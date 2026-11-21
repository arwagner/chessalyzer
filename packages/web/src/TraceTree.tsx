import type { Trace } from "@chessalyzer/engine";
import { type Expanded, visibleRows } from "./traceTree.ts";

export type TraceTreeProps = {
	readonly trace: Trace;
	readonly expanded: Expanded;
	readonly selected: number;
	readonly onToggle: (id: number) => void;
	readonly onSelect: (id: number) => void;
};

const ROOT_LABEL = "start";

/** Draws the rows the trace tree model gives it; which rows show and which is chosen is decided there. */
export function TraceTree({
	trace,
	expanded,
	selected,
	onToggle,
	onSelect,
}: TraceTreeProps) {
	return (
		<ul aria-label="Search tree" style={{ listStyle: "none", padding: 0 }}>
			{visibleRows(trace, expanded).map((row) => {
				const label = row.move ?? ROOT_LABEL;
				return (
					<li
						key={row.id}
						className={row.chosen ? "chosen" : undefined}
						style={{
							paddingLeft: `${row.level * 1.25}rem`,
							background: row.chosen ? "#fff3b0" : undefined,
							fontWeight: row.chosen ? "bold" : undefined,
						}}
					>
						{row.hasChildren ? (
							<button
								type="button"
								aria-label={`${row.expanded ? "Collapse" : "Expand"} ${label}`}
								aria-expanded={row.expanded}
								onClick={() => onToggle(row.id)}
							>
								{row.expanded ? "▾" : "▸"}
							</button>
						) : (
							// Keeps leaves' moves lined up with their siblings that have a toggle.
							<span style={{ display: "inline-block", width: "1.6rem" }} />
						)}{" "}
						<button
							type="button"
							aria-pressed={row.id === selected}
							onClick={() => onSelect(row.id)}
						>
							{label}
						</button>{" "}
						<span>{row.score === null ? "–" : row.score}</span>
					</li>
				);
			})}
		</ul>
	);
}
