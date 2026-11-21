import {
	type Position,
	parsePosition,
	play,
	type Trace,
	type TraceNode,
} from "@chessalyzer/engine";
import { describe, expect, test } from "vitest";
import {
	collapseAll,
	type Expanded,
	expandAll,
	initialExpanded,
	selectNode,
	toggleNode,
	visibleRows,
} from "../src/traceTree.ts";

const parsed = parsePosition(
	"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
);
if (!parsed.ok) throw new Error(parsed.error);
const START = parsed.position;
const E4 = play(START, "e4");
const D4 = play(START, "d4");

// Hand-built so each test can say exactly which rows it expects; scores are chosen, not searched.
function node(
	id: number,
	fen: Position,
	move: string | null,
	score: number | null,
	children: TraceNode[] = [],
): TraceNode {
	return {
		id,
		fen,
		move,
		depth: 0,
		entry: null,
		exit: null,
		score,
		pruned: score === null,
		children,
	};
}

// White to move at the root picks e4 (30 beats 10); after e4, Black's best reply is e5 (30 beats 50).
const trace: Trace = {
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
	visibleRows(trace, expanded).map((r) => r.id);

describe("visibleRows", () => {
	test("by default shows the root and its children, but not their children", () => {
		expect(visibleRows(trace, initialExpanded(trace))).toEqual([
			{
				id: 0,
				level: 0,
				move: null,
				score: 30,
				chosen: false,
				hasChildren: true,
				expanded: true,
			},
			{
				id: 1,
				level: 1,
				move: "e4",
				score: 30,
				chosen: true,
				hasChildren: true,
				expanded: false,
			},
			{
				id: 4,
				level: 1,
				move: "d4",
				score: 10,
				chosen: false,
				hasChildren: true,
				expanded: false,
			},
		]);
	});

	test("lists an expanded node's children straight after it, one level deeper", () => {
		const rows = visibleRows(trace, toggleNode(initialExpanded(trace), 1));
		expect(rows.map((r) => [r.id, r.level])).toEqual([
			[0, 0],
			[1, 1],
			[2, 2],
			[3, 2],
			[4, 1],
		]);
	});

	test("flags the first child scoring the same as its parent as the chosen move", () => {
		const rows = visibleRows(trace, expandAll(trace));
		expect(rows.filter((r) => r.chosen).map((r) => r.move)).toEqual([
			"e4",
			"e5",
			"d5",
		]);
	});

	test("a leaf has no children", () => {
		const rows = visibleRows(trace, expandAll(trace));
		expect(rows.find((r) => r.id === 2)?.hasChildren).toBe(false);
	});

	test("a pruned node comes through with a null score and is never chosen", () => {
		const rows = visibleRows(trace, expandAll(trace));
		expect(rows.find((r) => r.id === 6)).toMatchObject({
			score: null,
			chosen: false,
		});
	});
});

describe("expand and collapse", () => {
	test("toggling a node shows its children, and toggling it again hides them", () => {
		const opened = toggleNode(initialExpanded(trace), 4);
		expect(ids(opened)).toEqual([0, 1, 4, 5, 6]);
		expect(ids(toggleNode(opened, 4))).toEqual([0, 1, 4]);
	});

	test("toggling does not change the state it was given", () => {
		const before = initialExpanded(trace);
		toggleNode(before, 4);
		expect(ids(before)).toEqual([0, 1, 4]);
	});

	test("collapsing a node hides its whole subtree, and reopening it restores what was open below", () => {
		const deep = toggleNode(toggleNode(initialExpanded(trace), 1), 0);
		expect(ids(deep)).toEqual([0]);
		expect(ids(toggleNode(deep, 0))).toEqual([0, 1, 2, 3, 4]);
	});

	test("expand all shows every node", () => {
		expect(ids(expandAll(trace))).toEqual([0, 1, 2, 3, 4, 5, 6]);
	});

	test("collapse all leaves only the root", () => {
		expect(visibleRows(trace, collapseAll())).toEqual([
			{
				id: 0,
				level: 0,
				move: null,
				score: 30,
				chosen: false,
				hasChildren: true,
				expanded: false,
			},
		]);
	});
});

describe("selectNode", () => {
	test("gives the FEN of the selected node, however deep", () => {
		expect(selectNode(trace, 1)).toBe(E4);
		expect(selectNode(trace, 6)).toBe(play(D4, "Nf6"));
	});

	test("gives the root FEN for an id not in the trace", () => {
		expect(selectNode(trace, 99)).toBe(START);
	});
});
