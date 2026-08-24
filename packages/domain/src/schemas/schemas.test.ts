import { CaptureMode, Classification } from '@claimdesk/contracts';
import { describe, expect, it } from 'vitest';

import { approvalDecisionSchema } from './approval.schema.js';
import { requestOtpSchema, verifyOtpSchema } from './auth.schema.js';
import { createClaimSchema, financeReturnSchema, submitClaimSchema } from './claim.schema.js';
import { idempotencyKey } from './common.schema.js';
import { duplicateResolutionSchema, expenseInputSchema } from './expense.schema.js';
import { uploadIntentSchema } from './receipt.schema.js';

const validExpense = {
  expenseDate: '2026-08-01',
  categoryId: 'CAT-1',
  amountPaise: 250000,
  classification: Classification.INTERNAL,
  businessPurpose: 'Team offsite travel',
};

describe('expense input', () => {
  it('accepts a minimal internal expense and defaults the currency to INR', () => {
    const parsed = expenseInputSchema.parse(validExpense);
    expect(parsed.currency).toBe('INR');
  });

  it('rejects a non-integer or zero amount (money is integer paise, >= 1)', () => {
    expect(expenseInputSchema.safeParse({ ...validExpense, amountPaise: 100.5 }).success).toBe(
      false,
    );
    expect(expenseInputSchema.safeParse({ ...validExpense, amountPaise: 0 }).success).toBe(false);
    expect(expenseInputSchema.safeParse({ ...validExpense, amountPaise: -1 }).success).toBe(false);
  });

  it('requires an engagement for client work but not for internal', () => {
    const clientWork = { ...validExpense, classification: Classification.CLIENT_BILLABLE };
    expect(expenseInputSchema.safeParse(clientWork).success).toBe(false);
    expect(expenseInputSchema.safeParse({ ...clientWork, engagementId: 'ENG-1' }).success).toBe(
      true,
    );
  });

  it('requires mileage details on a mileage capture', () => {
    const mileageExpense = { ...validExpense, captureMode: CaptureMode.MILEAGE };
    expect(expenseInputSchema.safeParse(mileageExpense).success).toBe(false);
    expect(
      expenseInputSchema.safeParse({
        ...mileageExpense,
        mileage: {
          origin: 'Pune',
          destination: 'Mumbai',
          distanceKm: 148.5,
          ratePaisePerKm: 1200,
        },
      }).success,
    ).toBe(true);
  });

  it('rejects a blank business purpose', () => {
    expect(expenseInputSchema.safeParse({ ...validExpense, businessPurpose: '   ' }).success).toBe(
      false,
    );
  });
});

describe('claim submission', () => {
  it('demands the declaration be literally true, never coerced', () => {
    expect(submitClaimSchema.safeParse({ declarationAccepted: true }).success).toBe(true);
    expect(submitClaimSchema.safeParse({ declarationAccepted: false }).success).toBe(false);
    expect(submitClaimSchema.safeParse({ declarationAccepted: 'true' }).success).toBe(false);
    expect(submitClaimSchema.safeParse({ declarationAccepted: 1 }).success).toBe(false);
    expect(submitClaimSchema.safeParse({}).success).toBe(false);
  });

  it('requires at least one expense on a claim', () => {
    expect(createClaimSchema.safeParse({ expenseIds: [] }).success).toBe(false);
    expect(createClaimSchema.safeParse({ expenseIds: ['EXP-1'] }).success).toBe(true);
  });

  it('requires a non-blank reason when finance returns a claim', () => {
    expect(financeReturnSchema.safeParse({ reason: '' }).success).toBe(false);
    expect(financeReturnSchema.safeParse({ reason: '  ' }).success).toBe(false);
    expect(financeReturnSchema.safeParse({ reason: 'Missing GST invoice' }).success).toBe(true);
  });
});

describe('approval decision', () => {
  it('requires the current version so a stale decision can 409', () => {
    expect(approvalDecisionSchema.safeParse({ decision: 'APPROVE' }).success).toBe(false);
    expect(approvalDecisionSchema.safeParse({ decision: 'APPROVE', version: 3 }).success).toBe(true);
  });

  it('requires a reason to return or reject, but not to approve', () => {
    expect(approvalDecisionSchema.safeParse({ decision: 'RETURN', version: 1 }).success).toBe(false);
    expect(approvalDecisionSchema.safeParse({ decision: 'REJECT', version: 1 }).success).toBe(false);
    expect(
      approvalDecisionSchema.safeParse({
        decision: 'RETURN',
        version: 1,
        reason: 'Missing receipt',
      }).success,
    ).toBe(true);
  });
});

describe('duplicate resolution', () => {
  it('requires a reason to KEEP a suspected duplicate but not to DISCARD', () => {
    expect(duplicateResolutionSchema.safeParse({ action: 'DISCARD' }).success).toBe(true);
    expect(duplicateResolutionSchema.safeParse({ action: 'KEEP' }).success).toBe(false);
    expect(
      duplicateResolutionSchema.safeParse({ action: 'KEEP', reason: 'Two separate cab rides' })
        .success,
    ).toBe(true);
  });
});

describe('auth', () => {
  it('accepts valid Indian mobile numbers', () => {
    expect(requestOtpSchema.safeParse({ mobileNumber: '9876543210' }).success).toBe(true);
    expect(requestOtpSchema.safeParse({ mobileNumber: '+919876543210' }).success).toBe(true);
    expect(requestOtpSchema.safeParse({ mobileNumber: '1234567890' }).success).toBe(false);
    expect(requestOtpSchema.safeParse({ mobileNumber: '98765' }).success).toBe(false);
  });

  it('requires a 6-digit OTP', () => {
    expect(verifyOtpSchema.safeParse({ mobileNumber: '9876543210', code: '000000' }).success).toBe(
      true,
    );
    expect(verifyOtpSchema.safeParse({ mobileNumber: '9876543210', code: '123' }).success).toBe(
      false,
    );
  });
});

describe('receipts and idempotency', () => {
  it('accepts only PDF, JPEG and PNG (ADR-005)', () => {
    for (const mimeType of ['image/jpeg', 'image/png', 'application/pdf']) {
      expect(uploadIntentSchema.safeParse({ mimeType, sizeBytes: 1024 }).success).toBe(true);
    }
    expect(uploadIntentSchema.safeParse({ mimeType: 'image/heic', sizeBytes: 1024 }).success).toBe(
      false,
    );
    expect(uploadIntentSchema.safeParse({ mimeType: 'text/html', sizeBytes: 1024 }).success).toBe(
      false,
    );
  });

  it('enforces the 8-character minimum idempotency key', () => {
    expect(idempotencyKey.safeParse('1234567').success).toBe(false);
    expect(idempotencyKey.safeParse('12345678').success).toBe(true);
  });
});
