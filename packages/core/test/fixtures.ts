import type { SearchDeps } from "../src/analysis.ts";
import { type Position, parsePosition } from "../src/position.ts";

/** Test FENs are known good, so a rejection is a broken test, not a case to handle. */
export function parsed(fen: string): Position {
	const result = parsePosition(fen);
	if (!result.ok) throw new Error(`test FEN rejected: ${result.error}`);
	return result.position;
}

export const START = parsed(
	"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
);
// Black is mated by Qh5xf7 (scholar's mate).
export const SCHOLARS_MATE = parsed(
	"r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4",
);
// Black to move, not in check, with no legal move.
export const STALEMATE = parsed("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");

/**
 * A fake clock that moves on 1 ms each time it is read. Minimax reads it once per node it visits, so a
 * budget of N ms lets a search visit about N nodes, the same on every machine.
 */
export function ticking(): SearchDeps {
	let now = 0;
	return { clock: () => now++ };
}
