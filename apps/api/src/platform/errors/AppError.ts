import { ErrorCode } from './errorCodes.js';

export interface ErrorDetail {
  field?: string;
  message: string;
}

/**
 * The only error type the HTTP layer knows how to render. Anything else that
 * reaches the error handler becomes a 500 with no leaked internals.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly details: ErrorDetail[];
  /** When false, the error handler logs at `error` and hides the message. */
  readonly expose: boolean;

  constructor(
    code: ErrorCode,
    httpStatus: number,
    message: string,
    details: ErrorDetail[] = [],
    expose = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    this.expose = expose;
  }

  static validation(message: string, details: ErrorDetail[] = []): AppError {
    return new AppError(ErrorCode.VALIDATION_FAILED, 422, message, details);
  }

  static unauthenticated(message = 'Authentication is required.'): AppError {
    return new AppError(ErrorCode.UNAUTHENTICATED, 401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action.'): AppError {
    return new AppError(ErrorCode.FORBIDDEN, 403, message);
  }

  static notFound(what = 'Resource'): AppError {
    return new AppError(ErrorCode.NOT_FOUND, 404, `${what} not found.`);
  }

  /** 409 — the caller must refetch and re-present, never blind-retry. */
  static conflict(code: ErrorCode, message: string): AppError {
    return new AppError(code, 409, message);
  }

  static internal(message = 'An unexpected error occurred.'): AppError {
    return new AppError(ErrorCode.INTERNAL_ERROR, 500, message, [], false);
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}
