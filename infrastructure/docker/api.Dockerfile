# syntax=docker/dockerfile:1

# One image, two roles. `ROLE=api` serves HTTP; `ROLE=worker` runs the Mongo
# job and outbox pollers. They deploy as separate Azure Container Apps and
# scale independently (design/12-deployment-architecture.md §2).

# ─── build ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable

WORKDIR /repo

# Manifests first so the dependency layer caches independently of source.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY tsconfig.base.json ./
COPY packages/config-ts/package.json      packages/config-ts/
COPY packages/config-eslint/package.json  packages/config-eslint/
COPY packages/contracts/package.json      packages/contracts/
COPY packages/domain/package.json         packages/domain/
COPY packages/api-client/package.json     packages/api-client/
COPY packages/tokens/package.json         packages/tokens/
COPY apps/api/package.json                apps/api/

RUN pnpm install --frozen-lockfile --filter @claimdesk/api...

COPY packages/ packages/
COPY apps/api/ apps/api/
COPY design/06-api-contract.yaml design/06-api-contract.yaml

RUN pnpm --filter @claimdesk/api... build

# ─── runtime ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
RUN corepack enable && apk add --no-cache tini

ENV NODE_ENV=production
WORKDIR /app

# tsup inlines the @claimdesk/* workspace packages into dist/, so the runtime
# only has to resolve real npm dependencies — no `pnpm deploy` gymnastics under
# the hoisted node-linker.
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/apps/api/package.json ./package.json
COPY --from=builder /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml /repo/.npmrc /tmp/ws/

RUN cp /tmp/ws/pnpm-lock.yaml /tmp/ws/pnpm-workspace.yaml /tmp/ws/.npmrc . \
  && pnpm install --prod --ignore-scripts --no-frozen-lockfile \
  && rm -f pnpm-lock.yaml pnpm-workspace.yaml .npmrc \
  && rm -rf /tmp/ws /root/.local/share/pnpm/store

USER node
EXPOSE 4000 9464

# tini reaps zombies and forwards SIGTERM, which the graceful shutdown needs.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
