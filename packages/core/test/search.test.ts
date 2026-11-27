import { describe, expect, test } from "vitest";
import type { Node, SearchOptions } from "../src/analysis.ts";
import { MATE_EVALUATION } from "../src/evaluate.ts";
import { IMPLEMENTED_ALGORITHMS, search } from "../src/search.ts";
import { parsed, START, ticking } from "./fixtures.ts";

function* walk(node: Node): Generator<Node> {
	yield node;
	for (const child of node.children) yield* walk(child);
}

function minimax(budgetMs: number): SearchOptions {
	return { algorithm: "minimax", budgetMs, seed: 0 };
}

// Back-rank mates: Ra8# for White, Ra1# for Black.
const WHITE_MATES_IN_ONE = parsed("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1");
const BLACK_MATES_IN_ONE = parsed("r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1");

// With the ticking clock, these budgets let minimax finish passes to depth 1 and to depth 3 from the
// mate-in-one positions: about 20 nodes at depth 1, a few thousand at depth 3.
const SHALLOW = 100;
const DEEP = 3000;

describe("search with minimax", () => {
	for (const [budgetMs, depth] of [
		[SHALLOW, 1],
		[DEEP, 3],
	] as const) {
		test(`finds White's mate in 1 at search depth ${depth}`, () => {
			const result = search(WHITE_MATES_IN_ONE, minimax(budgetMs), ticking());
			expect(result.analysis.root.depth).toBe(depth);
			expect(result.chosenMove).toBe("Ra8#");
			expect(result.evaluation).toBe(MATE_EVALUATION - 1);
		});

		test(`finds Black's mate in 1 at search depth ${depth}`, () => {
			const result = search(BLACK_MATES_IN_ONE, minimax(budgetMs), ticking());
			expect(result.analysis.root.depth).toBe(depth);
			expect(result.chosenMove).toBe("Ra1#");
			expect(result.evaluation).toBe(-(MATE_EVALUATION - 1));
		});
	}

	test("prefers a mate in 1 over a slower mate", () => {
		// Qg7# mates at once; quiet queen moves lead to slower mates once the search is deep enough.
		const result = search(
			parsed("7k/8/5K2/8/8/8/8/6Q1 w - - 0 1"),
			minimax(DEEP),
			ticking(),
		);
		expect(result.analysis.root.depth).toBeGreaterThanOrEqual(3);
		expect(result.chosenMove).toBe("Qg7#");
		expect(result.evaluation).toBe(MATE_EVALUATION - 1);
		const slowerMate = result.analysis.root.children.find(
			(c) => c.evaluation === MATE_EVALUATION - 3,
		);
		expect(slowerMate).toBeDefined();
	});

	test("Black minimises: it takes the free queen", () => {
		const result = search(
			parsed("4k3/8/8/3q4/8/8/3Q4/4K3 b - - 0 1"),
			minimax(SHALLOW),
			ticking(),
		);
		expect(result.analysis.root.depth).toBe(1);
		expect(result.chosenMove).toBe("Qxd2+");
		expect(result.evaluation).toBe(-900);
	});

	test("at search depth 1 the start position's root has 20 children", () => {
		const { analysis } = search(START, minimax(30), ticking());
		expect(analysis.root.depth).toBe(1);
		expect(analysis.root.children).toHaveLength(20);
		expect(analysis.root.move).toBeNull();
		expect(analysis.root.fen).toBe(START);
		for (const child of analysis.root.children) {
			expect(child.depth).toBe(0);
			expect(child.children).toEqual([]);
			expect(child.evaluation).toBe(0);
		}
	});

	test("children are in move order and the root takes the chosen child's evaluation", () => {
		const { analysis, evaluation } = search(START, minimax(500), ticking());
		const moves = analysis.root.children.map((c) => c.move ?? "");
		expect(moves).toEqual([...moves].sort());
		expect(evaluation).toBe(analysis.root.evaluation);
	});

	test("ids are unique and assigned in visit order", () => {
		const { analysis } = search(START, minimax(500), ticking());
		expect(analysis.root.depth).toBe(2);
		const ids = [...walk(analysis.root)].map((n) => n.id);
		expect(ids).toEqual(ids.map((_, i) => i));
		// 20 replies to each of White's 20 first moves, plus the root.
		expect(ids).toHaveLength(1 + 20 + 400);
	});

	test("no node is pruned and none has a window", () => {
		const { analysis } = search(WHITE_MATES_IN_ONE, minimax(DEEP), ticking());
		for (const node of walk(analysis.root)) {
			expect(node.pruned).toBe(false);
			expect(node.evaluation).not.toBeNull();
			expect(node.entry).toBeNull();
			expect(node.exit).toBeNull();
		}
	});

	test("a game-over root is a leaf at search depth 0 and has no chosen move", () => {
		const mated = parsed("R5k1/5ppp/8/8/8/8/8/6K1 b - - 1 1");
		const result = search(mated, minimax(DEEP), ticking());
		expect(result.chosenMove).toBeNull();
		expect(result.evaluation).toBe(MATE_EVALUATION);
		expect(result.analysis.root.depth).toBe(0);
		expect(result.analysis.root.children).toEqual([]);
	});

	test("running the same search on the same clock readings gives deep-equal results", () => {
		expect(search(WHITE_MATES_IN_ONE, minimax(DEEP), ticking())).toEqual(
			search(WHITE_MATES_IN_ONE, minimax(DEEP), ticking()),
		);
	});

	test("the result survives a JSON round trip", () => {
		const result = search(BLACK_MATES_IN_ONE, minimax(DEEP), ticking());
		expect(JSON.parse(JSON.stringify(result))).toStrictEqual(result);
	});
});

