import {
	type Analysis,
	chosenChild,
	type Node,
	type Position,
} from "@chessalyzer/core";

/**
 * The ids of the nodes whose children are shown. Kept apart from the analysis so a new search's analysis
 * can be dropped in without the view model owning it, and so a collapsed node remembers what was open
 * beneath it when it is reopened.
 */
export type Expanded = ReadonlySet<number>;

/** One line of the tree view. */
export type TreeRow = {
	readonly id: number;
	/**
	 * How far below the root this node sits (the root is 0). Not the glossary's depth, which counts plies
	 * left to search and is on the node.
	 */
	readonly level: number;
	readonly move: string | null;
	readonly evaluation: number | null;
	/** The move the search settled on from the parent: see `chosenChild`. Never true for the root. */
	readonly chosen: boolean;
	readonly hasChildren: boolean;
	readonly expanded: boolean;
};

/** The root starts open so the first view shows the moves considered at the root, and nothing deeper. */
export function initialExpanded(analysis: Analysis): Expanded {
	return new Set([analysis.root.id]);
}

export function toggleNode(expanded: Expanded, id: number): Expanded {
	const next = new Set(expanded);
	if (!next.delete(id)) next.add(id);
	return next;
}

export function expandAll(analysis: Analysis): Expanded {
	const ids = new Set<number>();
	walk(analysis.root, (n) => {
		if (n.children.length > 0) ids.add(n.id);
	});
	return ids;
}

/** The root is always shown, so collapsing everything leaves just the root row. */
export function collapseAll(): Expanded {
	return new Set();
}

/** Rows in display order: each node, then its children if it is expanded, depth first in move order. */
export function visibleRows(analysis: Analysis, expanded: Expanded): TreeRow[] {
	const rows: TreeRow[] = [];
	function add(n: Node, level: number, chosen: boolean): void {
		const open = expanded.has(n.id);
		rows.push({
			id: n.id,
			level,
			move: n.move,
			evaluation: n.evaluation,
			chosen,
			hasChildren: n.children.length > 0,
			expanded: open,
		});
		if (!open) return;
		const pick = chosenChild(n);
		for (const c of n.children) add(c, level + 1, c === pick);
	}
	add(analysis.root, 0, false);
	return rows;
}

/** The position to show on the board. An unknown id (say, from a previous search's analysis) falls back to the root. */
export function selectNode(analysis: Analysis, id: number): Position {
	return find(analysis.root, id)?.fen ?? analysis.root.fen;
}

function find(n: Node, id: number): Node | undefined {
	if (n.id === id) return n;
	for (const c of n.children) {
		const hit = find(c, id);
		if (hit) return hit;
	}
	return undefined;
}

function walk(n: Node, visit: (n: Node) => void): void {
	visit(n);
	for (const c of n.children) walk(c, visit);
}
