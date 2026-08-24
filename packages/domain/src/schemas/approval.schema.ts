import { z } from 'zod';
import { ApprovalDecision } from '@claimdesk/contracts';
/**
 * `POST /approvals/{taskId}/decision`
 *
 * `version` is mandatory: the first valid terminal decision wins and a stale
 * version must fail with 409 (design/08-workflow-spec.md, concurrency).
 * A reason is mandatory for RETURN and REJECT.
 */
export const approvalDecisionSchema = z
  .object({
    decision: z.enum(ApprovalDecision),
    version: z.int().min(0),
    reason: z.string().trim().optional(),
  })
  .refine((v) => v.decision === ApprovalDecision.APPROVE || (v.reason?.length ?? 0) > 0, {
    message: 'Returning or rejecting a claim requires a reason.',
    path: ['reason'],
  });
export type ApprovalDecisionPayload = z.infer<typeof approvalDecisionSchema>;
