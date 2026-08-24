import { z } from 'zod';

import { CaptureMode, Classification, Currency, DuplicateResolutionAction } from '@claimdesk/contracts';

import {
  amountPaise,
  isoDate,
  objectId,
  positiveAmountPaise,
  requiredReason,
} from './common.schema.js';

/** `expenses.mileage` sub-document (design/04-data-model.md). */
export const mileageSchema = z.object({
  origin: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  distanceKm: z.number().min(0).max(100_000),
  ratePaisePerKm: amountPaise,
  rateRuleId: objectId.optional(),
});

/**
 * The raw `ExpenseInput` object, without cross-field rules.
 * Kept separate so `expenseUpdateSchema` can call `.partial()` on it — that is
 * not possible once `.refine()` has been applied.
 */
export const expenseInputShape = z.object({
  expenseDate: isoDate,
  categoryId: objectId,
  amountPaise: positiveAmountPaise,
  currency: z.enum(Currency).default(Currency.INR),
  classification: z.enum(Classification),
  businessPurpose: z.string().trim().min(1),
  captureMode: z.enum(CaptureMode).optional(),
  merchant: z.string().trim().optional(),
  engagementId: objectId.optional(),
  clientId: objectId.optional(),
  receiptIds: z.array(objectId).optional(),
  mileage: mileageSchema.optional(),
});

/*
 * The refinements are typed against only the fields they read. A
 * `Partial<z.infer<...>>` would not assign under `exactOptionalPropertyTypes`,
 * and it would also couple these rules to fields they do not care about.
 */
const mileagePresentWhenRequired = (v: {
  captureMode?: CaptureMode | undefined;
  mileage?: unknown;
}) => v.captureMode !== CaptureMode.MILEAGE || v.mileage !== undefined;

const engagementPresentWhenClientWork = (v: {
  classification?: Classification | undefined;
  engagementId?: string | undefined;
}) =>
  v.classification === undefined ||
  v.classification === Classification.INTERNAL ||
  v.engagementId !== undefined;

/** `ExpenseInput` from the OpenAPI contract, with cross-field rules applied. */
export const expenseInputSchema = expenseInputShape
  .refine(mileagePresentWhenRequired, {
    message: 'A mileage expense must carry mileage details.',
    path: ['mileage'],
  })
  .refine(engagementPresentWhenClientWork, {
    message: 'Client-billable and client-non-billable expenses require an engagement.',
    path: ['engagementId'],
  });

/** `PATCH /expenses/{expenseId}` — every field optional, same cross-field rules. */
export const expenseUpdateSchema = expenseInputShape
  .partial()
  .refine(mileagePresentWhenRequired, {
    message: 'A mileage expense must carry mileage details.',
    path: ['mileage'],
  })
  .refine(engagementPresentWhenClientWork, {
    message: 'Client-billable and client-non-billable expenses require an engagement.',
    path: ['engagementId'],
  });

/** `POST /expenses/{expenseId}/duplicate-resolution` */
export const duplicateResolutionSchema = z
  .object({
    action: z.enum(DuplicateResolutionAction),
    reason: z.string().trim().optional(),
  })
  .refine(
    (v) => v.action !== DuplicateResolutionAction.KEEP || (v.reason?.length ?? 0) > 0,
    {
      message: 'Keeping a suspected duplicate requires a reason (it is written to the audit log).',
      path: ['reason'],
    },
  );

export const policyExceptionJustificationSchema = z.object({
  justification: requiredReason,
});

export type ExpenseInputPayload = z.infer<typeof expenseInputSchema>;
export type ExpenseUpdatePayload = z.infer<typeof expenseUpdateSchema>;
export type MileagePayload = z.infer<typeof mileageSchema>;
