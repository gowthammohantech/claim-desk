import { writeFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { afterAll, describe, expect, it } from 'vitest';

/**
 * Executable proof that the architecture rules actually bite.
 *
 * This exists because eslint-plugin-boundaries fails SILENTLY when it cannot
 * resolve an import: every policy passes, the lint output is green, and the
 * layering is enforced by nothing at all. That happened during the initial
 * scaffold — `./x.js` specifiers (which resolve to `x.ts` under
 * moduleResolution: Bundler) were unresolvable until an `import/resolver`
 * setting was added.
 *
 * A green `pnpm lint` therefore does NOT prove the rules work. These cases do.
 */
const API_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const eslint = new ESLint({ cwd: API_ROOT });

const scratchFiles = new Set<string>();

/** Writes a scratch file, lints it, and returns whether an architecture rule fired. */
async function isDenied(relativePath: string, source: string): Promise<boolean> {
  const absolute = join(API_ROOT, relativePath);
  writeFileSync(absolute, source, 'utf8');
  scratchFiles.add(absolute);

  const [result] = await eslint.lintFiles([absolute]);
  const messages = result?.messages ?? [];

  // A parse/resolve crash must never read as "allowed".
  const fatal = messages.filter((m) => m.fatal);
  if (fatal.length > 0) {
    throw new Error(`Lint crashed on ${relativePath}: ${fatal[0]?.message ?? 'unknown'}`);
  }

  return messages.some(
    (m) => m.ruleId === 'boundaries/dependencies' || m.ruleId === 'no-restricted-imports',
  );
}

afterAll(async () => {
  await Promise.all([...scratchFiles].map((f) => rm(f, { force: true })));
});

describe('cross-module isolation', () => {
  it('denies domain reaching into a sibling module', async () => {
    expect(
      await isDenied(
        'src/modules/expense/domain/__boundary.ts',
        `import { buildClaimModule } from '../../claim/index.js';\nexport const x = buildClaimModule;\n`,
      ),
    ).toBe(true);
  });

  it('allows application to use a sibling module PUBLIC entry point', async () => {
    expect(
      await isDenied(
        'src/modules/expense/application/__boundary.ts',
        `import { buildClaimModule } from '../../claim/index.js';\nexport const x = buildClaimModule;\n`,
      ),
    ).toBe(false);
  });

  it('denies reaching past a sibling entry point into its wiring', async () => {
    expect(
      await isDenied(
        'src/modules/expense/application/__boundary.ts',
        `import type { ClaimModuleDeps } from '../../claim/claim.module.js';\nexport type X = ClaimModuleDeps;\n`,
      ),
    ).toBe(true);
  });
});

describe('layering (TDD §7.1)', () => {
  it('denies domain importing platform — it must invert with a port', async () => {
    expect(
      await isDenied(
        'src/modules/expense/domain/__boundary.ts',
        `import { systemClock } from '../../../platform/util/index.js';\nexport const n = systemClock;\n`,
      ),
    ).toBe(true);
  });

  it('allows application to use platform config and clock', async () => {
    expect(
      await isDenied(
        'src/modules/expense/application/__boundary.ts',
        `import { systemClock } from '../../../platform/util/index.js';\nexport const n = systemClock;\n`,
      ),
    ).toBe(false);
  });

  it('denies platform knowing about any module', async () => {
    expect(
      await isDenied(
        'src/platform/__boundary.ts',
        `import { buildClaimModule } from '../modules/claim/index.js';\nexport const x = buildClaimModule;\n`,
      ),
    ).toBe(true);
  });

  it('allows the http layer to mount a module entry point', async () => {
    expect(
      await isDenied(
        'src/http/__boundary.ts',
        `import { buildClaimModule } from '../modules/claim/index.js';\nexport const x = buildClaimModule;\n`,
      ),
    ).toBe(false);
  });
});

describe('infrastructure SDK bans', () => {
  it('denies mongoose in domain', async () => {
    expect(
      await isDenied(
        'src/modules/expense/domain/__boundary.ts',
        `import mongoose from 'mongoose';\nexport const x = mongoose;\n`,
      ),
    ).toBe(true);
  });

  it('denies express in application — layers are transport-agnostic', async () => {
    expect(
      await isDenied(
        'src/modules/expense/application/__boundary.ts',
        `import express from 'express';\nexport const x = express;\n`,
      ),
    ).toBe(true);
  });

  it('allows mongoose in infrastructure, where models belong', async () => {
    expect(
      await isDenied(
        'src/modules/expense/infrastructure/__boundary.ts',
        `import mongoose from 'mongoose';\nexport const x = mongoose;\n`,
      ),
    ).toBe(false);
  });
});
