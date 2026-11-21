import { expect, test } from "vitest";
import * as engine from "../src/index.ts";

test("the engine entry exposes position parsing and evaluation", () => {
	const result = engine.parsePosition("8/8/4k3/8/8/4K3/8/Q7 w - - 0 1");
	expect(result.ok).toBe(true);
	if (result.ok)
		expect(engine.evaluate(result.position)).toBe(engine.PIECE_VALUES.q);
});

test("the engine entry exposes search", () => {
	const result = engine.parsePosition("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
	if (!result.ok) throw new Error(result.error);
	const options: engine.SearchOptions = {
		algorithm: "random",
		depth: 1,
		seed: 1,
	};
	expect(engine.search(result.position, options).bestMove).toBeNull();
});
