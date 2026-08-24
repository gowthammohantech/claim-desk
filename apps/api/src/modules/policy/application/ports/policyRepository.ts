import type { Tx } from '../../../../platform/database/index.js';
import type { PolicyDefinition, PolicyRuleResult } from '../../domain/index.js';

/**
 * Policy persistence port.
 *
 * The application layer depends on this interface, never on the Mongoose
 * models — that inversion is what the boundaries lint enforces, and it is what
 * lets the evaluator be tested against an in-memory rule set.
 */
export interface PersistEvaluationInput {
  expenseId: string;
  evaluatedAt: Date;
  policyDefinitionIds: readonly string[];
  contextSnapshot: Record<string, unknown>;
  results: readonly PolicyRuleResult[];
  overallOutcome: string;
  derived: Record<string, unknown>;
}

export interface DuplicateCaseRecord {
  id: string;
  expenseId: string;
  candidateExpenseId: string;
  score: number;
  reasons: readonly string[];
  status: string;
  resolution?: string | undefined;
}

export interface PolicyRepository {
  /** Published definitions in force at `at`. */
  listEffective(at: Date, tx?: Tx): Promise<PolicyDefinition[]>;
  listAll(status: string | undefined, tx?: Tx): Promise<PolicyDefinition[]>;

  persistEvaluation(input: PersistEvaluationInput, tx: Tx): Promise<string>;

  openDuplicateCases(expenseId: string, tx?: Tx): Promise<DuplicateCaseRecord[]>;
  recordDuplicateCase(
    input: {
      expenseId: string;
      candidateExpenseId: string;
      score: number;
      reasons: readonly string[];
      now: Date;
    },
    tx: Tx,
  ): Promise<string>;
  resolveDuplicateCase(
    input: {
      expenseId: string;
      candidateExpenseId?: string | undefined;
      resolution: string;
      reason?: string | undefined;
      resolvedBy: string;
      now: Date;
    },
    tx: Tx,
  ): Promise<number>;
}
