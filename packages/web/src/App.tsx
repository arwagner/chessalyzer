import type { Algorithm, SearchResult } from "@chessalyzer/core";
import { type FormEvent, useState } from "react";
import { AnalysisTree } from "./AnalysisTree.tsx";
import {
	type Expanded,
	initialExpanded,
	selectNode,
	toggleNode,
} from "./analysisTree.ts";
import { Board } from "./Board.tsx";
import { type FetchFn, runSearch } from "./searchClient.ts";

export const START_FEN =
	"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Only random for now, as the ticket asks, though search also runs minimax; more join in later tickets. */
const ALGORITHMS: readonly Algorithm[] = ["random"];

// In milliseconds. The server rejects a longer budget: the analysis grows too big to send or draw.
const BUDGETS = [100, 250, 500, 1000, 2000, 5000] as const;

type Shown = {
	readonly result: SearchResult;
	readonly seed: number;
	readonly expanded: Expanded;
	readonly selected: number;
};

/** `fetchFn` is the network, passed in so tests can stand in for the server. */
export function App({ fetchFn }: { readonly fetchFn: FetchFn }) {
	const [fen, setFen] = useState(START_FEN);
	const [algorithm, setAlgorithm] = useState<Algorithm>("random");
	const [seedText, setSeedText] = useState("");
	const [budgetMs, setBudgetMs] = useState<number>(500);
	const [running, setRunning] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [shown, setShown] = useState<Shown | null>(null);

	async function run(event: FormEvent): Promise<void> {
		event.preventDefault();
		setRunning(true);
		const seed = seedText.trim() === "" ? undefined : Number(seedText);
		const outcome = await runSearch(
			{ fen, algorithm, budgetMs, ...(seed === undefined ? {} : { seed }) },
			fetchFn,
		);
		setRunning(false);
		if (outcome.ok) {
			const { analysis } = outcome.result;
			setError(null);
			setShown({
				result: outcome.result,
				seed: outcome.seed,
				expanded: initialExpanded(analysis),
				selected: analysis.root.id,
			});
		} else {
			setError(outcome.error.message);
			// A result left up would no longer match the form, so it goes with the failed run.
			setShown(null);
		}
	}

	// Before any search the board previews what the user typed.
	const boardFen = shown
		? selectNode(shown.result.analysis, shown.selected)
		: fen;

	return (
		<main style={{ fontFamily: "sans-serif", padding: "1rem" }}>
			<h1>chessalyzer</h1>
			<form
				onSubmit={run}
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: "0.5rem",
					alignItems: "center",
				}}
			>
				<label>
					FEN{" "}
					<input
						value={fen}
						onChange={(e) => setFen(e.target.value)}
						size={60}
					/>
				</label>
				<label>
					Algorithm{" "}
					<select
						value={algorithm}
						onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
					>
						{ALGORITHMS.map((a) => (
							<option key={a} value={a}>
								{a}
							</option>
						))}
					</select>
				</label>
				<label>
					Budget (ms){" "}
					<select
						value={budgetMs}
						onChange={(e) => setBudgetMs(Number(e.target.value))}
					>
						{BUDGETS.map((b) => (
							<option key={b} value={b}>
								{b}
							</option>
						))}
					</select>
				</label>
				<label>
					Seed{" "}
					<input
						value={seedText}
						onChange={(e) => setSeedText(e.target.value)}
						inputMode="numeric"
						placeholder="server picks"
						size={12}
					/>
				</label>
				<button type="submit" disabled={running}>
					{running ? "Running…" : "Run"}
				</button>
				{error !== null && (
					<p role="alert" style={{ color: "#b00020", margin: 0 }}>
						{error}
					</p>
				)}
			</form>
			{shown && (
				<p>
					Chosen move <strong>{shown.result.chosenMove ?? "none"}</strong>,
					evaluation <strong>{shown.result.evaluation}</strong>, search depth{" "}
					<strong>{shown.result.analysis.root.depth}</strong>, seed{" "}
					<strong>{shown.seed}</strong>
				</p>
			)}
			<div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
				<Board fen={boardFen} />
				{shown && (
					<AnalysisTree
						analysis={shown.result.analysis}
						expanded={shown.expanded}
						selected={shown.selected}
						onToggle={(id) =>
							setShown({ ...shown, expanded: toggleNode(shown.expanded, id) })
						}
						onSelect={(id) => setShown({ ...shown, selected: id })}
					/>
				)}
			</div>
		</main>
	);
}
