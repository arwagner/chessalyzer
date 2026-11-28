import type { ReactNode } from "react";

// One silhouette per piece keeps the two sides identical in shape at every board size.
const shapes: Readonly<Record<string, ReactNode>> = {
	p: <path d="M13 36c0-6 5-7 7-14a7 7 0 1 1 8 0c2 7 7 8 7 14Z" />,
	r: (
		<>
			<path d="M13 36c3-4 4-11 4-16l-5-4V7h6v5h4V7h4v5h4V7h6v9l-5 4c0 5 1 12 4 16Z" />
			<path className="incision" d="M17 20h14" />
		</>
	),
	n: (
		<>
			<path d="M12 36c1-6 6-11 12-16l-5 2-5 5-6-3 3-8 6-8 1-5 5 4 4-3 1 4c9 4 12 14 9 28Z" />
			<path className="incision" d="M27 13c5 4 7 11 6 17" />
			<circle className="eye" cx="18" cy="15" r="1.3" />
		</>
	),
	b: (
		<>
			<path d="M14 36c3-4 5-6 5-10-8-7-3-12 5-21 8 9 13 14 5 21 0 4 2 6 5 10Z" />
			<path className="incision" d="m20 11 5 8m-6 7h10" />
		</>
	),
	q: (
		<>
			<path d="m9 13 8 7 1-12 6 11 6-11 1 12 8-7-7 16 2 7H14l2-7Z" />
			<path className="incision" d="M16 29h16" />
			{[
				[9, 12],
				[18, 7],
				[30, 7],
				[39, 12],
			].map(([cx, cy]) => (
				<circle key={cx} cx={cx} cy={cy} r="2" />
			))}
		</>
	),
	k: (
		<>
			<path d="M22 13V9h-4V6h4V2h4v4h4v3h-4v4c6-4 13 0 11 6l-6 10 3 7H14l3-7-6-10c-2-6 5-10 11-6Z" />
			<path className="incision" d="M24 14v8m-7 7h14" />
		</>
	),
};

export function ChessPiece({ piece }: { readonly piece: string }) {
	return (
		<svg
			aria-hidden="true"
			className={
				piece === piece.toUpperCase()
					? "piece white-piece"
					: "piece black-piece"
			}
			viewBox="0 0 48 48"
		>
			{shapes[piece.toLowerCase()]}
			<path d="M13 35h22l3 5v2H10v-2Z" />
		</svg>
	);
}
