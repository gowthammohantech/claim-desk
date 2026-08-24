import boundaries from 'eslint-plugin-boundaries';

/**
 * Encodes the TDD §7.1 dependency rule for apps/api:
 *
 *   Controller -> UseCase -> Domain -> Port <- Adapter
 *
 * Two orthogonal mechanisms:
 *
 *   A. `boundaries/dependencies` governs INTERNAL paths — which layer may
 *      import which, and which module may reach into which.
 *   B. `apiSdkZones` (below) bans third-party SDKs by path, which is what makes
 *      "Domain modules SHALL not directly import infrastructure-specific
 *      provider SDKs" enforceable rather than aspirational.
 *
 * Elements classify FOLDERS (eslint-plugin-boundaries v7), so each module's
 * `index.ts` and `<name>.module.ts` — which sit at the module root — classify
 * as `module-root`. That is deliberate: the public entry point and the module's
 * mini composition root are the same trust level, and both are the only things
 * a sibling module or a runtime is allowed to import.
 *
 * The `{{from.module}}` capture is the load-bearing part of (A): it stops
 * `expense/domain` importing `claim/domain`. A deep path like
 * `../claim/application/x` classifies as another module's `module-app`, and the
 * allow lists only ever permit `module-app` of the SAME module — so a sibling's
 * `module-root` is the only way in.
 */

/** Shorthand for a single element-type selector. */
const el = (type) => ({ element: { type } });

/** Shorthand for several element types. */
const els = (...types) => ({ element: { types: { anyOf: types } } });

/** An element belonging to the SAME module as the importing file. */
const sameModule = (type) => ({
  element: { type, captured: { module: '{{from.module}}' } },
});

export const apiBoundaries = {
  files: ['src/**/*.ts'],
  plugins: { boundaries },
  settings: {
    /*
     * eslint-plugin-boundaries resolves imports through eslint-module-utils, so
     * it needs a TypeScript-aware resolver. Without this it silently fails to
     * classify `./x.js` specifiers (which resolve to `x.ts` under
     * moduleResolution: Bundler) and every policy quietly passes — the rules
     * look configured but enforce nothing.
     */
    'import/resolver': {
      typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
    },
    /*
     * Elements classify folders, so `index.ts` and `<name>.module.ts` both land
     * in `module-root`. These file categories let the policies tell them apart,
     * which is what pins a module's public entry point to `index.ts` alone.
     */
    'boundaries/files': [
      { category: 'module-entry', pattern: 'src/modules/*/index.ts' },
      { category: 'module-wiring', pattern: 'src/modules/*/*.module.ts' },
    ],
    // Most specific pattern wins, so the per-layer folders below take
    // precedence over the `src/modules/*` catch-all.
    'boundaries/elements': [
      { type: 'module-api', pattern: 'src/modules/*/api', capture: ['module'] },
      { type: 'module-app', pattern: 'src/modules/*/application', capture: ['module'] },
      { type: 'module-domain', pattern: 'src/modules/*/domain', capture: ['module'] },
      { type: 'module-infra', pattern: 'src/modules/*/infrastructure', capture: ['module'] },
      // index.ts + <name>.module.ts — the module's public surface.
      { type: 'module-root', pattern: 'src/modules/*', capture: ['module'] },

      { type: 'platform', pattern: 'src/platform' },
      { type: 'jobs', pattern: 'src/jobs' },
      { type: 'outbox', pattern: 'src/outbox' },
      { type: 'integrations', pattern: 'src/integrations' },
      { type: 'http', pattern: 'src/http' },
      { type: 'worker', pattern: 'src/worker' },
      // main.ts — the process composition root.
      { type: 'root', pattern: 'src' },
    ],
  },
  rules: {
    'boundaries/no-unknown-files': 'error',
    'boundaries/dependencies': [
      'error',
      {
        default: 'disallow',
        message:
          '{{from.type}} may not import {{to.type}} — violates the TDD §7.1 dependency rule (Controller -> UseCase -> Domain -> Port <- Adapter).',
        policies: [
          // npm packages and node built-ins are governed by `apiSdkZones`, not here.
          { allow: { to: { module: { origin: 'external' } } } },
          { allow: { to: { module: { origin: 'builtin' } } } },

          // DOMAIN — innermost ring. Same-module domain only. Pure, no I/O.
          {
            from: el('module-domain'),
            allow: { to: sameModule('module-domain') },
          },

          // APPLICATION — own domain and own ports, other modules' PUBLIC root,
          // jobs/outbox contracts, plus platform cross-cutting concerns
          // (typed config, clock, ids, error types).
          //
          // `platform` is allowed on purpose: routing config and clock through
          // injected ports buys nothing. What must not leak in is a driver or
          // provider SDK, and `apiSdkZones` bans those by path even though the
          // element rule permits the directory.
          {
            from: el('module-app'),
            allow: [
              { to: sameModule('module-domain') },
              { to: sameModule('module-app') },
              { to: els('module-root', 'platform', 'jobs', 'outbox') },
            ],
          },

          // INFRASTRUCTURE — implements its own module's ports; may touch platform.
          {
            from: el('module-infra'),
            allow: [
              { to: sameModule('module-domain') },
              { to: sameModule('module-app') },
              { to: els('platform', 'jobs', 'outbox') },
            ],
          },

          // API/controllers — own application layer plus other modules' public root.
          {
            from: el('module-api'),
            allow: [
              { to: sameModule('module-app') },
              { to: sameModule('module-domain') },
              { to: els('module-root', 'platform', 'http') },
            ],
          },

          // The module's public surface and mini composition root.
          {
            from: el('module-root'),
            allow: [
              { to: sameModule('module-api') },
              { to: sameModule('module-app') },
              { to: sameModule('module-infra') },
              { to: sameModule('module-domain') },
              { to: els('module-root', 'platform', 'jobs', 'outbox') },
            ],
          },

          // Adapters implement ports declared in application/ports — outermost ring.
          {
            from: el('integrations'),
            allow: {
              to: els('module-app', 'module-root', 'platform', 'jobs', 'outbox', 'integrations'),
            },
          },

          // Runtimes and the process composition root may see everything wireable.
          {
            from: el('http'),
            allow: { to: els('module-root', 'platform', 'http') },
          },
          {
            from: el('worker'),
            allow: { to: els('module-root', 'platform', 'jobs', 'outbox', 'worker') },
          },
          {
            from: el('root'),
            allow: {
              to: els(
                'module-root',
                'platform',
                'jobs',
                'outbox',
                'integrations',
                'http',
                'worker',
                'root',
              ),
            },
          },

          // platform/jobs/outbox are foundational: they must NOT know about modules.
          { from: el('platform'), allow: { to: el('platform') } },
          { from: el('jobs'), allow: { to: els('platform', 'jobs') } },
          { from: el('outbox'), allow: { to: els('platform', 'outbox') } },

          /*
           * Last-write-wins, so these two close the final gap: a module's
           * `<name>.module.ts` is wiring, not a public API. Without them a
           * sibling could enter through `../claim/claim.module.js` and bypass
           * `index.ts` entirely, since both classify as `module-root`.
           */
          { disallow: { to: { file: { categories: 'module-wiring' } } } },
          {
            from: el('module-root'),
            allow: {
              to: {
                element: { type: 'module-root', captured: { module: '{{from.module}}' } },
                file: { categories: 'module-wiring' },
              },
            },
          },
        ],
      },
    ],
  },
};

