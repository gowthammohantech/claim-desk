import { createBrowserRouter, Navigate } from 'react-router';

import { ScreenStub } from '@/components/ScreenStub';
import { FinanceQueuePage } from '@/features/finance-queue/FinanceQueuePage';
import { AppLayout } from './AppLayout';

/**
 * All 20 Finance/Admin screens from design/02-screen-inventory.md are routed.
 * Only W-003 is implemented; the rest render a stub so the information
 * architecture is walkable from day one and no screen gets forgotten.
 *
 * There are deliberately NO employee or approver routes here — those are mobile
 * (requirements/03-FRD.md §1.1).
 */
const stub = (id: string, title: string, note?: string) => ({
  element: <ScreenStub id={id} title={title} {...(note ? { note } : {})} />,
});

export const router = createBrowserRouter([
  {
    path: '/signin',
    ...stub(
      'W-001',
      'Sign in',
      'Open question: gaps.md GAP-002 mandates mobile + OTP, but the screen inventory still says SSO for web. Resolve before building.',
    ),
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/finance/queue" replace /> },

      // Finance
      { path: 'finance', ...stub('W-002', 'Finance dashboard') },
      { path: 'finance/queue', element: <FinanceQueuePage /> },
      { path: 'finance/claims/:claimId', ...stub('W-004', 'Claim review') },

      // Payments
      { path: 'payments/batches', ...stub('W-005', 'Payment batches') },
      { path: 'payments/batches/:batchId', ...stub('W-006', 'Payment batch detail') },

      // Master data
      { path: 'master/employees', ...stub('W-007', 'Employees') },
      { path: 'master/clients', ...stub('W-008', 'Clients') },
      { path: 'master/engagements', ...stub('W-009', 'Engagements') },
      { path: 'master/categories', ...stub('W-010', 'Expense categories') },

      // Configuration
      { path: 'policies', ...stub('W-011', 'Policies') },
      { path: 'policies/:policyId', ...stub('W-012', 'Policy editor') },
      { path: 'workflows', ...stub('W-013', 'Workflows') },
      { path: 'workflows/:workflowId', ...stub('W-014', 'Workflow editor') },
      {
        path: 'delegations',
        ...stub(
          'W-015',
          'Delegations',
          'Flagged post-MVP: design/08-workflow-spec.md §9 puts delegation out of current scope, but the screen inventory and data model both carry it.',
        ),
      },
      { path: 'settings', ...stub('W-019', 'Settings') },
      { path: 'access', ...stub('W-020', 'Access and permissions') },

      // Insight
      { path: 'reports', ...stub('W-016', 'Reports') },
      { path: 'audit', ...stub('W-017', 'Audit explorer') },
      { path: 'integrations', ...stub('W-018', 'Integration monitor') },
    ],
  },
  { path: '*', ...stub('404', 'Page not found') },
]);
