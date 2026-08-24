import type { components, operations, paths } from '../generated.js';

/** Raw OpenAPI surfaces, re-exported for consumers that need them. */
export type { components, operations, paths };

type Schemas = components['schemas'];

/**
 * Flattened aliases over the generated schemas.
 *
 * `Expense` is an `allOf` composition in the spec, so openapi-typescript emits
 * an intersection. That reads fine but is awkward to construct, hence the
 * aliases here.
 */
export type Employee = Schemas['Employee'];
export type Engagement = Schemas['Engagement'];
export type ExpenseInput = Schemas['ExpenseInput'];
export type Expense = Schemas['Expense'];
export type Mileage = Schemas['Mileage'];
export type Claim = Schemas['Claim'];
export type ApprovalTask = Schemas['ApprovalTask'];
export type PolicyEvaluation = Schemas['PolicyEvaluation'];
export type PolicyRuleResult = Schemas['PolicyRuleResult'];
export type DuplicateCase = Schemas['DuplicateCase'];

/** Auth (ADR-007). Refresh tokens are single-use and rotate. */
export type TokenPair = Schemas['TokenPair'];

/** Expense update carries the optimistic concurrency token. */
export type ExpenseUpdate = Schemas['ExpenseUpdate'];

/** Finance, payment and notification. */
export type FinanceVerifyInput = Schemas['FinanceVerifyInput'];
export type PaymentBatch = Schemas['PaymentBatch'];
export type Payment = Schemas['Payment'];
export type Notification = Schemas['Notification'];

/** Versioned admin definitions. `version` on these is a PUBLISHED version
 *  number, never an optimistic-concurrency counter. */
export type PolicyDefinition = Schemas['PolicyDefinition'];
export type PolicyDefinitionInput = Schemas['PolicyDefinitionInput'];
export type PolicyCondition = Schemas['PolicyCondition'];
export type WorkflowDefinition = Schemas['WorkflowDefinition'];
export type WorkflowDefinitionInput = Schemas['WorkflowDefinitionInput'];
export type WorkflowStage = Schemas['WorkflowStage'];

/** Operational. */
export type Job = Schemas['Job'];
export type HealthReport = Schemas['HealthReport'];

/** Error envelope returned by every non-2xx response (requirements/TDD.md §11.2). */
export type ErrorEnvelope = Schemas['Error'];
