import type {
	Algorithm,
	SearchAlgorithm,
	SearchDeps,
	SearchOptions,
	SearchResult,
} from "./analysis.ts";
import { minimax } from "./minimax.ts";
import type { Position } from "./position.ts";
import { random } from "./random.ts";

/** Adding an algorithm is adding an entry here. Partial until every `Algorithm` has an implementation. */
const algorithms: { readonly [A in Algorithm]?: SearchAlgorithm } = {
	random,
	minimax,
};

/** The algorithms `search` can run today, so callers can reject the rest before calling it. */
export const IMPLEMENTED_ALGORITHMS: readonly Algorithm[] = Object.freeze(
	Object.keys(algorithms) as Algorithm[],
);

/**
 * The clock comes in through `deps` so that the search stays deterministic given its inputs: the same
 * position, options and clock readings give the same result. Bad options are a caller bug (the server
 * validates the editor's input first), so they throw.
 */
export function search(
	position: Position,
	options: SearchOptions,
	deps: SearchDeps,
): SearchResult {
	const { algorithm, budgetMs, seed } = options;
	if (!Number.isFinite(budgetMs) || budgetMs <= 0) {
		throw new RangeError(`budgetMs must be a positive number, got ${budgetMs}`);
	}
	if (!Number.isInteger(seed)) {
		throw new RangeError(`seed must be an integer, got ${seed}`);
	}
	const run = algorithms[algorithm];
	if (run === undefined) {
		throw new Error(`no implementation for algorithm ${algorithm}`);
	}
	return run(position, options, deps);
}
