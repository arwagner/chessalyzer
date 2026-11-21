# chessalyzer

Edit and study chess search algorithms in a UI. TypeScript frontend and backend.

Work is done by [aint-farm](https://github.com/arwagner/aint-farm): label an issue `agent:explore`,
`agent:implement` or `agent:implement-spec`, or a PR `agent:review`. See `.factory.yml`.

The words used across code, issues and specs (position, search, trace, pruned, ...) are defined in
[GLOSSARY.md](GLOSSARY.md).

## Layout

npm workspaces:

- `packages/engine` (`@chessalyzer/engine`): pure TypeScript board, evaluation and search, on top of
  `chess.js`. No DOM or Node APIs.
- `packages/server` (`@chessalyzer/server`): Node HTTP API over the engine.
- `packages/web` (`@chessalyzer/web`): Vite + React UI.

The root `typecheck`, `lint` and `test` scripts cover all three; `npm test` is one Vitest run over every
package's project.

## Develop

```
npm ci
npm test
npm run typecheck
npm run lint
```

## Server

`npm start` runs the API on `127.0.0.1:3001` (override with `PORT`/`HOST`, or `--port <n>`).

`QUERY /api/search` takes a JSON body `{ fen, algorithm, depth, seed? }` (`algorithm` one the engine
implements, today `random` and `minimax`; `depth` an integer from 1 to 5) and returns the search result plus the
`seed` used; send that seed back to replay the same search. A bad body is a 400 with `{ "error": "..." }`,
other methods are a 405.
QUERY is the HTTP method for a safe, idempotent request with a body: `fetch(url, { method: "QUERY", body })`.

## Web

With the server running, `npm run dev -w @chessalyzer/web` serves the UI and forwards `/api` to
`127.0.0.1:3001`.
