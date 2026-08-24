/** Expense billing classification. */
export const Classification = {
  CLIENT_BILLABLE: 'CLIENT_BILLABLE',
  CLIENT_NON_BILLABLE: 'CLIENT_NON_BILLABLE',
  INTERNAL: 'INTERNAL',
} as const;

export type Classification = (typeof Classification)[keyof typeof Classification];

export const CLASSIFICATIONS = Object.values(Classification) as readonly Classification[];
