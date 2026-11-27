import { describe, expect, test } from "vitest";
import type { SearchOptions, SearchResult } from "../src/analysis.ts";
import { MATE_EVALUATION, staticEvaluation } from "../src/evaluate.ts";
import { type Position, play } from "../src/position.ts";
import { mulberry32 } from "../src/random.ts";
import { search } from "../src/search.ts";
import {
	parsed,
	SCHOLARS_MATE,
	STALEMATE,
	START,
	ticking,
} from "./fixtures.ts";

function randomly(seed: number): SearchOptions {
	return { algorithm: "random", budgetMs: 100, seed };
}

function searchRandomly(position: Position, seed: number): SearchResult {
	return search(position, randomly(seed), ticking());
}

describe("search with random", () => {
	test("from the start position the root has 20 children and the chosen move is one of them", () => {
		const { chosenMove, analysis } = searchRandomly(START, 1);
		const moves = analysis.root.children.map((c) => c.move);
		expect(moves).toHaveLength(20);
		expect(moves).toContain(chosenMove);
	});

	test("the evaluation is the static evaluation after the chosen move, and only that child is evaluated", () => {
		const { chosenMove, evaluation, analysis } = searchRandomly(
			parsed("4k3/8/8/3q4/8/8/3Q4/4K3 b - - 0 1"),
			7,
		);
		if (chosenMove === null) throw new Error("expected a move");
		const chosen = analysis.root.children.filter((c) => c.evaluation !== null);
		expect(chosen.map((c) => c.move)).toEqual([chosenMove]);
		expect(evaluation).toBe(
			staticEvaluation(play(analysis.root.fen, chosenMove)),
		);
		expect(analysis.root.evaluation).toBe(evaluation);
	});

	test("a mate it happens to pick is evaluated by its ply, as minimax evaluates it", () => {
		// Back-rank mate: Ra8# for White. Seeds are tried until one picks it, so the test does not rest on
		// one seed's choice.
		const position = parsed("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1");
		const mating = Array.from({ length: 200 }, (_, seed) =>
			searchRandomly(position, seed),
		).find((r) => r.chosenMove === "Ra8#");
		if (mating === undefined) throw new Error("no seed picked the mate");
		expect(mating.evaluation).toBe(MATE_EVALUATION - 1);
	});

	test("ids are unique and assigned in visit order, children in move order", () => {
		const { analysis } = searchRandomly(START, 3);
		expect(analysis.root.id).toBe(0);
		expect(analysis.root.children.map((c) => c.id)).toEqual(
			analysis.root.children.map((_, i) => i + 1),
		);
		const moves = analysis.root.children.map((c) => c.move ?? "");
		expect(moves).toEqual([...moves].sort());
	});

	test("the same seed twice gives deep-equal results", () => {
		expect(searchRandomly(START, 42)).toEqual(searchRandomly(START, 42));
	});

	test("across a range of seeds more than one distinct move is picked", () => {
		const picked = new Set(
			Array.from(
				{ length: 50 },
				(_, seed) => searchRandomly(START, seed).chosenMove,
			),
		);
		expect(picked.size).toBeGreaterThan(1);
	});

	test("a checkmated position has no chosen move", () => {
		const result = searchRandomly(SCHOLARS_MATE, 1);
		expect(result.chosenMove).toBeNull();
		expect(result.analysis.root.children).toEqual([]);
		expect(result.evaluation).toBe(staticEvaluation(SCHOLARS_MATE));
	});

	test("a stalemated position has no chosen move", () => {
		const result = searchRandomly(STALEMATE, 1);
		expect(result.chosenMove).toBeNull();
		expect(result.analysis.root.children).toEqual([]);
		expect(result.evaluation).toBe(0);
	});

	test("the result survives a JSON round trip", () => {
		const result = searchRandomly(START, 5);
		expect(JSON.parse(JSON.stringify(result))).toStrictEqual(result);
	});

	test("a drawn root is a leaf at search depth 0, though it has legal moves", () => {
		const bareKings = parsed("8/8/4k3/8/8/4K3/8/8 w - - 0 1");
		const result = searchRandomly(bareKings, 1);
		expect(result.chosenMove).toBeNull();
		expect(result.analysis.root.depth).toBe(0);
		expect(result.analysis.root.children).toEqual([]);
	});

	test("an ongoing root is searched to depth 1 whatever the budget", () => {
		for (const budgetMs of [1, 1e9]) {
			const { analysis } = search(
				START,
				{ algorithm: "random", budgetMs, seed: 1 },
				ticking(),
			);
			expect(analysis.root.depth).toBe(1);
		}
	});

	test("never reads the clock", () => {
		const result = search(START, randomly(1), {
			clock: () => {
				throw new Error("read the clock");
			},
		});
		expect(result.chosenMove).not.toBeNull();
	});

	test("rejects a non-integer seed", () => {
		expect(() =>
			search(
				START,
				{ algorithm: "random", budgetMs: 100, seed: 0.5 },
				ticking(),
			),
		).toThrow(RangeError);
	});
});

describe("mulberry32", () => {
	test("is a pure function of its seed and stays in [0, 1)", () => {
		const a = mulberry32(9);
		const b = mulberry32(9);
		for (let i = 0; i < 100; i++) {
			const x = a();
			expect(x).toBe(b());
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x).toBeLessThan(1);
		}
	});
});
