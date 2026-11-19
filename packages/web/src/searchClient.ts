import type { Algorithm, SearchResult } from "@chessalyzer/engine";

export type SearchRequest = {
	/** Raw user input: the server validates it and answers a bad FEN with a 400. */
	readonly fen: string;
	readonly algorithm: Algorithm;
	readonly depth: number;
	/** Optional because only the random algorithm uses it; left out of the body when not given. */
	readonly seed?: number;
};

/** The part of `fetch` this client uses, so a test can stand in for the network. */
export type FetchFn = (
	url: string,
	init: {
		readonly method: string;
		readonly headers: Record<string, string>;
		readonly body: string;
	},
) => Promise<Response>;

export type SearchError = {
	/**
	 * `rejected`: the server refused the request (400), so the message is about the user's input.
	 * `server`: any other failure the server reported. `network`: the server was never reached.
	 */
	readonly kind: "rejected" | "server" | "network";
	readonly message: string;
};

export type SearchOutcome =
	| { readonly ok: true; readonly result: SearchResult }
	| { readonly ok: false; readonly error: SearchError };

const SEARCH_PATH = "/api/search";

/** Never throws: every failure comes back as a `SearchError` the UI can show. */
export async function runSearch(
	request: SearchRequest,
	fetchFn: FetchFn,
): Promise<SearchOutcome> {
	let response: Response;
	try {
		// QUERY, as the server requires: a search is safe and idempotent but carries a body.
		response = await fetchFn(SEARCH_PATH, {
			method: "QUERY",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(request),
		});
	} catch (error) {
		return fail("network", thrownMessage(error));
	}

	let body: unknown;
	try {
		body = await response.json();
	} catch {
		body = undefined;
	}

	if (response.ok) {
		return isSearchResult(body)
			? { ok: true, result: body }
			: fail(
					"server",
					`server responded ${response.status} without a search result`,
				);
	}
	return fail(
		response.status === 400 ? "rejected" : "server",
		errorMessage(body) ?? `server responded ${response.status}`,
	);
}

// A shallow check: the server is ours, so this guards against a proxy's or dev server's page, not a
// malformed trace.
function isSearchResult(body: unknown): body is SearchResult {
	const record = asRecord(body);
	if (record === undefined) return false;
	const { score, trace } = record;
	return (
		typeof score === "number" &&
		typeof trace === "object" &&
		trace !== null &&
		"root" in trace
	);
}

function errorMessage(body: unknown): string | undefined {
	const error = asRecord(body)?.error;
	return typeof error === "string" ? error : undefined;
}

function asRecord(body: unknown): Record<string, unknown> | undefined {
	return typeof body === "object" && body !== null
		? (body as Record<string, unknown>)
		: undefined;
}

function fail(kind: SearchError["kind"], text: string): SearchOutcome {
	return { ok: false, error: { kind, message: text } };
}

function thrownMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
