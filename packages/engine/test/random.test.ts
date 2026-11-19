import { describe, expect, test } from "vitest";
import { evaluate } from "../src/evaluate.ts";
import { play } from "../src/position.ts";
import { mulberry32 } from "../src/random.ts";
import { search } from "../src/search.ts";
import type { SearchOptions } from "../src/trace.ts";
import { parsed, SCHOLARS_MATE, STALEMATE, START } from "./fixtures.ts";

function randomly(seed: number): SearchOptions {
	return { algorithm: "random", depth: 1, seed };
}

describe("search with random", () => {
	test("from the start position the root has 20 children and bestMove is one of them", () => {
		const { bestMove, trace } = search(START, randomly(1));
		const moves = trace.root.children.map((c) => c.move);
		expect(moves).toHaveLength(20);
		expect(moves).toContain(bestMove);
	});

	test("the score is the evaluation after the chosen move, and only that child is scored", () => {
		const { bestMove, score, trace } = search(
			parsed("4k3/8/8/3q4/8/8/3Q4/4K3 b - - 0 1"),
			randomly(7),
		);
		if (bestMove === null) throw new Error("expected a move");
		const chosen = trace.root.children.filter((c) => c.score !== null);
		expect(chosen.map((c) => c.move)).toEqual([bestMove]);
		expect(score).toBe(evaluate(play(trace.root.fen, bestMove)));
		expect(trace.root.score).toBe(score);
	});

	test("ids are unique and assigned in visit order, children in move order", () => {
		const { trace } = search(START, randomly(3));
		expect(trace.root.id).toBe(0);
		expect(trace.root.children.map((c) => c.id)).toEqual(
			trace.root.children.map((_, i) => i + 1),
		);
		const moves = trace.root.children.map((c) => c.move ?? "");
		expect(moves).toEqual([...moves].sort());
	});

	test("the same seed twice gives deep-equal results", () => {
		expect(search(START, randomly(42))).toEqual(search(START, randomly(42)));
	});

	test("across a range of seeds more than one distinct move is picked", () => {
		const picked = new Set(
			Array.from(
				{ length: 50 },
				(_, seed) => search(START, randomly(seed)).bestMove,
			),
		);
		expect(picked.size).toBeGreaterThan(1);
	});

	test("a checkmated position has no best move", () => {
		const result = search(SCHOLARS_MATE, randomly(1));
		expect(result.bestMove).toBeNull();
		expect(result.trace.root.children).toEqual([]);
		expect(result.score).toBe(evaluate(SCHOLARS_MATE));
	});

	test("a stalemated position has no best move", () => {
		const result = search(STALEMATE, randomly(1));
		expect(result.bestMove).toBeNull();
		expect(result.trace.root.children).toEqual([]);
		expect(result.score).toBe(0);
	});

	test("the result survives a JSON round trip", () => {
		const result = search(START, randomly(5));
		expect(JSON.parse(JSON.stringify(result))).toStrictEqual(result);
	});

	test("depth 0 scores the root without expanding it", () => {
		const result = search(START, { algorithm: "random", depth: 0, seed: 1 });
		expect(result.bestMove).toBeNull();
		expect(result.trace.root.children).toEqual([]);
	});

	test("rejects a non-integer seed", () => {
		expect(() =>
			search(START, { algorithm: "random", depth: 1, seed: 0.5 }),
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
