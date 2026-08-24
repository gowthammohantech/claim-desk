import { requestOtpSchema, verifyOtpSchema } from '@claimdesk/domain';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { validateBody } from '../../../http/middleware/validate.js';
import type { AuthService } from '../application/authService.js';
import { toEmployeeDto } from './employee.serializer.js';

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

/**
 * design/13-test-strategy.md §4 calls out "OTP abuse/rate-limit" as a required
 * security test. Per-IP limiting lives here; per-number limiting is enforced by
 * the challenge's own `attempts` counter, which — unlike this in-memory store —
 * works across API replicas.
 */
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

export function authRoutes(auth: AuthService): Router {
  const router = Router();

  router.post(
    '/auth/otp/request',
    otpRequestLimiter,
    validateBody(requestOtpSchema),
    (req, res, next) => {
      const { mobileNumber } = req.body as { mobileNumber: string };
      auth
        .requestOtp(mobileNumber)
        .then((result) => {
          // 202 whether or not the number belongs to an employee — a 404 here
          // would let anyone enumerate who works at the firm.
          res.status(202).json(result.devCode ? { devCode: result.devCode } : {});
        })
        .catch(next);
    },
  );

  router.post(
    '/auth/otp/verify',
    otpVerifyLimiter,
    validateBody(verifyOtpSchema),
    (req, res, next) => {
      const { mobileNumber, code } = req.body as { mobileNumber: string; code: string };
      auth
        .verifyOtp(mobileNumber, code)
        .then((pair) => {
          res.status(200).json({
            accessToken: pair.accessToken,
            refreshToken: pair.refreshToken,
            expiresIn: pair.expiresIn,
            employee: toEmployeeDto(pair.employee),
          });
        })
        .catch(next);
    },
  );

  router.post('/auth/refresh', validateBody(refreshSchema), (req, res, next) => {
    const { refreshToken } = req.body as { refreshToken: string };
    auth
      .refresh(refreshToken)
      .then((pair) => {
        res.status(200).json({
          accessToken: pair.accessToken,
          refreshToken: pair.refreshToken,
          expiresIn: pair.expiresIn,
          employee: toEmployeeDto(pair.employee),
        });
      })
      .catch(next);
  });

  router.post('/auth/logout', validateBody(refreshSchema), (req, res, next) => {
    const { refreshToken } = req.body as { refreshToken: string };
    auth
      .logout(refreshToken)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

  return router;
}
