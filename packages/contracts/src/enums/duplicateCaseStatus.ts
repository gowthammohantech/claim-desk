/** Whether a detected duplicate pair still needs a decision from the employee. */
export const DuplicateCaseStatus = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
} as const;

export type DuplicateCaseStatus = (typeof DuplicateCaseStatus)[keyof typeof DuplicateCaseStatus];

export const DUPLICATE_CASE_STATUSES = Object.values(DuplicateCaseStatus) as readonly DuplicateCaseStatus[];
