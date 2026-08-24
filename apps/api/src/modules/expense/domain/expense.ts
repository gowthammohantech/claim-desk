import type {
  CaptureMode,
  Classification,
  Currency,
  ExpenseState,
  PolicyOutcome,
} from '@claimdesk/contracts';

/**
 * Expense aggregate.
 *
 * All money is integer paise (ADR-010). `version` is a true optimistic
 * concurrency counter — one of only three collections that carry one.
 */
export interface Mileage {
  readonly origin: string;
  readonly destination: string;
  readonly distanceKm: number;
  readonly ratePaisePerKm: number;
  readonly rateRuleId?: string | undefined;
  readonly amountPaise: number;
}

export interface Expense {
  readonly id: string;
  readonly expenseNo: string;
  readonly employeeId: string;
  readonly captureMode: CaptureMode;
  readonly merchant?: string | undefined;
  readonly expenseDate: Date;
  readonly categoryId: string;
  readonly amountPaise: number;
  readonly currency: Currency;
  readonly classification: Classification;
  readonly clientId?: string | undefined;
  readonly engagementId?: string | undefined;
  readonly costCentreId?: string | undefined;
  readonly businessPurpose: string;
  readonly mileage?: Mileage | undefined;
  readonly receiptIds: readonly string[];
  readonly ocrResultId?: string | undefined;
  readonly policyEvaluationId?: string | undefined;
  readonly policyOutcome?: PolicyOutcome | undefined;
  readonly duplicateCaseIds: readonly string[];
  readonly exceptionJustification?: string | undefined;
  readonly state: ExpenseState;
  readonly claimId?: string | undefined;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Date-only fields are normalized to UTC midnight.
 *
 * `expenseDate` has no time component. Storing a local-midnight Date at +5:30
 * lands on the previous day in UTC, which then makes duplicate date-proximity
 * and policy effective-dating disagree with what the employee typed — a class
 * of bug that only appears after 18:30 local.
 */
export function toUtcMidnight(value: Date | string): Date {
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`) : value;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}

/** Only a draft or unclaimed expense may be edited by its owner. */
export function isEditable(expense: Pick<Expense, 'state'>): boolean {
  return expense.state === 'DRAFT' || expense.state === 'UNCLAIMED';
}

/** Only a draft may be deleted; anything further has entered the audit trail. */
export function isDeletable(expense: Pick<Expense, 'state'>): boolean {
  return expense.state === 'DRAFT' || expense.state === 'UNCLAIMED';
}

/** Client work must name the engagement it is billed to. */
export function requiresEngagement(classification: Classification): boolean {
  return classification !== 'INTERNAL';
}
