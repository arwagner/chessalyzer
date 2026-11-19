import { describe, expect, test } from "vitest";
import {
	legalMoves,
	parsePosition,
	play,
	sideToMove,
	status,
} from "../src/position.ts";

import { parsed, SCHOLARS_MATE, STALEMATE, START } from "./fixtures.ts";

// King against king: a draw that is neither mate nor stalemate.
const BARE_KINGS = "8/8/4k3/8/8/4K3/8/8 w - - 0 1";

describe("parsePosition", () => {
	test("accepts a valid FEN", () => {
		const result = parsePosition(START);
		expect(result).toEqual({ ok: true, position: START });
	});

	test.each([
		["garbage", "not a fen"],
		["empty", ""],
		["too few ranks", "8/8/8/8/8/8/8 w - - 0 1"],
		["no kings", "8/8/8/8/8/8/8/8 w - - 0 1"],
		[
			"bad side to move",
			"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1",
		],
	])(
		"returns an error result for an invalid FEN (%s) instead of throwing",
		(_, fen) => {
			const result = parsePosition(fen);
			expect(result.ok).toBe(false);
			if (!result.ok) expect(result.error).toMatch(/invalid FEN/);
		},
	);
});

describe("sideToMove", () => {
	test("reads the side to move", () => {
		expect(sideToMove(parsed(START))).toBe("w");
		expect(sideToMove(parsed(SCHOLARS_MATE))).toBe("b");
	});
});

describe("legalMoves", () => {
	test("lists the 20 opening moves sorted by SAN", () => {
		const moves = legalMoves(parsed(START));
		expect(moves).toHaveLength(20);
		expect(moves).toEqual([...moves].sort());
		expect(moves.slice(0, 3)).toEqual(["Na3", "Nc3", "Nf3"]);
	});

	test("comes back in the same order on repeated calls", () => {
		const fen =
			"r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
		const first = legalMoves(parsed(fen));
		for (let i = 0; i < 5; i++) {
			expect(legalMoves(parsed(fen))).toEqual(first);
		}
		expect(first).toHaveLength(48);
	});

	test("is empty at checkmate and stalemate", () => {
		expect(legalMoves(parsed(SCHOLARS_MATE))).toEqual([]);
		expect(legalMoves(parsed(STALEMATE))).toEqual([]);
	});
});

describe("play", () => {
	test("returns the position after the move", () => {
		expect(play(parsed(START), "e4")).toBe(
			"rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
		);
	});

	test("leaves the original position unchanged", () => {
		const start = parsed(START);
		play(start, "e4");
		expect(legalMoves(start)).toHaveLength(20);
	});

	test("rejects an illegal move", () => {
		expect(() => play(parsed(START), "e5")).toThrow(/illegal move/);
	});
});

describe("status", () => {
	test.each([
		["ongoing", START],
		["checkmate", SCHOLARS_MATE],
		["stalemate", STALEMATE],
		["draw", BARE_KINGS],
	])("reports %s", (expected, fen) => {
		expect(status(parsed(fen))).toBe(expected);
	});
});
