/**
 * One-shot generator for the apps/api module skeletons.
 *
 * Every module gets the identical four-layer shape so the boundaries lint rules
 * have real targets and so the first feature in each module has an obvious
 * place to go:
 *
 *   modules/<name>/
 *     domain/           entities + invariants — pure, zero I/O
 *     application/      use cases
 *     application/ports/ repository + provider interfaces
 *     infrastructure/   Mongoose models + repository implementations
 *     api/              controllers + routes
 *     <name>.module.ts  mini composition root
 *     index.ts          the ONLY legal cross-module import target
 *
 * Safe to re-run: existing files are never overwritten.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULES_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../apps/api/src/modules',
);

/** name -> [PascalName, owned collections, one-line purpose] */
const MODULES = [
  ['auth', 'Auth', [], 'Mobile number + OTP sign-in, token issue and refresh (ADR-007).'],
  ['employee', 'Employee', ['employees', 'roles'], 'Employee directory, roles and profile.'],
  [
    'master-data',
    'MasterData',
    ['clients', 'engagements', 'expenseCategories'],
    'Backend-maintained master data: clients, engagements, expense categories.',
  ],
  [
    'expense',
    'Expense',
    ['expenses', 'duplicateCases'],
    'Expense capture, editing and duplicate resolution.',
  ],
  [
    'receipt',
    'Receipt',
    ['receipts', 'ocrResults'],
    'Receipt upload intents (Azure Blob SAS) and OCR results (ADR-005).',
  ],
  [
    'policy',
    'Policy',
    ['policyDefinitions', 'policyEvaluations'],
    'Policy rule evaluation and duplicate scoring. BACKEND ONLY — design/09 §1 forbids shipping firm policy to clients.',
  ],
  ['claim', 'Claim', ['claims'], 'Claim assembly, submission and resubmission.'],
  [
    'approval',
    'Approval',
    ['approvalTasks', 'workflowDefinitions', 'delegations'],
    'Approval workflow resolution, task assignment and decisions.',
  ],
  ['finance', 'Finance', ['financeReviews'], 'Finance queue, verification and return.'],
  [
    'payment',
    'Payment',
    ['paymentBatches', 'payments'],
    'Payment batches and payment recording.',
  ],
  [
    'notification',
    'Notification',
    ['notifications'],
    'In-app notification records and push dispatch. Push is the only channel in scope (GAP-008).',
  ],
  ['reporting', 'Reporting', [], 'Aggregation reports and exports.'],
  ['audit', 'Audit', ['auditEvents'], 'Append-only audit event log and the audit explorer.'],
];

const write = (path, contents) => {
  if (existsSync(path)) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents, 'utf8');
  return true;
};

let created = 0;

for (const [name, pascal, collections, purpose] of MODULES) {
  const dir = join(MODULES_DIR, name);
  const collectionNote =
    collections.length > 0
      ? `Owns the ${collections.map((c) => `\`${c}\``).join(', ')} collection${
          collections.length > 1 ? 's' : ''
        }.`
      : 'Owns no collection of its own.';

  const files = {
    'domain/index.ts': `/**
 * ${pascal} domain.
 *
 * ${purpose}
 *
 * PURE: no I/O, no Mongoose, no Express, no Node built-ins. Entities,
 * value objects and invariants only. Enforced by eslint-plugin-boundaries
 * plus the SDK ban in @claimdesk/config-eslint/api-boundaries.
 */
export {};
`,

    'application/ports/index.ts': `/**
 * ${pascal} ports — INTERFACES ONLY.
 *
 * The application layer depends on these; \`infrastructure/\` and
 * \`src/integrations/\` provide the implementations. This inversion is what
 * keeps the domain free of provider SDKs (TDD §7.1, §16).
 */
export {};
`,

    'application/index.ts': `/**
 * ${pascal} use cases.
 *
 * One file per use case, each a factory that takes its ports as arguments and
 * returns the callable. That keeps them unit-testable without a database.
 */
export {};
`,

    'infrastructure/index.ts': `/**
 * ${pascal} infrastructure.
 *
 * ${collectionNote}
 * Mongoose schemas and repository implementations live here and NOWHERE else.
 * Collection names and indexes come from design/04-data-model.md.
 */
export {};
`,

    'api/index.ts': `/**
 * ${pascal} HTTP surface — controllers, routes and serializers.
 *
 * Routes declare their permission via the authorize() middleware. Remember that
 * a permission alone is never sufficient: design/07-permission-matrix.md §3
 * requires resource scope, entity state and the segregation-of-duties check too.
 */
export {};
`,

    [`${name}.module.ts`]: `/**
 * ${pascal} module composition root.
 *
 * Builds the concrete adapters, injects them into the use cases, and exposes
 * the router plus any job handlers the module contributes.
 */
export interface ${pascal}ModuleDeps {
  // TODO: inject the logger, config and repositories this module needs.
  _placeholder?: never;
}

export function build${pascal}Module(_deps: ${pascal}ModuleDeps = {}): Record<string, never> {
  // TODO: return { router, jobHandlers, subscribers }.
  return {};
}
`,

    'index.ts': `/**
 * ${pascal} — public surface.
 *
 * ${purpose}
 * ${collectionNote}
 *
 * This file is the ONLY thing another module may import. Reaching into
 * \`../${name}/application/...\` from a sibling is a lint error.
 */
export { type ${pascal}ModuleDeps, build${pascal}Module } from './${name}.module.js';
`,
  };

  for (const [relative, contents] of Object.entries(files)) {
    if (write(join(dir, relative), contents)) created += 1;
  }
}

console.log(`scaffold-modules: created ${created} file(s) across ${MODULES.length} modules`);
