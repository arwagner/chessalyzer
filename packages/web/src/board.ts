/** A FEN piece letter (`K`, `q`, ...) or null for an empty square. */
export type Square = string | null;

/** Eight ranks from rank 8 down to rank 1, each eight files from a to h, as a board is drawn for White. */
export type Squares = readonly (readonly Square[])[];

const PIECES = /^[KQRBNPkqrbnp]$/;

/**
 * Reads only the FEN's piece placement, since that is all the board draws. Null when the placement is
 * malformed: the board still has to draw something while the editor is typing a FEN.
 */
export function boardSquares(fen: string): Squares | null {
	const placement = fen.trim().split(/\s+/)[0] ?? "";
	const ranks = placement.split("/");
	if (ranks.length !== 8) return null;
	const squares: Square[][] = [];
	for (const rank of ranks) {
		const row: Square[] = [];
		for (const c of rank) {
			if (PIECES.test(c)) row.push(c);
			else if (c >= "1" && c <= "8") {
				for (let i = 0; i < Number(c); i++) row.push(null);
			} else return null;
		}
		if (row.length !== 8) return null;
		squares.push(row);
	}
	return squares;
}

export function emptySquares(): Squares {
	return Array.from({ length: 8 }, () => Array<Square>(8).fill(null));
}

/** Square name such as `e4`, from row and column indices as `boardSquares` lays them out. */
export function squareName(row: number, col: number): string {
	return `${"abcdefgh"[col]}${8 - row}`;
}

const GLYPHS: Readonly<Record<string, string>> = {
	K: "♔",
	Q: "♕",
	R: "♖",
	B: "♗",
	N: "♘",
	P: "♙",
	k: "♚",
	q: "♛",
	r: "♜",
	b: "♝",
	n: "♞",
	p: "♟",
};

export function glyph(piece: string): string {
	return GLYPHS[piece] ?? "";
}
