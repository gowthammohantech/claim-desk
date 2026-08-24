import {
  CORRELATION_ID_HEADER,
  IDEMPOTENCY_KEY_HEADER,
  type ErrorEnvelope,
  type paths,
} from '@claimdesk/contracts';
import createOpenApiClient, { type Middleware } from 'openapi-fetch';

import { ApiError } from './errors.js';

/**
 * Token storage is injected rather than assumed, because the two clients store
 * credentials very differently:
 *
 *   web    -> in-memory access token + httpOnly refresh cookie
 *   mobile -> expo-secure-store (platform secure storage only, per TDD §17.2)
 *
 * Every method may be async so the native keychain can be awaited.
 */
export interface TokenStore {
  getAccessToken(): string | null | Promise<string | null>;
  /**
   * Called once on a 401. Return a fresh access token to have the original
   * request retried, or `null` to surface the 401 to the caller.
   */
  refresh?(): Promise<string | null>;
  onUnauthorized?(): void | Promise<void>;
}

export interface ClaimDeskClientOptions {
  /** Base URL including the version prefix, e.g. `http://localhost:4000/v1`. */
  baseUrl: string;
  tokens?: TokenStore;
  /** Generates correlation ids. Defaults to `crypto.randomUUID()`. */
  correlationId?: () => string;
  /** Generates idempotency keys for mutating commands. */
  idempotencyKey?: () => string;
  fetch?: typeof globalThis.fetch;
  /** Extra headers applied to every request (e.g. an app-version header). */
  headers?: Record<string, string>;
}

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function defaultId(): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID();
  // Hermes on older RN versions has no crypto.randomUUID.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Builds the typed API client.
 *
 * `paths` comes straight from the generated OpenAPI types, so every route,
 * parameter and response body is checked against design/06-api-contract.yaml at
 * compile time. A route that does not exist in the spec will not compile.
 */
export function createClaimDeskClient(options: ClaimDeskClientOptions) {
  const {
    baseUrl,
    tokens,
    correlationId = defaultId,
    idempotencyKey = defaultId,
    fetch: fetchImpl,
    headers: staticHeaders,
  } = options;

  const client = createOpenApiClient<paths>({
    baseUrl,
    ...(fetchImpl ? { fetch: fetchImpl } : {}),
    ...(staticHeaders ? { headers: staticHeaders } : {}),
  });

  /**
   * Deliberately ONE middleware rather than two.
   *
   * openapi-fetch runs `onResponse` hooks in reverse registration order, so
   * splitting "refresh on 401" and "map errors" into separate middleware makes
   * the refresh unreachable — the error mapper throws first. Keeping both in a
   * single hook makes the ordering explicit and un-breakable.
   */
  const middleware: Middleware = {
    async onRequest({ request }) {
      const token = await tokens?.getAccessToken();
      if (token) request.headers.set('Authorization', `Bearer ${token}`);

      if (!request.headers.has(CORRELATION_ID_HEADER)) {
        request.headers.set(CORRELATION_ID_HEADER, correlationId());
      }

      // Every mutating command in the contract requires an Idempotency-Key.
      // Setting it here means a retry of the SAME request object is safe,
      // while a genuinely new command gets a fresh key.
      if (MUTATING_METHODS.has(request.method) && !request.headers.has(IDEMPOTENCY_KEY_HEADER)) {
        request.headers.set(IDEMPOTENCY_KEY_HEADER, idempotencyKey());
      }

      return request;
    },

    async onResponse({ response, request }) {
      let current = response;

      // 1. Refresh-and-retry, exactly once, before any error is raised.
      if (current.status === 401 && tokens?.refresh) {
        const fresh = await tokens.refresh();
        if (fresh) {
          // The original Idempotency-Key is preserved, so a command that DID
          // land server-side before the token expired is not duplicated.
          const retry = new Request(request, { headers: new Headers(request.headers) });
          retry.headers.set('Authorization', `Bearer ${fresh}`);
          current = await (fetchImpl ?? globalThis.fetch)(retry);
        } else {
          await tokens.onUnauthorized?.();
        }
      }

      // 2. Map whatever we ended up with onto the error envelope.
      if (current.ok) return current;

      let envelope: Partial<ErrorEnvelope> | undefined;
      try {
        envelope = (await current.clone().json()) as Partial<ErrorEnvelope>;
      } catch {
        envelope = undefined;
      }
      throw new ApiError(current.status, envelope, current.statusText);
    },
  };

  client.use(middleware);

  return client;
}

export type ClaimDeskClient = ReturnType<typeof createClaimDeskClient>;
