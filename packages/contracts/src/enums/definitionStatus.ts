/** Lifecycle of a versioned policy or workflow definition. Published versions are immutable (design/09 §9) — an edit creates a new version. */
export const DefinitionStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type DefinitionStatus = (typeof DefinitionStatus)[keyof typeof DefinitionStatus];

export const DEFINITION_STATUSES = Object.values(DefinitionStatus) as readonly DefinitionStatus[];
