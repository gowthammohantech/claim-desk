import { ClaimStatus, ExpenseState } from '@claimdesk/contracts';
import { describe, expect, it } from 'vitest';

import {
  CLAIM_TRANSITIONS,
  ClaimTransitionError,
  assertTransition,
  canTransition,
  canTransitionExpense,
  isClaimable,
  isEditableByOwner,
  isTerminal,
} from './stateMachine.js';

describe('claim state machine (design/08-workflow-spec.md §4)', () => {
  it('walks the happy path one hop at a time', () => {
    const path: ClaimStatus[] = [
      ClaimStatus.DRAFT,
      ClaimStatus.SUBMITTED,
      ClaimStatus.IN_APPROVAL,
      ClaimStatus.APPROVED,
      ClaimStatus.FINANCE_REVIEW,
      ClaimStatus.VERIFIED,
      ClaimStatus.PAYMENT_PROCESSING,
      ClaimStatus.PAID,
    ];
    for (let i = 0; i < path.length - 1; i += 1) {
      expect(canTransition(path[i]!, path[i + 1]!)).toBe(true);
    }
  });

  it('forbids skipping payment processing', () => {
    // The single most tempting shortcut, and the one that would lose the
    // payment record entirely.
    expect(canTransition(ClaimStatus.VERIFIED, ClaimStatus.PAID)).toBe(false);
  });

  it('forbids jumping straight from draft to approved', () => {
    expect(canTransition(ClaimStatus.DRAFT, ClaimStatus.APPROVED)).toBe(false);
    expect(canTransition(ClaimStatus.DRAFT, ClaimStatus.IN_APPROVAL)).toBe(false);
  });

  it('allows IN_APPROVAL -> IN_APPROVAL for multi-stage workflows', () => {
    expect(canTransition(ClaimStatus.IN_APPROVAL, ClaimStatus.IN_APPROVAL)).toBe(true);
  });

  it('lets an approver return or reject from IN_APPROVAL', () => {
    expect(canTransition(ClaimStatus.IN_APPROVAL, ClaimStatus.RETURNED)).toBe(true);
    expect(canTransition(ClaimStatus.IN_APPROVAL, ClaimStatus.REJECTED)).toBe(true);
  });

  it('lets finance return from FINANCE_REVIEW', () => {
    expect(canTransition(ClaimStatus.FINANCE_REVIEW, ClaimStatus.RETURNED)).toBe(true);
    expect(canTransition(ClaimStatus.FINANCE_REVIEW, ClaimStatus.VERIFIED)).toBe(true);
  });

  it('routes a returned claim back for correction and resubmission', () => {
    expect(canTransition(ClaimStatus.RETURNED, ClaimStatus.DRAFT)).toBe(true);
    expect(canTransition(ClaimStatus.RETURNED, ClaimStatus.SUBMITTED)).toBe(true);
  });

  it('only allows cancellation from DRAFT — submitted claims are never deleted', () => {
    expect(canTransition(ClaimStatus.DRAFT, ClaimStatus.CANCELLED)).toBe(true);
    expect(canTransition(ClaimStatus.SUBMITTED, ClaimStatus.CANCELLED)).toBe(false);
    expect(canTransition(ClaimStatus.IN_APPROVAL, ClaimStatus.CANCELLED)).toBe(false);
  });

  it.each([ClaimStatus.PAID, ClaimStatus.REJECTED, ClaimStatus.CANCELLED])(
    '%s is terminal',
    (status) => {
      expect(isTerminal(status)).toBe(true);
      expect(CLAIM_TRANSITIONS[status]).toHaveLength(0);
    },
  );

  it('is only owner-editable in DRAFT or RETURNED', () => {
    expect(isEditableByOwner(ClaimStatus.DRAFT)).toBe(true);
    expect(isEditableByOwner(ClaimStatus.RETURNED)).toBe(true);
    expect(isEditableByOwner(ClaimStatus.IN_APPROVAL)).toBe(false);
    expect(isEditableByOwner(ClaimStatus.PAID)).toBe(false);
  });

  it('covers every claim status exactly once', () => {
    expect(Object.keys(CLAIM_TRANSITIONS).sort()).toEqual(Object.values(ClaimStatus).sort());
  });

  it('never names a status that is not in the enum', () => {
    const valid = new Set<string>(Object.values(ClaimStatus));
    for (const targets of Object.values(CLAIM_TRANSITIONS)) {
      for (const target of targets) expect(valid.has(target)).toBe(true);
    }
  });

  it('throws a descriptive error on an illegal transition', () => {
    expect(() => assertTransition(ClaimStatus.PAID, ClaimStatus.DRAFT)).toThrow(
      ClaimTransitionError,
    );
    expect(() => assertTransition(ClaimStatus.PAID, ClaimStatus.DRAFT)).toThrow(/terminal/);
    expect(() => assertTransition(ClaimStatus.DRAFT, ClaimStatus.SUBMITTED)).not.toThrow();
  });
});

describe('expense state machine', () => {
  it('follows draft -> unclaimed -> in-claim -> submitted', () => {
    expect(canTransitionExpense(ExpenseState.DRAFT, ExpenseState.UNCLAIMED)).toBe(true);
    expect(canTransitionExpense(ExpenseState.UNCLAIMED, ExpenseState.IN_CLAIM)).toBe(true);
    expect(canTransitionExpense(ExpenseState.IN_CLAIM, ExpenseState.SUBMITTED)).toBe(true);
  });

  it('releases expenses back to UNCLAIMED when a claim is returned', () => {
    expect(canTransitionExpense(ExpenseState.IN_CLAIM, ExpenseState.UNCLAIMED)).toBe(true);
    expect(canTransitionExpense(ExpenseState.SUBMITTED, ExpenseState.UNCLAIMED)).toBe(true);
  });

  it('only lets unclaimed expenses join a new claim', () => {
    expect(isClaimable(ExpenseState.UNCLAIMED)).toBe(true);
    expect(isClaimable(ExpenseState.IN_CLAIM)).toBe(false);
    expect(isClaimable(ExpenseState.DRAFT)).toBe(false);
  });
});
