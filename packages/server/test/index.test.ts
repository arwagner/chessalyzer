import { expect, test } from "vitest";
import { resolvedEngineName } from "../src/index.ts";

test("the server imports the engine by workspace name", () => {
	expect(resolvedEngineName).toBe("chessalyzer-engine");
});
