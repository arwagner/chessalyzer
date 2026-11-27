import { expect, test } from "vitest";
import * as core from "../src/index.ts";

test("the core entry exposes position parsing and static evaluation", () => {
	const result = core.parsePosition("8/8/4k3/8/8/4K3/8/Q7 w - - 0 1");
	expect(result.ok).toBe(true);
	if (result.ok)
		expect(core.staticEvaluation(result.position)).toBe(core.PIECE_VALUES.q);
});

test("the core entry exposes search", () => {
	const result = core.parsePosition("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
	if (!result.ok) throw new Error(result.error);
	const options: core.SearchOptions = {
		algorithm: "random",
		budgetMs: 100,
		seed: 1,
	};
	const deps: core.SearchDeps = { clock: () => 0 };
	expect(core.search(result.position, options, deps).chosenMove).toBeNull();
});
