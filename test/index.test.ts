import { expect, test } from "vitest";
import { name } from "../src/index.ts";

test("the package has a name", () => {
	expect(name).toBe("chessalyzer");
});
