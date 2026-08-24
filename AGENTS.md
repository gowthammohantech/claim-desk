# Working in this repo

Read [`README.md`](README.md) first for layout and commands. This file covers the things that are easy to get wrong.

## The specification wins

`design/` and `requirements/` are the source of truth. Before changing behaviour, check them — most questions are already answered, often with a decision record in `design/ADRs/`. If the code and a doc disagree, that is a bug in one of them; say which.

Where docs conflict with each other, the newer `design/` pack supersedes `requirements/TDD.md`. `design/gaps.md` supersedes both.

## Non-negotiables

**Money is integer paise.** Never a float, never rupees, never `Number.toFixed` arithmetic. `amountPaise`, `totalPaise`, `ratePaisePerKm`. Convert only at the render boundary with `formatPaise()`. INR is the only currency (ADR-010, GAP-019).

**Authorization is five checks, not one.** A permission alone never authorizes anything. `design/07-permission-matrix.md` §3 requires: active employee **and** permission **and** resource relationship **and** valid entity state **and** no segregation-of-duties conflict. `@claimdesk/domain/authz` has a helper for each. A claimant can never approve, finance-verify or mark paid their own claim — not even through a delegation.

**Firm policy never ships to a client.** The policy evaluator, workflow resolution and duplicate scoring are backend-only (`design/09-policy-engine-spec.md` §1). Clients consume *outcomes* via `POST /expenses/{id}/evaluate`. `packages/domain/src/index.test.ts` enforces this.

**Audit and outbox commit with the mutation.** Same MongoDB transaction, always. That is what makes the outbox reliable without a queue.

**No Redis, no BullMQ.** Background work is a Mongo `jobs` collection with lease/lock fields, fed by a transactional `outbox` (ADR-004, ADR-009). If you find yourself wanting a queue, read those two ADRs first.

## Backend layering

```
Controller  ->  UseCase  ->  Domain  <-  Port  <-  Adapter
  api/         application/   domain/    application/ports/   infrastructure/, integrations/
```

- `domain/` is **pure**: no Mongoose, no Express, no Azure SDK, no Node built-ins, no reaching outward. Invert with a port instead.
- Cross-module imports go through the sibling's `index.ts`. Never `../claim/application/...`, never `../claim/claim.module.js`.
- `platform/`, `jobs/` and `outbox/` must not know about any module.

All of this is enforced by lint. `apps/api/src/boundaries.test.ts` proves the enforcement is live — **if you change the boundaries config, run that test**, because the plugin fails silently when import resolution breaks and a green `pnpm lint` will lie to you.

## Where things go

| Adding | Goes in |
|---|---|
| An enum shared by API and clients | `packages/contracts/src/enums/` (+ update its count test) |
| Money, permission or state-machine logic | `packages/domain/` |
| A colour, spacing or type value | `packages/tokens/src/` — never hard-code in an app |
| A backend feature | `apps/api/src/modules/<name>/`, four layers |
| A background job | a `JobType` in contracts, a handler in the owning module, registered in `worker/registry.ts` |
| An external system | a port in `application/ports/`, an adapter in `src/integrations/` |
| A Finance/Admin screen | `apps/web/src/features/` + a route in `app/router.tsx` |
| An employee/approver screen | `apps/mobile/app/` (routes) + `src/features/` |

Never edit `packages/contracts/src/generated.ts` or `packages/tokens/dist/*.css` — regenerate with `pnpm codegen`.

## Surface boundaries

Web is **Finance, Admin and read-only Management/Auditor only**. It has no expense capture, no claim submission and no approvals. Employee and approver journeys are mobile (`requirements/03-FRD.md` §1.1). Do not add employee screens to web because it seems convenient.

Mobile is **offline-assisted, not offline-first**. Draft capture and upload retry work offline. Submit, approve, verify and pay always require the server — they need server-side authorization, state and policy validation (TDD §17.3).

## Before you finish

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm verify:workspace     # version drift, app-to-app deps
pnpm codegen:check        # generated output still matches its source
```

Add a dependency with `catalog:` if it is catalogued. In `apps/mobile`, install Expo packages with `npx expo install`, never by hand — the SDK pins those versions.
