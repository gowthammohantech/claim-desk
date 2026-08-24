import { z } from 'zod';

import { objectId } from './common.schema.js';

/**
 * Receipt upload is a two-step flow (ADR-005):
 *   1. POST /receipts/upload-intent -> short-lived Azure Blob SAS URL
 *   2. client PUTs the binary straight to Blob
 *   3. POST /receipts/{receiptId}/complete -> metadata saved, OCR job queued
 *
 * Allowed MIME types are PDF/JPEG/PNG; max size is configurable
 * (requirements/03-FRD.md §24) so it is validated server-side from config, not
 * hard-coded here.
 */
export const RECEIPT_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;

export const uploadIntentSchema = z.object({
  mimeType: z.enum(RECEIPT_MIME_TYPES),
  sizeBytes: z.int().min(1),
  fileName: z.string().trim().min(1).optional(),
});

export const completeUploadSchema = z.object({
  expenseId: objectId.optional(),
  /** SHA-256 of the uploaded bytes; feeds duplicate detection. */
  contentHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, 'contentHash must be a hex SHA-256 digest.')
    .optional(),
});

export type UploadIntentPayload = z.infer<typeof uploadIntentSchema>;
