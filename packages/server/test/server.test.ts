import { parsePosition, type SearchResult, search } from "@chessalyzer/engine";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { type RunningServer, startServer } from "../src/server.ts";

const MATE_IN_ONE = "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const FIXED_SEED = 424242;

let server: RunningServer;

beforeEach(async () => {
	server = await startServer({ port: 0, deps: { newSeed: () => FIXED_SEED } });
});

afterEach(async () => {
	await server.close();
});

function query(body: unknown, path = "/api/search"): Promise<Response> {
	return fetch(new URL(path, server.url), {
		method: "QUERY",
		headers: { "content-type": "application/json" },
		body: typeof body === "string" ? body : JSON.stringify(body),
	});
}

type SearchResponse = SearchResult & { readonly seed: number };

describe("QUERY /api/search", () => {
	test("returns the same result as calling search directly with that seed", async () => {
		const response = await query({
			fen: MATE_IN_ONE,
			algorithm: "minimax",
			depth: 2,
			seed: 7,
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toMatch(/^application\/json/);
		const body = (await response.json()) as SearchResponse;
		const parsed = parsePosition(MATE_IN_ONE);
		if (!parsed.ok) throw new Error(parsed.error);
		const direct = search(parsed.position, {
			algorithm: "minimax",
			depth: 2,
			seed: 7,
		});
		expect(body.bestMove).toBe(direct.bestMove);
		expect(body.bestMove).toBe("Ra8#");
		expect(body.score).toBe(direct.score);
		expect(body.trace).toEqual(direct.trace);
		expect(body.seed).toBe(7);
	});

	test("picks a seed from the injected source when none is given, and returns it", async () => {
		const response = await query({
			fen: START,
			algorithm: "minimax",
			depth: 1,
		});

		expect(response.status).toBe(200);
		const body = (await response.json()) as SearchResponse;
		expect(body.seed).toBe(FIXED_SEED);
	});

	test("replaying a response's seed gives the same result", async () => {
		const first = (await (
			await query({ fen: START, algorithm: "minimax", depth: 1 })
		).json()) as SearchResponse;
		const replay = (await (
			await query({
				fen: START,
				algorithm: "minimax",
				depth: 1,
				seed: first.seed,
			})
		).json()) as SearchResponse;

		expect(replay).toEqual(first);
	});

	const valid = { fen: START, algorithm: "minimax", depth: 1 };
	const badRequests: ReadonlyArray<readonly [string, unknown, RegExp]> = [
		["an invalid FEN", { ...valid, fen: "not a fen" }, /FEN/],
		[
			"a FEN with no kings",
			{ ...valid, fen: "8/8/8/8/8/8/8/8 w - - 0 1" },
			/FEN/,
		],
		["a missing FEN", { algorithm: "minimax", depth: 1 }, /fen/],
		["an unknown algorithm", { ...valid, algorithm: "negamax" }, /algorithm/],
		[
			"an algorithm the engine names but does not implement yet",
			{ ...valid, algorithm: "alphabeta" },
			/algorithm/,
		],
		["a missing algorithm", { fen: START, depth: 1 }, /algorithm/],
		["a fractional depth", { ...valid, depth: 1.5 }, /depth/],
		["a string depth", { ...valid, depth: "2" }, /depth/],
		["a missing depth", { fen: START, algorithm: "minimax" }, /depth/],
		["depth 0", { ...valid, depth: 0 }, /depth/],
		["depth 6", { ...valid, depth: 6 }, /depth/],
		["a fractional seed", { ...valid, seed: 0.5 }, /seed/],
		["a string seed", { ...valid, seed: "1" }, /seed/],
		["malformed JSON", "{ not json", /JSON/],
		["a JSON body that is not an object", "[1, 2]", /object/],
		["a JSON body that is null", "null", /object/],
	];

	for (const [name, body, message] of badRequests) {
		test(`rejects ${name} with 400`, async () => {
			const response = await query(body);

			expect(response.status).toBe(400);
			expect(response.headers.get("content-type")).toMatch(
				/^application\/json/,
			);
			const { error } = (await response.json()) as { error: string };
			expect(error).toMatch(message);
		});
	}

	test("rejects POST with 405 and says QUERY is allowed", async () => {
		const response = await fetch(new URL("/api/search", server.url), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(valid),
		});

		expect(response.status).toBe(405);
		expect(response.headers.get("allow")).toBe("QUERY");
		expect(await response.json()).toHaveProperty("error");
	});

	test("rejects GET with 405", async () => {
		const response = await fetch(new URL("/api/search", server.url));

		expect(response.status).toBe(405);
		expect(response.headers.get("allow")).toBe("QUERY");
	});
});

test("an unknown route is 404", async () => {
	const response = await query({}, "/api/nope");

	expect(response.status).toBe(404);
	expect(await response.json()).toHaveProperty("error");
});

test("a search that throws is a 500 with a JSON error, not a dropped connection", async () => {
	const failing = await startServer({
		port: 0,
		deps: {
			newSeed: () => 1,
			search: () => {
				throw new Error("search exploded");
			},
		},
	});
	try {
		const response = await fetch(new URL("/api/search", failing.url), {
			method: "QUERY",
			body: JSON.stringify({ fen: START, algorithm: "minimax", depth: 1 }),
		});

		expect(response.status).toBe(500);
		const { error } = (await response.json()) as { error: string };
		expect(error).toMatch(/exploded/);
	} finally {
		await failing.close();
	}
});
