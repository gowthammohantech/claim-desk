import mongoose, { Schema, type Types } from 'mongoose';

import { EmployeeStatus } from '../domain/employee.js';

export interface EmployeeDoc {
  _id: Types.ObjectId;
  employeeCode: string;
  name: string;
  mobileNumber: string;
  email?: string | null;
  /** Lowercased/trimmed shadow of `email`, for the partial unique index. */
  emailNormalized?: string | null;
  status: string;
  grade?: string | null;
  department?: string | null;
  branch?: string | null;
  managerEmployeeId?: Types.ObjectId | null;
  paymentProfileMasked?: string | null;
  externalHrId?: string | null;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<EmployeeDoc>(
  {
    employeeCode: { type: String, required: true },
    name: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    email: { type: String, default: null },
    emailNormalized: { type: String, default: null },
    status: { type: String, required: true, default: EmployeeStatus.ACTIVE },
    grade: { type: String, default: null },
    department: { type: String, default: null },
    branch: { type: String, default: null },
    managerEmployeeId: { type: Schema.Types.ObjectId, default: null },
    paymentProfileMasked: { type: String, default: null },
    externalHrId: { type: String, default: null },
    roles: { type: [String], required: true, default: [] },
  },
  {
    // `__v` must never coexist with our own `version` field on the OCC
    // collections; disabling it everywhere keeps the convention uniform.
    versionKey: false,
    timestamps: true,
    autoIndex: false,
    autoCreate: false,
    collection: 'employees',
  },
);

export const EmployeeModel =
  (mongoose.models['Employee'] as mongoose.Model<EmployeeDoc> | undefined) ??
  mongoose.model<EmployeeDoc>('Employee', employeeSchema);
