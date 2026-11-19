import { expect, test } from "vitest";
import { DEFAULT_PORT, portFrom } from "../src/port.ts";

test("uses the default port when neither argv nor env names one", () => {
	expect(portFrom([], {})).toBe(DEFAULT_PORT);
});

test("reads PORT from the environment", () => {
	expect(portFrom([], { PORT: "8123" })).toBe(8123);
});

test("a --port argument wins over PORT", () => {
	expect(portFrom(["--port", "9000"], { PORT: "8123" })).toBe(9000);
	expect(portFrom(["--port=9001"], { PORT: "8123" })).toBe(9001);
});

test("accepts 0 for an ephemeral port", () => {
	expect(portFrom([], { PORT: "0" })).toBe(0);
});

test("rejects a port that is not an integer in range", () => {
	expect(() => portFrom([], { PORT: "http" })).toThrow(/port/);
	expect(() => portFrom(["--port", "70000"], {})).toThrow(/port/);
	expect(() => portFrom(["--port"], {})).toThrow(/port/);
});
