import { readFileSync } from "node:fs";
import { portFrom } from "@chessalyzer/server";
import { expect, test } from "vitest";
import config, { DEV_API_PORT } from "../vite.config.ts";

const serverPackage = JSON.parse(
	readFileSync(new URL("../../server/package.json", import.meta.url), "utf8"),
) as { scripts: Record<string, string> };

test("the dev server proxies /api to the API's dev port", () => {
	expect(config.server?.proxy?.["/api"]).toBe(
		`http://127.0.0.1:${DEV_API_PORT}`,
	);
});

test("the server's dev script listens on the port the proxy targets", () => {
	// Parsed by the server's own portFrom, so the test reads the script exactly as `main` will.
	const words = (serverPackage.scripts.dev ?? "").split(/\s+/);
	const argv = words.slice(words.indexOf("src/main.ts") + 1);
	// A stray PORT in the developer's shell must not move the API off the port the proxy targets.
	expect(portFrom(argv, { PORT: "1" })).toBe(DEV_API_PORT);
});
