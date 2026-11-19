import { describe, expect, test } from "vitest";
import * as engine from "../src/index.ts";
import { search } from "../src/search.ts";
import { chosenChild, type TraceNode } from "../src/trace.ts";
import { START } from "./fixtures.ts";

function leaf(id: number, score: number | null): TraceNode {
	return {
		id,
		fen: START,
		move: `m${id}`,
		depth: 0,
		entry: null,
		exit: null,
		score,
		pruned: score === null,
		children: [],
	};
}

function parent(score: number | null, children: TraceNode[]): TraceNode {
	return { ...leaf(0, score), move: null, pruned: false, children };
}

describe("chosenChild", () => {
	test("is the first child in move order with the parent's score", () => {
		const n = parent(5, [leaf(1, 3), leaf(2, 5), leaf(3, 5)]);
		expect(chosenChild(n)?.id).toBe(2);
	});

	test("skips a pruned child", () => {
		const pruned = { ...leaf(1, null), pruned: true };
		const n = parent(5, [pruned, leaf(2, 5)]);
		expect(chosenChild(n)?.id).toBe(2);
	});

	test("is undefined for a leaf or an unscored node", () => {
		expect(chosenChild(leaf(1, 5))).toBeUndefined();
		expect(chosenChild(parent(null, [leaf(1, 5)]))).toBeUndefined();
	});

	test("agrees with the best move search returns", () => {
		for (const algorithm of ["minimax", "random"] as const) {
			const { bestMove, trace } = search(START, {
				algorithm,
				depth: 2,
				seed: 4,
			});
			expect(chosenChild(trace.root)?.move).toBe(bestMove);
		}
	});

	test("is exported from the engine entry", () => {
		expect(engine.chosenChild).toBe(chosenChild);
	});
});
