export { type PolicyModule, type PolicyModuleDeps, buildPolicyModule } from './policy.module.js';
export type {
  EvaluatableExpense,
  EvaluationSummary,
  PolicyContextExtras,
  PolicyService,
} from './application/index.js';
export {
  type DuplicateCandidate,
  type DuplicateScore,
  type EvaluationPhase,
  type PolicyContext,
  type PolicyDefinition,
  type PolicyRuleResult,
  type RequiredExtraStage,
  DUPLICATE_THRESHOLD,
  KNOWN_FIELD_PATHS,
  evaluatePolicies,
  findDuplicates,
  isKnownFieldPath,
  normalizeMerchant,
  scoreDuplicate,
} from './domain/index.js';
