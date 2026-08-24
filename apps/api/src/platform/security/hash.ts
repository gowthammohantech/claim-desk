import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** SHA-256 hex digest. Used for receipt content hashes and idempotency request hashes. */
export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Hash for a stored secret (refresh token, OTP code).
 *
 * SHA-256 rather than bcrypt/argon2 is deliberate and safe HERE, but only
 * because these are high-entropy machine-generated values, not passwords: there
 * is nothing to brute-force. Never use this for a user-chosen secret.
 */
export function hashToken(token: string): string {
  return sha256(token);
}

/** Cryptographically random opaque token, base64url. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Numeric OTP code of the given length, uniformly distributed. */
export function generateOtpCode(length = 6): string {
  const digits: string[] = [];
  while (digits.length < length) {
    for (const byte of randomBytes(length)) {
      // Reject values in the biased tail rather than taking a plain modulo,
      // which would make low digits marginally more likely.
      if (byte < 250) digits.push(String(byte % 10));
      if (digits.length === length) break;
    }
  }
  return digits.join('');
}

/**
 * Constant-time comparison. OTP and token checks must not leak how much of the
 * value matched through response timing.
 */
export function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Canonical hash of a request body, for idempotency replay checking.
 * Keys are sorted recursively so `{a,b}` and `{b,a}` hash identically — clients
 * do not guarantee property order, and a false mismatch would reject a
 * legitimate retry.
 */
export function hashRequest(method: string, path: string, body: unknown): string {
  return sha256(`${method}|${path}|${canonicalize(body)}`);
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, v]) => `${JSON.stringify(key)}:${canonicalize(v)}`);
  return `{${entries.join(',')}}`;
}
