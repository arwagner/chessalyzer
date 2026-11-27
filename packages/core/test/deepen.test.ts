import { describe, expect, test } from "vitest";
import type { Node } from "../src/analysis.ts";
import { type DepthPass, deepen } from "../src/deepen.ts";
import { START } from "./fixtures.ts";

function rootAt(depth: number): Node {
	return {
		id: 0,
		fen: START,
		move: null,
		depth,
		entry: null,
		exit: null,
		evaluation: 0,
		pruned: false,
		children: [],
	};
}

/**
 * A stub pass that reads `outOfTime` `cost(depth)` times, as a real pass reads it once per node, and gives
 * up at the first true. Records the depths it was asked for.
 */
function stubPass(
	cost: (depth: number) => number,
	stoppedByDepth: (depth: number) => boolean = () => true,
): { pass: DepthPass<Node>; depths: number[] } {
	const depths: number[] = [];
	const pass: DepthPass<Node> = (depth, outOfTime) => {
		depths.push(depth);
		for (let i = 0; i < cost(depth); i++) if (outOfTime()) return null;
		return { root: rootAt(depth), stoppedByDepth: stoppedByDepth(depth) };
	};
	return { pass, depths };
}

/** Moves on 1 ms per reading, so a budget of N ms allows about N readings. */
function ticking(): () => number {
	let now = 0;
	return () => now++;
}

describe("deepen", () => {
	test("returns the deepest pass that finished, dropping the one that ran out", () => {
		// Each pass at depth d reads the clock 10^d times; a 50 ms budget fits depths 1 (10) but not 2 (100).
		const { pass, depths } = stubPass((d) => 10 ** d);
		expect(deepen(50, ticking(), pass).depth).toBe(1);
		expect(depths).toEqual([0, 1, 2]);
	});

	test("never times the depth 0 pass, so even the smallest budget returns an analysis", () => {
		// Depth 0 reads outOfTime a thousand times, far past a 1 ms budget, and still finishes.
		const { pass, depths } = stubPass((d) => (d === 0 ? 1000 : 5));
		expect(deepen(1, ticking(), pass).depth).toBe(0);
		expect(depths).toEqual([0, 1]);
	});

	test("stops once a pass had no leaf stopped by depth", () => {
		const { pass, depths } = stubPass(
			() => 0,
			(d) => d < 2,
		);
		expect(deepen(1000, ticking(), pass).depth).toBe(2);
		expect(depths).toEqual([0, 1, 2]);
	});

	test("measures the budget from the clock reading at the start, not from 0", () => {
		let now = 1_000_000;
		const clock = () => now++;
		const { pass } = stubPass((d) => 10 ** d);
		expect(deepen(50, clock, pass).depth).toBe(1);
	});

	test("throws if the depth 0 pass returns null, since nothing could be returned", () => {
		expect(() => deepen(100, ticking(), () => null)).toThrow(
			"a depth 0 pass cannot run out",
		);
	});
});
