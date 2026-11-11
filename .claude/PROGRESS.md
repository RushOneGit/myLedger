# Progress

Updated: 2026-11-06

## Now

**Block 1 — Domain core and transactions** (in progress)

**Next action:** CRUD for accounts (cash only for manual creation, archive instead of delete, foreign account → 404).

> Keep this section current. "Next action" must be one concrete first step, not "continue block 1".

## Overview

| Block | Topic                               | Status         |
| ----- | ----------------------------------- | -------------- |
| 0     | Foundation                          | ✅ Done        |
| 1     | Domain core and transactions        | 🟡 In progress |
| 2     | Monobank sync (synchronous)         | ⬜             |
| 3     | RabbitMQ: backfill, webhook, outbox | ⬜             |
| 4     | Binance Excel/CSV import            | ⬜             |
| 5     | Categorization and transfers        | ⬜             |
| 6     | Reports and Redis                   | ⬜             |
| 7     | Docker, Kubernetes, deploy          | ⬜             |
| 8     | E2E, Vue, polish                    | ⬜             |

Dates are a guide, not a deadline: a block is closed only when it's fully done.

---

## Block 0 — Foundation ✅

- [x] GitHub repo, README, BACKLOG, `docs/decisions/` with ADR template
- [x] NestJS skeleton: strict TS, ESLint + Prettier, `src/modules/*`
- [x] `docker-compose.yml`: Postgres, Redis, RabbitMQ (management UI)
- [x] `ConfigModule` with env validation + `.env.example`
- [x] TypeORM: connection, first migration, run / revert
- [x] Health checks (`@nestjs/terminus`): db, redis, rabbitmq
- [x] Swagger: `/docs`, `/docs-json`, CLI plugin, disabled in production
- [x] Global `ValidationPipe`, unified error format, structured logs
- [x] Jest: scripts `test`, `test:int`, `test:e2e`
- [x] GitHub Actions: lint + unit on every PR, `main` protected

ADR: module structure and configuration → [ ] written

## Block 1 — Domain core and transactions 🟡

- [x] Entities: `User`, `Account`, `Category`, `Transaction`
- [x] `Money` value object
  - [x] Amount columns `numeric` without precision/scale
  - [x] `currencies` table + seed migration + FKs
  - [x] `CurrencyRegistry` (incl. Mono ISO numeric codes)
  - [x] Validation: format, known currency, decimals ≤ `max_scale`
  - [x] Unit tests
- [x] Authentication: login + tokens, global guard, closed by default
- [ ] CRUD accounts and manual cash transactions: DTOs, pagination, filters
- [ ] Repository pattern: domain services don't use TypeORM directly
- [ ] Balance = sum of transactions; save + balance update in one DB transaction
- [ ] Transfer between own cash accounts: two records, one DB transaction, rollback on error
- [ ] Optimistic locking (`@VersionColumn`) on `Account`
- [ ] Integration tests with Testcontainers: rollback, version conflict, 20 parallel requests
- [ ] Seed script with fake demo data

Done when: a broken rollback is caught by a test; 20 parallel updates of one account give the correct balance.

ADR: money storage; optimistic vs pessimistic locking; authentication approach → [ ] written

## Block 2 — Monobank sync, synchronous ⬜

Goal: transactions from my Mono cards for the last month arrive with one command, without duplicates.

## Block 3 — RabbitMQ: backfill, webhook, outbox ⬜

Goal: a year of Mono history loads in the background; new transactions arrive by webhook; no event is lost even when the broker is down.

## Block 4 — Binance Excel/CSV import ⬜

Goal: an uploaded Binance file is processed in the background; re-importing the same or overlapping file creates no duplicates; errors are visible per row.

## Block 5 — Categorization and transfers ⬜

Goal: every transaction gets a category automatically; a Mono → Binance transfer is not counted as spending.

## Block 6 — Reports and Redis ⬜

Goal: monthly reports come from cache, are fresh after every new transaction, and export to Excel.

## Block 7 — Docker, Kubernetes, deploy ⬜

Goal: MyLedger runs on a public HTTPS URL; every merge to `main` deploys automatically.

## Block 8 — E2E, Vue, polish ⬜

Goal: minimal UI, e2e tests for key flows, a README that lets a stranger run the project in under 15 minutes.

The full task list per block lives in the plan document; copy a block's tasks here when you start it.
