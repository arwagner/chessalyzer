import { parsePosition, type SearchResult } from "@chessalyzer/engine";
import { describe, expect, test } from "vitest";
import { type FetchFn, runSearch } from "../src/searchClient.ts";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const parsedStart = parsePosition(START);
if (!parsedStart.ok) throw new Error(parsedStart.error);

const RESULT: SearchResult = {
	bestMove: "e4",
	score: 0,
	trace: {
		root: {
			id: 0,
			fen: parsedStart.position,
			move: null,
			depth: 1,
			entry: null,
			exit: null,
			score: 0,
			pruned: false,
			children: [],
		},
	},
};

type Call = { url: string; init: Parameters<FetchFn>[1] };

/** Records each call and answers with `respond`, so a test can check both sides of the exchange. */
function stubFetch(respond: () => Promise<Response>): {
	fetchFn: FetchFn;
	calls: Call[];
} {
	const calls: Call[] = [];
	const fetchFn: FetchFn = (url, init) => {
		calls.push({ url, init });
		return respond();
	};
	return { fetchFn, calls };
}

function json(status: number, body: unknown): () => Promise<Response> {
	return async () =>
		new Response(JSON.stringify(body), {
			status,
			headers: { "content-type": "application/json; charset=utf-8" },
		});
}

describe("runSearch request", () => {
	test("sends one QUERY to /api/search with a JSON body", async () => {
		const { fetchFn, calls } = stubFetch(json(200, RESULT));
		await runSearch({ fen: START, algorithm: "minimax", depth: 2 }, fetchFn);

		expect(calls).toHaveLength(1);
		const [call] = calls;
		expect(call?.url).toBe("/api/search");
		expect(call?.init.method).toBe("QUERY");
		expect(call?.init.headers["content-type"]).toBe("application/json");
		expect(JSON.parse(call?.init.body ?? "")).toEqual({
			fen: START,
			algorithm: "minimax",
			depth: 2,
		});
	});

	test("includes the seed when one is given", async () => {
		const { fetchFn, calls } = stubFetch(json(200, RESULT));
		await runSearch(
			{ fen: START, algorithm: "alphabeta", depth: 3, seed: 42 },
			fetchFn,
		);

		expect(JSON.parse(calls[0]?.init.body ?? "")).toEqual({
			fen: START,
			algorithm: "alphabeta",
			depth: 3,
			seed: 42,
		});
	});
});

describe("runSearch response", () => {
	test("a 200 is parsed to the search result and the seed the server ran with", async () => {
		const { fetchFn } = stubFetch(json(200, { ...RESULT, seed: 1234 }));
		const outcome = await runSearch(
			{ fen: START, algorithm: "random", depth: 1 },
			fetchFn,
		);

		expect(outcome).toEqual({
			ok: true,
			result: { ...RESULT, seed: 1234 },
			seed: 1234,
		});
	});

	test.each([
		["missing", RESULT],
		["not a number", { ...RESULT, seed: "1234" }],
	])("a 200 whose seed is %s is a server error", async (_, body) => {
		const { fetchFn } = stubFetch(json(200, body));
		const outcome = await runSearch(
			{ fen: START, algorithm: "random", depth: 1 },
			fetchFn,
		);

		expect(outcome).toEqual({
			ok: false,
			error: {
				kind: "server",
				message: "server responded 200 without a search result",
			},
		});
	});

	test("a 400 is surfaced with the server's message", async () => {
		const { fetchFn } = stubFetch(
			json(400, { error: "depth must be from 1 to 5, got 9" }),
		);
		const outcome = await runSearch(
			{ fen: START, algorithm: "minimax", depth: 9 },
			fetchFn,
		);

		expect(outcome).toEqual({
			ok: false,
			error: { kind: "rejected", message: "depth must be from 1 to 5, got 9" },
		});
	});

	test("another failing status is a server error carrying its message", async () => {
		const { fetchFn } = stubFetch(json(500, { error: "boom" }));
		const outcome = await runSearch(
			{ fen: START, algorithm: "minimax", depth: 1 },
			fetchFn,
		);

		expect(outcome).toEqual({
			ok: false,
			error: { kind: "server", message: "boom" },
		});
	});

	test("a failing status without a JSON error falls back to the status", async () => {
		const { fetchFn } = stubFetch(
			async () => new Response("Bad Gateway", { status: 502 }),
		);
		const outcome = await runSearch(
			{ fen: START, algorithm: "minimax", depth: 1 },
			fetchFn,
		);

		expect(outcome).toEqual({
			ok: false,
			error: { kind: "server", message: "server responded 502" },
		});
	});

	test("a 200 whose body is not a search result is a server error", async () => {
		const { fetchFn } = stubFetch(
			async () => new Response("<html></html>", { status: 200 }),
		);
		const outcome = await runSearch(
			{ fen: START, algorithm: "minimax", depth: 1 },
			fetchFn,
		);

		expect(outcome).toEqual({
			ok: false,
			error: {
				kind: "server",
				message: "server responded 200 without a search result",
			},
		});
	});

	test("a rejected fetch is surfaced as a network error", async () => {
		const { fetchFn } = stubFetch(() =>
			Promise.reject(new TypeError("fetch failed")),
		);
		const outcome = await runSearch(
			{ fen: START, algorithm: "minimax", depth: 1 },
			fetchFn,
		);

		expect(outcome).toEqual({
			ok: false,
			error: { kind: "network", message: "fetch failed" },
		});
	});
});

test("the global fetch fits the injected type", () => {
	// Compile-time check: the UI passes the real fetch straight in.
	const fetchFn: FetchFn = fetch;
	expect(typeof fetchFn).toBe("function");
});
