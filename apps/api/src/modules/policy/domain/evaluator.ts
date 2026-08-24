import {
  PolicyActionTrigger,
  PolicyActionType,
  PolicyOutcome,
  type PolicyOutcome as PolicyOutcomeValue,
} from '@claimdesk/contracts';

import { matchesCondition } from './operators.js';
import { isEffective, orderByPrecedence } from './precedence.js';
import type {
  AppliedAction,
  EvaluateOptions,
  PolicyAction,
  PolicyContext,
  PolicyDefinition,
  PolicyEvaluationOutput,
  PolicyRuleResult,
  RequiredExtraStage,
} from './types.js';

/** Outcome severity — a lower-precedence ALLOW can never clear a BLOCK. */
const SEVERITY: Record<PolicyOutcomeValue, number> = {
  [PolicyOutcome.PASS]: 0,
  [PolicyOutcome.WARNING]: 1,
  [PolicyOutcome.EXCEPTION_REQUIRES_JUSTIFICATION]: 2,
  [PolicyOutcome.BLOCKED]: 3,
};

const worst = (a: PolicyOutcomeValue, b: PolicyOutcomeValue): PolicyOutcomeValue =>
  SEVERITY[a] >= SEVERITY[b] ? a : b;

/** Converts a LIMIT's basis into the cap that actually applies to this expense. */
function limitForBasis(action: PolicyAction, context: PolicyContext): number | null {
  if (typeof action.amountPaise !== 'number') return null;

  switch (action.basis) {
    case 'PER_NIGHT': {
      const nights = context.trip.nights ?? 1;
      return action.amountPaise * Math.max(1, nights);
    }
    case 'PER_KM': {
      const distance = context.mileage.distanceKm ?? 0;
      return Math.round(action.amountPaise * distance);
    }
    case 'PER_DAY':
    case 'PER_TRANSACTION':
    default:
      return action.amountPaise;
  }
}

/**
 * Evaluates an expense against the effective policy set.
 *
 * PURE — no I/O, and evaluation time is an input, so the same context and the
 * same rules always produce the same snapshot.
 *
 * The action fold is deliberately TWO-PASS:
 *
 *   Pass 1 resolves the value-producing actions (LIMIT, SET_MILEAGE_RATE) and
 *          computes whether the limit was exceeded.
 *   Pass 2 resolves the gated actions, now that `exceeded` is known.
 *
 * A single pass is the bug waiting to happen: a `REQUIRE_JUSTIFICATION` with
 * `on: EXCEED` in the highest-precedence policy would be folded before a
 * lower-precedence LIMIT had been resolved, and would silently never fire —
 * which is exactly the §2 example (₹5,500 against a ₹4,000/night cap).
 */
