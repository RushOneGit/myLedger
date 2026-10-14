# myLedger

Monorepo managed with npm workspaces.

| Path      | What                                     |
| --------- | ---------------------------------------- |
| `server/` | NestJS API (strict TypeScript, CommonJS) |
| `client/` | Vue 3 app — _not added yet_              |

Shared Prettier and EditorConfig live at the root; each workspace owns its ESLint config.

## Getting started

Requires Node `>=22.22` (see `.nvmrc`) and npm 11.

```sh
npm install
npm run dev:server        # http://localhost:3000/api/health
```

## Scripts (root)

- `npm run lint` / `typecheck` / `test` / `build` — run across all workspaces
- `npm run format` / `format:check` — Prettier over the whole repo

## Server layout

```
server/src/
  main.ts            # bootstrap, global /api prefix
  app.module.ts      # imports feature modules
  modules/
    <feature>/       # one folder per feature: *.module.ts, *.controller.ts, *.service.ts, *.spec.ts
```

Generate a new feature with `npx nest g resource modules/<name>` from `server/`.

## Adding the Vue client

Scaffold it into `client/`, add `"client"` to `workspaces` in the root `package.json`,
and proxy `/api` to `http://localhost:3000` in its Vite config.

## Work with migrations

Lists migrations: [X] applied, [ ] not applied

```sh
npm run migration:show
```

Create clean migration:

```sh
npm run migration:create --name=create-empty-file
```

Example for migration:generate:

```sh
npm run migration:generate --name=create-user
```
