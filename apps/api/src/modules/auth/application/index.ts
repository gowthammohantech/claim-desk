export {
  type AuthService,
  type AuthServiceDeps,
  type TokenPairResult,
  createAuthService,
  resolvePermissionsFromRoles,
  toActor,
} from './authService.js';
export type {
  OtpChallenge,
  OtpChallengeRepository,
  OtpSender,
  RefreshTokenRepository,
  StoredRefreshToken,
} from './ports/index.js';