export function evaluatePolicies(
  context: PolicyContext,
  policies: readonly PolicyDefinition[],
  options: EvaluateOptions,
): PolicyEvaluationOutput {
  const matched = orderByPrecedence(
    policies.filter((policy) => isEffective(policy, options.at) && matchesCondition(policy.conditions, context)),
  );

  // ─── Pass 1: resolve limits and rates ─────────────────────────────────────
  let limitPaise: number | undefined;
  let limitOwner: PolicyDefinition | undefined;
  let mileageRatePaisePerKm: number | undefined;

  for (const policy of matched) {
    for (const action of policy.actions) {
      if (action.type === PolicyActionType.LIMIT && limitPaise === undefined) {
        const resolved = limitForBasis(action, context);
        if (resolved !== null) {
          // First (most-precedent) LIMIT wins; later ones are superseded.
          limitPaise = resolved;
          limitOwner = policy;
        }
      }

      if (
        action.type === PolicyActionType.SET_MILEAGE_RATE &&
        mileageRatePaisePerKm === undefined &&
        typeof action.ratePaisePerKm === 'number'
      ) {
        mileageRatePaisePerKm = action.ratePaisePerKm;
      }
    }
  }

  const overagePaise =
    limitPaise === undefined ? undefined : Math.max(0, context.amount.paise - limitPaise);
  const exceeded = (overagePaise ?? 0) > 0;

  // ─── Pass 2: fold the gated actions ───────────────────────────────────────
  const results: PolicyRuleResult[] = [];
  const requiredExtraStages: RequiredExtraStage[] = [];
  const messages: string[] = [];

  let overallOutcome: PolicyOutcomeValue = PolicyOutcome.PASS;
  let requiresJustification = false;
  let requiresReceipt = false;

  for (const policy of matched) {
    const applied: AppliedAction[] = [];
    let ruleOutcome: PolicyOutcomeValue = PolicyOutcome.PASS;

    for (const action of policy.actions) {
      const trigger = action.on ?? PolicyActionTrigger.ALWAYS;
      const fires = trigger === PolicyActionTrigger.ALWAYS || exceeded;

      applied.push({
        type: action.type,
        on: trigger,
        fired: fires,
        basis: action.basis,
        amountPaise: action.amountPaise,
        resolver: action.resolver,
        message: action.message,
      });

      if (!fires) continue;
      if (action.message) messages.push(action.message);

      switch (action.type) {
        case PolicyActionType.BLOCK:
          ruleOutcome = worst(ruleOutcome, PolicyOutcome.BLOCKED);
          break;

        case PolicyActionType.WARN:
          ruleOutcome = worst(ruleOutcome, PolicyOutcome.WARNING);
          break;

        case PolicyActionType.MARK_EXCEPTION:
          ruleOutcome = worst(ruleOutcome, PolicyOutcome.EXCEPTION_REQUIRES_JUSTIFICATION);
          break;

        case PolicyActionType.REQUIRE_JUSTIFICATION:
          requiresJustification = true;
          // Already justified means the exception is resolved, not outstanding.
          ruleOutcome = context.justification.provided
            ? worst(ruleOutcome, PolicyOutcome.WARNING)
            : worst(ruleOutcome, PolicyOutcome.EXCEPTION_REQUIRES_JUSTIFICATION);
          break;

        case PolicyActionType.REQUIRE_RECEIPT:
          requiresReceipt = true;
          if (!context.receipt.present) {
            /*
             * Phase-sensitive. A missing receipt on a draft is a nudge — the
             * employee has not attached it yet. At submission it is a hard stop,
             * because the claim is about to enter an approval chain that cannot
             * verify the spend.
             */
            ruleOutcome = worst(
              ruleOutcome,
              options.phase === 'SUBMIT' ? PolicyOutcome.BLOCKED : PolicyOutcome.WARNING,
            );
          }
          break;

        case PolicyActionType.ADD_APPROVAL_STAGE:
          if (action.resolver) {
            requiredExtraStages.push({
              resolver: action.resolver,
              policyCode: policy.policyCode,
              policyVersion: policy.version,
            });
          }
          break;

        case PolicyActionType.LIMIT:
          // Resolved in pass 1; exceeding it only matters through the gated
          // actions above, so a bare LIMIT does not itself change the outcome.
          break;

        case PolicyActionType.ALLOW:
        case PolicyActionType.SET_MILEAGE_RATE:
        default:
          break;
      }
    }

    const isLimitOwner = limitOwner?.id === policy.id;

    results.push({
      policyDefinitionId: policy.id,
      policyCode: policy.policyCode,
      policyVersion: policy.version,
      outcome: ruleOutcome,
      actions: applied,
      ...(isLimitOwner && limitPaise !== undefined ? { limitPaise } : {}),
      ...(isLimitOwner && overagePaise !== undefined ? { overagePaise } : {}),
    });

    overallOutcome = worst(overallOutcome, ruleOutcome);
  }

  return {
    overallOutcome,
    results,
    policyDefinitionIds: matched.map((policy) => policy.id),
    limitPaise,
    overagePaise,
    requiresJustification,
    requiresReceipt,
    // Deduped by resolver: two policies both demanding a Partner should add one
    // Partner stage, not two.
    requiredExtraStages: dedupeByResolver(requiredExtraStages),
    mileageRatePaisePerKm,
    messages,
  };
}

function dedupeByResolver(stages: readonly RequiredExtraStage[]): RequiredExtraStage[] {
  const seen = new Set<string>();
  const output: RequiredExtraStage[] = [];
  for (const stage of stages) {
    if (seen.has(stage.resolver)) continue;
    seen.add(stage.resolver);
    output.push(stage);
  }
  return output;
}
