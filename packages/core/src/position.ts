// The only module in core that touches chess.js, so the rest of core depends on this small
// interface and the board library can be swapped (or replaced by our own move generation) in one place.
import { Chess, validateFen } from "chess.js";

declare const validated: unique symbol;

/**
 * A FEN that `parsePosition` has accepted. Still a plain string, so it is JSON-safe and can go straight
 * into an analysis; the brand only stops unchecked strings reaching functions that assume a valid board.
 */
export type Position = string & { readonly [validated]: true };

export type ParseResult =
	| { readonly ok: true; readonly position: Position }
	| { readonly ok: false; readonly error: string };

export type Side = "w" | "b";

/** `draw` is any draw other than stalemate: fifty-move rule or insufficient material. */
export type Status = "ongoing" | "checkmate" | "stalemate" | "draw";

/** Bad input is an expected outcome here (the server passes user FENs straight in), so it never throws. */
export function parsePosition(fen: string): ParseResult {
	const check = validateFen(fen);
	if (!check.ok) {
		return {
			ok: false,
			error: `invalid FEN: ${check.error ?? "unrecognised"}`,
		};
	}
	// validateFen does not catch everything the constructor rejects (e.g. a missing king).
	try {
		return { ok: true, position: new Chess(fen).fen() as Position };
	} catch (e) {
		return {
			ok: false,
			error: `invalid FEN: ${e instanceof Error ? e.message : String(e)}`,
		};
	}
}

export function sideToMove(position: Position): Side {
	return board(position).turn();
}

/**
 * Legal moves in SAN, sorted by UTF-16 code unit. Sorting ourselves rather than relying on chess.js's
 * generation order keeps analyses reproducible across library versions; a plain sort (not localeCompare)
 * keeps them identical across machines.
 */
export function legalMoves(position: Position): string[] {
	return board(position).moves().sort();
}

/** `san` must be one of `legalMoves(position)`; anything else is a caller bug, so it throws. */
export function play(position: Position, san: string): Position {
	const chess = board(position);
	try {
		chess.move(san);
	} catch {
		throw new Error(`illegal move ${san} in ${position}`);
	}
	return chess.fen() as Position;
}

export function status(position: Position): Status {
	const chess = board(position);
	if (chess.isCheckmate()) return "checkmate";
	if (chess.isStalemate()) return "stalemate";
	// A lone FEN has no history, so threefold repetition cannot arise here.
	if (chess.isDraw()) return "draw";
	return "ongoing";
}

function board(position: Position): Chess {
	return new Chess(position);
}
