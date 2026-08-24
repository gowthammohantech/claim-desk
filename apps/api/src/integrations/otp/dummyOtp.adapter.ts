import type { AppLogger } from '../../platform/observability/logger.js';

/**
 * Dummy OTP adapter (design/11 §2: "OTP delivery/verification uses a dummy
 * adapter for now; a production SMS provider is deferred").
 *
 * Logs the code instead of sending it, and reports `revealsCode: true` so the
 * verify endpoint can hand it back in development. A real SMS adapter sets that
 * flag false and the code never leaves the provider.
 */
export interface DummyOtpAdapterOptions {
  logger: AppLogger;
  /** When set, every challenge uses this code — makes seeded demos scriptable. */
  fixedCode?: string | undefined;
}

export function createDummyOtpAdapter({ logger, fixedCode }: DummyOtpAdapterOptions) {
  return {
    revealsCode: true,
    async send(mobileNumber: string, code: string): Promise<void> {
      logger.warn(
        { mobileNumber, code: fixedCode ?? code },
        'otp.dummy_delivery — no SMS provider configured',
      );
    },
  };
}
