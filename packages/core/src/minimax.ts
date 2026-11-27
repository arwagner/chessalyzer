import { chosenChild, type Node, type SearchAlgorithm } from "./analysis.ts";
import { deepen, type PassResult } from "./deepen.ts";
import { staticEvaluationAtPly } from "./evaluate.ts";
import {
	legalMoves,
	type Position,
	play,
	sideToMove,
	status,
} from "./position.ts";

// Minimax evaluates every node it touches, so its nodes never carry the null evaluation of a pruned node.
type EvaluatedNode = Node & { readonly evaluation: number };

/**
 * Minimax, deepened until the search budget runs out: White maximises, Black minimises, and every node the
 * deepest finished pass visited is in the analysis.
 */
export const minimax: SearchAlgorithm = (position, { budgetMs }, { clock }) => {
	const root = deepen(budgetMs, clock, (depth, outOfTime) =>
		minimaxPass(position, depth, outOfTime),
	);
	return {
		chosenMove: chosenChild(root)?.move ?? null,
		evaluation: root.evaluation,
		analysis: { root },
	};
};

function minimaxPass(
	position: Position,
	depth: number,
	outOfTime: () => boolean,
): PassResult<EvaluatedNode> | null {
	// Lives in this call, not the module, so every pass numbers its nodes from 0.
	let nextId = 0;
	let stoppedByDepth = false;

	function visit(
		fen: Position,
		move: string | null,
		remaining: number,
		ply: number,
	): EvaluatedNode | null {
		if (outOfTime()) return null;
		const id = nextId++;
		const common = { id, fen, move, depth: remaining, entry: null, exit: null };
		const ongoing = status(fen) === "ongoing";
		if (remaining === 0 || !ongoing) {
			if (ongoing) stoppedByDepth = true;
			return {
				...common,
				evaluation: staticEvaluationAtPly(fen, ply),
				pruned: false,
				children: [],
			};
		}
		const children: EvaluatedNode[] = [];
		for (const san of legalMoves(fen)) {
			const child = visit(play(fen, san), san, remaining - 1, ply + 1);
			if (child === null) return null;
			children.push(child);
		}
		const evaluations = children.map((c) => c.evaluation);
		const evaluation =
			sideToMove(fen) === "w"
				? Math.max(...evaluations)
				: Math.min(...evaluations);
		return { ...common, evaluation, pruned: false, children };
	}

	const root = visit(position, null, depth, 0);
	return root === null ? null : { root, stoppedByDepth };
}
