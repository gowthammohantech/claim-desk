import { pino, type Logger } from 'pino';

import type { Env } from '../config/env.js';
import { getContext } from '../util/requestContext.js';

/**
 * Structured logging with correlation ids (requirements/TDD.md §23.1).
 *
 * The redaction list is not optional: design/10-audit-event-catalog.md §3
 * forbids logging receipt binaries, access tokens, full bank account numbers
 * and secrets.
 */
const REDACT = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.code',
  'req.body.otp',
  '*.accessToken',
  '*.refreshToken',
  '*.jwt',
  '*.otpCode',
  '*.bankAccountNumber',
  '*.accountNumber',
  '*.connectionString',
  '*.sasUrl',
  '*.uploadUrl',
];

export type AppLogger = Logger;

export function createLogger(env: Env): AppLogger {
  const isDev = env.NODE_ENV === 'development';

  return pino({
    level: env.LOG_LEVEL,
    base: {
      service: env.SERVICE_NAME,
      environment: env.ENVIRONMENT,
      role: env.ROLE,
    },
    redact: { paths: REDACT, censor: '[redacted]' },
    // Pull the ids off the async context so call sites never have to pass them.
    mixin() {
      const context = getContext();
      if (!context) return {};
      return {
        requestId: context.requestId,
        correlationId: context.correlationId,
        ...(context.employeeId ? { employeeId: context.employeeId } : {}),
      };
    },
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
          },
        }
      : {}),
  });
}
