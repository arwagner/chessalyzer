import { describe, expect, test } from "vitest";
import {
	EVALUATION_BOUND,
	MATE_EVALUATION,
	PIECE_VALUES,
	staticEvaluation,
	staticEvaluationAtPly,
} from "../src/evaluate.ts";
import { parsed, SCHOLARS_MATE, STALEMATE, START } from "./fixtures.ts";

describe("staticEvaluation", () => {
	test("the start position is level", () => {
		expect(staticEvaluation(START)).toBe(0);
	});

	test("White a queen up is +900", () => {
		expect(
			staticEvaluation(
				parsed("rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
			),
		).toBe(900);
	});

	test("evaluates from White's point of view whoever is to move", () => {
		// Black is a rook and a knight up, White to move and Black to move.
		expect(
			staticEvaluation(parsed("rn2k3/pppppppp/8/8/8/8/PPPPPPPP/4K3 w - - 0 1")),
		).toBe(-820);
		expect(
			staticEvaluation(parsed("rn2k3/pppppppp/8/8/8/8/PPPPPPPP/4K3 b - - 0 1")),
		).toBe(-820);
	});

	test("Black checkmated gets the mate evaluation for White", () => {
		expect(staticEvaluation(SCHOLARS_MATE)).toBe(MATE_EVALUATION);
	});

	test("White checkmated gets the mate evaluation against White", () => {
		// Fool's mate.
		expect(
			staticEvaluation(
				parsed("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3"),
			),
		).toBe(-MATE_EVALUATION);
	});

	test("stalemate is 0 even with a queen up", () => {
		expect(staticEvaluation(STALEMATE)).toBe(0);
	});

	test("other draws are 0", () => {
		// King and bishop against king: insufficient material.
		expect(staticEvaluation(parsed("8/8/4k3/8/8/4KB2/8/8 w - - 0 1"))).toBe(0);
		// Fifty-move rule, a rook up.
		expect(staticEvaluation(parsed("8/8/4k3/8/8/4K3/8/R7 w - - 100 80"))).toBe(
			0,
		);
	});
});

describe("evaluation constants", () => {
	test("the mate evaluation is beyond any material evaluation", () => {
		const v = PIECE_VALUES;
		// Every piece a side could ever have, with all eight pawns promoted to queens.
		const most = 9 * v.q + 2 * v.r + 2 * v.b + 2 * v.n;
		expect(MATE_EVALUATION).toBeGreaterThan(most);
	});

	test("the bound is finite, JSON-safe and beyond the mate evaluation", () => {
		expect(Number.isFinite(EVALUATION_BOUND)).toBe(true);
		expect(EVALUATION_BOUND).toBeGreaterThan(MATE_EVALUATION);
		expect(
			JSON.parse(
				JSON.stringify({ alpha: -EVALUATION_BOUND, beta: EVALUATION_BOUND }),
			),
		).toEqual({
			alpha: -EVALUATION_BOUND,
			beta: EVALUATION_BOUND,
		});
	});
});

describe("staticEvaluationAtPly", () => {
	const blackIsMated = parsed("R5k1/5ppp/8/8/8/8/8/6K1 b - - 1 1");
	const whiteIsMated = parsed("6k1/8/8/8/8/8/5PPP/r5K1 w - - 1 1");

	test("pulls a mate evaluation toward zero by the ply of the mate", () => {
		expect(staticEvaluationAtPly(blackIsMated, 3)).toBe(MATE_EVALUATION - 3);
		expect(staticEvaluationAtPly(whiteIsMated, 3)).toBe(-(MATE_EVALUATION - 3));
	});

	test("leaves a material evaluation alone", () => {
		const queenUp = parsed("8/8/4k3/8/8/4K3/8/Q7 w - - 0 1");
		expect(staticEvaluationAtPly(queenUp, 3)).toBe(PIECE_VALUES.q);
	});
});
