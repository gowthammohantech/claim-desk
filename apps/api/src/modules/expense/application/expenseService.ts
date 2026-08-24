import {
  AuditEventName,
  CaptureMode,
  Currency,
  EntityType,
  ExpenseState,
  PolicyOutcome,
} from '@claimdesk/contracts';
import { computeMileagePaise } from '@claimdesk/domain';

import {
  type GuardFailure,
  type UnitOfWork,
  allocateNumber,
} from '../../../platform/database/index.js';
import { AppError, ErrorCode } from '../../../platform/errors/index.js';
import type { Clock } from '../../../platform/util/index.js';
import type { PolicyService } from '../../policy/index.js';
import { type Expense, requiresEngagement, toUtcMidnight } from '../domain/expense.js';
import type { ExpenseQuery, ExpenseRepository, NewExpense } from './ports/expenseRepository.js';

/**
 * Expense capture and editing.
 *
 * Every write re-evaluates policy (design/09 §8: "on expense create/update"),
 * persists the evaluation, and stamps the outcome onto the expense so a list
 * view can show it without re-running the engine.
 */
export interface ExpenseInputPayload {
  expenseDate: string;
  categoryId: string;
  amountPaise: number;
  currency?: string;
  classification: string;
  businessPurpose: string;
  captureMode?: string;
  merchant?: string;
  clientId?: string;
  engagementId?: string;
  receiptIds?: string[];
  exceptionJustification?: string;
  mileage?: {
    origin: string;
    destination: string;
    distanceKm: number;
    ratePaisePerKm: number;
  };
}

export interface ExpenseServiceDeps {
  expenses: ExpenseRepository;
  policy: PolicyService;
  uow: UnitOfWork;
  clock: Clock;
}

/** Maps a repository guard failure onto the HTTP answer it deserves. */
export function guardToError(reason: GuardFailure, what = 'Expense'): AppError {
  switch (reason) {
    case 'not-found':
      return AppError.notFound(what);
    case 'forbidden':
      return AppError.forbidden(`This ${what.toLowerCase()} belongs to someone else.`);
    case 'stale-version':
      return AppError.conflict(
        ErrorCode.STALE_VERSION,
        'This record changed since you loaded it. Reload and try again.',
      );
    case 'illegal-state':
    default:
      return AppError.conflict(
        ErrorCode.ILLEGAL_STATE_TRANSITION,
        'This record can no longer be changed in its current state.',
      );
  }
}

export interface ExpenseService {
  create(employeeId: string, input: ExpenseInputPayload): Promise<Expense>;
  update(
    employeeId: string,
    expenseId: string,
    version: number,
    input: ExpenseInputPayload,
  ): Promise<Expense>;
  remove(employeeId: string, expenseId: string): Promise<void>;
  get(employeeId: string, expenseId: string): Promise<Expense>;
  list(query: ExpenseQuery): Promise<{ items: Expense[]; nextCursor?: string | undefined }>;
  evaluate(employeeId: string, expenseId: string): Promise<unknown>;
}

