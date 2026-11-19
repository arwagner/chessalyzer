import {
	chosenChild,
	type Position,
	type Trace,
	type TraceNode,
} from "@chessalyzer/engine";

/**
 * The ids of the trace nodes whose children are shown. Kept apart from the trace so a new search's trace
 * can be dropped in without the view model owning it, and so a collapsed node remembers what was open
 * beneath it when it is reopened.
 */
export type Expanded = ReadonlySet<number>;

/** One line of the tree view. */
export type TreeRow = {
	readonly id: number;
	/**
	 * How far below the root this node sits (the root is 0). Not the glossary's depth, which counts plies
	 * left to search and is on the trace node.
	 */
	readonly level: number;
	readonly move: string | null;
	readonly score: number | null;
	/** The move the search settled on from the parent: see `chosenChild`. Never true for the root. */
	readonly chosen: boolean;
	readonly hasChildren: boolean;
	readonly expanded: boolean;
};

/** The root starts open so the first view shows the moves considered at the root, and nothing deeper. */
export function initialExpanded(trace: Trace): Expanded {
	return new Set([trace.root.id]);
}

export function toggleNode(expanded: Expanded, id: number): Expanded {
	const next = new Set(expanded);
	if (!next.delete(id)) next.add(id);
	return next;
}

export function expandAll(trace: Trace): Expanded {
	const ids = new Set<number>();
	walk(trace.root, (n) => {
		if (n.children.length > 0) ids.add(n.id);
	});
	return ids;
}

/** The root is always shown, so collapsing everything leaves just the root row. */
export function collapseAll(): Expanded {
	return new Set();
}

/** Rows in display order: each node, then its children if it is expanded, depth first in move order. */
export function visibleRows(trace: Trace, expanded: Expanded): TreeRow[] {
	const rows: TreeRow[] = [];
	function add(n: TraceNode, level: number, chosen: boolean): void {
		const open = expanded.has(n.id);
		rows.push({
			id: n.id,
			level,
			move: n.move,
			score: n.score,
			chosen,
			hasChildren: n.children.length > 0,
			expanded: open,
		});
		if (!open) return;
		const best = chosenChild(n);
		for (const c of n.children) add(c, level + 1, c === best);
	}
	add(trace.root, 0, false);
	return rows;
}

/** The position to show on the board. An unknown id (say, from a previous search) falls back to the root. */
export function selectNode(trace: Trace, id: number): Position {
	return find(trace.root, id)?.fen ?? trace.root.fen;
}

function find(n: TraceNode, id: number): TraceNode | undefined {
	if (n.id === id) return n;
	for (const c of n.children) {
		const hit = find(c, id);
		if (hit) return hit;
	}
	return undefined;
}

function walk(n: TraceNode, visit: (n: TraceNode) => void): void {
	visit(n);
	for (const c of n.children) walk(c, visit);
}
