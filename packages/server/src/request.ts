import {
	type Algorithm,
	IMPLEMENTED_ALGORITHMS,
	type Position,
	parsePosition,
} from "@chessalyzer/engine";

// Each node at depth d has ~30 children, so the trace grows ~30^d; beyond 5 a response would be too big to
// send or render.
export const MAX_DEPTH = 5;

export type SearchRequest = {
	readonly position: Position;
	readonly algorithm: Algorithm;
	readonly depth: number;
	/** Absent when the client left the server to pick one. */
	readonly seed: number | undefined;
};

export type RequestResult =
	| { readonly ok: true; readonly request: SearchRequest }
	| { readonly ok: false; readonly error: string };

/** Checks a request body's text. User input, so every failure is a value, never a throw. */
export function parseSearchRequest(text: string): RequestResult {
	let body: unknown;
	try {
		body = JSON.parse(text);
	} catch {
		return fail("request body is not valid JSON");
	}
	if (typeof body !== "object" || body === null || Array.isArray(body)) {
		return fail("request body must be a JSON object");
	}
	const { fen, algorithm, depth, seed } = body as Record<string, unknown>;

	if (typeof fen !== "string") return fail("fen must be a string");
	const parsed = parsePosition(fen);
	if (!parsed.ok) return fail(parsed.error);

	if (!isAlgorithm(algorithm)) {
		return fail(
			`algorithm must be one of ${IMPLEMENTED_ALGORITHMS.join(", ")}`,
		);
	}
	if (typeof depth !== "number" || !Number.isInteger(depth)) {
		return fail("depth must be an integer");
	}
	if (depth < 1 || depth > MAX_DEPTH) {
		return fail(`depth must be from 1 to ${MAX_DEPTH}, got ${depth}`);
	}
	if (seed !== undefined && !Number.isSafeInteger(seed)) {
		return fail("seed must be an integer");
	}

	return {
		ok: true,
		request: {
			position: parsed.position,
			algorithm,
			depth,
			seed: seed as number | undefined,
		},
	};
}

function isAlgorithm(value: unknown): value is Algorithm {
	return (IMPLEMENTED_ALGORITHMS as readonly unknown[]).includes(value);
}

function fail(error: string): RequestResult {
	return { ok: false, error };
}
