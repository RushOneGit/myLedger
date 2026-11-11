# CLAUDE.md

Guidance for Claude (Claude Code or chat) working in this repository.

## Project in one paragraph

**MyLedger** is a personal finance ledger: Monobank (personal API), Binance (Excel/CSV import) and cash, in one place. It is a **learning project**: the goal is to understand backend technologies through a full development cycle (NestJS, PostgreSQL transactions, RabbitMQ, Redis, Docker/Kubernetes, CI/CD, testing), not to ship a perfect product fast.

- What and why → [`BRIEF.md`](BRIEF.md)
- Where we are now → [`PROGRESS.md`](PROGRESS.md)
- Session notes → [`DEVLOG.md`](DEVLOG.md)
- Parked ideas → [`BACKLOG.md`](BACKLOG.md)
- Entities and invariants → [`docs/domain-model.md`](docs/domain-model.md)
- Decisions → [`docs/decisions/`](docs/decisions/)

## How to help me (important)

This is a learning project. Whether you write code depends on the zone:

| Zone         | Topics                                                                                                                                                                         | What you do                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Learning** | DB transactions and locking, RabbitMQ (ack/retry/DLQ), transactional outbox, auth tokens and refresh rotation, Redis caching and invalidation, Kubernetes manifests, Terraform | **Do not write the implementation unless I explicitly say "write it".** Explain concepts, ask guiding questions, point to official docs, review code I wrote. When I'm stuck, give the next small step, not the whole solution |
| **Known**    | CRUD controllers, DTOs, entities, Vue components                                                                                                                               | You may generate code. Keep diffs small; I review every line                                                                                                                                                                   |
| **Chores**   | Seed data, test fixtures, renames, boilerplate config                                                                                                                          | Do it fully                                                                                                                                                                                                                    |

When unsure which zone a task is in, ask.

In every answer:

- Explain **why**, not only what.
- If my code breaks a rule in "Domain rules" below, say so explicitly.
- Prefer official docs as sources; say when something is your assumption.

## Stack

NestJS + TypeScript (strict) · TypeORM · PostgreSQL · Redis · RabbitMQ · Jest + Testcontainers · Swagger · Vue 3 (minimal, later) · Docker · k3d / k3s · Terraform · GitHub Actions

Architecture: **modular monolith** + a **worker** process from the same codebase (second entrypoint, consumes RabbitMQ). No microservices.

## Commands

> Verify these match `package.json`; adjust if script names differ.

```bash
docker compose up -d            # Postgres, Redis, RabbitMQ (UI: http://localhost:15672)
npm run start:dev               # API with watch (NestJS runs in the terminal, not in Docker)
npm run lint
npm test                        # unit
npm run test:int                # integration (Testcontainers, needs Docker)
npm run test:e2e
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:run
npm run migration:revert
npm run migration:show
```

Swagger: `http://localhost:3000/docs` (disabled in production).

## Domain rules (never break these)

**Money**

- Amount columns are `numeric` **without** precision/scale. Postgres silently rounds values that exceed a declared scale.
- In entities, amounts are `string`. **Never** pass money through `Number()` or `parseFloat()`.
- Business logic uses the `Money` value object (amount + currency). An invalid `Money` cannot be created.
- `currencies` table (PK `code`) holds `max_scale` per currency; `CurrencyRegistry` caches it in memory.

**Currency**

- A transaction's currency is its **account's** currency. Transactions have no main currency column.
- `original_amount` + `original_currency_code` are filled only when the operation currency differs (e.g. paying in PLN with a UAH card).

**Ownership and auth**

- The current user comes **only** from the auth context (`@CurrentUser()`), never from body, query or path.
- Every query on user data filters by that user. Another user's resource → **404**, not 403.
- Every route is protected by default; open routes are marked `@Public()`.

**Transactions and balance**

- Saving a transaction and updating the account balance happen in **one DB transaction**.
- `Account` uses optimistic locking (`@VersionColumn`).
- Synced transactions (source MONO / BINANCE_IMPORT): amount and date are **read-only**; only category (and notes) can change. Requests that try to change them get an explicit error.
- Duplicates are prevented by the DB: `UNIQUE(source, external_id)`.

**Categories**

- `category_id` is nullable: uncategorized is a normal state.
- A manual category choice sets a flag; automatic rules never overwrite it.

**Lifecycle**

- Accounts and categories are **archived**, not deleted.
- Only manual transactions can be deleted.

**API**

- One DTO per operation (create / update / list query), never the entity as a DTO.
- Never accept `userId`, `balance`, `source`, `externalId` from the client.
  **Time (ADR-0010)**
- Timestamps are `timestamptz`, i.e. moments stored in UTC. A calendar day only has boundaries relative to a time zone, so the server never guesses one.
- Date-range filters take ISO-8601 moments **with an offset** (`2026-11-01T00:00:00+02:00` or `...Z`). Values without `Z`/`±hh:mm` (e.g. a bare `2026-11-01`) are rejected with 400. The client converts its local days to moments, the same model as the Stripe and Monobank APIs.
- Ranges are half-open: `>= from AND < to`. Never `BETWEEN` or `<= 23:59:59`.
- Filter and sort transactions on `operation_date` (when the money moved), not `created_at` (when the row was saved; a backfill inserts a year of history in one day).
- Manual transactions are created with a full moment including an offset, not a bare date.
- No hard-coded zone (`Europe/Kyiv`, `+02:00`) in server code. Server-side grouping by day or month (reports, Block 6) uses the user's IANA time zone (`users.time_zone`, planned) with `AT TIME ZONE`, because an offset can't express daylight saving time.

## Database

- `synchronize: false`. Schema changes **only** through migrations.
- Never edit a migration that has already been applied; add a new one.
- Read generated migration SQL before running it.

## Security

- The Monobank token is stored encrypted and **never** appears in logs, fixtures or commits.
- Secrets come from env, validated at startup by `ConfigModule`. `.env` is git-ignored; `.env.example` is kept in sync.
- Test fixtures and demo data are **fake**. No real financial data in the repo.

## Conventions

- Tests: unit for domain logic (`Money`, rules), integration with Testcontainers for DB and RabbitMQ, e2e for HTTP flows.
- Commits: conventional style with the reason, e.g. `feat(accounts): archive instead of delete (ADR-0007)`.
- Each block ends with an ADR in `docs/decisions/`.
- New ideas mid-block go to `BACKLOG.md`, not into code.
