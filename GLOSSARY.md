# Glossary

The words the code, tests, issues and specs in this repo use. When one of these appears in a name or a
comment, it means exactly this.

## Board

**Position**:
A chess position, written as a [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
string. Positions are passed around as FEN, not as board objects.
_Avoid_: board, state

**Move**:
One legal move from a position, written in SAN.
_Avoid_: action, UCI move

**Side to move**:
White or Black: the side whose turn it is in a position.
_Avoid_: turn, colour, player

**Game status**:
Whether a position is ongoing, checkmate, stalemate or draw. Here "draw" means any draw other than
stalemate: the fifty-move rule or insufficient material.
_Avoid_: result, outcome, game over

## Evaluation

**Evaluation**:
How good a position is: an integer in centipawns, from White's point of view (positive is good for White).
A position's evaluation comes either from the position alone (static evaluation) or from searching its
children.
_Avoid_: score, value

**Static evaluation**:
The evaluation of a position from the position alone, without searching. Material-only for now.
_Avoid_: eval, heuristic

**Mate evaluation**:
The evaluation given to a checkmated position. It is larger in magnitude than any material evaluation,
positive when White has mated and negative when Black has, and is adjusted by the ply of the mate so a
faster mate is better than a slower one.
_Avoid_: mate score

## People

**Editor**:
The person who uses chessalyzer: composes engines, runs them on positions, and maintains suites of
exemplars.
_Avoid_: user, builder, researcher

## Engines and search

**Engine**:
A chess search an editor builds by composing components, then runs on positions to study how it behaves.
_Avoid_: bot, AI, player

**Component**:
One composable building block of an engine. Engines differ by which components they combine. (Open: whether
components split into kinds, such as steps and patterns, is not yet decided.)
_Avoid_: module, plugin, feature

**Algorithm**:
A named, well-known engine that an editor can start from and change, such as random, minimax or
alpha-beta. Changing it gives a new engine, not a new algorithm.
_Avoid_: preset, template

**Node**:
A position reached during a search, by one move from its parent node. In an analysis, a node records its
position, the move that led to it, its depth, its window, its evaluation and whether it was pruned.
_Avoid_: branch, vertex

**Root**:
The node a search starts from: the position being searched.

**Leaf**:
A node given its static evaluation instead of being expanded: at depth 0, or with any game status other
than ongoing.

**Ply**:
A node's distance from the root in half-moves. The root is ply 0.
_Avoid_: level, height

**Depth**:
The number of plies left to search from a node. A node at depth 0 is a leaf.

**Search depth**:
The depth of the root: how far a search looks ahead. Chosen by the engine, not given to it.

**Search**:
Running an engine on a position for a given search budget. Deterministic given its inputs, the clock among
them: the same position, engine, budget, seed and clock readings give the same search result, analysis
included.

**Seed**:
An integer a search is given so it can be replayed exactly. Engines that make random choices, such as
random, draw them from it; others ignore it.
_Avoid_: random state

**Search budget**:
How long an engine is given to search a position, in time. The engine decides how deep to go within it,
and must finish within it.
_Avoid_: time limit, timeout, time control

**Search result**:
What a search returns: the chosen move (the move the engine would play at the root), the root's evaluation
and the analysis.
_Avoid_: best move

## Analysis

**Analysis**:
Everything one search by an engine produces: every variation the search looked at, plus other
information such as assertions about specific positions. Replayable step by step in the UI.
_Avoid_: trace, log

**Variation**:
A line of moves in an analysis, from the root down to a node. An analysis's variations branch off one
another where they share a starting sequence. There is not always a single best variation.
_Avoid_: line, branch, path, principal variation, PV

**Assertion**:
A claim about a subject in a specific position, made by one of an engine's components during a search,
recorded in the analysis along with the component that made it. For example, that the bishop on f3 is
bad, or that a transposition table has seen the position before.
_Avoid_: event, finding, note

**Claim**:
What an assertion says about its subject, drawn from a fixed vocabulary: for example, bad.
_Avoid_: tag, label, annotation

**Subject**:
What an assertion is about, within its position: a piece, a square, a move, or the whole position.
_Avoid_: target, object

**Window**:
The alpha/beta bounds at a node, recorded both on entry and on exit. Minimax has no window to narrow, so its
nodes record none.

**Pruned node**:
A node skipped after a cutoff. It is present in the analysis so the UI can show it, but it was never
searched: it has no evaluation and no children.
_Avoid_: pruned move

**Visited node count**:
The number of nodes in an analysis that are not pruned: how many variations the search looked at. On a
single exemplar, of two engines that pass the same number of checks, the one with the lower visited node
count is better.

## Exemplars

**Exemplar**:
A position together with the checks an editor has specified for it. An engine passes an exemplar when its
analysis of that position satisfies every check. A search that overruns its search budget fails every
check of its exemplar.
_Avoid_: puzzle, test case, problem, study position

**Check**:
One thing an exemplar requires an engine's analysis of its position to contain. For example, that the
analysis includes the variation Bxf7 Kxf7 d4, or that it asserts the bishop on f3 is bad in a given
position. Checks only say what must be there, never what must not.
_Avoid_: test, expectation, criterion

**Suite**:
A named collection of exemplars that an editor maintains, for running engines over and comparing them.
_Avoid_: study, set, benchmark, collection

**Suite run**:
Running one or more engines over every exemplar in a suite with one search budget chosen for the run,
giving each engine's passed checks and visited node count per exemplar. On a single exemplar, the better
engine passes more checks, or the same number with a lower visited node count. Over the suite, the better
engine is the one that is better on more exemplars.
_Avoid_: benchmark, test run
