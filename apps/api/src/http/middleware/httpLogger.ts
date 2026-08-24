import type { RequestHandler } from 'express';

import type { AppLogger } from '../../platform/observability/logger.js';

/**
 * Minimal access log.
 *
 * Deliberately hand-rolled rather than pino-http: the request/correlation ids
 * already come from the async context via the logger mixin, and this keeps the
 * health-check noise out of the log at a single obvious place.
 */
export function httpLogger(logger: AppLogger): RequestHandler {
  return (req, res, next) => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const isHealth = req.path.endsWith('/health');
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      if (isHealth && res.statusCode < 400) {
        logger.debug({ method: req.method, path: req.path, status: res.statusCode }, 'http.request');
        return;
      }

      logger[level](
        {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
        },
        'http.request',
      );
    });

    next();
  };
}
