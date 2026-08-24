# ClaimDesk

Employee reimbursement claims for a professional-services firm.

- **Mobile** (Expo) — employees capture expenses and submit claims; approvers act on them.
- **Web** (React + Vite) — Finance verification, payments, master data, policy/workflow admin, reports, audit.
- **API** (Express + MongoDB) — modular monolith. One image runs both the HTTP server and the background worker.

The specification lives in [`design/`](design/) and [`requirements/`](requirements/); the design prototype is [`reference/ClaimDesk_Mobile_v2.html`](reference/ClaimDesk_Mobile_v2.html). **Those documents are the source of truth** — this codebase implements them.

---

## Quick start

```bash
pnpm install
pnpm codegen            # contracts from the OpenAPI spec, tokens from the prototype
pnpm dev:api            # http://localhost:4000/v1/health
pnpm dev:web            # http://localhost:5173
pnpm dev:mobile         # Expo
```

The API boots without a database — `/v1/health` reports `"mongo": "skipped"`. For anything that persists:

```bash
pnpm infra:up           # MongoDB (single-node replica set) + Azurite
```

The replica set is not optional: claim submission commits the claim transition and the first approval task in **one transaction**, and MongoDB has no transactions on a standalone `mongod`.

## Layout

```
apps/
  api/        Express + worker. ROLE=api | worker | migrate selects the runtime.
  web/        Finance / Admin / Auditor portal. No employee or approver screens.
  mobile/     Employee + Approver in one binary. Approvals tab is permission-gated.
packages/
  contracts/  Enums + DTOs generated from design/06-api-contract.yaml
  domain/     Money, authorization, claim state machine, validation schemas
  api-client/ Typed fetch shared by web and mobile
  tokens/     "Clear Ledger" design tokens -> Tailwind theme AND React Native theme
  config-ts/  config-eslint/
infrastructure/  docker/ bicep/ scripts/
tools/           scaffold-modules.mjs, verify-workspace.mjs
```

`apps/api/src/modules/<name>/` all share one shape:

```
domain/          entities + invariants — pure, zero I/O
application/     use cases; application/ports/ holds the interfaces
infrastructure/  Mongoose models + repository implementations
api/             controllers + routes
<name>.module.ts wiring   index.ts  the only legal cross-module import
```

## The rules that are actually enforced

| Rule | Enforced by |
|---|---|
| Controller → UseCase → Domain → Port ← Adapter | `boundaries/dependencies` |
| Domain imports no driver or provider SDK | `no-restricted-imports`, scoped by path |
| Cross-module imports go through `index.ts` only | file categories in the boundaries config |
| Money is integer paise, INR only | `@claimdesk/domain` money module + its tests |
| No firm policy logic in client code | `packages/domain/src/index.test.ts` |
| One version of React and TanStack Query | `pnpm verify:workspace` |
| Generated code matches its source | `pnpm codegen:check` |

> **`pnpm lint` passing is not proof the architecture rules work.**
> `eslint-plugin-boundaries` fails *silently* when it cannot resolve an import — every policy passes and nothing is enforced. That happened during this scaffold. [`apps/api/src/boundaries.test.ts`](apps/api/src/boundaries.test.ts) writes deliberate violations and asserts they are rejected. Keep it green.

## Commands

| | |
|---|---|
| `pnpm lint` / `typecheck` / `test` / `build` | the full pipeline, via Turborepo |
| `pnpm codegen` | regenerate contracts + tokens |
| `pnpm codegen:check` | fail if generated output drifted from source |
| `pnpm openapi:lint` | validate the API contract |
| `pnpm verify:workspace` | catalog use, singleton versions, no app-to-app deps |
| `pnpm test:integration` | needs `pnpm infra:up` first |
| `pnpm --filter @claimdesk/mobile doctor` | Expo/monorepo health |

## Conventions

- **Money** is an integer number of paise everywhere — API, database, domain. `formatPaise()` converts at the render boundary and nowhere else. INR only.
- **Timestamps** are stored UTC; clients render local.
- **Idempotency**: every mutating command takes an `Idempotency-Key`; `@claimdesk/api-client` adds one automatically.
- **409 is not retryable.** It means the claim or task moved on — refetch and re-present. The first valid terminal decision wins.
- **Async work** runs on a MongoDB `jobs` collection plus a transactional `outbox`. There is no Redis and no BullMQ, by decision (ADR-004, ADR-009).
- **Never log** receipt binaries, tokens, full bank account numbers or secrets. The logger's redaction list enforces the common cases.

## Known gaps

Carried over from the specification, not introduced here:

- The OpenAPI `Admin` tag has **zero paths** — no endpoints exist for `policy:manage`, `workflow:manage` or `master:manage`, though the permission matrix and collections do.
- `/v1/health` is **not in the contract**, but the test strategy forbids undocumented production endpoints. Either document it or move liveness/readiness to the ops port.
- Web sign-in (W-001) still says SSO, while `gaps.md` GAP-002 mandates mobile + OTP. Unresolved **for web**.
- Delegation is "out of current scope" in the workflow spec, yet the collection, both screens and the permission all exist. Scaffolded, flagged post-MVP.
- `design/05-reimbursement.dbml` omits several collections that `04-data-model.md` defines.
- The `jobs` collection is used by the worker but is not in the data model's collection list.
- The API contract has no per-operation summaries (88 Redocly warnings); see [`redocly.yaml`](redocly.yaml).
