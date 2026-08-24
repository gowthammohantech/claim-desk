import { CORRELATION_ID_HEADER, IDEMPOTENCY_KEY_HEADER } from '@claimdesk/contracts';
import { describe, expect, it, vi } from 'vitest';

import { createClaimDeskClient } from './client.js';
import { ApiError, isApiError } from './errors.js';

const BASE = 'http://api.test/v1';

/** Collects the requests the client actually issued. */
function stubFetch(responses: Response[]) {
  const seen: Request[] = [];
  const queue = [...responses];
  const impl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    seen.push(input instanceof Request ? input : new Request(input, init));
    return queue.shift() ?? new Response(null, { status: 500 });
  });
  return { impl: impl as unknown as typeof globalThis.fetch, seen };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('request decoration', () => {
  it('attaches the bearer token from the injected store', async () => {
    const { impl, seen } = stubFetch([json({ id: 'EMP-1' })]);
    const client = createClaimDeskClient({
      baseUrl: BASE,
      fetch: impl,
      tokens: { getAccessToken: () => 'tok-123' },
    });

    await client.GET('/me');

    expect(seen[0]?.headers.get('Authorization')).toBe('Bearer tok-123');
  });

  it('awaits an async token store (native secure storage)', async () => {
    const { impl, seen } = stubFetch([json({ id: 'EMP-1' })]);
    const client = createClaimDeskClient({
      baseUrl: BASE,
      fetch: impl,
      tokens: { getAccessToken: () => Promise.resolve('tok-async') },
    });

    await client.GET('/me');

    expect(seen[0]?.headers.get('Authorization')).toBe('Bearer tok-async');
  });

  it('sets a correlation id on every request', async () => {
    const { impl, seen } = stubFetch([json({ id: 'EMP-1' })]);
    const client = createClaimDeskClient({
      baseUrl: BASE,
      fetch: impl,
      correlationId: () => 'corr-1',
    });

    await client.GET('/me');

    expect(seen[0]?.headers.get(CORRELATION_ID_HEADER)).toBe('corr-1');
  });

  it('adds an idempotency key to mutating commands only', async () => {
    const { impl, seen } = stubFetch([json({ id: 'EXP-1' }, 201), json({ id: 'EMP-1' })]);
    const client = createClaimDeskClient({
      baseUrl: BASE,
      fetch: impl,
      idempotencyKey: () => 'idem-key-1',
    });

    await client.POST('/expenses', {
      body: {
        expenseDate: '2026-08-01',
        categoryId: 'CAT-1',
        amountPaise: 1000,
        classification: 'INTERNAL',
        businessPurpose: 'test',
      },
    } as never);
    await client.GET('/me');

    expect(seen[0]?.headers.get(IDEMPOTENCY_KEY_HEADER)).toBe('idem-key-1');
    expect(seen[1]?.headers.get(IDEMPOTENCY_KEY_HEADER)).toBeNull();
  });
});

describe('error mapping', () => {
  it('turns the error envelope into an ApiError', async () => {
    const { impl } = stubFetch([
      json(
        {
          code: 'CLAIM_NOT_SUBMITTABLE',
          message: 'Claim has no expenses.',
          correlationId: 'corr-9',
        },
        422,
      ),
    ]);
    const client = createClaimDeskClient({ baseUrl: BASE, fetch: impl });

    const error = await client.GET('/me').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(isApiError(error)).toBe(true);
    if (!isApiError(error)) throw new Error('expected an ApiError');
    expect(error.code).toBe('CLAIM_NOT_SUBMITTABLE');
    expect(error.correlationId).toBe('corr-9');
    expect(error.isValidation).toBe(true);
    expect(error.isRetryable).toBe(false);
  });

  it('classifies 409 as a conflict that must not be blind-retried', async () => {
    const { impl } = stubFetch([json({ code: 'STALE_VERSION', message: 'Task moved on' }, 409)]);
    const client = createClaimDeskClient({ baseUrl: BASE, fetch: impl });

    const error = await client.GET('/approvals').catch((e: unknown) => e);
    if (!isApiError(error)) throw new Error('expected an ApiError');
    expect(error.isConflict).toBe(true);
    expect(error.isRetryable).toBe(false);
  });

  it('marks 5xx and 429 retryable', async () => {
    for (const status of [500, 503, 429]) {
      const { impl } = stubFetch([json({ code: 'X', message: 'boom' }, status)]);
      const client = createClaimDeskClient({ baseUrl: BASE, fetch: impl });
      const error = await client.GET('/me').catch((e: unknown) => e);
      if (!isApiError(error)) throw new Error('expected an ApiError');
      expect(error.isRetryable).toBe(true);
    }
  });

  it('survives a non-JSON error body', async () => {
    const { impl } = stubFetch([new Response('<html>gateway</html>', { status: 502 })]);
    const client = createClaimDeskClient({ baseUrl: BASE, fetch: impl });

    const error = await client.GET('/me').catch((e: unknown) => e);
    if (!isApiError(error)) throw new Error('expected an ApiError');
    expect(error.code).toBe('HTTP_502');
    expect(error.status).toBe(502);
  });
});

describe('401 refresh', () => {
  it('refreshes once and retries with the new token', async () => {
    const { impl, seen } = stubFetch([
      json({ code: 'UNAUTHENTICATED', message: 'expired' }, 401),
      json({ id: 'EMP-1' }),
    ]);
    const refresh = vi.fn(async () => 'tok-new');
    const client = createClaimDeskClient({
      baseUrl: BASE,
      fetch: impl,
      tokens: { getAccessToken: () => 'tok-old', refresh },
    });

    const { data } = await client.GET('/me');

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(data).toEqual({ id: 'EMP-1' });
    expect(seen[1]?.headers.get('Authorization')).toBe('Bearer tok-new');
  });

  it('surfaces the 401 and signals logout when refresh fails', async () => {
    const { impl } = stubFetch([json({ code: 'UNAUTHENTICATED', message: 'expired' }, 401)]);
    const onUnauthorized = vi.fn();
    const client = createClaimDeskClient({
      baseUrl: BASE,
      fetch: impl,
      tokens: { getAccessToken: () => 'tok-old', refresh: async () => null, onUnauthorized },
    });

    const error = await client.GET('/me').catch((e: unknown) => e);
    if (!isApiError(error)) throw new Error('expected an ApiError');
    expect(error.isUnauthorized).toBe(true);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
