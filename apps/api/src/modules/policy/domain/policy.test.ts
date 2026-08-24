import {
  Classification,
  PolicyActionTrigger,
  PolicyActionType,
  PolicyOperator,
  PolicyOutcome,
} from '@claimdesk/contracts';
import { describe, expect, it } from 'vitest';

import { isKnownFieldPath, resolveField } from './context.js';
import { findDuplicates, normalizeMerchant, scoreDuplicate } from './duplicates.js';
import { evaluatePolicies } from './evaluator.js';
import { evaluateLeaf, matchesCondition } from './operators.js';
import { comparePolicies, orderByPrecedence, specificityOf } from './precedence.js';
import type { PolicyContext, PolicyDefinition } from './types.js';

const AT = new Date('2026-08-20T00:00:00Z');

const context = (over: Partial<PolicyContext> = {}): PolicyContext => ({
  employee: { id: 'EMP-1', grade: 'M2', branch: 'Pune', department: 'Audit' },
  category: { id: 'CAT-ACC', code: 'ACCOMMODATION', receiptRequired: true },
  amount: { paise: 550_000 },
  expense: { date: '2026-08-15', captureMode: 'MANUAL' },
  merchant: { raw: 'Hotel Sahyadri', normalized: 'hotel sahyadri' },
  classification: Classification.CLIENT_BILLABLE,
  client: { id: 'CLI-1' },
  engagement: { id: 'ENG-1', status: 'OPEN' },
  receipt: { count: 1, present: true },
  mileage: {},
  trip: { domestic: true, nights: 1 },
  duplicate: { maxScore: 0, unresolvedCount: 0 },
  justification: { provided: false },
  ...over,
});

/** design/09 §2's example policy, verbatim in structure. */
const POL_ACC_04: PolicyDefinition = {
  id: 'pol-1',
  policyCode: 'POL-ACC-04',
  version: 3,
  name: 'Domestic accommodation cap',
  priority: 100,
  effectiveFrom: new Date('2026-08-01T00:00:00Z'),
  conditions: {
    all: [
      { field: 'category.code', op: PolicyOperator.EQ, value: 'ACCOMMODATION' },
      { field: 'employee.grade', op: PolicyOperator.IN, value: ['M1', 'M2'] },
      { field: 'trip.domestic', op: PolicyOperator.EQ, value: true },
    ],
  },
  actions: [
    { type: PolicyActionType.LIMIT, basis: 'PER_NIGHT', amountPaise: 400_000 },
    { type: PolicyActionType.REQUIRE_JUSTIFICATION, on: PolicyActionTrigger.EXCEED },
    {
      type: PolicyActionType.ADD_APPROVAL_STAGE,
      on: PolicyActionTrigger.EXCEED,
      resolver: 'ENGAGEMENT_PARTNER',
    },
  ],
};

describe('field paths', () => {
  it('resolves the documented context paths', () => {
    expect(resolveField(context(), 'category.code')).toBe('ACCOMMODATION');
    expect(resolveField(context(), 'employee.grade')).toBe('M2');
    expect(resolveField(context(), 'trip.domestic')).toBe(true);
    expect(resolveField(context(), 'amount.paise')).toBe(550_000);
  });

  it('refuses unknown paths instead of walking the object graph', () => {
    // A generic deep-get would accept __proto__ and turn an admin-authored rule
    // into a prototype-pollution vector.
    expect(isKnownFieldPath('__proto__')).toBe(false);
    expect(isKnownFieldPath('constructor.prototype')).toBe(false);
    expect(isKnownFieldPath('employee.salary')).toBe(false);
    expect(resolveField(context(), '__proto__')).toBeUndefined();
  });
});

