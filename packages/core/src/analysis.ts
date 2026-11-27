import type { Position } from "./position.ts";

export type Algorithm = "random" | "minimax" | "alphabeta";

export type SearchOptions = {
	readonly algorithm: Algorithm;
	/**
	 * The search budget in milliseconds of the clock the search is given. The engine picks its own search
	 * depth within it.
	 */
	readonly budgetMs: number;
	/** Seeds the PRNG of algorithms that choose at random, so the same seed replays the same search. */
	readonly seed: number;
};

/**
 * Milliseconds since some fixed origin, never decreasing. A search reads time only through this, so with a
 * fake clock it is deterministic and can be replayed exactly.
 */
export type Clock = () => number;

export type SearchDeps = {
	readonly clock: Clock;
};

/** Alpha/beta bounds. Finite (see `EVALUATION_BOUND`) so an analysis survives JSON. */
export type Window = {
	readonly alpha: number;
	readonly beta: number;
};

export type Node = {
	/** Unique within its analysis, assigned in the order the search visited nodes. */
	readonly id: number;
	readonly fen: Position;
	/** SAN of the move that led here; null at the root. */
	readonly move: string | null;
	/** Plies left to search from this node. */
	readonly depth: number;
	/** null for algorithms without a window, such as minimax. */
	readonly entry: Window | null;
	readonly exit: Window | null;
	/** From White's point of view; null when pruned, since a pruned node was never searched. */
	readonly evaluation: number | null;
	readonly pruned: boolean;
	/** In move order (`legalMoves` order). */
	readonly children: readonly Node[];
};

export type Analysis = {
	/** Its depth is the search depth the engine chose. */
	readonly root: Node;
};

export type SearchResult = {
	/** null when the root is not expanded: the game is already over, or the budget ran out before depth 1. */
	readonly chosenMove: string | null;
	/** The root's evaluation, from White's point of view. */
	readonly evaluation: number;
	readonly analysis: Analysis;
};

/** One algorithm. `search` validates the options before calling it. */
export type SearchAlgorithm = (
	position: Position,
	options: SearchOptions,
	deps: SearchDeps,
) => SearchResult;

/**
 * The child a node's evaluation came from: the first in move order, not pruned, whose evaluation equals the
 * node's. One rule for the engine's chosen move and for anything reading an analysis afterwards, since the
 * analysis records evaluations and not the pick itself.
 */
export function chosenChild(node: Node): Node | undefined {
	if (node.evaluation === null) return undefined;
	return node.children.find(
		(c) => !c.pruned && c.evaluation === node.evaluation,
	);
}
