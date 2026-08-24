import { DefinitionStatus, DuplicateCaseStatus } from '@claimdesk/contracts';
import mongoose, { Schema, type Types } from 'mongoose';

/**
 * `policyDefinitions`, `policyEvaluations`, `duplicateCases`.
 *
 * NOTE `policyDefinitions.version` is a PUBLISHED VERSION NUMBER, not an
 * optimistic-concurrency counter. Published versions are immutable
 * (design/09 §9) — an edit creates a new version — so there is deliberately no
 * `expectedVersion` anywhere in this module's repository API.
 */

export interface PolicyDefinitionDoc {
  _id: Types.ObjectId;
  policyCode: string;
  version: number;
  name: string;
  priority: number;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  status: string;
  mandatoryControl: boolean;
  defaultCategoryPolicy: boolean;
  conditions: Record<string, unknown>;
  actions: unknown[];
  createdBy?: Types.ObjectId | null;
  approvedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const policyDefinitionSchema = new Schema<PolicyDefinitionDoc>(
  {
    policyCode: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
    name: { type: String, required: true },
    priority: { type: Number, required: true, default: 0 },
    effectiveFrom: { type: Date, required: true },
    effectiveTo: { type: Date, default: null },
    status: { type: String, required: true, default: DefinitionStatus.DRAFT },
    mandatoryControl: { type: Boolean, required: true, default: false },
    defaultCategoryPolicy: { type: Boolean, required: true, default: false },
    conditions: { type: Schema.Types.Mixed, required: true },
    actions: { type: Schema.Types.Mixed, required: true, default: [] },
    createdBy: { type: Schema.Types.ObjectId, default: null },
    approvedBy: { type: Schema.Types.ObjectId, default: null },
  },
  {
    versionKey: false,
    timestamps: true,
    autoIndex: false,
    autoCreate: false,
    collection: 'policyDefinitions',
    minimize: false,
  },
);

export interface PolicyEvaluationDoc {
  _id: Types.ObjectId;
  expenseId: Types.ObjectId;
  evaluatedAt: Date;
  policyVersionIds: Types.ObjectId[];
  contextSnapshot: Record<string, unknown>;
  results: unknown[];
  overallOutcome: string;
  /**
   * Computed once by the evaluator so the workflow resolver consumes a value
   * rather than re-deriving it from `results[]`. Not in design/04's field list;
   * an addition, and the snapshot is more self-explaining for it.
   */
  derived: Record<string, unknown>;
}

const policyEvaluationSchema = new Schema<PolicyEvaluationDoc>(
  {
    expenseId: { type: Schema.Types.ObjectId, required: true },
    evaluatedAt: { type: Date, required: true },
    policyVersionIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    contextSnapshot: { type: Schema.Types.Mixed, required: true },
    results: { type: Schema.Types.Mixed, required: true, default: [] },
    overallOutcome: { type: String, required: true },
    derived: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  {
    versionKey: false,
    timestamps: false,
    autoIndex: false,
    autoCreate: false,
    collection: 'policyEvaluations',
    minimize: false,
  },
);

export interface DuplicateCaseDoc {
  _id: Types.ObjectId;
  expenseId: Types.ObjectId;
  candidateExpenseId: Types.ObjectId;
  score: number;
  reasons: string[];
  status: string;
  resolution?: string | null;
  resolutionReason?: string | null;
  resolvedBy?: Types.ObjectId | null;
  resolvedAt?: Date | null;
  createdAt: Date;
}

const duplicateCaseSchema = new Schema<DuplicateCaseDoc>(
  {
    expenseId: { type: Schema.Types.ObjectId, required: true },
    candidateExpenseId: { type: Schema.Types.ObjectId, required: true },
    score: { type: Number, required: true },
    reasons: { type: [String], required: true, default: [] },
    status: { type: String, required: true, default: DuplicateCaseStatus.OPEN },
    resolution: { type: String, default: null },
    resolutionReason: { type: String, default: null },
    resolvedBy: { type: Schema.Types.ObjectId, default: null },
    resolvedAt: { type: Date, default: null },
    createdAt: { type: Date, required: true },
  },
  {
    versionKey: false,
    timestamps: false,
    autoIndex: false,
    autoCreate: false,
    collection: 'duplicateCases',
  },
);

const model = <T>(name: string, schema: Schema<T>): mongoose.Model<T> =>
  (mongoose.models[name] as mongoose.Model<T> | undefined) ?? mongoose.model<T>(name, schema);

export const PolicyDefinitionModel = model<PolicyDefinitionDoc>(
  'PolicyDefinition',
  policyDefinitionSchema,
);
export const PolicyEvaluationModel = model<PolicyEvaluationDoc>(
  'PolicyEvaluation',
  policyEvaluationSchema,
);
export const DuplicateCaseModel = model<DuplicateCaseDoc>('DuplicateCase', duplicateCaseSchema);
