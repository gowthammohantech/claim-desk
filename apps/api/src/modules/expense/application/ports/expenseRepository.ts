import type { ExpenseState } from '@claimdesk/contracts';

import type { GuardResult, Tx } from '../../../../platform/database/index.js';
import type { Expense } from '../../domain/expense.js';

export interface NewExpense {
  expenseNo: string;
  employeeId: string;
  captureMode: string;
  merchant?: string | undefined;
  expenseDate: Date;
  categoryId: string;
  amountPaise: number;
  currency: string;
  classification: string;
  clientId?: string | undefined;
  engagementId?: string | undefined;
  businessPurpose: string;
  mileage?: Expense['mileage'];
  receiptIds?: readonly string[] | undefined;
  exceptionJustification?: string | undefined;
  state: ExpenseState;
}

export interface UpdateExpenseCommand {
  id: string;
  employeeId: string;
  expectedVersion: number;
  patch: Partial<NewExpense>;
}

export interface ExpenseQuery {
  employeeId: string;
  state?: ExpenseState | undefined;
  limit: number;
  cursor?: string | undefined;
}

/**
 * Expense persistence.
 *
 * Note there is no `save(expense)`. Every mutation is an intent-named method
 * that compiles to a single guarded conditional update — that is what keeps
 * read-modify-write out of the application layer, where it would race.
 */
export interface ExpenseRepository {
  findById(id: string, tx?: Tx): Promise<Expense | null>;
  findByIds(ids: readonly string[], tx?: Tx): Promise<Expense[]>;
  list(query: ExpenseQuery, tx?: Tx): Promise<{ items: Expense[]; nextCursor?: string | undefined }>;

  /** Candidates for duplicate detection: same employee, near the same date. */
  findDuplicateCandidates(
    employeeId: string,
    around: Date,
    windowDays: number,
    excludeExpenseId?: string,
    tx?: Tx,
  ): Promise<Expense[]>;

  insert(expense: NewExpense, tx: Tx): Promise<Expense>;
  update(command: UpdateExpenseCommand, tx: Tx): Promise<GuardResult<Expense>>;
  deleteDraft(id: string, employeeId: string, tx: Tx): Promise<GuardResult<Expense>>;

  /** Records the outcome of a policy run against an expense. */
  attachEvaluation(
    id: string,
    evaluationId: string,
    outcome: string,
    tx: Tx,
  ): Promise<GuardResult<Expense>>;

  /** Moves expenses into a claim: UNCLAIMED -> IN_CLAIM. */
  attachToClaim(
    expenseIds: readonly string[],
    claimId: string,
    employeeId: string,
    tx: Tx,
  ): Promise<number>;

  /** Bulk state transition used by submit, return and reject. */
  transitionMany(
    expenseIds: readonly string[],
    from: readonly ExpenseState[],
    to: ExpenseState,
    tx: Tx,
    options?: { clearClaim?: boolean },
  ): Promise<number>;

  setDuplicateCases(id: string, caseIds: readonly string[], tx: Tx): Promise<void>;
}
