# MyLedger — Project Brief

## What

A personal finance ledger that brings together:

| Source       | How data arrives                                   |
| ------------ | -------------------------------------------------- |
| **Monobank** | Personal API: sync + webhook                       |
| **Binance**  | Excel/CSV export files, imported in the background |
| **Cash**     | Entered manually through the API                   |

It answers: _how much do I have, where did it go, how much did I spend by category this month?_

## Why

The main goal is **learning**, not the product. I want to understand, by building it end to end:

- PostgreSQL transactions, locking, concurrency
- Message queues (RabbitMQ): ack, retry, dead-letter queues, transactional outbox
- Caching with Redis and cache invalidation
- Authentication with access and refresh tokens
- Testing: unit, integration (Testcontainers), e2e
- Docker, Kubernetes, CI/CD, infrastructure as code

The product is useful to me, which keeps me motivated. But when "faster" and "understood" conflict, **understood wins**.

## Users

- **Me** (one user in the MVP)
- Later: my family (shared budget). Allowed by Monobank's rules for personal API use.
- **No public registration.** Users are created by a CLI command.

## External constraints

| Constraint                                                                       | Consequence                                                      |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Monobank personal API: 1 request per 60 s, statement period max 31 days + 1 hour | History backfill goes through a queue in 31-day chunks           |
| Monobank personal API is for personal / family use only                          | No service for strangers; otherwise the provider API is required |
| Binance exports: several file types, period limits, possible overlaps            | One parser per file type; idempotent import with deduplication   |
| Free hosting only                                                                | Oracle Cloud Always Free VM (k3s) + Neon free Postgres           |

## MVP scope

1. Accounts (Mono, Binance, cash) and manual cash transactions
2. Monobank sync (backfill + webhook)
3. Binance Excel/CSV import
4. Automatic categorization (user rules, MCC) with manual override
5. Detection of transfers between own accounts (not counted as spending)
6. Monthly reports, Excel export
7. Deployed on a public HTTPS URL with CI/CD

Crypto is shown **separately in USDT**, without conversion to UAH.

## Not in the MVP

Shared budget, notifications, net worth over time, month closing, multi-currency conversion, second cloud target, React client. See [`BACKLOG.md`](BACKLOG.md).

## Architecture

```
Vue SPA ──HTTP──► NestJS API ─────────────► PostgreSQL ◄── outbox table
                    │   │                        ▲             │
                    │   └── cache ──► Redis      │             ▼
                    │                            │       Outbox relay
 Mono webhook ──────┤                            │             │
                    └── jobs ──► RabbitMQ ◄──────┼─────────────┘
                                    │            │
                                    ▼            │
                                 Worker ─────────┘
                       (Mono backfill, Binance import,
                        categorization, report export)
```

- **Modular monolith**: one codebase, modules per domain area
- **Worker**: second process from the same codebase, consumes RabbitMQ
- **Facts first, meaning later**: a transaction is saved as a fact (amount, date, source); category and transfer links are added afterwards and may change
- **Write side and read side separate**: entry points write transactions; reports only read

## Stack

| Layer    | Choice                                                                    |
| -------- | ------------------------------------------------------------------------- |
| Backend  | NestJS, TypeScript (strict), TypeORM                                      |
| Data     | PostgreSQL (prod: Neon free), Redis                                       |
| Queue    | RabbitMQ                                                                  |
| Frontend | Vue 3, minimal                                                            |
| Infra    | Docker, k3d locally, k3s on Oracle Always Free, Terraform, GitHub Actions |

## Success criteria

- Every technology above is used for a real reason, not as a checkbox
- Each block ends with an ADR explaining decisions and mistakes
- I can explain every non-trivial part of the code at an interview
- Someone without context can run the project from the README in under 15 minutes
