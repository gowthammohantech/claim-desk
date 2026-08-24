/** Approval task states (design/08-workflow-spec.md §4). */
export const ApprovalTaskStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  RETURNED: 'RETURNED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;

export type ApprovalTaskStatus = (typeof ApprovalTaskStatus)[keyof typeof ApprovalTaskStatus];

export const APPROVAL_TASK_STATUSES = Object.values(ApprovalTaskStatus) as readonly ApprovalTaskStatus[];
