import type { Tx } from '../../../../platform/database/index.js';

/**
 * OTP delivery.
 *
 * design/11 §2: "OTP delivery/verification uses a dummy adapter for now; a
 * production SMS provider is deferred." The port exists so swapping in a real
 * provider touches one file.
 */
export interface OtpSender {
  send(mobileNumber: string, code: string): Promise<void>;
  /** Dummy adapters return a fixed code; production ones never reveal it. */
  readonly revealsCode: boolean;
}

export interface OtpChallenge {
  id: string;
  mobileNumber: string;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  consumedAt?: Date | undefined;
  expiresAt: Date;
}

export interface OtpChallengeRepository {
  create(input: {
    mobileNumber: string;
    codeHash: string;
    maxAttempts: number;
    expiresAt: Date;
    now: Date;
  }): Promise<OtpChallenge>;
  /** Most recent unconsumed, unexpired challenge for a number. */
  findActive(mobileNumber: string, now: Date): Promise<OtpChallenge | null>;
  recordAttempt(id: string): Promise<number>;
  consume(id: string, now: Date): Promise<boolean>;
  /** Invalidates outstanding challenges when a new code is requested. */
  invalidateFor(mobileNumber: string, now: Date): Promise<void>;
}

export interface StoredRefreshToken {
  id: string;
  employeeId: string;
  familyId: string;
  expiresAt: Date;
  revokedAt?: Date | undefined;
  replacedBy?: string | undefined;
}

export interface RefreshTokenRepository {
  issue(input: {
    employeeId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    now: Date;
  }): Promise<StoredRefreshToken>;
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  /** Marks a token rotated, pointing at its replacement. */
  markRotated(id: string, replacedByHash: string, now: Date): Promise<void>;
  revoke(id: string, now: Date): Promise<void>;
  /** Revokes an entire rotation chain — the response to suspected theft. */
  revokeFamily(familyId: string, now: Date, tx?: Tx): Promise<number>;
}
