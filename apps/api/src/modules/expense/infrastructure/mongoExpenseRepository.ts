import type {
  CaptureMode,
  Classification,
  Currency,
  ExpenseState,
  PolicyOutcome,
} from '@claimdesk/contracts';
import type { ClientSession } from 'mongoose';

import {
  type Tx,
  decodeCursor,
  guardedUpdate,
  mapGuardResult,
  pruneUndefined,
  sessionOf,
  toObjectId,
  toObjectIds,
  toPage,
} from '../../../platform/database/index.js';
import type {
  ExpenseQuery,
  ExpenseRepository,
  NewExpense,
  UpdateExpenseCommand,
} from '../application/ports/expenseRepository.js';
import type { Expense } from '../domain/expense.js';
import { type ExpenseDoc, ExpenseModel } from './expense.model.js';

const withSession = (tx?: Tx): { session?: ClientSession } =>
  tx ? { session: sessionOf(tx) } : {};

export function toExpense(doc: ExpenseDoc): Expense {
  return {
    id: doc._id.toHexString(),
    expenseNo: doc.expenseNo,
    employeeId: doc.employeeId.toHexString(),
    captureMode: doc.captureMode as CaptureMode,
    merchant: doc.merchant ?? undefined,
    expenseDate: doc.expenseDate,
    categoryId: doc.categoryId.toHexString(),
    amountPaise: doc.amountPaise,
    currency: doc.currency as Currency,
    classification: doc.classification as Classification,
    clientId: doc.clientId?.toHexString(),
    engagementId: doc.engagementId?.toHexString(),
    costCentreId: doc.costCentreId ?? undefined,
    businessPurpose: doc.businessPurpose,
    mileage: doc.mileage
      ? {
          origin: doc.mileage.origin,
          destination: doc.mileage.destination,
          distanceKm: doc.mileage.distanceKm,
          ratePaisePerKm: doc.mileage.ratePaisePerKm,
          rateRuleId: doc.mileage.rateRuleId?.toHexString(),
          amountPaise: doc.mileage.amountPaise,
        }
      : undefined,
    receiptIds: (doc.receiptIds ?? []).map((id) => id.toHexString()),
    ocrResultId: doc.ocrResultId?.toHexString(),
    policyEvaluationId: doc.policyEvaluationId?.toHexString(),
    policyOutcome: (doc.policyOutcome ?? undefined) as PolicyOutcome | undefined,
    duplicateCaseIds: (doc.duplicateCaseIds ?? []).map((id) => id.toHexString()),
    exceptionJustification: doc.exceptionJustification ?? undefined,
    state: doc.state as ExpenseState,
    claimId: doc.claimId?.toHexString(),
    version: doc.version,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/** Maps a domain-shaped write into document fields, converting ids. */
function toPersistence(input: Partial<NewExpense>): Record<string, unknown> {
  return pruneUndefined({
    expenseNo: input.expenseNo,
    employeeId: input.employeeId ? toObjectId(input.employeeId) : undefined,
    captureMode: input.captureMode,
    merchant: input.merchant,
    expenseDate: input.expenseDate,
    categoryId: input.categoryId ? toObjectId(input.categoryId) : undefined,
    amountPaise: input.amountPaise,
    currency: input.currency,
    classification: input.classification,
    clientId: input.clientId ? toObjectId(input.clientId) : undefined,
    engagementId: input.engagementId ? toObjectId(input.engagementId) : undefined,
    businessPurpose: input.businessPurpose,
    mileage: input.mileage
      ? {
          ...input.mileage,
          rateRuleId: input.mileage.rateRuleId ? toObjectId(input.mileage.rateRuleId) : null,
        }
      : undefined,
    receiptIds: input.receiptIds ? toObjectIds(input.receiptIds) : undefined,
    exceptionJustification: input.exceptionJustification,
    state: input.state,
  });
}

export function createMongoExpenseRepository(): ExpenseRepository {
  return {
    async findById(id, tx) {
      const objectId = toObjectId(id);
      if (!objectId) return null;
      const doc = await ExpenseModel.findOne({ _id: objectId }, null, withSession(tx))
        .lean<ExpenseDoc>()
        .exec();
      return doc ? toExpense(doc) : null;
    },

    async findByIds(ids, tx) {
      const objectIds = toObjectIds(ids);
      if (objectIds.length === 0) return [];
      const docs = await ExpenseModel.find({ _id: { $in: objectIds } }, null, withSession(tx))
        .lean<ExpenseDoc[]>()
        .exec();
      return docs.map(toExpense);
    },

    async list(query: ExpenseQuery, tx) {
      const employeeId = toObjectId(query.employeeId);
      if (!employeeId) return { items: [] };

      const cursor = query.cursor ? decodeCursor(query.cursor) : null;

      // Keyset pagination, not skip/limit: an expense created mid-paging would
      // shift every later page and silently hide a row.
      const filter: Record<string, unknown> = {
        employeeId,
        ...(query.state ? { state: query.state } : {}),
        ...(cursor
          ? {
              $or: [
                { expenseDate: { $lt: new Date(cursor.k) } },
                { expenseDate: new Date(cursor.k), _id: { $lt: toObjectId(cursor.i) } },
              ],
            }
          : {}),
      };

      const docs = await ExpenseModel.find(filter, null, withSession(tx))
        .sort({ expenseDate: -1, _id: -1 })
        .limit(query.limit + 1)
        .lean<ExpenseDoc[]>()
        .exec();

      const page = toPage(docs, query.limit, (doc) => ({
        k: doc.expenseDate.toISOString(),
        i: doc._id.toHexString(),
      }));

      return { items: page.items.map(toExpense), nextCursor: page.nextCursor };
    },

    async findDuplicateCandidates(employeeId, around, windowDays, excludeExpenseId, tx) {
      const employee = toObjectId(employeeId);
      if (!employee) return [];

      const windowMs = windowDays * 24 * 60 * 60 * 1000;
      const exclude = excludeExpenseId ? toObjectId(excludeExpenseId) : null;

      const docs = await ExpenseModel.find(
        {
          employeeId: employee,
          expenseDate: {
            $gte: new Date(around.getTime() - windowMs),
            $lte: new Date(around.getTime() + windowMs),
          },
          ...(exclude ? { _id: { $ne: exclude } } : {}),
        },
        null,
        withSession(tx),
      )
        .limit(50)
        .lean<ExpenseDoc[]>()
        .exec();

      return docs.map(toExpense);
    },

    async insert(expense, tx) {
      const [created] = await ExpenseModel.create([{ ...toPersistence(expense), version: 0 }], {
        session: sessionOf(tx),
      });
      if (!created) throw new Error('Failed to insert expense.');
      return toExpense(created.toObject<ExpenseDoc>());
    },

    async update(command: UpdateExpenseCommand, tx) {
      const id = toObjectId(command.id);
      const employeeId = toObjectId(command.employeeId);
      if (!id || !employeeId) {
        return { ok: false, reason: 'not-found' };
      }

      const result = await guardedUpdate<ExpenseDoc>({
        model: ExpenseModel,
        session: sessionOf(tx),
        spec: {
          identity: { _id: id },
          ownership: { employeeId },
          // Only an editable expense may change; anything in a submitted claim
          // is frozen.
          state: { state: { $in: ['DRAFT', 'UNCLAIMED'] } },
          version: command.expectedVersion,
        },
        update: { $set: toPersistence(command.patch) },
      });
      return mapGuardResult(result, toExpense);
    },

    async deleteDraft(id, employeeId, tx) {
      const expenseId = toObjectId(id);
      const employee = toObjectId(employeeId);
      if (!expenseId || !employee) return { ok: false, reason: 'not-found' };

      const session = sessionOf(tx);
      const existing = await ExpenseModel.findOne({ _id: expenseId })
        .session(session)
        .lean<ExpenseDoc>()
        .exec();

      if (!existing) return { ok: false, reason: 'not-found' };
      if (!existing.employeeId.equals(employee)) return { ok: false, reason: 'forbidden' };
      if (!['DRAFT', 'UNCLAIMED'].includes(existing.state)) {
        return { ok: false, reason: 'illegal-state' };
      }

      await ExpenseModel.deleteOne({ _id: expenseId, state: existing.state }, { session }).exec();
      return { ok: true, value: toExpense(existing) };
    },

    async attachEvaluation(id, evaluationId, outcome, tx) {
      const expenseId = toObjectId(id);
      const evaluation = toObjectId(evaluationId);
      if (!expenseId || !evaluation) return { ok: false, reason: 'not-found' };

      const result = await guardedUpdate<ExpenseDoc>({
        model: ExpenseModel,
        session: sessionOf(tx),
        spec: { identity: { _id: expenseId } },
        update: { $set: { policyEvaluationId: evaluation, policyOutcome: outcome } },
        // A policy re-run is not a user edit; bumping the version would
        // invalidate the client's token for no reason.
        incrementVersion: false,
      });
      return mapGuardResult(result, toExpense);
    },

    async attachToClaim(expenseIds, claimId, employeeId, tx) {
      const ids = toObjectIds(expenseIds);
      const claim = toObjectId(claimId);
      const employee = toObjectId(employeeId);
      if (ids.length === 0 || !claim || !employee) return 0;

      const result = await ExpenseModel.updateMany(
        { _id: { $in: ids }, employeeId: employee, state: 'UNCLAIMED', claimId: null },
        { $set: { claimId: claim, state: 'IN_CLAIM' }, $inc: { version: 1 } },
        { session: sessionOf(tx) },
      ).exec();

      return result.modifiedCount;
    },

    async transitionMany(expenseIds, from, to, tx, options) {
      const ids = toObjectIds(expenseIds);
      if (ids.length === 0) return 0;

      const result = await ExpenseModel.updateMany(
        { _id: { $in: ids }, state: { $in: [...from] } },
        {
          $set: { state: to, ...(options?.clearClaim ? { claimId: null } : {}) },
          $inc: { version: 1 },
        },
        { session: sessionOf(tx) },
      ).exec();

      return result.modifiedCount;
    },

    async setDuplicateCases(id, caseIds, tx) {
      const expenseId = toObjectId(id);
      if (!expenseId) return;
      await ExpenseModel.updateOne(
        { _id: expenseId },
        { $set: { duplicateCaseIds: toObjectIds(caseIds) } },
        { session: sessionOf(tx) },
      ).exec();
    },
  };
}
