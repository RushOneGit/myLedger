# Backlog

Ideas and postponed decisions. **Nothing here is worked on until the current block is closed.**

## After MVP (in priority order)

1. **Shared budget with a partner**: a monthly limit per category, two people spending at once. Row locks, isolation levels, concurrency tests. The partner connects their own Mono token.
2. **Notifications**: "budget at 80%" via Telegram or email, as a RabbitMQ consumer.
3. **Net worth**: daily snapshots of total capital; converting crypto to UAH (historical rates).
4. **Month closing**: no changes in a closed period; state machine.
5. **Azure as a second Terraform target**: proves portability.
6. **React client** for the same API.

## Decisions postponed to a specific block

| Topic                                                              | Decide in                             | Notes                                                                                                                                                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transfer pairs: pointer on both rows vs separate `transfers` table | Block 5                               | A separate table has no half-linked state and can store fee and rate                                                                                                                                                      |
| Where the Vue client stores tokens                                 | Block 8                               | Access token in memory; refresh token location is the real trade-off (XSS)                                                                                                                                                |
| Mono webhook verification                                          | Block 3                               | Check Mono docs for a signature; otherwise a secret in the URL, and treat the payload as a hint to sync                                                                                                                   |
| Production stores for auth without sessions                        | Before Block 7                        | Refresh token store is required; check "The store contract" / "Production checklist" in the NestJS auth docs                                                                                                              |
| Cursor pagination                                                  | When offset gets slow                 | Offset is enough for the MVP                                                                                                                                                                                              |
| `users.time_zone` (IANA)                                           | Block 6                               | Needed for server-side `GROUP BY` day/month with `AT TIME ZONE`; offsets can't express DST. Optional `tz` query override validated with `@IsTimeZone()`. Check Postgres knows `Europe/Kyiv` (older tzdata: `Europe/Kiev`) |
| Binance CSV time zone                                              | Block 4                               | Confirm on a real export that the time column is UTC before parsing                                                                                                                                                       |
| `user_id` denormalized on `transactions`                           | Block 6, only after `EXPLAIN ANALYZE` | Needs a composite FK to stay consistent                                                                                                                                                                                   |

## Small ideas

- CHECK constraint on amount columns: at most 18 decimal places (if not added yet)
- "Reset to automatic" for a manually set category
- A separate user note field, so the bank's description is never overwritten
- Report: effective exchange rate on foreign-currency purchases vs the official rate
- Category hierarchy (two levels: Food → Restaurants)
- Splitting an amount into parts with remainder (money allocation)
- Mono "jars" as accounts
- Per-transaction UTC offset (like ezBookkeeping's `TimezoneUtcOffset`), to show the local time where a purchase happened while travelling
- Several Binance wallets (Spot / Funding / Earn): composite external id such as `spot:USDT`
- Docker Compose `full` profile to run API + worker in containers (README convenience)
- Disable Husky in the production Docker build (devDependencies are not installed there)
- Unarchive accounts: today an archived account is visible only in `GET /accounts?archivedFlag=true`; every other route returns 404. Decide what `GET /accounts/:id` returns for archived accounts, add `POST /accounts/:id/unarchive` (name may clash with an active account → 409 from `UQ_accounts_user_id_name`)