describe('operators', () => {
  const c = context();

  it.each([
    [PolicyOperator.EQ, 'category.code', 'ACCOMMODATION', true],
    [PolicyOperator.EQ, 'category.code', 'TRAVEL', false],
    [PolicyOperator.NE, 'category.code', 'TRAVEL', true],
    [PolicyOperator.IN, 'employee.grade', ['M1', 'M2'], true],
    [PolicyOperator.IN, 'employee.grade', ['M3'], false],
    [PolicyOperator.NOT_IN, 'employee.grade', ['M3'], true],
    [PolicyOperator.GT, 'amount.paise', 400_000, true],
    [PolicyOperator.GT, 'amount.paise', 600_000, false],
    [PolicyOperator.GTE, 'amount.paise', 550_000, true],
    [PolicyOperator.LT, 'amount.paise', 600_000, true],
    [PolicyOperator.LTE, 'amount.paise', 550_000, true],
    [PolicyOperator.EXISTS, 'engagement.id', true, true],
    [PolicyOperator.BETWEEN, 'amount.paise', [500_000, 600_000], true],
    [PolicyOperator.BETWEEN, 'amount.paise', [100_000, 200_000], false],
  ])('%s %s', (op, field, value, expected) => {
    expect(evaluateLeaf({ field, op, value }, c)).toBe(expected);
  });

  it('treats BETWEEN as inclusive at both ends', () => {
    expect(evaluateLeaf({ field: 'amount.paise', op: PolicyOperator.BETWEEN, value: [550_000, 600_000] }, c)).toBe(true);
    expect(evaluateLeaf({ field: 'amount.paise', op: PolicyOperator.BETWEEN, value: [400_000, 550_000] }, c)).toBe(true);
  });

  it('never throws on a type mismatch — a bad rule must not break expense capture', () => {
    expect(() =>
      evaluateLeaf({ field: 'category.code', op: PolicyOperator.GT, value: 5 }, c),
    ).not.toThrow();
    expect(evaluateLeaf({ field: 'category.code', op: PolicyOperator.GT, value: 5 }, c)).toBe(false);
    expect(evaluateLeaf({ field: 'amount.paise', op: PolicyOperator.BETWEEN, value: 'x' }, c)).toBe(false);
    expect(evaluateLeaf({ field: 'nope.nope', op: PolicyOperator.EQ, value: 1 }, c)).toBe(false);
  });

  it('EXISTS with value false asserts absence', () => {
    expect(evaluateLeaf({ field: 'client.id', op: PolicyOperator.EXISTS, value: false }, c)).toBe(false);
    expect(
      evaluateLeaf({ field: 'mileage.distanceKm', op: PolicyOperator.EXISTS, value: false }, c),
    ).toBe(true);
  });

  it('matches an empty `all`, which is how a default policy is written', () => {
    expect(matchesCondition({ all: [] }, c)).toBe(true);
  });
});

describe('precedence (design/09 §6)', () => {
  const base = (over: Partial<PolicyDefinition>): PolicyDefinition => ({
    ...POL_ACC_04,
    ...over,
  });

  it('scores a narrower rule as more specific', () => {
    const narrow = base({
      conditions: { all: [{ field: 'engagement.id', op: PolicyOperator.EQ, value: 'ENG-1' }] },
    });
    const broad = base({
      conditions: { all: [{ field: 'employee.branch', op: PolicyOperator.EQ, value: 'Pune' }] },
    });
    expect(specificityOf(narrow)).toBeGreaterThan(specificityOf(broad));
  });

  it('sorts the default category policy last regardless of specificity', () => {
    const fallback = base({ id: 'f', policyCode: 'DEFAULT', defaultCategoryPolicy: true, priority: 999 });
    const normal = base({ id: 'n', policyCode: 'NORMAL', priority: 1 });
    expect(orderByPrecedence([fallback, normal]).map((p) => p.id)).toEqual(['n', 'f']);
  });

  it('breaks a full tie deterministically by policyCode', () => {
    // Without a last-resort tiebreak, ordering falls through to Mongo's return
    // order and the same expense snapshots differently on different days.
    const a = base({ id: 'a', policyCode: 'AAA' });
    const b = base({ id: 'b', policyCode: 'BBB' });
    expect(comparePolicies(a, b)).toBeLessThan(0);
    expect(orderByPrecedence([b, a]).map((p) => p.policyCode)).toEqual(['AAA', 'BBB']);
  });

  it('prefers higher priority, then the newer effective version', () => {
    const older = base({ id: 'o', priority: 5, effectiveFrom: new Date('2026-01-01') });
    const newer = base({ id: 'n', priority: 5, effectiveFrom: new Date('2026-06-01') });
    expect(orderByPrecedence([older, newer]).map((p) => p.id)).toEqual(['n', 'o']);

    const high = base({ id: 'h', priority: 50 });
    expect(orderByPrecedence([high, older]).map((p) => p.id)).toEqual(['h', 'o']);
  });
});

