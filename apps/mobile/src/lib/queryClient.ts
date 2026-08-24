import { isApiError } from '@claimdesk/api-client';
import { QueryClient } from '@tanstack/react-query';

/**
 * A 409 means the claim or approval task moved on before the request landed.
 * Retrying is wrong, not just wasteful: the first valid terminal decision wins
 * (design/08-workflow-spec.md), so the user must see fresh state instead.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (isApiError(error) && !error.isRetryable) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});
