# Architecture Decision Records

One file per decision: `NNNN-short-title.md`, based on [`0000-template.md`](0000-template.md).

**Write each ADR from memory first**, then check it against notes or the plan. If you can't explain a decision without looking, it's not learned yet.

## Index

| #    | Decision                                                                                                                                                                                      | Block | Status       |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------ |
| 0001 | Modular monolith + worker process from the same codebase; NestJS in the terminal, infra in Docker                                                                                             | 0     | ⬜ to write  |
| 0002 | Configuration: env validated at startup, `.env.example` kept in sync                                                                                                                          | 0     | ⬜ to write  |
| 0003 | Unified error format, domain errors mapped to HTTP in one filter, request id in logs and responses                                                                                            | 0     | ⬜ to write  |
| 0004 | Money: `numeric` without precision/scale (no silent rounding), `Money` value object, never float                                                                                              | 1     | ⬜ to write  |
| 0005 | Currency only on `Account`; `currencies` reference table with natural key `code`, `max_scale`, `iso_numeric`                                                                                  | 1     | ⬜ to write  |
| 0006 | Authentication: `@nestjs/authentication`, bearer access token + rotating refresh token, closed by default, no public registration                                                             | 1     | ⬜ to write  |
| 0007 | Synced transactions: amount and date read-only; archive instead of delete for accounts and categories                                                                                         | 1     | ⬜ to write  |
| 0008 | Optimistic vs pessimistic locking for balance updates                                                                                                                                         | 1     | ⬜ to decide |
| 0009 | Offset pagination for MVP                                                                                                                                                                     | 1     | ⬜ to write  |
| 0010 | Time: `timestamptz` (UTC); date filters take moments with an offset from the client, half-open; no server-side default zone; user IANA zone for reports (replaces "Kyiv-time day boundaries") | 1     | ⬜ to write  |

Add new rows as decisions come up. Superseded ADRs stay in the folder; only their status changes.
