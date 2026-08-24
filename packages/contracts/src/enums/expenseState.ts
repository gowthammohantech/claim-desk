/** Expense lifecycle states (design/08-workflow-spec.md §4). */
export const ExpenseState = {
  DRAFT: 'DRAFT',
  UNCLAIMED: 'UNCLAIMED',
  IN_CLAIM: 'IN_CLAIM',
  SUBMITTED: 'SUBMITTED',
} as const;

export type ExpenseState = (typeof ExpenseState)[keyof typeof ExpenseState];

export const EXPENSE_STATES = Object.values(ExpenseState) as readonly ExpenseState[];
