import type {
  Classification,
  PolicyActionTrigger,
  PolicyActionType,
  PolicyOperator,
  PolicyOutcome,
} from '@claimdesk/contracts';

/**
 * The policy rule DSL (design/09-policy-engine-spec.md).
 *
 * Everything here is pure data. The evaluator that consumes it does no I/O —
 * `domain/` is lint-banned from persistence, and that ban is what makes the
 * engine unit-testable to exhaustion.
 */

export interface PolicyLeafCondition {
  field: string;
  op: PolicyOperator;
  value?: unknown;
}

/**
 * Only `{all: [...]}` is supported. §2 shows nothing else, and inventing
 * `any`/`none` would put behaviour in the engine that no policy author was ever
 * told about.
 */
export interface PolicyCondition {
  all: PolicyLeafCondition[];
}

export interface PolicyAction {
  type: PolicyActionType;
  /**
   * When the action fires. Defaults to ALWAYS.
   *
   * This is how §5's canonical action list is reconciled with §2's example,
   * which writes `REQUIRE_JUSTIFICATION_ON_EXCEED`: that becomes
   * `{type: REQUIRE_JUSTIFICATION, on: EXCEED}`. EXCEED fires only when a LIMIT
   * on the same rule was breached.
   */
  on?: PolicyActionTrigger;
  /** LIMIT: what the cap is measured against. */
  basis?: 'PER_NIGHT' | 'PER_DAY' | 'PER_TRANSACTION' | 'PER_KM';
  amountPaise?: number;
  /** ADD_APPROVAL_STAGE: which resolver the extra stage uses. */
  resolver?: string;
  /** SET_MILEAGE_RATE. */
  ratePaisePerKm?: number;
  message?: string;
}

export interface PolicyDefinition {
  id: string;
  policyCode: string;
  version: number;
  name: string;
  priority: number;
  effectiveFrom: Date;
  effectiveTo?: Date | undefined;
  /**
   * Precedence level 2 — a mandatory legal or firm control, which outranks
   * specificity and priority.
   */
  mandatoryControl?: boolean | undefined;
  /** Precedence level 6 — the fallback when nothing more specific matched. */
  defaultCategoryPolicy?: boolean | undefined;
  conditions: PolicyCondition;
  actions: PolicyAction[];
}

/**
 * The evaluation context (design/09 §4).
 *
 * Nested rather than flat because rules address it by dot path
 * (`category.code`, `employee.grade`, `trip.domestic`).
 */
export interface PolicyContext {
  employee: {
    id: string;
    grade?: string | undefined;
    branch?: string | undefined;
    department?: string | undefined;
  };
  category: { id: string; code: string; receiptRequired: boolean };
  amount: { paise: number };
  expense: { date: string; captureMode?: string | undefined };
  merchant: { raw?: string | undefined; normalized?: string | undefined };
  classification: Classification;
  client: { id?: string | undefined };
  engagement: { id?: string | undefined; status?: string | undefined };
  receipt: { count: number; present: boolean };
  mileage: { distanceKm?: number | undefined; ratePaisePerKm?: number | undefined };
  trip: { domestic?: boolean | undefined; nights?: number | undefined };
  duplicate: { maxScore: number; unresolvedCount: number };
  justification: { provided: boolean; text?: string | undefined };
}

export interface AppliedAction {
  type: PolicyActionType;
  on: PolicyActionTrigger;
  fired: boolean;
  basis?: string | undefined;
  amountPaise?: number | undefined;
  resolver?: string | undefined;
  message?: string | undefined;
}

export interface PolicyRuleResult {
  policyDefinitionId: string;
  policyCode: string;
  policyVersion: number;
  outcome: PolicyOutcome;
  actions: AppliedAction[];
  limitPaise?: number | undefined;
  overagePaise?: number | undefined;
  message?: string | undefined;
}

export interface RequiredExtraStage {
  resolver: string;
  policyCode: string;
  policyVersion: number;
}

export interface PolicyEvaluationOutput {
  overallOutcome: PolicyOutcome;
  results: PolicyRuleResult[];
  policyDefinitionIds: string[];
  /** Set when a LIMIT applied; the tightest one wins. */
  limitPaise?: number | undefined;
  overagePaise?: number | undefined;
  requiresJustification: boolean;
  requiresReceipt: boolean;
  /** Extra approval stages the workflow must splice in (design/08 §3 row 4). */
  requiredExtraStages: RequiredExtraStage[];
  mileageRatePaisePerKm?: number | undefined;
  messages: string[];
}

/** Where evaluation is happening — `REQUIRE_RECEIPT` is phase-sensitive. */
export type EvaluationPhase = 'DRAFT' | 'SUBMIT';

export interface EvaluateOptions {
  phase: EvaluationPhase;
  /** Evaluation time is an input so the engine stays deterministic. */
  at: Date;
}