export default apiBoundaries;

/**
 * Rule B — infrastructure SDK bans, scoped by path.
 *
 * Kept as `no-restricted-imports` rather than folded into the boundaries
 * policies so the ban list reads as one obvious table, and so each entry can
 * say what to do instead.
 */
const INFRA_SDKS = [
  {
    group: ['mongoose', 'mongoose/*', 'mongodb', 'bson'],
    message: 'Persistence SDK. Depend on a Repository port; implement it in infrastructure/.',
  },
  {
    group: ['@azure/*'],
    message: 'Cloud provider SDK. Wrap it in platform/storage or integrations/.',
  },
  {
    group: ['express', 'express/*', 'helmet', 'cors', 'express-rate-limit'],
    message: 'HTTP transport. Domain and application layers are transport-agnostic.',
  },
  {
    group: ['pino', 'pino-http', 'prom-client', '@opentelemetry/*'],
    message: 'Observability SDK. Inject a Logger port instead.',
  },
  {
    group: ['jose', 'jsonwebtoken', 'bcrypt', 'bcryptjs'],
    message: 'Crypto SDK belongs in platform/security.',
  },
  {
    group: ['axios', 'node-fetch', 'undici', 'got'],
    message: 'HTTP client. Belongs in integrations/.',
  },
  {
    group: [
      'node:*',
      'fs',
      'fs/*',
      'path',
      'crypto',
      'os',
      'child_process',
      'http',
      'https',
      'net',
      'dns',
    ],
    message: 'Node built-in. Domain must be pure and platform-free.',
  },
  {
    group: ['**/platform/**', '**/integrations/**', '**/infrastructure/**'],
    message: 'Domain must not reach outward. Invert the dependency with a port.',
  },
];

/** Application may use Node built-ins and platform ports; still no SDKs. */
const APP_SDKS = INFRA_SDKS.filter(
  (zone) => !zone.group.includes('node:*') && !zone.group.includes('**/platform/**'),
);

export const apiSdkZones = [
  {
    // The strictest ring: domain is pure.
    files: ['src/modules/*/domain/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: INFRA_SDKS }] },
  },
  {
    files: ['src/modules/*/application/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: APP_SDKS }] },
  },
  {
    // Only these directories may construct a Mongoose model or an Azure client.
    files: [
      'src/modules/*/infrastructure/**/*.ts',
      'src/modules/*/*.module.ts',
      'src/modules/*/index.ts',
      'src/platform/**/*.ts',
      'src/integrations/**/*.ts',
      'src/jobs/**/*.ts',
      'src/outbox/**/*.ts',
      'src/http/**/*.ts',
      'src/worker/**/*.ts',
      'src/*.ts',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
];
