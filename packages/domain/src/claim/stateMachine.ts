import { ClaimStatus, ExpenseState } from '@claimdesk/contracts';

/**
 * Claim state machine, transcribed as DATA from design/08-workflow-spec.md §4.
 *
 * Kept as a table rather than a switch so both the server (which enforces it)
 * and the clients (which grey out impossible actions) read the same source.
 *
 * PAID and REJECTED are terminal in MVP. CANCELLED is terminal too, and is only
 * reachable from DRAFT — a submitted claim is never hard-deleted
 * (design/04-data-model.md).
 */
export const CLAIM_TRANSITIONS: Readonly<Record<ClaimStatus, readonly ClaimStatus[]>> = {
  [ClaimStatus.DRAFT]: [ClaimStatus.SUBMITTED, ClaimStatus.CANCELLED],
  [ClaimStatus.SUBMITTED]: [ClaimStatus.IN_APPROVAL],
  [ClaimStatus.IN_APPROVAL]: [
    // Another approval stage remains.
    ClaimStatus.IN_APPROVAL,
    // Final business approver signed off.
    ClaimStatus.APPROVED,
    ClaimStatus.RETURNED,
    ClaimStatus.REJECTED,
  ],
  [ClaimStatus.APPROVED]: [ClaimStatus.FINANCE_REVIEW],
  [ClaimStatus.FINANCE_REVIEW]: [ClaimStatus.VERIFIED, ClaimStatus.RETURNED],
  [ClaimStatus.VERIFIED]: [ClaimStatus.PAYMENT_PROCESSING],
  [ClaimStatus.PAYMENT_PROCESSING]: [ClaimStatus.PAID],
  // A returned claim goes back to the employee for correction and resubmission.
  [ClaimStatus.RETURNED]: [ClaimStatus.DRAFT, ClaimStatus.SUBMITTED],
  [ClaimStatus.PAID]: [],
  [ClaimStatus.REJECTED]: [],
  [ClaimStatus.CANCELLED]: [],
};

/** Statuses from which no further transition is possible. */
export const TERMINAL_CLAIM_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.PAID,
  ClaimStatus.REJECTED,
  ClaimStatus.CANCELLED,
];

/** Statuses where the claim is with an approver or finance, not the employee. */
export const IN_FLIGHT_CLAIM_STATUSES: readonly ClaimStatus[] = [
  ClaimStatus.SUBMITTED,
  ClaimStatus.IN_APPROVAL,
  ClaimStatus.APPROVED,
  ClaimStatus.FINANCE_REVIEW,
  ClaimStatus.VERIFIED,
  ClaimStatus.PAYMENT_PROCESSING,
];

export function canTransition(from: ClaimStatus, to: ClaimStatus): boolean {
  return CLAIM_TRANSITIONS[from].includes(to);
}

export function allowedTransitions(from: ClaimStatus): readonly ClaimStatus[] {
  return CLAIM_TRANSITIONS[from];
}

export function isTerminal(status: ClaimStatus): boolean {
  return TERMINAL_CLAIM_STATUSES.includes(status);
}

/** A claim may only be edited by its owner while it is a draft or was returned. */
export function isEditableByOwner(status: ClaimStatus): boolean {
  return status === ClaimStatus.DRAFT || status === ClaimStatus.RETURNED;
}

export class ClaimTransitionError extends Error {
  readonly from: ClaimStatus;
  readonly to: ClaimStatus;

  constructor(from: ClaimStatus, to: ClaimStatus) {
    super(
      `Illegal claim transition ${from} -> ${to}. Allowed from ${from}: ${
        CLAIM_TRANSITIONS[from].join(', ') || '(terminal)'
      }`,
    );
    this.name = 'ClaimTransitionError';
    this.from = from;
    this.to = to;
  }
}

export function assertTransition(from: ClaimStatus, to: ClaimStatus): void {
  if (!canTransition(from, to)) throw new ClaimTransitionError(from, to);
}

/** Expense state machine (design/08-workflow-spec.md §4). */
export const EXPENSE_TRANSITIONS: Readonly<Record<ExpenseState, readonly ExpenseState[]>> = {
  [ExpenseState.DRAFT]: [ExpenseState.UNCLAIMED],
  [ExpenseState.UNCLAIMED]: [ExpenseState.IN_CLAIM],
  // Returned claims release their expenses back to UNCLAIMED for correction.
  [ExpenseState.IN_CLAIM]: [ExpenseState.SUBMITTED, ExpenseState.UNCLAIMED],
  [ExpenseState.SUBMITTED]: [ExpenseState.UNCLAIMED],
};

export function canTransitionExpense(from: ExpenseState, to: ExpenseState): boolean {
  return EXPENSE_TRANSITIONS[from].includes(to);
}

/** Only unclaimed expenses may be added to a new claim. */
export function isClaimable(state: ExpenseState): boolean {
  return state === ExpenseState.UNCLAIMED;
}
