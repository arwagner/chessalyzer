/** Placeholder until the search lands; lets other workspaces prove they can import the engine. */
export const engineName = "chessalyzer-engine";

export { evaluate, MATE_SCORE, PIECE_VALUES, SCORE_BOUND } from "./evaluate.ts";
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
