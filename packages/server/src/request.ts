import {
	type Algorithm,
	IMPLEMENTED_ALGORITHMS,
	type Position,
	parsePosition,
} from "@chessalyzer/core";

// The analysis grows with how many nodes the engine visits in its budget. Board code visits a few thousand
// nodes a second, so a longer budget would make a response too big to send or render.
export const MAX_BUDGET_MS = 5000;

export type SearchRequest = {
	readonly position: Position;
	readonly algorithm: Algorithm;
	/** The search budget, in milliseconds. */
	readonly budgetMs: number;
	/** Absent when the client left the server to pick one. */
	readonly seed: number | undefined;
};

export type RequestResult =
	| { readonly ok: true; readonly request: SearchRequest }
	| { readonly ok: false; readonly error: string };

/** Checks a request body's text. Editor input, so every failure is a value, never a throw. */
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
	const { fen, algorithm, budgetMs, seed } = body as Record<string, unknown>;

	if (typeof fen !== "string") return fail("fen must be a string");
	const parsed = parsePosition(fen);
	if (!parsed.ok) return fail(parsed.error);

	if (!isAlgorithm(algorithm)) {
		return fail(
			`algorithm must be one of ${IMPLEMENTED_ALGORITHMS.join(", ")}`,
		);
	}
	if (typeof budgetMs !== "number" || !Number.isInteger(budgetMs)) {
		return fail("budgetMs must be an integer");
	}
	if (budgetMs < 1 || budgetMs > MAX_BUDGET_MS) {
		return fail(`budgetMs must be from 1 to ${MAX_BUDGET_MS}, got ${budgetMs}`);
	}
	if (seed !== undefined && !Number.isSafeInteger(seed)) {
		return fail("seed must be an integer");
	}

	return {
		ok: true,
		request: {
			position: parsed.position,
			algorithm,
			budgetMs,
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
