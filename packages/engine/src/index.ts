/** Placeholder until the search lands; lets other workspaces prove they can import the engine. */
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
export { IMPLEMENTED_ALGORITHMS, search } from "./search.ts";
export type {
	Algorithm,
	SearchOptions,
	SearchResult,
	Trace,
	TraceNode,
	Window,
} from "./trace.ts";
