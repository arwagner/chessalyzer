import { expect, test } from "vitest";
import { serverUses } from "../src/index.ts";

test("the server imports the engine by workspace name", () => {
	expect(serverUses).toBe("chessalyzer-engine");
});
