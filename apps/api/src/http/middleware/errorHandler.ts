import type { ErrorRequestHandler, RequestHandler } from 'express';

import { AppError, ErrorCode } from '../../platform/errors/index.js';
import type { AppLogger } from '../../platform/observability/logger.js';
import { getContext } from '../../platform/util/index.js';

/**
 * Renders the single error envelope used across the API
 * (requirements/TDD.md §11.2):
 *
 *   { code, message, correlationId, details[] }
 *
 * Unknown errors become a generic 500. Internal messages and stack traces are
 * never returned to a client — they go to the logs, joinable by correlationId.
 */
export function errorHandler(logger: AppLogger): ErrorRequestHandler {
  return (error, _req, res, _next) => {
    const correlationId = getContext()?.correlationId;

    if (AppError.isAppError(error)) {
      const level = error.httpStatus >= 500 ? 'error' : 'warn';
      logger[level]({ err: error, code: error.code, status: error.httpStatus }, 'request.failed');

      res.status(error.httpStatus).json({
        code: error.code,
        message: error.expose ? error.message : 'An unexpected error occurred.',
        ...(correlationId ? { correlationId } : {}),
        ...(error.details.length > 0 ? { details: error.details } : {}),
      });
      return;
    }

    /*
     * A database that is down is an availability problem, not a bug. Rendering
     * it as 503 tells the caller to retry; a blanket 500 tells them the request
     * itself was wrong, which sends them debugging the wrong thing.
     */
    if (isDatabaseUnavailable(error)) {
      logger.error({ err: error }, 'request.dependency_unavailable');
      res.status(503).json({
        code: ErrorCode.DEPENDENCY_UNAVAILABLE,
        message: 'A required service is temporarily unavailable. Please retry.',
        ...(correlationId ? { correlationId } : {}),
      });
      return;
    }

    logger.error({ err: error }, 'request.unhandled_error');
    res.status(500).json({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred.',
      ...(correlationId ? { correlationId } : {}),
    });
  };
}

/**
 * Recognises the errors Mongoose raises when there is no usable connection.
 * `bufferCommands: false` makes these immediate rather than a 10s hang.
 */
function isDatabaseUnavailable(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const name = (error as { name?: string }).name ?? '';
  const message = (error as { message?: string }).message ?? '';
  return (
    name === 'MongooseServerSelectionError' ||
    name === 'MongoNetworkError' ||
    name === 'MongoNotConnectedError' ||
    message.includes('Client must be connected') ||
    message.includes('buffering timed out') ||
    // What Mongoose raises with `bufferCommands: false` and no connection.
    message.includes('before initial connection is complete')
  );
}

/** 404 in the same envelope, so clients only ever parse one error shape. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new AppError(ErrorCode.NOT_FOUND, 404, `No route matches ${req.method} ${req.originalUrl}.`),
  );
};
