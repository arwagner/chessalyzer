import { readFileSync } from "node:fs";
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
	const port = /--port[= ](\d+)/.exec(serverPackage.scripts.dev ?? "")?.[1];
	expect(port).toBe(String(DEV_API_PORT));
});
