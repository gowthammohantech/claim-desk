import { PermissionCode } from '@claimdesk/contracts';

/**
 * Sidebar for the Finance/Admin portal.
 *
 * The web app serves Finance, Admin and read-only Management/Auditor ONLY.
 * Employee and approver journeys are mobile (design/01-HFD.md §2,
 * requirements/03-FRD.md §1.1), so there is deliberately no expense capture,
 * claim submission or approval screen here.
 */
export interface NavItem {
  screenId: string;
  label: string;
  to: string;
  permission: PermissionCode;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: 'Finance',
    items: [
      {
        screenId: 'W-002',
        label: 'Dashboard',
        to: '/finance',
        permission: PermissionCode.FINANCE_REVIEW,
      },
      {
        screenId: 'W-003',
        label: 'Verification queue',
        to: '/finance/queue',
        permission: PermissionCode.FINANCE_REVIEW,
      },
      {
        screenId: 'W-005',
        label: 'Payment batches',
        to: '/payments/batches',
        permission: PermissionCode.PAYMENT_MANAGE,
      },
    ],
  },
  {
    label: 'Master data',
    items: [
      {
        screenId: 'W-007',
        label: 'Employees',
        to: '/master/employees',
        permission: PermissionCode.MASTER_MANAGE,
      },
      {
        screenId: 'W-008',
        label: 'Clients',
        to: '/master/clients',
        permission: PermissionCode.MASTER_MANAGE,
      },
      {
        screenId: 'W-009',
        label: 'Engagements',
        to: '/master/engagements',
        permission: PermissionCode.MASTER_MANAGE,
      },
      {
        screenId: 'W-010',
        label: 'Expense categories',
        to: '/master/categories',
        permission: PermissionCode.MASTER_MANAGE,
      },
    ],
  },
  {
    label: 'Configuration',
    items: [
      {
        screenId: 'W-011',
        label: 'Policies',
        to: '/policies',
        permission: PermissionCode.POLICY_MANAGE,
      },
      {
        screenId: 'W-013',
        label: 'Workflows',
        to: '/workflows',
        permission: PermissionCode.WORKFLOW_MANAGE,
      },
      {
        screenId: 'W-015',
        label: 'Delegations',
        to: '/delegations',
        permission: PermissionCode.WORKFLOW_MANAGE,
      },
      {
        screenId: 'W-019',
        label: 'Settings',
        to: '/settings',
        permission: PermissionCode.MASTER_MANAGE,
      },
      {
        screenId: 'W-020',
        label: 'Access admin',
        to: '/access',
        permission: PermissionCode.MASTER_MANAGE,
      },
    ],
  },
  {
    label: 'Insight',
    items: [
      { screenId: 'W-016', label: 'Reports', to: '/reports', permission: PermissionCode.REPORT_READ },
      {
        screenId: 'W-017',
        label: 'Audit explorer',
        to: '/audit',
        permission: PermissionCode.AUDIT_READ,
      },
      {
        screenId: 'W-018',
        label: 'Integrations',
        to: '/integrations',
        permission: PermissionCode.MASTER_MANAGE,
      },
    ],
  },
];
