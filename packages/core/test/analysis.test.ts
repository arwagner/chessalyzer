import { describe, expect, test } from "vitest";
import { chosenChild, type Node } from "../src/analysis.ts";
import * as core from "../src/index.ts";
import { search } from "../src/search.ts";
import { START, ticking } from "./fixtures.ts";

function leaf(id: number, evaluation: number | null): Node {
	return {
		id,
		fen: START,
		move: `m${id}`,
		depth: 0,
		entry: null,
		exit: null,
		evaluation,
		pruned: evaluation === null,
		children: [],
	};
}

function parent(evaluation: number | null, children: Node[]): Node {
	return { ...leaf(0, evaluation), move: null, pruned: false, children };
}

describe("chosenChild", () => {
	test("is the first child in move order with the parent's evaluation", () => {
		const n = parent(5, [leaf(1, 3), leaf(2, 5), leaf(3, 5)]);
		expect(chosenChild(n)?.id).toBe(2);
	});

	test("skips a pruned child", () => {
		const pruned = { ...leaf(1, null), pruned: true };
		const n = parent(5, [pruned, leaf(2, 5)]);
		expect(chosenChild(n)?.id).toBe(2);
	});

	test("is undefined for a leaf or an unevaluated node", () => {
		expect(chosenChild(leaf(1, 5))).toBeUndefined();
		expect(chosenChild(parent(null, [leaf(1, 5)]))).toBeUndefined();
	});

	test("agrees with the chosen move search returns", () => {
		for (const algorithm of ["minimax", "random"] as const) {
			const { chosenMove, analysis } = search(
				START,
				{ algorithm, budgetMs: 500, seed: 4 },
				ticking(),
			);
			expect(chosenChild(analysis.root)?.move).toBe(chosenMove);
		}
	});

	test("is exported from the core entry", () => {
		expect(core.chosenChild).toBe(chosenChild);
	});
});
