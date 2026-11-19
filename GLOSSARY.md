# Glossary

The words the code, tests, issues and specs in this repo use. When one of these appears in a name or a
comment, it means exactly this.

- **position**: a chess position as a [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
  string. Positions are passed around as FEN, not as board objects.
- **evaluation**: the static score of a position, without searching: an integer in centipawns, from White's
  point of view (positive is good for White). Material-only for now.
- **mate score**: the score given to a checkmated position. It is larger in magnitude than any material
  evaluation, positive when White has mated and negative when Black has, and is adjusted by the distance to
  mate so a faster mate scores better than a slower one.
- **algorithm**: a named search implementation, selected by name: `random`, `minimax` or `alphabeta`.
- **depth**: the number of plies (half-moves) left to search from a node. A node at depth 0 is scored by the
  evaluation instead of being expanded.
- **search**: running an algorithm on a position: `search(position, options) => SearchResult`, where
  `options` names at least the algorithm and depth. Pure and deterministic: the same input gives the same
  search result, trace included.
- **search result**: what a search returns: `bestMove` (the move chosen at the root), `score` (the root's
  score, from White's point of view) and `trace`.
- **trace**: the whole tree one search visited, as plain data, so the UI can replay the search step by step.
- **trace node**: one position in the trace, either visited or pruned. It records the position's FEN, the move
  that led to it, its depth, its window, its score and whether it was pruned.
- **window**: the alpha/beta bounds at a node, recorded both on entry and on exit. Minimax has no window to
  narrow, so its trace nodes record `null` for the window on entry and on exit.
- **pruned**: a move alpha-beta skipped after a cutoff. It is present in the trace as a trace node so the UI
  can show it, but it was never searched: it has no score and no children.
- **visited node count**: the number of trace nodes that are not pruned. Used to compare how much work
  algorithms did on the same position.
