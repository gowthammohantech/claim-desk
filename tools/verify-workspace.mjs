/**
 * Workspace hygiene checks that lint and tsc cannot express.
 *
 * 1. Catalogued dependencies must be written as `catalog:`. A literal range
 *    silently forks the version, which is exactly how apps/web and apps/mobile
 *    end up with two copies of @tanstack/react-query and the shared
 *    @claimdesk/api-client hooks stop type-checking against both.
 *
 * 2. Runtime singletons must resolve to exactly one installed version.
 *
 * 3. Apps must not depend on each other. Shared code goes through packages/.
 *
 * Run with `pnpm verify:workspace`.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Packages that must never be installed twice — shared hooks depend on identity. */
const SINGLETONS = ['@tanstack/react-query', 'react'];

const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'];

const problems = [];

// ─── read the catalog ───────────────────────────────────────────────────────
const workspaceYaml = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8');
const catalogNames = new Set();
{
  let inCatalog = false;
  for (const line of workspaceYaml.split('\n')) {
    if (/^catalog:\s*$/.test(line)) {
      inCatalog = true;
      continue;
    }
    if (inCatalog) {
      if (/^\S/.test(line)) break;
      const match = line.match(/^\s{2}'?([^':\s]+)'?:\s*\S/);
      if (match) catalogNames.add(match[1]);
    }
  }
}

if (catalogNames.size === 0) {
  problems.push('Could not parse any entries from the `catalog:` block in pnpm-workspace.yaml.');
}

// ─── walk every workspace package ───────────────────────────────────────────
const packageDirs = [];
for (const group of ['apps', 'packages']) {
  const groupDir = join(ROOT, group);
  if (!existsSync(groupDir)) continue;
  for (const name of readdirSync(groupDir)) {
    const manifest = join(groupDir, name, 'package.json');
    if (existsSync(manifest)) packageDirs.push({ id: `${group}/${name}`, manifest });
  }
}

for (const { id, manifest } of packageDirs) {
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'));

  for (const field of DEP_FIELDS) {
    for (const [dep, range] of Object.entries(pkg[field] ?? {})) {
      // 1. catalogued deps must use `catalog:`
      if (catalogNames.has(dep) && !String(range).startsWith('catalog:')) {
        problems.push(
          `${id}: "${dep}": "${range}" in ${field} — this dependency is catalogued, use "catalog:".`,
        );
      }

      // 3. no app-to-app dependencies
      if (dep.startsWith('@claimdesk/') && id.startsWith('apps/')) {
        const target = dep.slice('@claimdesk/'.length);
        if (['api', 'web', 'mobile'].includes(target)) {
          problems.push(`${id}: depends on app "${dep}". Share code through packages/ instead.`);
        }
      }
    }
  }
}

// ─── 2. singleton versions ──────────────────────────────────────────────────
for (const name of SINGLETONS) {
  let raw;
  try {
    // pnpm.cmd rather than shell:true — passing args through a shell is both
    // deprecated and an injection surface.
    const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    raw = execFileSync(pnpmBin, ['ls', name, '-r', '--depth', '0', '--json'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    // The package may not be installed anywhere; that is not a failure.
    continue;
  }

  const versions = new Set();
  const visit = (deps) => {
    for (const [dep, info] of Object.entries(deps ?? {})) {
      if (dep === name && info?.version) versions.add(info.version);
    }
  };

  for (const entry of JSON.parse(raw)) {
    visit(entry.dependencies);
    visit(entry.devDependencies);
  }

  if (versions.size > 1) {
    problems.push(
      `"${name}" resolves to ${versions.size} versions (${[...versions].join(', ')}). ` +
        'It must be a singleton — pin it in the pnpm catalog.',
    );
  }
}

// ─── report ─────────────────────────────────────────────────────────────────
if (problems.length > 0) {
  console.error(`verify-workspace: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `verify-workspace: OK (${packageDirs.length} packages, ${catalogNames.size} catalogued deps)`,
);
