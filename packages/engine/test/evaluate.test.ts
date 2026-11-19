import { describe, expect, test } from "vitest";
import {
	evaluate,
	evaluateAtPly,
	MATE_SCORE,
	PIECE_VALUES,
	SCORE_BOUND,
} from "../src/evaluate.ts";
import { parsed, SCHOLARS_MATE, STALEMATE, START } from "./fixtures.ts";

describe("evaluate", () => {
	test("the start position is level", () => {
		expect(evaluate(START)).toBe(0);
	});

	test("White a queen up is +900", () => {
		expect(
			evaluate(
				parsed("rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
			),
		).toBe(900);
	});

	test("scores from White's point of view whoever is to move", () => {
		// Black is a rook and a knight up, White to move and Black to move.
		expect(
			evaluate(parsed("rn2k3/pppppppp/8/8/8/8/PPPPPPPP/4K3 w - - 0 1")),
		).toBe(-820);
		expect(
			evaluate(parsed("rn2k3/pppppppp/8/8/8/8/PPPPPPPP/4K3 b - - 0 1")),
		).toBe(-820);
	});

	test("Black checkmated scores the mate score for White", () => {
		expect(evaluate(SCHOLARS_MATE)).toBe(MATE_SCORE);
	});

	test("White checkmated scores the mate score against White", () => {
		// Fool's mate.
		expect(
			evaluate(
				parsed("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3"),
			),
		).toBe(-MATE_SCORE);
	});

	test("stalemate is 0 even with a queen up", () => {
		expect(evaluate(STALEMATE)).toBe(0);
	});

	test("other draws are 0", () => {
		// King and bishop against king: insufficient material.
		expect(evaluate(parsed("8/8/4k3/8/8/4KB2/8/8 w - - 0 1"))).toBe(0);
		// Fifty-move rule, a rook up.
		expect(evaluate(parsed("8/8/4k3/8/8/4K3/8/R7 w - - 100 80"))).toBe(0);
	});
});

describe("score constants", () => {
	test("the mate score is beyond any material evaluation", () => {
		const v = PIECE_VALUES;
		// Every piece a side could ever have, with all eight pawns promoted to queens.
		const most = 9 * v.q + 2 * v.r + 2 * v.b + 2 * v.n;
		expect(MATE_SCORE).toBeGreaterThan(most);
	});

	test("the bound is finite, JSON-safe and beyond the mate score", () => {
		expect(Number.isFinite(SCORE_BOUND)).toBe(true);
		expect(SCORE_BOUND).toBeGreaterThan(MATE_SCORE);
		expect(
			JSON.parse(JSON.stringify({ alpha: -SCORE_BOUND, beta: SCORE_BOUND })),
		).toEqual({
			alpha: -SCORE_BOUND,
			beta: SCORE_BOUND,
		});
	});
});

describe("evaluateAtPly", () => {
	const blackIsMated = parsed("R5k1/5ppp/8/8/8/8/8/6K1 b - - 1 1");
	const whiteIsMated = parsed("6k1/8/8/8/8/8/5PPP/r5K1 w - - 1 1");

	test("pulls a mate score toward zero by the distance to mate", () => {
		expect(evaluateAtPly(blackIsMated, 3)).toBe(MATE_SCORE - 3);
		expect(evaluateAtPly(whiteIsMated, 3)).toBe(-(MATE_SCORE - 3));
	});

	test("leaves a material score alone", () => {
		const queenUp = parsed("8/8/4k3/8/8/4K3/8/Q7 w - - 0 1");
		expect(evaluateAtPly(queenUp, 3)).toBe(PIECE_VALUES.q);
	});
});
