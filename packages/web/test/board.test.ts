import { describe, expect, test } from "vitest";
import { boardSquares, emptySquares, glyph, squareName } from "../src/board.ts";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("boardSquares", () => {
	test("lays out the start position from rank 8 down, files a to h", () => {
		const squares = boardSquares(START);
		expect(squares?.[0]).toEqual(["r", "n", "b", "q", "k", "b", "n", "r"]);
		expect(squares?.[1]).toEqual(Array(8).fill("p"));
		expect(squares?.[4]).toEqual(Array(8).fill(null));
		expect(squares?.[7]).toEqual(["R", "N", "B", "Q", "K", "B", "N", "R"]);
	});

	test("expands digits into empty squares", () => {
		const squares = boardSquares("8/8/4k3/8/8/4K3/8/Q7 w - - 0 1");
		expect(squares?.[2]).toEqual([
			null,
			null,
			null,
			null,
			"k",
			null,
			null,
			null,
		]);
		expect(squares?.[7]?.[0]).toBe("Q");
	});

	test("needs only the piece placement", () => {
		expect(boardSquares("8/8/8/8/8/8/8/8")).toEqual(emptySquares());
	});

	test.each([
		["too few ranks", "8/8/8/8/8/8/8 w - - 0 1"],
		["a short rank", "7/8/8/8/8/8/8/8 w - - 0 1"],
		["a long rank", "9/8/8/8/8/8/8/8 w - - 0 1"],
		["an unknown piece", "x7/8/8/8/8/8/8/8 w - - 0 1"],
		["nothing", ""],
	])("is null for %s", (_, fen) => {
		expect(boardSquares(fen)).toBeNull();
	});
});

test("squareName names squares as boardSquares lays them out", () => {
	expect(squareName(0, 0)).toBe("a8");
	expect(squareName(7, 7)).toBe("h1");
	expect(squareName(4, 4)).toBe("e4");
});

test("glyph draws each side's pieces differently", () => {
	expect(glyph("K")).toBe("♔");
	expect(glyph("k")).toBe("♚");
	expect(glyph("x")).toBe("");
});
