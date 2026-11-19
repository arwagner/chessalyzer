import { boardSquares, emptySquares, glyph, squareName } from "./board.ts";

const SIZE = "2.5rem";

/** Draws a position. A malformed FEN draws an empty board rather than failing while the user types. */
export function Board({ fen }: { readonly fen: string }) {
	const squares = boardSquares(fen) ?? emptySquares();
	return (
		<figure aria-label="Board" data-fen={fen} style={{ margin: 0 }}>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: `repeat(8, ${SIZE})`,
					gridAutoRows: SIZE,
					border: "1px solid #444",
					width: "max-content",
				}}
			>
				{squares.flatMap((rank, row) =>
					rank.map((piece, col) => {
						const name = squareName(row, col);
						return (
							<div
								key={name}
								title={name}
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "1.8rem",
									background: (row + col) % 2 === 0 ? "#eed8b5" : "#b48862",
								}}
							>
								{piece === null ? "" : glyph(piece)}
							</div>
						);
					}),
				)}
			</div>
			<figcaption>
				<code>{fen}</code>
			</figcaption>
		</figure>
	);
}
