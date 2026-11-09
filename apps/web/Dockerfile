# Build from the repo root:  docker build -f apps/web/Dockerfile -t ailit-web .
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter web build

FROM base AS run
WORKDIR /app
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0
RUN groupadd -r app && useradd -r -g app app
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
USER app
EXPOSE 8080
# Committed migrations run on boot (prodMigrations in payload.config.ts).
CMD ["node", "apps/web/server.js"]
