import type { EngagementStatus, PermissionCode, RoleCode } from '@claimdesk/contracts';
import type { ClientSession } from 'mongoose';

import { type Tx, sessionOf, toObjectId, toObjectIds } from '../../../platform/database/index.js';
import type { MasterDataRepository } from '../application/ports/masterDataRepository.js';
import type {
  Client,
  Engagement,
  ExpenseCategory,
  Role,
} from '../domain/masterData.js';
import {
  type ClientDoc,
  ClientModel,
  type EngagementDoc,
  EngagementModel,
  type ExpenseCategoryDoc,
  ExpenseCategoryModel,
  type RoleDoc,
  RoleModel,
} from './masterData.models.js';

const withSession = (tx?: Tx): { session?: ClientSession } =>
  tx ? { session: sessionOf(tx) } : {};

const toClient = (doc: ClientDoc): Client => ({
  id: doc._id.toHexString(),
  code: doc.code,
  name: doc.name,
  status: doc.status,
  externalId: doc.externalId ?? undefined,
});

const toEngagement = (doc: EngagementDoc): Engagement => ({
  id: doc._id.toHexString(),
  code: doc.code,
  clientId: doc.clientId.toHexString(),
  name: doc.name,
  status: doc.status as EngagementStatus,
  startDate: doc.startDate ?? undefined,
  endDate: doc.endDate ?? undefined,
  managerEmployeeId: doc.managerEmployeeId?.toHexString(),
  partnerEmployeeId: doc.partnerEmployeeId?.toHexString(),
  memberEmployeeIds: (doc.memberEmployeeIds ?? []).map((id) => id.toHexString()),
  costCentreId: doc.costCentreId ?? undefined,
  externalId: doc.externalId ?? undefined,
});

const toCategory = (doc: ExpenseCategoryDoc): ExpenseCategory => ({
  id: doc._id.toHexString(),
  code: doc.code,
  name: doc.name,
  active: doc.active,
  defaultReceiptRequired: doc.defaultReceiptRequired,
  accountingDefaults: (doc.accountingDefaults ?? undefined) as ExpenseCategory['accountingDefaults'],
});

const toRole = (doc: RoleDoc): Role => ({
  id: doc._id.toHexString(),
  code: doc.code as RoleCode,
  name: doc.name,
  permissions: (doc.permissions ?? []) as PermissionCode[],
  active: doc.active,
});

export function createMongoMasterDataRepository(): MasterDataRepository {
  return {
    async findClientById(id, tx) {
      const objectId = toObjectId(id);
      if (!objectId) return null;
      const doc = await ClientModel.findOne({ _id: objectId }, null, withSession(tx))
        .lean<ClientDoc>()
        .exec();
      return doc ? toClient(doc) : null;
    },

    async listClients(tx) {
      const docs = await ClientModel.find({}, null, withSession(tx))
        .sort({ code: 1 })
        .lean<ClientDoc[]>()
        .exec();
      return docs.map(toClient);
    },

    async findEngagementById(id, tx) {
      const objectId = toObjectId(id);
      if (!objectId) return null;
      const doc = await EngagementModel.findOne({ _id: objectId }, null, withSession(tx))
        .lean<EngagementDoc>()
        .exec();
      return doc ? toEngagement(doc) : null;
    },

    async findEngagementsByIds(ids, tx) {
      const objectIds = toObjectIds(ids);
      if (objectIds.length === 0) return [];
      const docs = await EngagementModel.find(
        { _id: { $in: objectIds } },
        null,
        withSession(tx),
      )
        .lean<EngagementDoc[]>()
        .exec();
      return docs.map(toEngagement);
    },

    /**
     * design/11 §3: only OPEN engagements the employee is assigned to are
     * selectable. Closed ones stay readable through `findEngagementById`, which
     * is what keeps a historical claim renderable.
     */
    async listSelectableEngagements(employeeId, tx) {
      const objectId = toObjectId(employeeId);
      if (!objectId) return [];
      const docs = await EngagementModel.find(
        { status: 'OPEN', memberEmployeeIds: objectId },
        null,
        withSession(tx),
      )
        .sort({ code: 1 })
        .lean<EngagementDoc[]>()
        .exec();
      return docs.map(toEngagement);
    },

    async findCategoryById(id, tx) {
      const objectId = toObjectId(id);
      if (!objectId) return null;
      const doc = await ExpenseCategoryModel.findOne({ _id: objectId }, null, withSession(tx))
        .lean<ExpenseCategoryDoc>()
        .exec();
      return doc ? toCategory(doc) : null;
    },

    async listCategories(tx) {
      const docs = await ExpenseCategoryModel.find({}, null, withSession(tx))
        .sort({ name: 1 })
        .lean<ExpenseCategoryDoc[]>()
        .exec();
      return docs.map(toCategory);
    },

    async listRoles(tx) {
      const docs = await RoleModel.find({ active: true }, null, withSession(tx))
        .lean<RoleDoc[]>()
        .exec();
      return docs.map(toRole);
    },
  };
}
