import type { Node, SearchAlgorithm } from "./analysis.ts";
import { staticEvaluation, staticEvaluationAtPly } from "./evaluate.ts";
import { legalMoves, play, status } from "./position.ts";

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
 * Picks one legal move uniformly at random and looks no further: the analysis is the root plus one leaf per
 * legal move, and only the chosen leaf is evaluated because it is the only one the algorithm looked at.
 * One evaluation is far within any budget, so it neither reads the clock nor searches deeper.
 */
export const random: SearchAlgorithm = (position, { seed }) => {
	// A game-over root is a leaf, so it has no children and a search depth of 0, as for every algorithm.
	const moves = status(position) === "ongoing" ? legalMoves(position) : [];
	const depth = moves.length === 0 ? 0 : 1;
	const chosen = Math.floor(mulberry32(seed)() * moves.length);
	const children: Node[] = moves.map((san, i) => {
		const fen = play(position, san);
		return {
			id: i + 1,
			fen,
			move: san,
			depth: 0,
			entry: null,
			exit: null,
			evaluation: i === chosen ? staticEvaluationAtPly(fen, 1) : null,
			pruned: false,
			children: [],
		};
	});
	const pick = children[chosen];
	const evaluation = pick?.evaluation ?? staticEvaluation(position);
	return {
		chosenMove: pick?.move ?? null,
		evaluation,
		analysis: {
			root: {
				id: 0,
				fen: position,
				move: null,
				depth,
				entry: null,
				exit: null,
				evaluation,
				pruned: false,
				children,
			},
		},
	};
};
