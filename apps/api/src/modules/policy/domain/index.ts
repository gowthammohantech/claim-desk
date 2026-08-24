export {
  type AppliedAction,
  type EvaluateOptions,
  type EvaluationPhase,
  type PolicyAction,
  type PolicyCondition,
  type PolicyContext,
  type PolicyDefinition,
  type PolicyEvaluationOutput,
  type PolicyLeafCondition,
  type PolicyRuleResult,
  type RequiredExtraStage,
} from './types.js';
export { FIELD_PATHS, KNOWN_FIELD_PATHS, isKnownFieldPath, resolveField } from './context.js';
export { evaluateLeaf, matchesCondition } from './operators.js';
export { comparePolicies, isEffective, orderByPrecedence, specificityOf } from './precedence.js';
export { evaluatePolicies } from './evaluator.js';
export {
  type DuplicateCandidate,
  type DuplicateScore,
  DUPLICATE_THRESHOLD,
  findDuplicates,
  isDuplicate,
  normalizeMerchant,
  scoreDuplicate,
} from './duplicates.js';
