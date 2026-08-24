/**
 * One query-key factory, used by BOTH apps/web and apps/mobile.
 *
 * Two independent key schemes would mean an invalidation that works on web
 * silently fails on mobile, which is exactly the class of bug that only shows
 * up in production.
 */
export const queryKeys = {
  all: ['claimdesk'] as const,

  profile: () => [...queryKeys.all, 'profile'] as const,
  myEngagements: () => [...queryKeys.all, 'profile', 'engagements'] as const,

  expenses: {
    all: () => [...queryKeys.all, 'expenses'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.expenses.all(), 'list', filters ?? {}] as const,
    detail: (expenseId: string) => [...queryKeys.expenses.all(), 'detail', expenseId] as const,
    policyEvaluation: (expenseId: string) =>
      [...queryKeys.expenses.all(), 'policy', expenseId] as const,
  },

  claims: {
    all: () => [...queryKeys.all, 'claims'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.claims.all(), 'list', filters ?? {}] as const,
    detail: (claimId: string) => [...queryKeys.claims.all(), 'detail', claimId] as const,
  },

  approvals: {
    all: () => [...queryKeys.all, 'approvals'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.approvals.all(), 'list', filters ?? {}] as const,
  },

  finance: {
    all: () => [...queryKeys.all, 'finance'] as const,
    queue: (filters?: Record<string, unknown>) =>
      [...queryKeys.finance.all(), 'queue', filters ?? {}] as const,
  },

  notifications: {
    all: () => [...queryKeys.all, 'notifications'] as const,
    list: () => [...queryKeys.notifications.all(), 'list'] as const,
  },
} as const;
