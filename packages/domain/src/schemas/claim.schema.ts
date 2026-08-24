import { z } from 'zod';

import { objectId, requiredReason } from './common.schema.js';

/** `POST /claims` */
export const createClaimSchema = z.object({
  title: z.string().trim().min(1).optional(),
  expenseIds: z.array(objectId).min(1, 'A claim needs at least one expense.'),
});

/**
 * `POST /claims/{claimId}/submit`
 *
 * The contract types this as `const: true`, so anything other than a literal
 * `true` is a validation error — the employee must actively accept the
 * declaration, and a missing or false value must never be coerced.
 */
export const submitClaimSchema = z.object({
  declarationAccepted: z.literal(true, {
    message: 'The declaration must be accepted before a claim can be submitted.',
  }),
});

/** `POST /claims/{claimId}/resubmit` */
export const resubmitClaimSchema = submitClaimSchema;

export type CreateClaimPayload = z.infer<typeof createClaimSchema>;
export type SubmitClaimPayload = z.infer<typeof submitClaimSchema>;

/** `POST /finance/claims/{claimId}/return` */
export const financeReturnSchema = z.object({ reason: requiredReason });

/** `POST /finance/claims/{claimId}/verify` */
export const financeVerifySchema = z.object({
  glCode: z.string().trim().optional(),
  costCentre: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
