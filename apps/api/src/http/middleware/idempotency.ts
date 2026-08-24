import { IDEMPOTENCY_KEY_HEADER, IDEMPOTENCY_KEY_MIN_LENGTH } from '@claimdesk/contracts';
import type { RequestHandler, Response } from 'express';

import {
  type IdempotencyKeyDoc,
  IDEMPOTENCY_LOCK_MS,
  IDEMPOTENCY_RETENTION_MS,
  IdempotencyKeyModel,
} from '../../platform/database/idempotency.js';
import { isDuplicateKey } from '../../platform/database/index.js';
import { AppError, ErrorCode } from '../../platform/errors/index.js';
import { hashRequest } from '../../platform/security/index.js';

/**
 * Replay protection for mutating commands.
 *
 * The reservation is deliberately made OUTSIDE the business transaction. If it
 * were inside, a rollback would erase it and the retry would re-execute — and
 * because `withTransaction` re-runs its callback on transient errors, the
 * reservation would be attempted twice per request anyway.
 *
 * Only 2xx responses are persisted; a failure deletes the reservation so a
 * transient error cannot poison the key. The cost is that a genuinely-failing
 * duplicate runs the use case twice, which is harmless because every use case
 * is independently guarded by state and version.
 */
export function idempotency(operationId: string): RequestHandler {
  return (req, res, next) => {
    const key = req.header(IDEMPOTENCY_KEY_HEADER);

    if (!key || key.length < IDEMPOTENCY_KEY_MIN_LENGTH) {
      next(
        new AppError(
          ErrorCode.IDEMPOTENCY_KEY_REQUIRED,
          400,
          `${IDEMPOTENCY_KEY_HEADER} is required and must be at least ${IDEMPOTENCY_KEY_MIN_LENGTH} characters.`,
        ),
      );
      return;
    }

    const employeeId = req.actor?.employeeId;
    if (!employeeId) {
      next(AppError.unauthenticated());
      return;
    }

    const requestHash = hashRequest(req.method, req.path, req.body);
    const now = new Date();

    void reserve({ key, operationId, employeeId, requestHash, now, res })
      .then((outcome) => {
        if (outcome === 'replayed') return;
        captureResponse(res, { key, operationId, employeeId });
        next();
      })
      .catch(next);
  };
}

type ReserveOutcome = 'proceed' | 'replayed';

async function reserve(input: {
  key: string;
  operationId: string;
  employeeId: string;
  requestHash: string;
  now: Date;
  res: Response;
}): Promise<ReserveOutcome> {
  const { key, operationId, employeeId, requestHash, now, res } = input;

  try {
    await IdempotencyKeyModel.create({
      key,
      operationId,
      employeeId,
      requestHash,
      status: 'IN_PROGRESS',
      lockedAt: now,
      expiresAt: new Date(now.getTime() + IDEMPOTENCY_RETENTION_MS),
    });
    return 'proceed';
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
  }

  const existing = await IdempotencyKeyModel.findOne({ key, operationId, employeeId })
    .lean<IdempotencyKeyDoc>()
    .exec();

  if (!existing) return 'proceed';

  // Same key, different payload is a client bug. Fail loudly rather than
  // replaying a response that does not match what was asked for.
  if (existing.requestHash !== requestHash) {
    throw new AppError(
      ErrorCode.IDEMPOTENCY_KEY_REUSED,
      422,
      'This Idempotency-Key was already used with a different request body.',
    );
  }

  if (existing.status === 'COMPLETED') {
    res.setHeader('Idempotency-Replayed', 'true');
    res.status(existing.responseStatus ?? 200).json(existing.responseBody ?? {});
    return 'replayed';
  }

  // Still in flight. If the holder crashed, take the lock over; otherwise tell
  // the client to retry rather than running the command concurrently.
  const staleAt = new Date(now.getTime() - IDEMPOTENCY_LOCK_MS);
  if (existing.lockedAt <= staleAt) {
    const takeover = await IdempotencyKeyModel.updateOne(
      { _id: existing._id, status: 'IN_PROGRESS', lockedAt: existing.lockedAt },
      { $set: { lockedAt: now, requestHash } },
    ).exec();
    if (takeover.modifiedCount === 1) return 'proceed';
  }

  res.setHeader('Retry-After', '1');
  throw new AppError(
    ErrorCode.IDEMPOTENCY_IN_PROGRESS,
    409,
    'An identical request is already being processed. Retry shortly.',
  );
}

/**
 * Wraps `res.json` to record the exact payload the client receives.
 *
 * Capturing here rather than re-serializing later matters: a replay must return
 * byte-identical content, including any ids the first call generated.
 */
function captureResponse(
  res: Response,
  ref: { key: string; operationId: string; employeeId: string },
): void {
  const originalJson = res.json.bind(res);

  res.json = (body: unknown) => {
    const completedAt = new Date();

    if (res.statusCode >= 200 && res.statusCode < 300) {
      void IdempotencyKeyModel.updateOne(
        { key: ref.key, operationId: ref.operationId, employeeId: ref.employeeId },
        {
          $set: {
            status: 'COMPLETED',
            responseStatus: res.statusCode,
            responseBody: body,
            completedAt,
          },
        },
      ).exec();
    } else {
      // Release the key so a corrected retry is not blocked by a failed attempt.
      void IdempotencyKeyModel.deleteOne({
        key: ref.key,
        operationId: ref.operationId,
        employeeId: ref.employeeId,
        status: 'IN_PROGRESS',
      }).exec();
    }

    return originalJson(body);
  };
}
