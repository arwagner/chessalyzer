import { type Position, sideToMove, status } from "./position.ts";

/** Centipawns. The king has no material value: both sides always have exactly one. */
export const PIECE_VALUES = {
	p: 100,
	n: 320,
	b: 330,
	r: 500,
	q: 900,
	k: 0,
} as const;

/**
 * The magnitude of the mate evaluation: `staticEvaluation` gives +MATE_EVALUATION when White has mated and
 * -MATE_EVALUATION when Black has. Far beyond any material total, so that once a search adjusts it by the
 * ply of the mate, every mate still ranks above any material.
 */
export const MATE_EVALUATION = 100_000;

/**
 * Stands in for infinity in alpha/beta windows. `Infinity` serialises to `null` in JSON, which would
 * corrupt analyses sent to the UI; this finite bound is larger than any evaluation a search can return.
 */
export const EVALUATION_BOUND = 1_000_000;

/** Material-only, in centipawns from White's point of view. */
export function staticEvaluation(position: Position): number {
	switch (status(position)) {
		case "checkmate":
			return sideToMove(position) === "w" ? -MATE_EVALUATION : MATE_EVALUATION;
		case "stalemate":
		case "draw":
			return 0;
		case "ongoing":
			return material(position);
	}
}

// Reads the FEN's placement field directly: a validated FEN's piece letters are exactly the pieces on the
// board, so there is no need to go through the board library.
function material(position: Position): number {
	let total = 0;
	for (const ch of position.slice(0, position.indexOf(" "))) {
		const piece = ch.toLowerCase();
		if (!(piece in PIECE_VALUES)) continue;
		const value = PIECE_VALUES[piece as keyof typeof PIECE_VALUES];
		total += ch === piece ? -value : value;
	}
	return total;
}

/**
 * `staticEvaluation` for a node `ply` half-moves below the root. Mate evaluations are pulled toward zero by
 * the ply of the mate, so a search prefers the faster of two mates (and, when being mated, the slower one).
 */
export function staticEvaluationAtPly(position: Position, ply: number): number {
	const evaluation = staticEvaluation(position);
	if (evaluation === MATE_EVALUATION) return evaluation - ply;
	if (evaluation === -MATE_EVALUATION) return evaluation + ply;
	return evaluation;
}
