import { expect, test } from "vitest";
import { engineName } from "../src/index.ts";

test("the engine package exports its name", () => {
	expect(engineName).toBe("chessalyzer-engine");
});
