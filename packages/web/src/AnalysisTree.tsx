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
		<ul aria-label="Analysis" className="analysis-tree">
			{visibleRows(analysis, expanded).map((row) => {
				const label = row.move ?? ROOT_LABEL;
				return (
					<li
						key={row.id}
						className={row.chosen ? "chosen" : undefined}
						style={{ paddingLeft: `${row.ply * 0.75}rem` }}
					>
						{row.hasChildren ? (
							<button
								type="button"
								className="toggle"
								aria-label={`${row.expanded ? "Collapse" : "Expand"} ${label}`}
								aria-expanded={row.expanded}
								onClick={() => onToggle(row.id)}
							>
								{row.expanded ? "▾" : "▸"}
							</button>
						) : (
							// Keeps leaves' moves lined up with their siblings that have a toggle.
							<span className="toggle-space" />
						)}{" "}
						<button
							type="button"
							className="move"
							aria-pressed={row.id === selected}
							onClick={() => onSelect(row.id)}
						>
							{label}
						</button>{" "}
						{row.chosen && <span className="chosen-label">Chosen</span>}
						<span className="node-evaluation">
							{row.evaluation === null ? "–" : `${row.evaluation} cp`}
						</span>
					</li>
				);
			})}
		</ul>
	);
}
