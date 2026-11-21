import type { Position } from "./position.ts";

export type Algorithm = "random" | "minimax" | "alphabeta";

export type SearchOptions = {
	readonly algorithm: Algorithm;
	/** Plies to search below the root; 0 scores the root by evaluation alone. */
	readonly depth: number;
	/** Seeds the PRNG of algorithms that choose at random, so the same seed replays the same search. */
	readonly seed: number;
};

/** Alpha/beta bounds. Finite (see `SCORE_BOUND`) so a trace survives JSON. */
export type Window = {
	readonly alpha: number;
	readonly beta: number;
};

export type TraceNode = {
	/** Unique within its trace, assigned in the order the search visited nodes. */
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
	readonly score: number | null;
	readonly pruned: boolean;
	/** In move order (`legalMoves` order). */
	readonly children: readonly TraceNode[];
};

export type Trace = {
	readonly root: TraceNode;
};

export type SearchResult = {
	/** null when the root is not expanded: depth 0 or the game is already over. */
	readonly bestMove: string | null;
	/** The root's score, from White's point of view. */
	readonly score: number;
	readonly trace: Trace;
};

/** One algorithm. `search` validates the options before calling it. */
export type SearchAlgorithm = (
	position: Position,
	options: SearchOptions,
) => SearchResult;

/**
 * The child a node's score came from: the first in move order, not pruned, whose score equals the node's.
 * One rule for the engine's best move and for anything reading a trace afterwards, since the trace records
 * scores and not the pick itself.
 */
export function chosenChild(node: TraceNode): TraceNode | undefined {
	if (node.score === null) return undefined;
	return node.children.find((c) => !c.pruned && c.score === node.score);
}
