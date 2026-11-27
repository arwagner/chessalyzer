# Search budgets are time, not nodes

An engine is told how long to search a position and decides its own depth. We measure that search budget
in time rather than in visited nodes, because time is how engines are really constrained, and an engine
that does more useful work per second should benefit from it. A search that overruns its budget fails
every check of its exemplar.

## Considered Options

- **Node budget** (at most N visited nodes): fully reproducible on every machine, but it hides the cost of
  expensive components, such as a slow static evaluation, that a node count does not see.
- **Wall-clock time read inside the search**: rejected, since a search could then never be replayed.

## Consequences

- Search stays deterministic only given its inputs, with the clock counted as one of them. The clock is
  passed in, so tests and replays can use a fake one; real runs are not reproducible.
- The same suite run can give different pass/fail results on a slower or busier machine. Comparisons
  between engines mean most when they come from the same run on the same machine.
- Visited node count is still recorded, and breaks ties between engines that pass the same number of
  checks on an exemplar.
