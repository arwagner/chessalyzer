import { evaluateAtPly } from "./evaluate.ts";
import {
	legalMoves,
	type Position,
	play,
	sideToMove,
	status,
} from "./position.ts";
import type { SearchResult, TraceNode } from "./trace.ts";

// Minimax scores every node it touches, so its nodes never carry the null score of a pruned node.
type ScoredNode = TraceNode & { readonly score: number };

/** Depth-limited minimax: White maximises, Black minimises, and every node visited is in the trace. */
export function minimax(position: Position, depth: number): SearchResult {
	// The counter lives in this call, not the module, so every search numbers its nodes from 0.
	let nextId = 0;

	function visit(
		fen: Position,
		move: string | null,
		remaining: number,
		ply: number,
	): ScoredNode {
		const id = nextId++;
		const leaf = { id, fen, move, depth: remaining, entry: null, exit: null };
		if (remaining === 0 || status(fen) !== "ongoing") {
			return {
				...leaf,
				score: evaluateAtPly(fen, ply),
				pruned: false,
				children: [],
			};
		}
		const children = legalMoves(fen).map((san) =>
			visit(play(fen, san), san, remaining - 1, ply + 1),
		);
		const scores = children.map((c) => c.score);
		const score =
			sideToMove(fen) === "w" ? Math.max(...scores) : Math.min(...scores);
		return { ...leaf, score, pruned: false, children };
	}

	const root = visit(position, null, depth, 0);
	// The first child in move order with the root's score, so ties break the same way every run.
	const best = root.children.find((c) => c.score === root.score);
	return {
		bestMove: best?.move ?? null,
		score: root.score,
		trace: { root },
	};
}
