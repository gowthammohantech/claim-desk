import { describe, expect, it } from 'vitest';

import { loadEnv } from '../config/env.js';
import { generateOtpCode, generateToken, hashRequest, hashToken, safeEquals } from './hash.js';
import { createJwtService, durationToSeconds, InvalidTokenError } from './jwt.js';

const env = loadEnv({
  NODE_ENV: 'test',
  JWT_ACCESS_SECRET: 'test-access-secret-at-least-32-characters',
  JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars',
} as NodeJS.ProcessEnv);

describe('hashing', () => {
  it('is deterministic and hides the input', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
    expect(hashToken('abc')).not.toContain('abc');
  });

  it('compares in constant time and handles length mismatch', () => {
    expect(safeEquals('same', 'same')).toBe(true);
    expect(safeEquals('same', 'diff')).toBe(false);
    expect(safeEquals('short', 'much-longer')).toBe(false);
  });

  it('generates distinct high-entropy tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()));
    expect(tokens.size).toBe(100);
  });

  it('generates 6-digit OTP codes', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });
});

describe('hashRequest', () => {
  it('ignores property order, so a legitimate retry is not rejected', () => {
    // Clients do not guarantee JSON key order; a false mismatch would turn a
    // valid idempotent retry into a 422.
    const a = hashRequest('POST', '/v1/claims', { title: 'x', expenseIds: ['1'] });
    const b = hashRequest('POST', '/v1/claims', { expenseIds: ['1'], title: 'x' });
    expect(a).toBe(b);
  });

  it('changes when the payload, path or method changes', () => {
    const base = hashRequest('POST', '/v1/claims', { title: 'x' });
    expect(hashRequest('POST', '/v1/claims', { title: 'y' })).not.toBe(base);
    expect(hashRequest('POST', '/v1/other', { title: 'x' })).not.toBe(base);
    expect(hashRequest('PATCH', '/v1/claims', { title: 'x' })).not.toBe(base);
  });

  it('treats an absent key and an explicit undefined as the same request', () => {
    expect(hashRequest('POST', '/p', { a: 1, b: undefined })).toBe(
      hashRequest('POST', '/p', { a: 1 }),
    );
  });

  it('distinguishes nested differences', () => {
    expect(hashRequest('POST', '/p', { m: { k: 1 } })).not.toBe(
      hashRequest('POST', '/p', { m: { k: 2 } }),
    );
  });
});

describe('durationToSeconds', () => {
  it('parses the supported units', () => {
    expect(durationToSeconds('30s')).toBe(30);
    expect(durationToSeconds('15m')).toBe(900);
    expect(durationToSeconds('24h')).toBe(86_400);
    expect(durationToSeconds('30d')).toBe(2_592_000);
  });

  it('rejects anything else rather than guessing', () => {
    for (const bad of ['15', 'm', '15w', '']) {
      expect(() => durationToSeconds(bad)).toThrow();
    }
  });
});

describe('access tokens', () => {
  const jwt = createJwtService(env);
  const claims = {
    employeeId: '507f1f77bcf86cd799439011',
    employeeCode: 'EMP-10428',
    roles: ['EMPLOYEE'] as never,
    permissions: ['expense:create'] as never,
  };

  it('round-trips the claims an authorization check needs', async () => {
    const { token, expiresIn } = await jwt.signAccessToken(claims);
    const verified = await jwt.verifyAccessToken(token);

    expect(verified.employeeId).toBe(claims.employeeId);
    expect(verified.employeeCode).toBe('EMP-10428');
    expect(verified.roles).toEqual(['EMPLOYEE']);
    expect(verified.permissions).toEqual(['expense:create']);
    expect(expiresIn).toBe(900);
    expect(verified.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects a tampered token', async () => {
    const { token } = await jwt.signAccessToken(claims);
    const [header, , signature] = token.split('.');

    // Re-sign attempt with a flipped payload: the signature no longer matches.
    const forged = `${header}.${Buffer.from(
      JSON.stringify({ sub: 'someone-else', roles: ['ADMIN'] }),
    ).toString('base64url')}.${signature}`;

    await expect(jwt.verifyAccessToken(forged)).rejects.toThrow(InvalidTokenError);
  });

  it('rejects a token signed with a different secret', async () => {
    const other = createJwtService({
      ...env,
      JWT_ACCESS_SECRET: 'a-completely-different-secret-32-chars',
    });
    const { token } = await other.signAccessToken(claims);

    await expect(jwt.verifyAccessToken(token)).rejects.toThrow(InvalidTokenError);
  });

  it('rejects garbage without leaking why', async () => {
    for (const bad of ['', 'not.a.token', 'a.b.c']) {
      await expect(jwt.verifyAccessToken(bad)).rejects.toThrow(InvalidTokenError);
    }
  });
});
