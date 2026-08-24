import { z } from 'zod';

import { IDEMPOTENCY_KEY_MIN_LENGTH } from '@claimdesk/contracts';
import { MAX_AMOUNT_PAISE } from '../money/paise.js';

/**
 * Zod mirrors of the constraints in design/06-api-contract.yaml.
 *
 * The mobile offline draft validator and the server MUST run identical rules —
 * that is the whole reason these live in shared code (see gaps.md GAP-018:
 * drafts are created offline, then validated server-side on sync).
 */

/** Integer paise, >= 0. Use `positiveAmountPaise` where the API requires >= 1. */
export const amountPaise = z
  .int()
  .min(0)
  .max(MAX_AMOUNT_PAISE)
  .describe('Integer paise. INR only (ADR-010).');

/** Integer paise, >= 1 — what `ExpenseInput.amountPaise` requires. */
export const positiveAmountPaise = amountPaise.min(1);

export const idempotencyKey = z
  .string()
  .min(IDEMPOTENCY_KEY_MIN_LENGTH)
  .describe('Idempotency-Key header value.');

export const objectId = z.string().min(1);

/** ISO-8601 date (no time component), e.g. an expense date. */
export const isoDate = z.iso.date();

/** ISO-8601 date-time in UTC. */
export const isoDateTime = z.iso.datetime();

export const cursor = z.string().min(1).optional();

export const pageLimit = z.int().min(1).max(100).default(25);

export const paginationQuery = z.object({
  cursor,
  limit: pageLimit,
});

/** Free-text reason, mandatory where the API says `minLength: 1`. */
export const requiredReason = z.string().trim().min(1, 'A reason is required.');
