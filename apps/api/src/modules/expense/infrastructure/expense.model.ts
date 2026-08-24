import { Currency, ExpenseState } from '@claimdesk/contracts';
import mongoose, { Schema, type Types } from 'mongoose';

/**
 * `expenses` — one of the three collections with a true OCC `version`.
 *
 * `versionKey: false` so `__v` never coexists with it. Mongoose's own
 * `optimisticConcurrency` is deliberately NOT enabled: it is bound to `.save()`
 * on hydrated documents (which the repository never uses), it keys off `__v`,
 * and it cannot express the state guard that every transition here needs.
 */
const integerPaise = {
  type: Number,
  required: true,
  validate: {
    validator: Number.isInteger,
    message: 'Money must be an integer number of paise (ADR-010).',
  },
} as const;

export interface MileageSubDoc {
  origin: string;
  destination: string;
  distanceKm: number;
  ratePaisePerKm: number;
  rateRuleId?: Types.ObjectId | null;
  amountPaise: number;
}

export interface ExpenseDoc {
  _id: Types.ObjectId;
  expenseNo: string;
  employeeId: Types.ObjectId;
  captureMode: string;
  merchant?: string | null;
  expenseDate: Date;
  categoryId: Types.ObjectId;
  amountPaise: number;
  currency: string;
  classification: string;
  clientId?: Types.ObjectId | null;
  engagementId?: Types.ObjectId | null;
  costCentreId?: string | null;
  businessPurpose: string;
  mileage?: MileageSubDoc | null;
  receiptIds: Types.ObjectId[];
  ocrResultId?: Types.ObjectId | null;
  policyEvaluationId?: Types.ObjectId | null;
  policyOutcome?: string | null;
  duplicateCaseIds: Types.ObjectId[];
  exceptionJustification?: string | null;
  state: string;
  claimId?: Types.ObjectId | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const mileageSchema = new Schema<MileageSubDoc>(
  {
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    distanceKm: { type: Number, required: true, min: 0 },
    ratePaisePerKm: integerPaise,
    rateRuleId: { type: Schema.Types.ObjectId, default: null },
    amountPaise: integerPaise,
  },
  { _id: false },
);

const expenseSchema = new Schema<ExpenseDoc>(
  {
    expenseNo: { type: String, required: true },
    employeeId: { type: Schema.Types.ObjectId, required: true },
    captureMode: { type: String, required: true },
    merchant: { type: String, default: null },
    expenseDate: { type: Date, required: true },
    categoryId: { type: Schema.Types.ObjectId, required: true },
    amountPaise: { ...integerPaise, min: 1 },
    currency: { type: String, required: true, default: Currency.INR },
    classification: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, default: null },
    engagementId: { type: Schema.Types.ObjectId, default: null },
    costCentreId: { type: String, default: null },
    businessPurpose: { type: String, required: true },
    mileage: { type: mileageSchema, default: null },
    receiptIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    ocrResultId: { type: Schema.Types.ObjectId, default: null },
    policyEvaluationId: { type: Schema.Types.ObjectId, default: null },
    policyOutcome: { type: String, default: null },
    duplicateCaseIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    exceptionJustification: { type: String, default: null },
    state: { type: String, required: true, default: ExpenseState.UNCLAIMED },
    claimId: { type: Schema.Types.ObjectId, default: null },
    version: { type: Number, required: true, default: 0 },
  },
  {
    versionKey: false,
    timestamps: true,
    autoIndex: false,
    autoCreate: false,
    collection: 'expenses',
  },
);

export const ExpenseModel =
  (mongoose.models['Expense'] as mongoose.Model<ExpenseDoc> | undefined) ??
  mongoose.model<ExpenseDoc>('Expense', expenseSchema);