export function createExpenseService(deps: ExpenseServiceDeps): ExpenseService {
  const { expenses, policy, uow, clock } = deps;

  /**
   * Derives the fields the client must not be trusted to compute.
   *
   * The mileage amount in particular is calculated server-side from distance
   * and rate — accepting a client-supplied total would let anyone claim an
   * arbitrary amount for a 2km trip.
   */
  function normalize(input: ExpenseInputPayload): Omit<NewExpense, 'expenseNo' | 'employeeId' | 'state'> {
    const captureMode = (input.captureMode ?? CaptureMode.MANUAL) as CaptureMode;

    if (requiresEngagement(input.classification as never) && !input.engagementId) {
      throw AppError.validation('Client-billable expenses must name an engagement.', [
        { field: 'engagementId', message: 'Required for client work.' },
      ]);
    }

    const mileage =
      captureMode === CaptureMode.MILEAGE && input.mileage
        ? {
            ...input.mileage,
            amountPaise: computeMileagePaise({
              distanceKm: input.mileage.distanceKm,
              ratePaisePerKm: input.mileage.ratePaisePerKm,
            }),
          }
        : undefined;

    if (captureMode === CaptureMode.MILEAGE && !mileage) {
      throw AppError.validation('A mileage expense must carry mileage details.', [
        { field: 'mileage', message: 'Required for a mileage capture.' },
      ]);
    }

    return {
      captureMode,
      merchant: input.merchant,
      expenseDate: toUtcMidnight(input.expenseDate),
      categoryId: input.categoryId,
      // For mileage the derived amount wins over anything the client sent.
      amountPaise: mileage ? mileage.amountPaise : input.amountPaise,
      currency: input.currency ?? Currency.INR,
      classification: input.classification,
      clientId: input.clientId,
      engagementId: input.engagementId,
      businessPurpose: input.businessPurpose,
      mileage,
      receiptIds: input.receiptIds,
      exceptionJustification: input.exceptionJustification,
    };
  }

  return {
    async create(employeeId, input) {
      const normalized = normalize(input);
      // Allocated OUTSIDE the transaction: a retry would otherwise burn a
      // number per attempt, and a gap is invisible where a duplicate is a
      // unique-index failure at commit time.
      const expenseNo = await allocateNumber('expense', clock.now());

      return uow.run({ actor: { employeeId }, source: 'api' }, async (scope) => {
        const created = await expenses.insert(
          { ...normalized, expenseNo, employeeId, state: ExpenseState.UNCLAIMED },
          scope.tx,
        );

        const evaluation = await policy.evaluateExpense(created, 'DRAFT', scope.tx);

        if (evaluation.overallOutcome === PolicyOutcome.BLOCKED) {
          // Throwing rolls the whole transaction back, so a blocked expense
          // leaves nothing behind.
          throw new AppError(
            ErrorCode.POLICY_BLOCKED,
            422,
            evaluation.messages[0] ?? 'Firm policy does not allow this expense.',
          );
        }

        await expenses.attachEvaluation(
          created.id,
          evaluation.evaluationId,
          evaluation.overallOutcome,
          scope.tx,
        );

        scope.audit({
          eventName: AuditEventName.EXPENSE_CREATED,
          entityType: EntityType.EXPENSE,
          entityId: created.id,
          payload: {
            captureMode: created.captureMode,
            amountPaise: created.amountPaise,
            categoryId: created.categoryId,
          },
        });

        return {
          ...created,
          policyEvaluationId: evaluation.evaluationId,
          policyOutcome: evaluation.overallOutcome,
        };
      });
    },

    async update(employeeId, expenseId, version, input) {
      const normalized = normalize(input);

      return uow.run({ actor: { employeeId }, source: 'api' }, async (scope) => {
        const result = await expenses.update(
          { id: expenseId, employeeId, expectedVersion: version, patch: normalized },
          scope.tx,
        );
        if (!result.ok) throw guardToError(result.reason);

        const evaluation = await policy.evaluateExpense(result.value, 'DRAFT', scope.tx);
        if (evaluation.overallOutcome === PolicyOutcome.BLOCKED) {
          throw new AppError(
            ErrorCode.POLICY_BLOCKED,
            422,
            evaluation.messages[0] ?? 'Firm policy does not allow this expense.',
          );
        }

        await expenses.attachEvaluation(
          result.value.id,
          evaluation.evaluationId,
          evaluation.overallOutcome,
          scope.tx,
        );

        scope.audit({
          eventName: AuditEventName.EXPENSE_UPDATED,
          entityType: EntityType.EXPENSE,
          entityId: result.value.id,
          payload: { changedFields: Object.keys(normalized) },
        });

        return {
          ...result.value,
          policyEvaluationId: evaluation.evaluationId,
          policyOutcome: evaluation.overallOutcome,
        };
      });
    },

    async remove(employeeId, expenseId) {
      await uow.run({ actor: { employeeId }, source: 'api' }, async (scope) => {
        const result = await expenses.deleteDraft(expenseId, employeeId, scope.tx);
        if (!result.ok) throw guardToError(result.reason);

        scope.audit({
          eventName: AuditEventName.EXPENSE_DELETED_DRAFT,
          entityType: EntityType.EXPENSE,
          entityId: expenseId,
          payload: { expenseNo: result.value.expenseNo },
          before: { state: result.value.state },
        });
      });
    },

    async get(employeeId, expenseId) {
      const expense = await expenses.findById(expenseId);
      if (!expense) throw AppError.notFound('Expense');
      // 404 rather than 403 for someone else's expense: a 403 confirms the
      // record exists, which is an enumeration oracle (IDOR).
      if (expense.employeeId !== employeeId) throw AppError.notFound('Expense');
      return expense;
    },

    async list(query) {
      return expenses.list(query);
    },

    async evaluate(employeeId, expenseId) {
      const expense = await expenses.findById(expenseId);
      if (!expense || expense.employeeId !== employeeId) throw AppError.notFound('Expense');

      return uow.run(
        { actor: { employeeId }, source: 'api', requireAudit: false },
        async (scope) => {
          const evaluation = await policy.evaluateExpense(expense, 'DRAFT', scope.tx);
          await expenses.attachEvaluation(
            expense.id,
            evaluation.evaluationId,
            evaluation.overallOutcome,
            scope.tx,
          );
          return evaluation;
        },
      );
    },
  };
}
