import { describe, expect, test } from "vitest";
import { MATE_SCORE } from "../src/evaluate.ts";
import { search } from "../src/search.ts";
import type { TraceNode } from "../src/trace.ts";
import { parsed, START } from "./fixtures.ts";

function* walk(node: TraceNode): Generator<TraceNode> {
	yield node;
	for (const child of node.children) yield* walk(child);
}

// Back-rank mates: Ra8# for White, Ra1# for Black.
const WHITE_MATES_IN_ONE = parsed("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1");
const BLACK_MATES_IN_ONE = parsed("r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1");

describe("search with minimax", () => {
	for (const depth of [1, 3]) {
		test(`finds White's mate in 1 at depth ${depth}`, () => {
			const result = search(WHITE_MATES_IN_ONE, {
				algorithm: "minimax",
				depth,
				seed: 0,
			});
			expect(result.bestMove).toBe("Ra8#");
			expect(result.score).toBe(MATE_SCORE - 1);
		});

		test(`finds Black's mate in 1 at depth ${depth}`, () => {
			const result = search(BLACK_MATES_IN_ONE, {
				algorithm: "minimax",
				depth,
				seed: 0,
			});
			expect(result.bestMove).toBe("Ra1#");
			expect(result.score).toBe(-(MATE_SCORE - 1));
		});
	}

	test("prefers a mate in 1 over a slower mate", () => {
		// Qg7# mates at once; quiet queen moves lead to slower mates within the same depth.
		const result = search(parsed("7k/8/5K2/8/8/8/8/6Q1 w - - 0 1"), {
			algorithm: "minimax",
			depth: 3,
			seed: 0,
		});
		expect(result.bestMove).toBe("Qg7#");
		expect(result.score).toBe(MATE_SCORE - 1);
		const slowerMate = result.trace.root.children.find(
			(c) => c.score === MATE_SCORE - 3,
		);
		expect(slowerMate).toBeDefined();
	});

	test("Black minimises: it takes the free queen", () => {
		const result = search(parsed("4k3/8/8/3q4/8/8/3Q4/4K3 b - - 0 1"), {
			algorithm: "minimax",
			depth: 1,
			seed: 0,
		});
		expect(result.bestMove).toBe("Qxd2+");
		expect(result.score).toBe(-900);
	});

	test("at depth 1 the start position's root has 20 children", () => {
		const { trace } = search(START, {
			algorithm: "minimax",
			depth: 1,
			seed: 0,
		});
		expect(trace.root.children).toHaveLength(20);
		expect(trace.root.move).toBeNull();
		expect(trace.root.fen).toBe(START);
		expect(trace.root.depth).toBe(1);
		for (const child of trace.root.children) {
			expect(child.depth).toBe(0);
			expect(child.children).toEqual([]);
			expect(child.score).toBe(0);
		}
	});

	test("children are in move order and the root takes the best child's score", () => {
		const { trace, score } = search(START, {
			algorithm: "minimax",
			depth: 2,
			seed: 0,
		});
		const moves = trace.root.children.map((c) => c.move ?? "");
		expect(moves).toEqual([...moves].sort());
		expect(score).toBe(trace.root.score);
	});

	test("ids are unique and assigned in visit order", () => {
		const { trace } = search(START, {
			algorithm: "minimax",
			depth: 2,
			seed: 0,
		});
		const ids = [...walk(trace.root)].map((n) => n.id);
		expect(ids).toEqual(ids.map((_, i) => i));
		// 20 replies to each of White's 20 first moves, plus the root.
		expect(ids).toHaveLength(1 + 20 + 400);
	});

	test("no node is pruned and none has a window", () => {
		const { trace } = search(WHITE_MATES_IN_ONE, {
			algorithm: "minimax",
			depth: 3,
			seed: 0,
		});
		for (const node of walk(trace.root)) {
			expect(node.pruned).toBe(false);
			expect(node.score).not.toBeNull();
			expect(node.entry).toBeNull();
			expect(node.exit).toBeNull();
		}
	});

	test("a game-over root is scored without expanding and has no best move", () => {
		const mated = parsed("R5k1/5ppp/8/8/8/8/8/6K1 b - - 1 1");
		const result = search(mated, { algorithm: "minimax", depth: 3, seed: 0 });
		expect(result.bestMove).toBeNull();
		expect(result.score).toBe(MATE_SCORE);
		expect(result.trace.root.children).toEqual([]);
	});

	test("depth 0 scores the root by evaluation alone", () => {
		const result = search(START, { algorithm: "minimax", depth: 0, seed: 0 });
		expect(result).toEqual({
			bestMove: null,
			score: 0,
			trace: {
				root: {
					id: 0,
					fen: START,
					move: null,
					depth: 0,
					entry: null,
					exit: null,
					score: 0,
					pruned: false,
					children: [],
				},
			},
		});
	});

	test("running the same search twice gives deep-equal results", () => {
		const options = { algorithm: "minimax", depth: 3, seed: 0 } as const;
		expect(search(WHITE_MATES_IN_ONE, options)).toEqual(
			search(WHITE_MATES_IN_ONE, options),
		);
	});

	test("the result survives a JSON round trip", () => {
		const result = search(BLACK_MATES_IN_ONE, {
			algorithm: "minimax",
			depth: 3,
			seed: 0,
		});
		expect(JSON.parse(JSON.stringify(result))).toStrictEqual(result);
	});
});

describe("search", () => {
	test("rejects a negative or fractional depth", () => {
		expect(() =>
			search(START, { algorithm: "minimax", depth: -1, seed: 0 }),
		).toThrow(RangeError);
		expect(() =>
			search(START, { algorithm: "minimax", depth: 1.5, seed: 0 }),
		).toThrow(RangeError);
	});

	test("rejects an algorithm that has no implementation yet", () => {
		expect(() =>
			search(START, { algorithm: "alphabeta", depth: 1, seed: 0 }),
		).toThrow(/alphabeta/);
	});
});
