/** Engagement status. Only OPEN engagements are selectable; CLOSED remain readable. */
export const EngagementStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;

export type EngagementStatus = (typeof EngagementStatus)[keyof typeof EngagementStatus];

export const ENGAGEMENT_STATUSES = Object.values(EngagementStatus) as readonly EngagementStatus[];
