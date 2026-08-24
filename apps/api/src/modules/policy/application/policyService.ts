import type { Classification, PolicyOutcome } from '@claimdesk/contracts';

import type { Tx } from '../../../platform/database/index.js';
import type { Clock } from '../../../platform/util/index.js';
import {
  type EvaluationPhase,
  type PolicyContext,
  type PolicyDefinition,
  type PolicyRuleResult,
  type RequiredExtraStage,
  evaluatePolicies,
} from '../domain/index.js';
import type { PolicyRepository } from './ports/policyRepository.js';

/**
 * The policy module's public service.
 *
 * The EVALUATOR is pure and lives in `domain/`. This layer does the I/O the
 * evaluator refuses to: load the effective rule set, build the context, and
 * persist the result.
 *
 * Callers pass an expense-shaped input rather than the policy module reading
 * the `expenses` collection — a module never reaches into another's data.
 */
export interface EvaluatableExpense {
  id: string;
  employeeId: string;
  categoryId: string;
  amountPaise: number;
  expenseDate: Date;
  merchant?: string | undefined;
  classification: string;
  captureMode?: string | undefined;
  clientId?: string | undefined;
  engagementId?: string | undefined;
  receiptIds: readonly string[];
  exceptionJustification?: string | undefined;
  mileage?: { distanceKm: number; ratePaisePerKm: number } | undefined;
}

export interface EvaluationSummary {
  evaluationId: string;
  overallOutcome: PolicyOutcome;
  results: PolicyRuleResult[];
  policyDefinitionIds: string[];
  limitPaise?: number | undefined;
  overagePaise?: number | undefined;
  requiresJustification: boolean;
  requiredExtraStages: RequiredExtraStage[];
  messages: string[];
}

export interface PolicyContextExtras {
  employeeGrade?: string | undefined;
  employeeBranch?: string | undefined;
  employeeDepartment?: string | undefined;
  categoryCode?: string | undefined;
  categoryReceiptRequired?: boolean | undefined;
  engagementStatus?: string | undefined;
  tripNights?: number | undefined;
  tripDomestic?: boolean | undefined;
  duplicateMaxScore?: number | undefined;
  duplicateUnresolvedCount?: number | undefined;
}

export interface PolicyService {
  evaluateExpense(
    expense: EvaluatableExpense,
    phase: EvaluationPhase,
    tx: Tx,
    extras?: PolicyContextExtras,
  ): Promise<EvaluationSummary>;
  listEffective(at: Date, tx?: Tx): Promise<PolicyDefinition[]>;
}

export interface PolicyServiceDeps {
  policies: PolicyRepository;
  clock: Clock;
  /** Supplies the context fields the policy module cannot read itself. */
  loadExtras?: (expense: EvaluatableExpense, tx: Tx) => Promise<PolicyContextExtras>;
}

export function createPolicyService(deps: PolicyServiceDeps): PolicyService {
  const { clock, loadExtras, policies } = deps;

  return {
    listEffective: (at, tx) => policies.listEffective(at, tx),

    async evaluateExpense(expense, phase, tx, providedExtras?) {
      const now = clock.now();
      const extras = providedExtras ?? (await loadExtras?.(expense, tx)) ?? {};

      /*
       * Effective-dating uses the EXPENSE date, not today: the rule that
       * applied when the spend happened is the one that governs it. Workflow
       * routing is the opposite — it uses submission time, because routing is
       * about now. That asymmetry is deliberate.
       */
      const definitions = await policies.listEffective(expense.expenseDate, tx);

      const context: PolicyContext = {
        employee: {
          id: expense.employeeId,
          grade: extras.employeeGrade,
          branch: extras.employeeBranch,
          department: extras.employeeDepartment,
        },
        category: {
          id: expense.categoryId,
          code: extras.categoryCode ?? '',
          receiptRequired: extras.categoryReceiptRequired ?? false,
        },
        amount: { paise: expense.amountPaise },
        expense: {
          date: expense.expenseDate.toISOString().slice(0, 10),
          captureMode: expense.captureMode,
        },
        merchant: { raw: expense.merchant, normalized: expense.merchant?.toLowerCase() },
        classification: expense.classification as Classification,
        client: { id: expense.clientId },
        engagement: { id: expense.engagementId, status: extras.engagementStatus },
        receipt: { count: expense.receiptIds.length, present: expense.receiptIds.length > 0 },
        mileage: {
          distanceKm: expense.mileage?.distanceKm,
          ratePaisePerKm: expense.mileage?.ratePaisePerKm,
        },
        trip: { domestic: extras.tripDomestic ?? true, nights: extras.tripNights },
        duplicate: {
          maxScore: extras.duplicateMaxScore ?? 0,
          unresolvedCount: extras.duplicateUnresolvedCount ?? 0,
        },
        justification: {
          provided: Boolean(expense.exceptionJustification),
          text: expense.exceptionJustification,
        },
      };

      const output = evaluatePolicies(context, definitions, { phase, at: now });

      const evaluationId = await policies.persistEvaluation(
        {
          expenseId: expense.id,
          evaluatedAt: now,
          policyDefinitionIds: output.policyDefinitionIds,
          contextSnapshot: context as unknown as Record<string, unknown>,
          results: output.results,
          overallOutcome: output.overallOutcome,
          derived: {
            limitPaise: output.limitPaise ?? null,
            overagePaise: output.overagePaise ?? null,
            requiresJustification: output.requiresJustification,
            requiresReceipt: output.requiresReceipt,
            requiredExtraStages: output.requiredExtraStages,
            mileageRatePaisePerKm: output.mileageRatePaisePerKm ?? null,
          },
        },
        tx,
      );

      return {
        evaluationId,
        overallOutcome: output.overallOutcome,
        results: output.results,
        policyDefinitionIds: output.policyDefinitionIds,
        limitPaise: output.limitPaise,
        overagePaise: output.overagePaise,
        requiresJustification: output.requiresJustification,
        requiredExtraStages: output.requiredExtraStages,
        messages: output.messages,
      };
    },
  };
}
