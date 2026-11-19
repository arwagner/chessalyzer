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
 * The score of a checkmate, from the mated side's opponent's point of view. Far beyond any material
 * total, so that searches which subtract the distance to mate still rank every mate above any material.
 */
export const MATE_SCORE = 100_000;

/**
 * Stands in for infinity in alpha/beta windows. `Infinity` serialises to `null` in JSON, which would
 * corrupt traces sent to the UI; this finite bound is larger than any score a search can return.
 */
export const SCORE_BOUND = 1_000_000;

/** Static, material-only evaluation in centipawns from White's point of view. */
export function evaluate(position: Position): number {
	switch (status(position)) {
		case "checkmate":
			return sideToMove(position) === "w" ? -MATE_SCORE : MATE_SCORE;
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
	let score = 0;
	for (const ch of position.slice(0, position.indexOf(" "))) {
		const piece = ch.toLowerCase();
		if (!(piece in PIECE_VALUES)) continue;
		const value = PIECE_VALUES[piece as keyof typeof PIECE_VALUES];
		score += ch === piece ? -value : value;
	}
	return score;
}
