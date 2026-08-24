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

    logger.error({ err: error }, 'request.unhandled_error');
    res.status(500).json({
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred.',
      ...(correlationId ? { correlationId } : {}),
    });
  };
}

/** 404 in the same envelope, so clients only ever parse one error shape. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(
    new AppError(ErrorCode.NOT_FOUND, 404, `No route matches ${req.method} ${req.originalUrl}.`),
  );
};