describe('evaluator — the design/09 §11 worked example', () => {
  it('turns ₹5,500 against a ₹4,000/night cap into an exception plus a Partner stage', () => {
    const result = evaluatePolicies(context(), [POL_ACC_04], { phase: 'DRAFT', at: AT });

    expect(result.overallOutcome).toBe(PolicyOutcome.EXCEPTION_REQUIRES_JUSTIFICATION);
    expect(result.limitPaise).toBe(400_000);
    expect(result.overagePaise).toBe(150_000);
    expect(result.requiresJustification).toBe(true);
    expect(result.requiredExtraStages).toEqual([
      { resolver: 'ENGAGEMENT_PARTNER', policyCode: 'POL-ACC-04', policyVersion: 3 },
    ]);
  });

  it('passes when the amount is within the cap, and fires no gated action', () => {
    const result = evaluatePolicies(context({ amount: { paise: 350_000 } }), [POL_ACC_04], {
      phase: 'DRAFT',
      at: AT,
    });

    expect(result.overallOutcome).toBe(PolicyOutcome.PASS);
    expect(result.overagePaise).toBe(0);
    expect(result.requiredExtraStages).toEqual([]);
    expect(result.results[0]?.actions.filter((a) => a.fired).map((a) => a.type)).toEqual([
      PolicyActionType.LIMIT,
    ]);
  });

  it('downgrades to a warning once the justification is supplied', () => {
    const result = evaluatePolicies(
      context({ justification: { provided: true, text: 'Conference rates' } }),
      [POL_ACC_04],
      { phase: 'SUBMIT', at: AT },
    );
    expect(result.overallOutcome).toBe(PolicyOutcome.WARNING);
  });

  it('does not match an employee outside the grade band', () => {
    const result = evaluatePolicies(
      context({ employee: { id: 'E', grade: 'M5' } }),
      [POL_ACC_04],
      { phase: 'DRAFT', at: AT },
    );
    expect(result.results).toHaveLength(0);
    expect(result.overallOutcome).toBe(PolicyOutcome.PASS);
  });

  it('scales a PER_NIGHT limit by the number of nights', () => {
    const result = evaluatePolicies(
      context({ trip: { domestic: true, nights: 2 }, amount: { paise: 750_000 } }),
      [POL_ACC_04],
      { phase: 'DRAFT', at: AT },
    );
    expect(result.limitPaise).toBe(800_000);
    expect(result.overagePaise).toBe(0);
    expect(result.overallOutcome).toBe(PolicyOutcome.PASS);
  });
});

describe('evaluator — two-pass fold', () => {
  /**
   * The regression this whole design exists to prevent: a gated action in a
   * HIGHER-precedence policy than the LIMIT it depends on. A single-pass fold
   * would evaluate it before the limit was known and silently never fire.
   */
  it('fires an on:EXCEED action declared in a more-specific policy than the LIMIT', () => {
    const limitPolicy: PolicyDefinition = {
      ...POL_ACC_04,
      id: 'broad',
      policyCode: 'BROAD-LIMIT',
      conditions: { all: [{ field: 'category.code', op: PolicyOperator.EQ, value: 'ACCOMMODATION' }] },
      actions: [{ type: PolicyActionType.LIMIT, basis: 'PER_NIGHT', amountPaise: 400_000 }],
    };

    const gatedPolicy: PolicyDefinition = {
      ...POL_ACC_04,
      id: 'narrow',
      policyCode: 'NARROW-GATE',
      // More specific: engagement-scoped, so it sorts FIRST.
      conditions: { all: [{ field: 'engagement.id', op: PolicyOperator.EQ, value: 'ENG-1' }] },
      actions: [{ type: PolicyActionType.REQUIRE_JUSTIFICATION, on: PolicyActionTrigger.EXCEED }],
    };

    const result = evaluatePolicies(context(), [limitPolicy, gatedPolicy], {
      phase: 'DRAFT',
      at: AT,
    });

    expect(result.overallOutcome).toBe(PolicyOutcome.EXCEPTION_REQUIRES_JUSTIFICATION);
    expect(result.requiresJustification).toBe(true);
  });

  it('lets the most-precedent LIMIT win when two policies both set one', () => {
    const tight: PolicyDefinition = {
      ...POL_ACC_04,
      id: 'tight',
      policyCode: 'TIGHT',
      conditions: { all: [{ field: 'engagement.id', op: PolicyOperator.EQ, value: 'ENG-1' }] },
      actions: [{ type: PolicyActionType.LIMIT, basis: 'PER_NIGHT', amountPaise: 300_000 }],
    };
    const loose: PolicyDefinition = {
      ...POL_ACC_04,
      id: 'loose',
      policyCode: 'LOOSE',
      conditions: { all: [{ field: 'employee.branch', op: PolicyOperator.EQ, value: 'Pune' }] },
      actions: [{ type: PolicyActionType.LIMIT, basis: 'PER_NIGHT', amountPaise: 900_000 }],
    };

    const result = evaluatePolicies(context(), [loose, tight], { phase: 'DRAFT', at: AT });
    expect(result.limitPaise).toBe(300_000);
  });
});

