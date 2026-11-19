import { type Position, parsePosition } from "../src/position.ts";

export const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
// Black is mated by Qh5xf7 (scholar's mate).
export const SCHOLARS_MATE =
	"r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4";
// Black to move, not in check, with no legal move.
export const STALEMATE = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";

/** Parses a FEN the test knows is valid, failing the test loudly if it is not. */
export function parsed(fen: string): Position {
	const result = parsePosition(fen);
	if (!result.ok) throw new Error(`test FEN rejected: ${result.error}`);
	return result.position;
}
