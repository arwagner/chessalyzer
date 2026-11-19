import { minimax } from "./minimax.ts";
import type { Position } from "./position.ts";
import type {
	Algorithm,
	SearchAlgorithm,
	SearchOptions,
	SearchResult,
} from "./trace.ts";

/** Adding an algorithm is adding an entry here. Partial until every `Algorithm` has an implementation. */
const algorithms: { readonly [A in Algorithm]?: SearchAlgorithm } = {
	minimax,
};

/** Bad options are a caller bug (the server validates user input first), so they throw. */
export function search(
	position: Position,
	options: SearchOptions,
): SearchResult {
	const { algorithm, depth } = options;
	if (!Number.isInteger(depth) || depth < 0) {
		throw new RangeError(`depth must be a non-negative integer, got ${depth}`);
	}
	const run = algorithms[algorithm];
	if (run === undefined) {
		throw new Error(`no implementation for algorithm ${algorithm}`);
	}
	return run(position, depth);
}
