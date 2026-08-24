import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { AppError } from '../../platform/errors/index.js';

/**
 * Validates a request against a zod schema and REPLACES the raw value with the
 * parsed one, so downstream code sees defaults applied and unknown keys
 * stripped. That stripping is the mass-assignment defence
 * (design/13-test-strategy.md §4 requires a test for it).
 */
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        AppError.validation(
          'The request body failed validation.',
          result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(
        AppError.validation(
          'The query string failed validation.',
          result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
      return;
    }
    // Express 5 makes req.query a getter, so assign onto a held reference.
    Object.defineProperty(req, 'query', { value: result.data, writable: true });
    next();
  };
}
