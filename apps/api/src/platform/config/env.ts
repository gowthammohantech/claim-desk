import { z } from 'zod';

/**
 * Typed, fail-fast environment configuration.
 *
 * This file covers ENVIRONMENT config only — endpoints, secrets, worker tuning.
 * BUSINESS configuration (categories, policy rules, approval workflows, mileage
 * rates, receipt thresholds, escalation periods, notification templates) lives
 * in the database and is edited through the Admin UI: requirements/TDD.md §27
 * requires that changing it never needs a deployment.
 *
 * `PARTNER_APPROVAL_THRESHOLD_PAISE` is the one borderline case. It is here as
 * a bootstrap default only; the workflow spec requires it to be configurable
 * per workflow version, so the approval module must read it from the workflow
 * definition, not from here.
 */

const durationString = z.string().regex(/^\d+[smhd]$/, 'Use a duration like 15m, 24h or 30d.');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ROLE: z.enum(['api', 'worker', 'migrate']).default('api'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  OPS_PORT: z.coerce.number().int().min(1).max(65535).default(9464),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  SERVICE_NAME: z.string().default('claimdesk-api'),
  ENVIRONMENT: z.string().default('local'),

  // Optional so the skeleton boots with no database. Production readiness is
  // asserted separately in `assertProductionReady`.
  MONGODB_URI: z.string().optional(),
  MONGODB_DB_NAME: z.string().default('claimdesk'),

  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
  AZURE_BLOB_RECEIPTS_CONTAINER: z.string().default('receipts'),
  BLOB_SAS_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  RECEIPT_MAX_BYTES: z.coerce.number().int().min(1).default(10_485_760),
  RECEIPT_ALLOWED_MIME: z
    .string()
    .default('image/jpeg,image/png,application/pdf')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT secrets must be at least 32 characters.'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT secrets must be at least 32 characters.'),
  JWT_ACCESS_TTL: durationString.default('15m'),
  JWT_REFRESH_TTL: durationString.default('30d'),

  OTP_ADAPTER: z.enum(['dummy', 'sms']).default('dummy'),
  OTP_DUMMY_CODE: z.string().regex(/^\d{6}$/).default('000000'),
  OTP_TTL_SECONDS: z.coerce.number().int().min(30).max(900).default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),

  WORKER_JOB_POLL_MS: z.coerce.number().int().min(100).default(2000),
  WORKER_OUTBOX_POLL_MS: z.coerce.number().int().min(100).default(1000),
  WORKER_BATCH_SIZE: z.coerce.number().int().min(1).max(100).default(10),
  WORKER_LEASE_MS: z.coerce.number().int().min(1000).default(60_000),
  WORKER_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(5),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(32).default(4),

  OCR_ADAPTER: z.enum(['dummy', 'azure']).default('dummy'),
  HR_ADAPTER: z.enum(['manual', 'api']).default('manual'),
  ENGAGEMENT_ADAPTER: z.enum(['manual', 'api']).default('manual'),
  ACCOUNTING_ADAPTER: z.enum(['file-export', 'api']).default('file-export'),
  PUSH_ADAPTER: z.enum(['expo', 'fcm', 'noop']).default('expo'),

  DEFAULT_CURRENCY: z.literal('INR').default('INR'),
  PARTNER_APPROVAL_THRESHOLD_PAISE: z.coerce.number().int().min(0).default(2_500_000),

  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses `process.env`, reporting every problem at once rather than failing on
 * the first — a half-configured container should say so in one message.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

/**
 * Guards against shipping development defaults. Called from `main.ts` when
 * NODE_ENV is production.
 */
export function assertProductionReady(env: Env): void {
  const problems: string[] = [];
  if (!env.MONGODB_URI) problems.push('MONGODB_URI is required in production.');
  if (!env.AZURE_STORAGE_CONNECTION_STRING) {
    problems.push('AZURE_STORAGE_CONNECTION_STRING is required in production.');
  }
  if (env.OTP_ADAPTER === 'dummy') {
    problems.push('OTP_ADAPTER must not be "dummy" in production.');
  }
  for (const [name, value] of [
    ['JWT_ACCESS_SECRET', env.JWT_ACCESS_SECRET],
    ['JWT_REFRESH_SECRET', env.JWT_REFRESH_SECRET],
  ] as const) {
    if (value.includes('dev-only')) problems.push(`${name} still holds a development placeholder.`);
  }
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ.');
  }
  if (problems.length > 0) {
    throw new Error(`Refusing to start in production:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
}
