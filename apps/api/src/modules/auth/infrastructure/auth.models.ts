import mongoose, { Schema, type Types } from 'mongoose';

/**
 * `otpChallenges` and `refreshTokens`.
 *
 * Neither is in design/04-data-model.md — the doc predates the OTP decision
 * (ADR-007 / gaps.md GAP-002) being fully specified. Both carry a TTL index so
 * expired credentials remove themselves rather than accumulating.
 */

export interface OtpChallengeDoc {
  _id: Types.ObjectId;
  mobileNumber: string;
  /** Hashed, never the code itself — this collection is a credential store. */
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  consumedAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

const otpChallengeSchema = new Schema<OtpChallengeDoc>(
  {
    mobileNumber: { type: String, required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, required: true, default: 0 },
    maxAttempts: { type: Number, required: true, default: 5 },
    consumedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
  },
  {
    versionKey: false,
    timestamps: false,
    autoIndex: false,
    autoCreate: false,
    collection: 'otpChallenges',
  },
);

export interface RefreshTokenDoc {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  /** SHA-256 of the token. A database dump must not yield usable credentials. */
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  /**
   * Set when this token was rotated out. Presenting a token that has a
   * `replacedBy` is either a benign race or replay of a stolen token — see
   * `rotateRefreshToken` for how the two are told apart.
   */
  replacedBy?: string | null;
  /** Groups a rotation chain so the whole family can be revoked at once. */
  familyId: string;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    employeeId: { type: Schema.Types.ObjectId, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
    familyId: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  {
    versionKey: false,
    timestamps: false,
    autoIndex: false,
    autoCreate: false,
    collection: 'refreshTokens',
  },
);

const model = <T>(name: string, schema: Schema<T>): mongoose.Model<T> =>
  (mongoose.models[name] as mongoose.Model<T> | undefined) ?? mongoose.model<T>(name, schema);

export const OtpChallengeModel = model<OtpChallengeDoc>('OtpChallenge', otpChallengeSchema);
export const RefreshTokenModel = model<RefreshTokenDoc>('RefreshToken', refreshTokenSchema);
