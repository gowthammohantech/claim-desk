/** How a workflow stage resolves its approver (design/08-workflow-spec.md §5). */
export const ApproverResolver = {
  REPORTING_MANAGER: 'REPORTING_MANAGER',
  ENGAGEMENT_MANAGER: 'ENGAGEMENT_MANAGER',
  ENGAGEMENT_PARTNER: 'ENGAGEMENT_PARTNER',
  NAMED_ROLE: 'NAMED_ROLE',
  NAMED_EMPLOYEE: 'NAMED_EMPLOYEE',
} as const;

export type ApproverResolver = (typeof ApproverResolver)[keyof typeof ApproverResolver];

export const APPROVER_RESOLVERS = Object.values(ApproverResolver) as readonly ApproverResolver[];
