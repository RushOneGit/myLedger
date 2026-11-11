# Domain Model

## Relationships

```
User 1 ──── * Account 1 ──── * Transaction * ──── 0..1 Category
  │                                 │                     ▲
  └──────────── * Category ─────────┼─────────────────────┘ (user's own; system ones have no owner)
                                    │
                      Transaction 0..1 ── 0..1 Transaction   (transfer pair, Block 5)

currencies ◄── accounts.currency_code              (required)
currencies ◄── transactions.original_currency_code (nullable)
```

Foreign keys always live on the "many" side (many-to-one). Inverse one-to-many relations are optional and never eager.

## Entities

### User

| Field         | Notes                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| id            |                                                                                                              |
| email         | unique                                                                                                       |
| password hash | never selected by default, never returned or logged                                                          |
| created at    |                                                                                                              |
| time_zone     | _planned, Block 6_: IANA name (e.g. `Europe/Kyiv`), used for server-side grouping by day or month in reports |

Users are created by a CLI command. No public registration.

### Account

| Field         | Notes                                                                |
| ------------- | -------------------------------------------------------------------- |
| id            |                                                                      |
| user          | many-to-one, required                                                |
| name          | the only field editable via API                                      |
| type          | `MONO` / `BINANCE` / `CASH`                                          |
| currency_code | FK → `currencies.code`; immutable after creation                     |
| external_id   | Mono account id; for Binance the asset (e.g. `USDT`); empty for cash |
| balance       | `numeric`; changes only together with a transaction                  |
| archived      | accounts are archived, never deleted                                 |
| version       | optimistic locking                                                   |
| timestamps    | `timestamptz` (UTC)                                                  |

Unique: `(type, external_id)` for synced accounts.
Only CASH accounts are created via API; MONO / BINANCE come from sync and import.

### Category

| Field    | Notes                                                     |
| -------- | --------------------------------------------------------- |
| id       |                                                           |
| user     | nullable: empty = system category                         |
| name     |                                                           |
| kind     | `EXPENSE` / `INCOME`                                      |
| archived | archived, never deleted; transactions keep their category |

"Transfer" is **not** a category; it's a kind of transaction.

### Transaction

| Field                                   | Notes                                                                                                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                                      |                                                                                                                                                             |
| account                                 | many-to-one, required                                                                                                                                       |
| amount                                  | `numeric` string, signed or per the ADR; in the **account's** currency                                                                                      |
| occurred_at                             | `timestamptz`; when the money moved (Mono: Unix seconds; cash: a moment with an offset sent by the client). Date filters and default sorting use this field |
| created_at                              | when the row was saved                                                                                                                                      |
| description                             | the bank's text, saved as is                                                                                                                                |
| category                                | nullable                                                                                                                                                    |
| category set manually                   | flag; rules never overwrite a manual choice                                                                                                                 |
| mcc                                     | from Mono; nullable                                                                                                                                         |
| kind                                    | `INCOME` / `EXPENSE` / `TRANSFER`                                                                                                                           |
| transfer pair                           | nullable self-reference (or a `transfers` table, decided in Block 5)                                                                                        |
| source                                  | `MANUAL` / `MONO` / `BINANCE_IMPORT`                                                                                                                        |
| external_id                             | bank id or hash of an import row; empty for manual                                                                                                          |
| original_amount, original_currency_code | only when the operation currency differs from the account currency                                                                                          |
| raw payload                             | optional `jsonb` copy of what was received; for debugging only, never logged                                                                                |

Unique: `(source, external_id)`.

### Currency

| Field                  | Example                                               |
| ---------------------- | ----------------------------------------------------- |
| code (PK, natural key) | `UAH`, `BTC`                                          |
| name                   |                                                       |
| kind                   | `FIAT` / `CRYPTO`                                     |
| max_scale              | 2 for fiat, 18 for crypto                             |
| iso_numeric            | `980` for UAH (Mono format); empty for crypto; unique |
| symbol                 | `₴`                                                   |

Reference data, created by a seed migration.

## Invariants

| Rule                                                        | Enforced by                                                                                                       |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| No floating point for money anywhere                        | `numeric` columns, `Money`                                                                                        |
| Amount has no more decimals than the currency allows        | `Money` (+ optional CHECK ≤ 18)                                                                                   |
| Transaction currency = account currency                     | Model: no currency column on transactions                                                                         |
| No duplicate from one source                                | DB unique `(source, external_id)`                                                                                 |
| Balance changes only together with a transaction            | One DB transaction                                                                                                |
| Concurrent balance updates don't get lost                   | Optimistic locking on `Account`                                                                                   |
| Synced amount and date are read-only                        | Service rule + explicit API error                                                                                 |
| A transaction's category is a system one or the same user's | Domain logic                                                                                                      |
| Every query filters by the current user                     | Services; user id only from auth context                                                                          |
| All timestamps are moments in UTC                           | `timestamptz` columns                                                                                             |
| The server never guesses a time zone                        | Filters take ISO-8601 moments with an offset, half-open `[from, to)`; reports use the user's IANA zone (ADR-0010) |

## Data flow

1. **Structure**: user → accounts (cash manually; Mono from client info; Binance per asset on import) → categories (seeded + own).
2. **Facts arrive**: manual API, Mono sync/webhook, Binance import. Saved with amount, date, account, source, external id; usually no category yet. Balance updated in the same DB transaction.
3. **Meaning is added**: the categorizer sets a category (user rule → MCC → uncategorized); the matcher links transfer pairs.
4. **Reports read**: grouped by category / month / account, excluding transfers; cached; exported to Excel.
