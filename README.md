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
