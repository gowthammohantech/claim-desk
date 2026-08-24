import { sessionOf, toObjectId } from '../../../platform/database/index.js';
import type {
  OtpChallenge,
  OtpChallengeRepository,
  RefreshTokenRepository,
  StoredRefreshToken,
} from '../application/ports/authPorts.js';
import {
  type OtpChallengeDoc,
  OtpChallengeModel,
  type RefreshTokenDoc,
  RefreshTokenModel,
} from './auth.models.js';

const toChallenge = (doc: OtpChallengeDoc): OtpChallenge => ({
  id: doc._id.toHexString(),
  mobileNumber: doc.mobileNumber,
  codeHash: doc.codeHash,
  attempts: doc.attempts,
  maxAttempts: doc.maxAttempts,
  consumedAt: doc.consumedAt ?? undefined,
  expiresAt: doc.expiresAt,
});

const toRefreshToken = (doc: RefreshTokenDoc): StoredRefreshToken => ({
  id: doc._id.toHexString(),
  employeeId: doc.employeeId.toHexString(),
  familyId: doc.familyId,
  expiresAt: doc.expiresAt,
  revokedAt: doc.revokedAt ?? undefined,
  replacedBy: doc.replacedBy ?? undefined,
});

export function createMongoOtpChallengeRepository(): OtpChallengeRepository {
  return {
    async create(input) {
      const [created] = await OtpChallengeModel.create([
        {
          mobileNumber: input.mobileNumber,
          codeHash: input.codeHash,
          attempts: 0,
          maxAttempts: input.maxAttempts,
          expiresAt: input.expiresAt,
          createdAt: input.now,
        },
      ]);
      if (!created) throw new Error('Failed to create OTP challenge.');
      return toChallenge(created.toObject<OtpChallengeDoc>());
    },

    async findActive(mobileNumber, now) {
      const doc = await OtpChallengeModel.findOne({
        mobileNumber,
        consumedAt: null,
        expiresAt: { $gt: now },
      })
        .sort({ createdAt: -1 })
        .lean<OtpChallengeDoc>()
        .exec();
      return doc ? toChallenge(doc) : null;
    },

    async recordAttempt(id) {
      const objectId = toObjectId(id);
      if (!objectId) return 0;
      const updated = await OtpChallengeModel.findOneAndUpdate(
        { _id: objectId },
        { $inc: { attempts: 1 } },
        { new: true },
      )
        .lean<OtpChallengeDoc>()
        .exec();
      return updated?.attempts ?? 0;
    },

    /**
     * Single-use: the conditional `consumedAt: null` means two simultaneous
     * verifications of the same code cannot both succeed.
     */
    async consume(id, now) {
      const objectId = toObjectId(id);
      if (!objectId) return false;
      const result = await OtpChallengeModel.updateOne(
        { _id: objectId, consumedAt: null },
        { $set: { consumedAt: now } },
      ).exec();
      return result.modifiedCount === 1;
    },

    async invalidateFor(mobileNumber, now) {
      await OtpChallengeModel.updateMany(
        { mobileNumber, consumedAt: null },
        { $set: { consumedAt: now } },
      ).exec();
    },
  };
}

export function createMongoRefreshTokenRepository(): RefreshTokenRepository {
  return {
    async issue(input) {
      const employeeId = toObjectId(input.employeeId);
      if (!employeeId) throw new Error('Invalid employee id.');

      const [created] = await RefreshTokenModel.create([
        {
          employeeId,
          tokenHash: input.tokenHash,
          familyId: input.familyId,
          expiresAt: input.expiresAt,
          createdAt: input.now,
        },
      ]);
      if (!created) throw new Error('Failed to issue refresh token.');
      return toRefreshToken(created.toObject<RefreshTokenDoc>());
    },

    async findByHash(tokenHash) {
      const doc = await RefreshTokenModel.findOne({ tokenHash }).lean<RefreshTokenDoc>().exec();
      return doc ? toRefreshToken(doc) : null;
    },

    async markRotated(id, replacedByHash, now) {
      const objectId = toObjectId(id);
      if (!objectId) return;
      await RefreshTokenModel.updateOne(
        { _id: objectId },
        { $set: { revokedAt: now, replacedBy: replacedByHash } },
      ).exec();
    },

    async revoke(id, now) {
      const objectId = toObjectId(id);
      if (!objectId) return;
      await RefreshTokenModel.updateOne(
        { _id: objectId, revokedAt: null },
        { $set: { revokedAt: now } },
      ).exec();
    },

    async revokeFamily(familyId, now, tx) {
      const result = await RefreshTokenModel.updateMany(
        { familyId, revokedAt: null },
        { $set: { revokedAt: now } },
        tx ? { session: sessionOf(tx) } : {},
      ).exec();
      return result.modifiedCount;
    },
  };
}
