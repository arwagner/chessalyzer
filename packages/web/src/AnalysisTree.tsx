import type { Analysis } from "@chessalyzer/core";
import { type Expanded, visibleRows } from "./analysisTree.ts";

export type AnalysisTreeProps = {
	readonly analysis: Analysis;
	readonly expanded: Expanded;
	readonly selected: number;
	readonly onToggle: (id: number) => void;
	readonly onSelect: (id: number) => void;
};

const ROOT_LABEL = "start";

/** Draws the rows the analysis tree model gives it; which rows show and which is chosen is decided there. */
export function AnalysisTree({
	analysis,
	expanded,
	selected,
	onToggle,
	onSelect,
}: AnalysisTreeProps) {
	return (
		<ul aria-label="Analysis" style={{ listStyle: "none", padding: 0 }}>
			{visibleRows(analysis, expanded).map((row) => {
				const label = row.move ?? ROOT_LABEL;
				return (
					<li
						key={row.id}
						className={row.chosen ? "chosen" : undefined}
						style={{
							paddingLeft: `${row.ply * 1.25}rem`,
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
						<span>{row.evaluation === null ? "–" : row.evaluation}</span>
					</li>
				);
			})}
		</ul>
	);
}
