import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { App } from "../src/App.tsx";

// Server rendering keeps this test free of a DOM environment dependency.
test("App renders the app name", () => {
	expect(renderToString(<App />)).toContain("chessalyzer");
});
