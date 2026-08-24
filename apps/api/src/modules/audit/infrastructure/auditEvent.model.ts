import mongoose, { Schema, type Types } from 'mongoose';

/**
 * `auditEvents` — append-only (design/10 §3).
 *
 * The envelope follows design/10 §1, which includes `source`. Note that
 * design/04-data-model.md §2 omits `source` from its field list; the catalog is
 * the authority for the envelope, so it is included here.
 *
 * No `updatedAt`, no `version`: there is no update path. Records are never
 * hard-deleted (design/04 §1).
 */
export interface AuditEventDoc {
  _id: Types.ObjectId;
  eventId: string;
  eventName: string;
  entityType: string;
  entityId: string;
  actor: { employeeId: string; role?: string };
  occurredAt: Date;
  correlationId: string;
  requestId?: string;
  source: string;
  payload?: Record<string, unknown>;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

const auditEventSchema = new Schema<AuditEventDoc>(
  {
    eventId: { type: String, required: true },
    eventName: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    actor: {
      employeeId: { type: String, required: true },
      role: { type: String },
    },
    occurredAt: { type: Date, required: true },
    correlationId: { type: String, required: true },
    requestId: { type: String },
    source: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
  },
  {
    versionKey: false,
    timestamps: false,
    autoIndex: false,
    autoCreate: false,
    collection: 'auditEvents',
    // `strict: throw` would reject an unexpected field loudly; audit payloads
    // are Mixed by design, so the guard that matters is redaction, not strict.
    minimize: false,
  },
);

export const AuditEventModel =
  (mongoose.models['AuditEvent'] as mongoose.Model<AuditEventDoc> | undefined) ??
  mongoose.model<AuditEventDoc>('AuditEvent', auditEventSchema);
