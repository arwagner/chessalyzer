# Agents in chessalyzer

A TypeScript frontend and backend for editing and studying chess search algorithms (minimax, alpha-beta,
move ordering, transposition tables, ...) in a UI. Read README.md first.

Work arrives through aint-farm (arwagner/aint-farm): GitHub issues labelled `agent:explore`,
`agent:implement`, `agent:implement-spec` and PRs labelled `agent:review`. Issues and specs live on this
repo's GitHub issues.

## Checks

`npm ci`, `npm run typecheck`, `npm run lint` (Biome) and `npm test` (Vitest) must pass before every commit.
Node runs the TypeScript directly, so only erasable syntax: no enums, no namespaces, no parameter properties.

## How code is written here

- Test first, at a seam. Time, the network and the filesystem come in as parameters or deps, never reached
  for inside the code that uses them.
- Comments say why, not what.
- Search code is pure and deterministic given its inputs, so a search can be replayed and inspected step by
  step in the UI.

## Leave alone

`.factory.yml` and `.github/`. No AI attribution anywhere: no co-author trailers, no "generated with" lines.
