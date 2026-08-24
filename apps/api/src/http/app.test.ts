import { CORRELATION_ID_HEADER } from '@claimdesk/contracts';
import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { loadEnv } from '../platform/config/index.js';
import { createLogger } from '../platform/observability/index.js';
import { createApp } from './app.js';

/**
 * Component test: the real Express app, with no database.
 * design/13-test-strategy.md §2 — mock only at external boundaries.
 */
const TEST_ENV = {
  NODE_ENV: 'test',
  ROLE: 'api',
  LOG_LEVEL: 'silent',
  JWT_ACCESS_SECRET: 'test-secret-that-is-at-least-32-chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars',
} as NodeJS.ProcessEnv;

let app: Express;

beforeAll(() => {
  const env = loadEnv(TEST_ENV);
  const logger = createLogger(env);
  // No modules mounted: this suite covers the HTTP shell — context, error
  // envelope, security headers — not any business route.
  app = createApp({
    env,
    logger,
    version: '0.1.0-test',
    startedAtMs: Date.now(),
    routers: { public: [], authenticated: [] },
    authenticate: (_req, _res, next) => {
      next();
    },
  });
});

describe('GET /v1/health', () => {
  it('reports ok and marks mongo as skipped when no database is configured', async () => {
    const response = await request(app).get('/v1/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      role: 'api',
      version: '0.1.0-test',
      checks: { mongo: 'skipped' },
    });
    expect(response.body.uptimeSec).toBeGreaterThanOrEqual(0);
  });

  it('echoes an inbound correlation id so one id spans client and server', async () => {
    const response = await request(app)
      .get('/v1/health')
      .set(CORRELATION_ID_HEADER, 'corr-from-client');

    expect(response.headers[CORRELATION_ID_HEADER]).toBe('corr-from-client');
  });

  it('generates a correlation id and a request id when none is supplied', async () => {
    const response = await request(app).get('/v1/health');

    expect(response.headers[CORRELATION_ID_HEADER]).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(response.headers['x-request-id']).toBeDefined();
  });
});

describe('error envelope', () => {
  it('returns the standard shape on an unknown route', async () => {
    const response = await request(app).get('/v1/does-not-exist').expect(404);

    expect(response.body).toMatchObject({
      code: 'NOT_FOUND',
      message: expect.stringContaining('/v1/does-not-exist'),
    });
    expect(response.body.correlationId).toBeDefined();
  });

  it('404s outside the version prefix rather than serving anything', async () => {
    await request(app).get('/health').expect(404);
  });
});

describe('security headers', () => {
  it('applies helmet and hides the framework', async () => {
    const response = await request(app).get('/v1/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});
