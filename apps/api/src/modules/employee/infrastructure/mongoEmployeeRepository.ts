import type { RoleCode } from '@claimdesk/contracts';
import type { ClientSession } from 'mongoose';

import { type Tx, sessionOf, toObjectId, toObjectIds } from '../../../platform/database/index.js';
import type { EmployeeRepository } from '../application/ports/employeeRepository.js';
import { type Employee, EmployeeStatus, normalizeMobile } from '../domain/employee.js';
import { type EmployeeDoc, EmployeeModel } from './employee.model.js';

/**
 * Maps a persisted document to the domain entity.
 *
 * The one place ObjectIds become strings. A hydrated Mongoose Document must
 * never escape into `application/` — every query below is `.lean()`, and the
 * module's `index.ts` never exports the model.
 */
export function toEmployee(doc: EmployeeDoc): Employee {
  return {
    id: doc._id.toHexString(),
    employeeCode: doc.employeeCode,
    name: doc.name,
    mobileNumber: doc.mobileNumber,
    email: doc.email ?? undefined,
    status: doc.status as EmployeeStatus,
    grade: doc.grade ?? undefined,
    department: doc.department ?? undefined,
    branch: doc.branch ?? undefined,
    managerEmployeeId: doc.managerEmployeeId?.toHexString(),
    paymentProfileMasked: doc.paymentProfileMasked ?? undefined,
    externalHrId: doc.externalHrId ?? undefined,
    roles: (doc.roles ?? []) as RoleCode[],
  };
}

const withSession = (tx?: Tx): { session?: ClientSession } =>
  tx ? { session: sessionOf(tx) } : {};

export function createMongoEmployeeRepository(): EmployeeRepository {
  return {
    async findById(id, tx) {
      const objectId = toObjectId(id);
      // A malformed id is "no such employee", never a 500.
      if (!objectId) return null;

      const doc = await EmployeeModel.findOne({ _id: objectId }, null, withSession(tx))
        .lean<EmployeeDoc>()
        .exec();
      return doc ? toEmployee(doc) : null;
    },

    async findByIds(ids, tx) {
      const objectIds = toObjectIds(ids);
      if (objectIds.length === 0) return [];

      const docs = await EmployeeModel.find({ _id: { $in: objectIds } }, null, withSession(tx))
        .lean<EmployeeDoc[]>()
        .exec();
      return docs.map(toEmployee);
    },

    async findByMobile(mobileNumber, tx) {
      // Normalized so +91-prefixed and bare numbers resolve to the same person
      // — design/11 §2 requires one mobile number to map to one active employee.
      const doc = await EmployeeModel.findOne(
        { mobileNumber: normalizeMobile(mobileNumber) },
        null,
        withSession(tx),
      )
        .lean<EmployeeDoc>()
        .exec();
      return doc ? toEmployee(doc) : null;
    },

    async findByCode(employeeCode, tx) {
      const doc = await EmployeeModel.findOne({ employeeCode }, null, withSession(tx))
        .lean<EmployeeDoc>()
        .exec();
      return doc ? toEmployee(doc) : null;
    },

    async findByRole(role, tx) {
      const docs = await EmployeeModel.find(
        { roles: role, status: EmployeeStatus.ACTIVE },
        null,
        withSession(tx),
      )
        .lean<EmployeeDoc[]>()
        .exec();
      return docs.map(toEmployee);
    },

    async list(tx) {
      const docs = await EmployeeModel.find({}, null, withSession(tx))
        .sort({ employeeCode: 1 })
        .lean<EmployeeDoc[]>()
        .exec();
      return docs.map(toEmployee);
    },
  };
}
