# Build from the repo root:  docker build -f apps/web/Dockerfile -t ailit-web .
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter web build

# One-off admin tasks on a server (seed content, create the first admin). Has the full source and
# dev dependencies; used by the "tools" service in docker-compose.selfhost.yml, never served publicly.
FROM build AS tools
WORKDIR /repo/apps/web
ENTRYPOINT ["sh", "/repo/scripts/tools-entrypoint.sh"]

FROM base AS run
WORKDIR /app
ARG APP_VERSION=dev
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0 APP_VERSION=$APP_VERSION
RUN groupadd -r app && useradd -r -g app app
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
USER app
EXPOSE 8080
# The first boot runs migrations, so allow a generous start period.
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Committed migrations run on boot (prodMigrations in payload.config.ts).
CMD ["node", "apps/web/server.js"]
