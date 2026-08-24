import mongoose, { Schema, type Types } from 'mongoose';

/** `clients`, `engagements`, `expenseCategories`, `roles`. */

export interface ClientDoc {
  _id: Types.ObjectId;
  code: string;
  name: string;
  status: string;
  externalId?: string | null;
}

export interface EngagementDoc {
  _id: Types.ObjectId;
  code: string;
  clientId: Types.ObjectId;
  name: string;
  status: string;
  startDate?: Date | null;
  endDate?: Date | null;
  managerEmployeeId?: Types.ObjectId | null;
  partnerEmployeeId?: Types.ObjectId | null;
  memberEmployeeIds: Types.ObjectId[];
  costCentreId?: string | null;
  externalId?: string | null;
}

export interface ExpenseCategoryDoc {
  _id: Types.ObjectId;
  code: string;
  name: string;
  active: boolean;
  defaultReceiptRequired: boolean;
  accountingDefaults?: Record<string, unknown> | null;
}

export interface RoleDoc {
  _id: Types.ObjectId;
  code: string;
  name: string;
  permissions: string[];
  active: boolean;
}

const options = {
  versionKey: false,
  timestamps: true,
  autoIndex: false,
  autoCreate: false,
} as const;

const clientSchema = new Schema<ClientDoc>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, required: true, default: 'ACTIVE' },
    externalId: { type: String, default: null },
  },
  { ...options, collection: 'clients' },
);

const engagementSchema = new Schema<EngagementDoc>(
  {
    code: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    status: { type: String, required: true, default: 'OPEN' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    managerEmployeeId: { type: Schema.Types.ObjectId, default: null },
    partnerEmployeeId: { type: Schema.Types.ObjectId, default: null },
    // The N:N carrier between Engagement and Employee (design/04 §3).
    memberEmployeeIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    costCentreId: { type: String, default: null },
    externalId: { type: String, default: null },
  },
  { ...options, collection: 'engagements' },
);

const expenseCategorySchema = new Schema<ExpenseCategoryDoc>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
    defaultReceiptRequired: { type: Boolean, required: true, default: true },
    accountingDefaults: { type: Schema.Types.Mixed, default: null },
  },
  { ...options, collection: 'expenseCategories' },
);

const roleSchema = new Schema<RoleDoc>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    permissions: { type: [String], required: true, default: [] },
    active: { type: Boolean, required: true, default: true },
  },
  { ...options, collection: 'roles' },
);

const model = <T>(name: string, schema: Schema<T>): mongoose.Model<T> =>
  (mongoose.models[name] as mongoose.Model<T> | undefined) ?? mongoose.model<T>(name, schema);

export const ClientModel = model<ClientDoc>('Client', clientSchema);
export const EngagementModel = model<EngagementDoc>('Engagement', engagementSchema);
export const ExpenseCategoryModel = model<ExpenseCategoryDoc>(
  'ExpenseCategory',
  expenseCategorySchema,
);
export const RoleModel = model<RoleDoc>('Role', roleSchema);
