# AI Literacy Platform

Impact Thinklab's AI literacy platform. Phase 1 serves teens (SMP and SMA/SMK): learning tracks, a safe AI
Lab, and the AILIS test. Product spec: https://claude.ai/artifact/8RocWT7u4XMYV92D5PmExD

## Stack

- **apps/web** — Next.js 15 + Payload CMS 3 (admin at `/admin`), PostgreSQL, Bahasa Indonesia / English
- **packages/shared** — roles, curriculum constants, locales
- **packages/ai-gateway** — the only path to AI models (guardrails, Safety Shield, quotas, logs)
- **packages/test-engine** — AILIS item bank, forms and scoring, kept separate for the independent test body
- **infra/terraform** — Cloud Run + Cloud SQL + Secret Manager in Jakarta (`asia-southeast2`)

## Run locally

```bash
docker compose up -d            # or any PostgreSQL 16
cp .env.example apps/web/.env   # set PAYLOAD_SECRET
pnpm install
pnpm dev                        # http://localhost:3000, admin at /admin
```

The first visit to `/admin` creates the first super admin.

## Checks

```bash
pnpm typecheck
pnpm test        # integration tests need a database: TEST_DATABASE_URI (default ailit_test)
pnpm build
```

## Database changes

Development pushes schema changes automatically. Before merging a schema change, create a migration:

```bash
pnpm --filter web payload migrate:create <name>
pnpm generate    # refresh payload-types.ts and the admin import map
```

Staging and production apply committed migrations on boot.

## Content model (Sprint 0)

| Collection | Purpose |
| --- | --- |
| users | One account per person; 10 roles; parental consent status |
| schools | School, NPSN, level, licence seats and dates |
| classes | Class per academic year, teachers, students, auto join code |
| tracks → units → lessons | Learning tree; units carry a big idea; lessons have drafts, scheduling, revisions and a review state |
| media | Images, PDFs, video; S3-compatible storage in staging/production |
