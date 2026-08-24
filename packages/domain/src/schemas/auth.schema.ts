import { z } from 'zod';

/**
 * Mobile number + OTP (ADR-007, gaps.md GAP-002). OTP delivery currently uses a
 * dummy adapter (design/11-integration-spec.md §2).
 */

/** E.164, or a 10-digit Indian mobile number. */
export const mobileNumber = z
  .string()
  .trim()
  .regex(/^(\+91)?[6-9]\d{9}$/, 'Enter a valid Indian mobile number.');

export const otpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'The OTP is a 6-digit code.');

export const requestOtpSchema = z.object({ mobileNumber });

export const verifyOtpSchema = z.object({
  mobileNumber,
  code: otpCode,
});

export type RequestOtpPayload = z.infer<typeof requestOtpSchema>;
export type VerifyOtpPayload = z.infer<typeof verifyOtpSchema>;
