/** User resolution of a detected duplicate. KEEP requires a reason. */
export const DuplicateResolutionAction = {
  DISCARD: 'DISCARD',
  KEEP: 'KEEP',
} as const;

export type DuplicateResolutionAction = (typeof DuplicateResolutionAction)[keyof typeof DuplicateResolutionAction];

export const DUPLICATE_RESOLUTION_ACTIONS = Object.values(DuplicateResolutionAction) as readonly DuplicateResolutionAction[];
