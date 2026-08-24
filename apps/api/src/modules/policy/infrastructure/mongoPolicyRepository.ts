import { DefinitionStatus, DuplicateCaseStatus } from '@claimdesk/contracts';
import type { ClientSession } from 'mongoose';

import { type Tx, sessionOf, toObjectId, toObjectIds } from '../../../platform/database/index.js';
import type {
  DuplicateCaseRecord,
  PolicyRepository,
} from '../application/ports/policyRepository.js';
import type { PolicyDefinition } from '../domain/index.js';
import {
  type DuplicateCaseDoc,
  DuplicateCaseModel,
  type PolicyDefinitionDoc,
  PolicyDefinitionModel,
  PolicyEvaluationModel,
} from './policy.models.js';

const withSession = (tx?: Tx): { session?: ClientSession } =>
  tx ? { session: sessionOf(tx) } : {};

function toPolicyDefinition(doc: PolicyDefinitionDoc): PolicyDefinition {
  return {
    id: doc._id.toHexString(),
    policyCode: doc.policyCode,
    version: doc.version,
    name: doc.name,
    priority: doc.priority,
    effectiveFrom: doc.effectiveFrom,
    effectiveTo: doc.effectiveTo ?? undefined,
    mandatoryControl: doc.mandatoryControl,
    defaultCategoryPolicy: doc.defaultCategoryPolicy,
    conditions: doc.conditions as unknown as PolicyDefinition['conditions'],
    actions: doc.actions as unknown as PolicyDefinition['actions'],
  };
}

const toDuplicateCase = (doc: DuplicateCaseDoc): DuplicateCaseRecord => ({
  id: doc._id.toHexString(),
  expenseId: doc.expenseId.toHexString(),
  candidateExpenseId: doc.candidateExpenseId.toHexString(),
  score: doc.score,
  reasons: doc.reasons,
  status: doc.status,
  resolution: doc.resolution ?? undefined,
});

export function createMongoPolicyRepository(): PolicyRepository {
  return {
    async listEffective(at, tx) {
      const docs = await PolicyDefinitionModel.find(
        {
          status: DefinitionStatus.PUBLISHED,
          effectiveFrom: { $lte: at },
          $or: [{ effectiveTo: null }, { effectiveTo: { $gt: at } }],
        },
        null,
        withSession(tx),
      )
        .lean<PolicyDefinitionDoc[]>()
        .exec();

      return docs.map(toPolicyDefinition);
    },

    async listAll(status, tx) {
      const docs = await PolicyDefinitionModel.find(
        status ? { status } : {},
        null,
        withSession(tx),
      )
        .sort({ policyCode: 1, version: -1 })
        .lean<PolicyDefinitionDoc[]>()
        .exec();
      return docs.map(toPolicyDefinition);
    },

    async persistEvaluation(input, tx) {
      const expenseId = toObjectId(input.expenseId);
      if (!expenseId) throw new Error(`Invalid expense id: ${input.expenseId}`);

      // Loose record: Mongoose 9's `create` generics do not narrow cleanly
      // against a typed literal under exactOptionalPropertyTypes.
      const doc: Record<string, unknown> = {
        expenseId,
        evaluatedAt: input.evaluatedAt,
        policyVersionIds: toObjectIds(input.policyDefinitionIds),
        contextSnapshot: input.contextSnapshot,
        results: input.results,
        overallOutcome: input.overallOutcome,
        derived: input.derived,
      };

      const [created] = await PolicyEvaluationModel.create([doc], { session: sessionOf(tx) });
      if (!created) throw new Error('Failed to persist the policy evaluation.');
      return created._id.toHexString();
    },

    async openDuplicateCases(expenseId, tx) {
      const id = toObjectId(expenseId);
      if (!id) return [];
      const docs = await DuplicateCaseModel.find(
        { expenseId: id, status: DuplicateCaseStatus.OPEN },
        null,
        withSession(tx),
      )
        .lean<DuplicateCaseDoc[]>()
        .exec();
      return docs.map(toDuplicateCase);
    },

    async recordDuplicateCase(input, tx) {
      const expenseId = toObjectId(input.expenseId);
      const candidateExpenseId = toObjectId(input.candidateExpenseId);
      if (!expenseId || !candidateExpenseId) throw new Error('Invalid expense id.');

      // Upsert on the pair: re-running detection must not create a second case
      // for the same two expenses. The unique index backs this up.
      const updated = await DuplicateCaseModel.findOneAndUpdate(
        { expenseId, candidateExpenseId },
        {
          $setOnInsert: {
            expenseId,
            candidateExpenseId,
            status: DuplicateCaseStatus.OPEN,
            createdAt: input.now,
          },
          $set: { score: input.score, reasons: [...input.reasons] },
        },
        { upsert: true, returnDocument: 'after', session: sessionOf(tx) },
      )
        .lean<DuplicateCaseDoc>()
        .exec();

      if (!updated) throw new Error('Failed to record the duplicate case.');
      return updated._id.toHexString();
    },

    async resolveDuplicateCase(input, tx) {
      const expenseId = toObjectId(input.expenseId);
      const resolvedBy = toObjectId(input.resolvedBy);
      if (!expenseId) return 0;

      const candidate = input.candidateExpenseId
        ? toObjectId(input.candidateExpenseId)
        : undefined;

      const result = await DuplicateCaseModel.updateMany(
        {
          expenseId,
          status: DuplicateCaseStatus.OPEN,
          ...(candidate ? { candidateExpenseId: candidate } : {}),
        },
        {
          $set: {
            status: DuplicateCaseStatus.RESOLVED,
            resolution: input.resolution,
            resolutionReason: input.reason ?? null,
            resolvedBy: resolvedBy ?? null,
            resolvedAt: input.now,
          },
        },
        { session: sessionOf(tx) },
      ).exec();

      return result.modifiedCount;
    },
  };
}
