import type { Clock } from '../../platform/util/index.js';
import {
  type PolicyContextExtras,
  type PolicyService,
  createPolicyService,
} from './application/index.js';
import type { EvaluatableExpense, PolicyRepository } from './application/index.js';
import type { Tx } from '../../platform/database/index.js';
import { createMongoPolicyRepository } from './infrastructure/mongoPolicyRepository.js';

/**
 * Policy module. Owns `policyDefinitions`, `policyEvaluations` and
 * `duplicateCases`.
 *
 * The evaluator itself is BACKEND ONLY and never shipped to a client —
 * design/09 §1: evaluate "without embedding firm policy in mobile/web code".
 * Clients consume outcomes through POST /expenses/{id}/evaluate.
 */
export interface PolicyModuleDeps {
  clock: Clock;
  loadExtras?: (expense: EvaluatableExpense, tx: Tx) => Promise<PolicyContextExtras>;
}

export interface PolicyModule {
  policy: PolicyService;
  policies: PolicyRepository;
}

export function buildPolicyModule(deps: PolicyModuleDeps): PolicyModule {
  const policies = createMongoPolicyRepository();

  return {
    policies,
    policy: createPolicyService({
      policies,
      clock: deps.clock,
      ...(deps.loadExtras ? { loadExtras: deps.loadExtras } : {}),
    }),
  };
}
