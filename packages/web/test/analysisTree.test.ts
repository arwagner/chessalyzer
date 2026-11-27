import {
	type Analysis,
	type Node,
	type Position,
	parsePosition,
	play,
} from "@chessalyzer/core";
import { describe, expect, test } from "vitest";
import {
	collapseAll,
	type Expanded,
	expandAll,
	initialExpanded,
	selectNode,
	toggleNode,
	visibleRows,
} from "../src/analysisTree.ts";

const parsed = parsePosition(
	"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
);
if (!parsed.ok) throw new Error(parsed.error);
const START = parsed.position;
const E4 = play(START, "e4");
const D4 = play(START, "d4");

// Hand-built so each test can say exactly which rows it expects; evaluations are chosen, not searched.
function node(
	id: number,
	fen: Position,
	move: string | null,
	evaluation: number | null,
	children: Node[] = [],
): Node {
	return {
		id,
		fen,
		move,
		depth: 0,
		entry: null,
		exit: null,
		evaluation,
		pruned: evaluation === null,
		children,
	};
}

// White to move at the root picks e4 (30 beats 10); after e4, Black's best reply is e5 (30 beats 50).
const analysis: Analysis = {
	root: node(0, START, null, 30, [
		node(1, E4, "e4", 30, [
			node(2, play(E4, "e5"), "e5", 30),
			node(3, play(E4, "c5"), "c5", 50),
		]),
		node(4, D4, "d4", 10, [
			node(5, play(D4, "d5"), "d5", 10),
			node(6, play(D4, "Nf6"), "Nf6", null),
		]),
	]),
};

const ids = (expanded: Expanded) =>
	visibleRows(analysis, expanded).map((r) => r.id);

describe("visibleRows", () => {
	test("by default shows the root and its children, but not their children", () => {
		expect(visibleRows(analysis, initialExpanded(analysis))).toEqual([
			{
				id: 0,
				level: 0,
				move: null,
				evaluation: 30,
				chosen: false,
				hasChildren: true,
				expanded: true,
			},
			{
				id: 1,
				level: 1,
				move: "e4",
				evaluation: 30,
				chosen: true,
				hasChildren: true,
				expanded: false,
			},
			{
				id: 4,
				level: 1,
				move: "d4",
				evaluation: 10,
				chosen: false,
				hasChildren: true,
				expanded: false,
			},
		]);
	});

	test("lists an expanded node's children straight after it, one level deeper", () => {
		const rows = visibleRows(
			analysis,
			toggleNode(initialExpanded(analysis), 1),
		);
		expect(rows.map((r) => [r.id, r.level])).toEqual([
			[0, 0],
			[1, 1],
			[2, 2],
			[3, 2],
			[4, 1],
		]);
	});

	test("flags the first child evaluated the same as its parent as the chosen move", () => {
		const rows = visibleRows(analysis, expandAll(analysis));
		expect(rows.filter((r) => r.chosen).map((r) => r.move)).toEqual([
			"e4",
			"e5",
			"d5",
		]);
	});

	test("a leaf has no children", () => {
		const rows = visibleRows(analysis, expandAll(analysis));
		expect(rows.find((r) => r.id === 2)?.hasChildren).toBe(false);
	});

	test("a pruned node comes through with a null evaluation and is never chosen", () => {
		const rows = visibleRows(analysis, expandAll(analysis));
		expect(rows.find((r) => r.id === 6)).toMatchObject({
			evaluation: null,
			chosen: false,
		});
	});
});

describe("expand and collapse", () => {
	test("toggling a node shows its children, and toggling it again hides them", () => {
		const opened = toggleNode(initialExpanded(analysis), 4);
		expect(ids(opened)).toEqual([0, 1, 4, 5, 6]);
		expect(ids(toggleNode(opened, 4))).toEqual([0, 1, 4]);
	});

	test("toggling does not change the state it was given", () => {
		const before = initialExpanded(analysis);
		toggleNode(before, 4);
		expect(ids(before)).toEqual([0, 1, 4]);
	});

	test("collapsing a node hides its whole subtree, and reopening it restores what was open below", () => {
		const deep = toggleNode(toggleNode(initialExpanded(analysis), 1), 0);
		expect(ids(deep)).toEqual([0]);
		expect(ids(toggleNode(deep, 0))).toEqual([0, 1, 2, 3, 4]);
	});

	test("expand all shows every node", () => {
		expect(ids(expandAll(analysis))).toEqual([0, 1, 2, 3, 4, 5, 6]);
	});

	test("collapse all leaves only the root", () => {
		expect(visibleRows(analysis, collapseAll())).toEqual([
			{
				id: 0,
				level: 0,
				move: null,
				evaluation: 30,
				chosen: false,
				hasChildren: true,
				expanded: false,
			},
		]);
	});
});

describe("selectNode", () => {
	test("gives the FEN of the selected node, however deep", () => {
		expect(selectNode(analysis, 1)).toBe(E4);
		expect(selectNode(analysis, 6)).toBe(play(D4, "Nf6"));
	});

	test("gives the root FEN for an id not in the analysis", () => {
		expect(selectNode(analysis, 99)).toBe(START);
	});
});
