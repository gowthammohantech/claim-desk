/**
 * Health snapshot.
 *
 * Dependency checks arrive as injected functions rather than direct imports, so
 * the application layer stays free of driver SDKs. `health.module.ts` supplies
 * the real ones.
 */
export type DependencyState = 'ok' | 'degraded' | 'down' | 'skipped';

export interface HealthCheck {
  name: string;
  check: () => DependencyState | Promise<DependencyState>;
  /** A failing non-critical dependency degrades readiness but does not fail it. */
  critical: boolean;
}

export interface HealthReport {
  status: 'ok' | 'degraded' | 'down';
  role: string;
  version: string;
  uptimeSec: number;
  checks: Record<string, DependencyState>;
}

export interface GetHealthDeps {
  role: string;
  version: string;
  startedAtMs: number;
  nowMs: () => number;
  checks: readonly HealthCheck[];
}

export function createGetHealth(deps: GetHealthDeps) {
  return async function getHealth(): Promise<HealthReport> {
    const checks: Record<string, DependencyState> = {};
    let status: HealthReport['status'] = 'ok';

    for (const { name, check, critical } of deps.checks) {
      const state = await check();
      checks[name] = state;

      if (state === 'down' && critical) status = 'down';
      else if ((state === 'down' || state === 'degraded') && status === 'ok') status = 'degraded';
    }

    return {
      status,
      role: deps.role,
      version: deps.version,
      uptimeSec: Math.floor((deps.nowMs() - deps.startedAtMs) / 1000),
      checks,
    };
  };
}

export type GetHealth = ReturnType<typeof createGetHealth>;
