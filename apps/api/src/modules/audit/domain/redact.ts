/**
 * Audit payload redaction.
 *
 * design/10-audit-event-catalog.md §3: "Do not log receipt binary, access
 * tokens, full bank account numbers, or secrets."
 *
 * Pure and exhaustively testable — it is the last line before secrets become
 * permanent, because `auditEvents` is append-only and never hard-deleted.
 */
const REDACTED = '[redacted]';

/** Keys whose value never survives, at any depth. */
const DENY_KEYS = new Set(
  [
    'accessToken',
    'refreshToken',
    'token',
    'jwt',
    'password',
    'otp',
    'otpCode',
    'code',
    'secret',
    'apiKey',
    'connectionString',
    'sasUrl',
    'uploadUrl',
    'accountNumber',
    'bankAccountNumber',
    'authorization',
    'cookie',
  ].map((key) => key.toLowerCase()),
);

/**
 * Keys replaced by a hash of their value rather than dropped: the audit trail
 * still needs to correlate them, it just must not carry the value itself.
 * `receipt.uploaded` logs `blobKeyHash`, never `blobKey` (design/10 §2).
 */
const HASH_KEYS = new Set(['blobkey', 'blobref']);

/** Anything larger than this is a payload someone should not be auditing. */
const MAX_STRING_LENGTH = 2_000;
const MAX_DEPTH = 8;

export interface RedactOptions {
  hash: (value: string) => string;
}

export function redact(
  value: unknown,
  options: RedactOptions,
  depth = 0,
): unknown {
  if (depth > MAX_DEPTH) return REDACTED;

  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…[truncated]` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, options, depth + 1));
  }

  if (typeof value === 'object') {
    // A Buffer is receipt binary or similar — never auditable.
    if (Buffer.isBuffer(value)) return REDACTED;

    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const lower = key.toLowerCase();

      if (DENY_KEYS.has(lower)) {
        output[key] = REDACTED;
        continue;
      }

      if (HASH_KEYS.has(lower) && typeof item === 'string') {
        output[`${key}Hash`] = options.hash(item);
        continue;
      }

      output[key] = redact(item, options, depth + 1);
    }
    return output;
  }

  // Functions, symbols, bigints — nothing that belongs in an audit payload.
  return REDACTED;
}

export function redactRecord(
  record: Record<string, unknown> | undefined,
  options: RedactOptions,
): Record<string, unknown> | undefined {
  if (!record) return undefined;
  return redact(record, options) as Record<string, unknown>;
}
