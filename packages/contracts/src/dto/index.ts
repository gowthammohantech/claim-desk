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

/** Error envelope returned by every non-2xx response (requirements/TDD.md §11.2). */
export type ErrorEnvelope = Schemas['Error'];
