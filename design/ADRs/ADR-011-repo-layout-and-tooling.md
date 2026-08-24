# ADR-011 --- Repository Layout and Tooling

**Status:** Accepted

## Context

`requirements/TDD.md` §7 sketches a monorepo: `apps/{api,worker,web,mobile}`, eighteen `libs/*` packages for the backend domains, `packages/{ui-web,ui-mobile,eslint-config,tsconfig}`, and `turbo.json` at the root. It names no package manager, no dependency versions and no test tooling.

Implementing that sketch surfaced four places where the literal structure costs more than it returns. This ADR records the divergences so the docs and the repository do not silently disagree.

## Decisions

### 1. Backend domains are folders, not packages

`apps/api/src/modules/<name>/` instead of eighteen `libs/*` workspace packages.

The architecture is unchanged — same bounded contexts, same `Controller -> UseCase -> Domain -> Port <- Adapter` rule from §7.1. What changes is where the boundary is enforced: ESLint (`eslint-plugin-boundaries` plus path-scoped `no-restricted-imports`) rather than package resolution.

Eighteen packages would mean eighteen `package.json` files, eighteen build steps and an eighteen-node dependency graph to rebuild on every change, in exchange for a boundary that lint already gives us.

**Consequence:** the enforcement is only as good as the lint config. `eslint-plugin-boundaries` fails *silently* when it cannot resolve an import — every policy passes and nothing is enforced. `apps/api/src/boundaries.test.ts` therefore asserts that deliberate violations are actually rejected, and must stay green.

### 2. The worker is a role, not a separate app

`ROLE=api | worker | migrate` on `apps/api`, one image, one build.

`design/12-deployment-architecture.md` §2 explicitly permits this ("same codebase or separate process"). The two still deploy as separate Azure Container Apps and scale independently, and `migrate` running through the same entrypoint keeps migrations in the deployment pipeline rather than on a developer machine (TDD §29).

### 3. `packages/` holds shared tokens, not two UI kits

TDD proposes `ui-web` and `ui-mobile`. Instead there is one `@claimdesk/tokens`, and components live in the app that renders them.

React Native cannot consume Tailwind, so the sharable artifact is **the token values, not the styling mechanism**. `packages/tokens/src/*.ts` is the single source, transcribed from the prototype's `:root` block; a build step emits a Tailwind `@theme` block and CSS variables for web, while `src/native.ts` exports a React Native theme. Two conversions happen only in `native.ts` and are documented there: multi-layer CSS shadows collapse to one RN layer plus an Android `elevation`, and the CSS gradient becomes `expo-linear-gradient` props.

Component libraries are not shared because shadcn/ui generates components *into* the consuming app by design.

### 4. Specification documents stay where they are

TDD §7 expects `docs/`. `design/` and `requirements/` remain in place: the ADRs and READMEs cross-reference sibling filenames, and `design/06-api-contract.yaml` is a build input. Moving them churns every reference for no benefit.

## Tooling

Not specified anywhere in the design pack; chosen here.

| | | Why |
|---|---|---|
| Package manager | pnpm workspaces + **catalogs** | Catalogs pin the versions that must not fork. `@tanstack/react-query` resolving to two versions across web and mobile silently breaks the shared `@claimdesk/api-client` hooks. `pnpm verify:workspace` enforces it. |
| Build orchestration | Turborepo | Already named in TDD §7. |
| Node linker | `hoisted` | **Required** — Metro does not follow pnpm's symlinked store. The cost is phantom dependencies, mitigated by `import-x/no-extraneous-dependencies` as an error everywhere. |
| Language | TypeScript 5.9 → **6.0** | Expo SDK 57 expects `~6.0.3`. TS 6 deprecates `baseUrl`, which tsup's DTS build synthesizes, so `ignoreDeprecations: "6.0"` is set in the shared base config. |
| API bundling | tsup, ESM | Inlining the `@claimdesk/*` workspace packages keeps the Docker runtime stage to real npm dependencies only. ESM with `moduleResolution: Bundler` avoids the `.js`-extension tax of `NodeNext`. |
| Validation | Zod | One schema set mirroring the OpenAPI constraints, shared so the mobile offline-draft validator and the server cannot drift. |
| DTOs | `openapi-typescript` from `design/06-api-contract.yaml` | The contract is the source of truth. `pnpm codegen:check` fails CI on drift. |
| Testing | Vitest (+ Testing Library) | `design/13-test-strategy.md` names layers, not tools. |
| Web UI | Tailwind v4 + TanStack Table v9 | TDD §18 requires data grids with row selection and **per-item** bulk results. |

## Consequences

- The docs describe `libs/` and `apps/worker`; the repository does not have them. This ADR is the reconciliation. TDD §7 and §17.1 should be amended or marked superseded.
- Architecture enforcement depends on lint configuration staying correct, which is why it has its own test.
- Node's `--experimental-loader` is required for OpenTelemetry auto-instrumentation under ESM; account for it in the container `CMD` when tracing is wired up.
