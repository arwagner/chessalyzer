import type { Clock, Node } from "./analysis.ts";

/** One depth-limited search from the root, or null if it ran out of budget part way. */
export type DepthPass<N extends Node> = (
	depth: number,
	outOfTime: () => boolean,
) => {
	readonly root: N;
	/** Whether any leaf was ongoing and only stopped by depth, so a deeper pass could see more. */
	readonly cutOff: boolean;
} | null;

/**
 * Iterative deepening: how an engine picks its own search depth within a search budget. Runs `pass` at depth
 * 0, 1, 2, ... and returns the root of the deepest pass that finished in time. A pass that runs out is
 * thrown away whole, so the analysis never mixes depths. Stops early once a pass was cut off nowhere, since
 * deeper passes would find the same tree.
 */
export function deepen<N extends Node>(
	budgetMs: number,
	clock: Clock,
	pass: DepthPass<N>,
): N {
	const start = clock();
	const outOfTime = () => clock() - start >= budgetMs;
	// Depth 0 is one static evaluation, too cheap to time, so every search has an analysis to return.
	let deepest = pass(0, () => false);
	if (deepest === null) throw new Error("a depth 0 pass cannot run out");
	for (let depth = 1; deepest.cutOff; depth++) {
		const next = pass(depth, outOfTime);
		if (next === null) break;
		deepest = next;
	}
	return deepest.root;
}