describe('evaluator — outcome precedence and phases', () => {
  const blocking: PolicyDefinition = {
    ...POL_ACC_04,
    id: 'block',
    policyCode: 'BLOCK-ALL',
    conditions: { all: [] },
    actions: [{ type: PolicyActionType.BLOCK, message: 'Category suspended' }],
  };
  const allowing: PolicyDefinition = {
    ...POL_ACC_04,
    id: 'allow',
    policyCode: 'ALLOW-ALL',
    priority: 999,
    conditions: { all: [] },
    actions: [{ type: PolicyActionType.ALLOW }],
  };

  it('never lets an ALLOW clear a BLOCK, whatever its priority', () => {
    const result = evaluatePolicies(context(), [allowing, blocking], { phase: 'DRAFT', at: AT });
    expect(result.overallOutcome).toBe(PolicyOutcome.BLOCKED);
  });

  it('treats a missing receipt as a nudge on a draft and a hard stop at submission', () => {
    const receiptRule: PolicyDefinition = {
      ...POL_ACC_04,
      id: 'receipt',
      policyCode: 'RECEIPT',
      conditions: { all: [] },
      actions: [{ type: PolicyActionType.REQUIRE_RECEIPT }],
    };
    const noReceipt = context({ receipt: { count: 0, present: false } });

    expect(
      evaluatePolicies(noReceipt, [receiptRule], { phase: 'DRAFT', at: AT }).overallOutcome,
    ).toBe(PolicyOutcome.WARNING);
    expect(
      evaluatePolicies(noReceipt, [receiptRule], { phase: 'SUBMIT', at: AT }).overallOutcome,
    ).toBe(PolicyOutcome.BLOCKED);
  });

  it('ignores a policy that is not yet effective or already expired', () => {
    const future = { ...POL_ACC_04, effectiveFrom: new Date('2027-01-01') };
    const expired = { ...POL_ACC_04, effectiveTo: new Date('2026-01-01') };

    expect(evaluatePolicies(context(), [future], { phase: 'DRAFT', at: AT }).results).toHaveLength(0);
    expect(evaluatePolicies(context(), [expired], { phase: 'DRAFT', at: AT }).results).toHaveLength(0);
  });

  it('dedupes extra stages so two policies demanding a Partner add one stage', () => {
    const second: PolicyDefinition = {
      ...POL_ACC_04,
      id: 'second',
      policyCode: 'SECOND',
      actions: [
        { type: PolicyActionType.LIMIT, basis: 'PER_NIGHT', amountPaise: 400_000 },
        {
          type: PolicyActionType.ADD_APPROVAL_STAGE,
          on: PolicyActionTrigger.EXCEED,
          resolver: 'ENGAGEMENT_PARTNER',
        },
      ],
    };
    const result = evaluatePolicies(context(), [POL_ACC_04, second], { phase: 'DRAFT', at: AT });
    expect(result.requiredExtraStages).toHaveLength(1);
  });
});

describe('duplicate detection (design/09 §10)', () => {
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

  const candidate = (over: Partial<Parameters<typeof scoreDuplicate>[0]> = {}) => ({
    expenseId: 'EXP-2',
    employeeId: 'EMP-1',
    merchantNormalized: 'hotel sahyadri',
    amountPaise: 550_000,
    expenseDate: day('2026-08-15'),
    receiptHashes: [] as string[],
    ...over,
  });

  const subject = candidate({ expenseId: 'EXP-1' });

  it('normalizes merchant strings before comparing', () => {
    expect(normalizeMerchant('UBER  *TRIP')).toBe('uber trip');
    expect(normalizeMerchant('Uber Trip')).toBe('uber trip');
    expect(normalizeMerchant('   ')).toBeUndefined();
  });

  it('treats an identical receipt hash as conclusive', () => {
    const score = scoreDuplicate(
      { ...subject, receiptHashes: ['abc'] },
      candidate({ receiptHashes: ['abc'], amountPaise: 1, merchantNormalized: 'other' }),
    );
    expect(score.score).toBe(1);
    expect(score.reasons).toEqual(['IDENTICAL_RECEIPT']);
  });

  it('raises same merchant + same amount + same day', () => {
    const score = scoreDuplicate(subject, candidate());
    expect(score.score).toBeGreaterThanOrEqual(0.7);
    expect(score.reasons).toEqual(['SAME_AMOUNT', 'SAME_MERCHANT', 'SAME_DATE']);
  });

  it('does not raise on amount alone', () => {
    const score = scoreDuplicate(
      subject,
      candidate({ merchantNormalized: 'different cafe', expenseDate: day('2026-07-01') }),
    );
    expect(score.score).toBeLessThan(0.7);
  });

  it('never compares across employees', () => {
    expect(scoreDuplicate(subject, candidate({ employeeId: 'EMP-9' })).score).toBe(0);
  });

  it('never matches an expense against itself', () => {
    expect(scoreDuplicate(subject, candidate({ expenseId: 'EXP-1' })).score).toBe(0);
  });

  it('returns hits sorted strongest first', () => {
    const hits = findDuplicates(subject, [
      candidate({ expenseId: 'EXP-3' }),
      candidate({ expenseId: 'EXP-4', receiptHashes: [] }),
      candidate({ expenseId: 'EXP-5', merchantNormalized: 'unrelated', expenseDate: day('2026-01-01') }),
    ]);
    expect(hits).toHaveLength(2);
    expect(hits[0]!.score.score).toBeGreaterThanOrEqual(hits[1]!.score.score);
  });
});
