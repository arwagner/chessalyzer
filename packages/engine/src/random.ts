import { evaluate } from "./evaluate.ts";
import { legalMoves, type Position, play } from "./position.ts";
import type { SearchOptions, SearchResult, TraceNode } from "./trace.ts";

/**
 * mulberry32: a tiny seeded PRNG giving floats in [0, 1). Written here rather than reaching for
 * `Math.random` so that the same seed replays the same search.
 */
export function mulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Picks one legal move uniformly at random and looks no further: the trace is the root plus one leaf per
 * legal move, and only the chosen leaf is scored because it is the only one the algorithm looked at. Depths
 * beyond 1 are accepted but search no deeper.
 */
export function random(
	position: Position,
	{ depth, seed }: SearchOptions,
): SearchResult {
	// Depth 0 means the root is scored, not expanded, as for every algorithm.
	const moves = depth === 0 ? [] : legalMoves(position);
	const chosen = Math.floor(mulberry32(seed)() * moves.length);
	const children: TraceNode[] = moves.map((san, i) => {
		const fen = play(position, san);
		return {
			id: i + 1,
			fen,
			move: san,
			depth: depth - 1,
			entry: null,
			exit: null,
			score: i === chosen ? evaluate(fen) : null,
			pruned: false,
			children: [],
		};
	});
	const best = children[chosen];
	const score = best?.score ?? evaluate(position);
	return {
		bestMove: best?.move ?? null,
		score,
		trace: {
			root: {
				id: 0,
				fen: position,
				move: null,
				depth,
				entry: null,
				exit: null,
				score,
				pruned: false,
				children,
			},
		},
	};
}
