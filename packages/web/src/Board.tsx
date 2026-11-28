import { boardSquares, emptySquares, glyph, squareName } from "./board.ts";
import { ChessPiece } from "./ChessPiece.tsx";

/** A partial FEN can still preview its piece placement while the editor types. */
export function Board({ fen }: { readonly fen: string }) {
	const placement = boardSquares(fen);
	const squares = placement ?? emptySquares();
	const side = placement && fen.trim().split(/\s+/)[1];
	return (
		<figure
			id="position"
			className="panel board-panel"
			aria-label="Board"
			data-fen={fen}
		>
			<figcaption className="panel-heading">
				<h2>Position</h2>
				{(side === "w" || side === "b") && (
					<span className="side">
						<i className={side === "w" ? "white-disc" : "black-disc"} />
						{side === "w" ? "White" : "Black"} to move
					</span>
				)}
			</figcaption>
			<div className="board-frame">
				<div className="ranks coordinates" aria-hidden="true">
					{[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
						<span key={rank}>{rank}</span>
					))}
				</div>
				<div className="squares">
					{squares.flatMap((rank, row) =>
						rank.map((piece, col) => {
							const name = squareName(row, col);
							return (
								<div
									className={
										(row + col) % 2 === 0 ? "square light" : "square dark"
									}
									key={name}
									title={name}
								>
									{piece && (
										<>
											<ChessPiece piece={piece} />
											<span className="sr-only">
												{name} {glyph(piece)}
											</span>
										</>
									)}
								</div>
							);
						}),
					)}
				</div>
				<div className="files coordinates" aria-hidden="true">
					{Array.from("abcdefgh", (file) => (
						<span key={file}>{file}</span>
					))}
				</div>
			</div>
			<div className="fen-caption">
				<span>Displayed FEN</span>
				<code>{fen}</code>
			</div>
		</figure>
	);
}