describe("minimax within a search budget", () => {
	test("a bigger budget buys a deeper search", () => {
		const depths = [30, 500].map(
			(budgetMs) =>
				search(START, minimax(budgetMs), ticking()).analysis.root.depth,
		);
		expect(depths).toEqual([1, 2]);
	});

	test("stops reading the clock once the budget is spent", () => {
		const readings: number[] = [];
		const { clock } = ticking();
		search(START, minimax(500), {
			clock: () => {
				const now = clock();
				readings.push(now);
				return now;
			},
		});
		const spent = Math.max(...readings) - Math.min(...readings);
		expect(spent).toBe(500);
	});

	test("a budget too small for depth 1 evaluates the root alone", () => {
		const result = search(START, minimax(1), ticking());
		expect(result).toEqual({
			chosenMove: null,
			evaluation: 0,
			analysis: {
				root: {
					id: 0,
					fen: START,
					move: null,
					depth: 0,
					entry: null,
					exit: null,
					evaluation: 0,
					pruned: false,
					children: [],
				},
			},
		});
	});

	test("stops deepening once a pass reaches the end of every variation", () => {
		// White's only move, Kxb2, leaves bare kings: a draw, so depth 1 already sees the whole tree.
		const onlyMoveDraws = parsed("k7/8/8/8/8/8/1r6/K7 w - - 0 1");
		const result = search(onlyMoveDraws, minimax(1e9), ticking());
		expect(result.analysis.root.depth).toBe(1);
		expect(result.chosenMove).toBe("Kxb2");
		expect(result.evaluation).toBe(0);
	});

	test("searches as deep as the clock allows, not as fast as the machine runs", () => {
		// A clock that jumps the whole budget on its second reading ends the search during the depth 1 pass.
		const readings = [0, 1000];
		const result = search(START, minimax(1000), {
			clock: () => readings.shift() ?? 1000,
		});
		expect(result.analysis.root.depth).toBe(0);
	});
});

describe("search", () => {
	test.each([
		["a zero", 0],
		["a negative", -1],
		["a NaN", Number.NaN],
		["an infinite", Number.POSITIVE_INFINITY],
	])("rejects %s budget", (_, budgetMs) => {
		expect(() => search(START, minimax(budgetMs), ticking())).toThrow(
			RangeError,
		);
	});

	test("lists exactly the algorithms it can run", () => {
		expect(IMPLEMENTED_ALGORITHMS).toEqual(["random", "minimax"]);
	});

	test("rejects an algorithm that has no implementation yet", () => {
		expect(() =>
			search(
				START,
				{ algorithm: "alphabeta", budgetMs: 100, seed: 0 },
				ticking(),
			),
		).toThrow(/alphabeta/);
	});
});
