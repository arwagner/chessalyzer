/** Lets other workspaces prove they resolve the engine by package name before they use its API. */
export const engineName = "chessalyzer-engine";

export {
	evaluate,
	evaluateAtPly,
	MATE_SCORE,
	PIECE_VALUES,
	SCORE_BOUND,
} from "./evaluate.ts";
export {
	legalMoves,
	type ParseResult,
	type Position,
	parsePosition,
	play,
	type Side,
	type Status,
	sideToMove,
	status,
} from "./position.ts";
export { search } from "./search.ts";
export {
	type Algorithm,
	chosenChild,
	type SearchOptions,
	type SearchResult,
	type Trace,
	type TraceNode,
	type Window,
} from "./trace.ts";
