import { expect, test } from "vitest";
import { engineName } from "../src/index.ts";

test("the engine package exports its name", () => {
	expect(engineName).toBe("chessalyzer-engine");
});

test("the engine entry exposes position parsing and evaluation", async () => {
	const engine = await import("../src/index.ts");
	const result = engine.parsePosition("8/8/4k3/8/8/4K3/8/Q7 w - - 0 1");
	expect(result.ok).toBe(true);
	if (result.ok)
		expect(engine.evaluate(result.position)).toBe(engine.PIECE_VALUES.q);
});
