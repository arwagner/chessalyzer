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

	// Before any search the board previews what the editor typed.
	const boardFen = shown
		? selectNode(shown.result.analysis, shown.selected)
		: fen;

	return (
		<>
			<header className="masthead">
				<div className="masthead-inner">
					<a className="brand" href="#workspace">
						<span className="brand-mark" aria-hidden="true" />
						chessalyzer
					</a>
					<nav aria-label="Workspace sections">
						<a href="#position">Position</a>
						<a href="#search">Search</a>
						<a href="#analysis">Analysis</a>
					</nav>
				</div>
			</header>
			<main id="workspace" className="workspace">
				<h1>Analysis workspace</h1>
				<div className="workspace-grid">
					<Board fen={boardFen} />
					<div className="inspector">
						<section id="search" className="panel">
							<div className="panel-heading">
								<h2>Search setup</h2>
							</div>
							<form onSubmit={run}>
								<div className="field">
									<label htmlFor="fen">FEN</label>
									<textarea
										id="fen"
										rows={2}
										value={fen}
										onChange={(e) => setFen(e.target.value)}
										spellCheck={false}
										autoCapitalize="none"
									/>
								</div>
								<div className="field-pair">
									<div className="field">
										<label htmlFor="algorithm">Algorithm</label>
										<select
											id="algorithm"
											value={algorithm}
											onChange={(e) =>
												setAlgorithm(e.target.value as Algorithm)
											}
										>
											{ALGORITHMS.map((a) => (
												<option key={a} value={a}>
													{a}
												</option>
											))}
										</select>
									</div>
									<div className="field">
										<label htmlFor="budget">Budget (ms)</label>
										<select
											id="budget"
											value={budgetMs}
											onChange={(e) => setBudgetMs(Number(e.target.value))}
										>
											{BUDGETS.map((b) => (
												<option key={b} value={b}>
													{b}
												</option>
											))}
										</select>
									</div>
								</div>
								<div className="field">
									<label htmlFor="seed">Seed</label>
									<input
										id="seed"
										value={seedText}
										onChange={(e) => setSeedText(e.target.value)}
										inputMode="numeric"
										placeholder="Automatic"
									/>
								</div>
								<button className="run" type="submit" disabled={running}>
									<span className="play" aria-hidden="true" />
									{running ? "Running…" : "Run search"}
								</button>
								{error !== null && (
									<p className="error" role="alert">
										{error}
									</p>
								)}
							</form>
						</section>
						<section id="analysis" className="panel">
							<div className="panel-heading">
								<h2>Analysis</h2>
							</div>
							{shown ? (
								<>
									<section aria-label="Search result">
										<dl className="result">
											<div>
												<dt>Chosen move</dt>
												<dd>{shown.result.chosenMove ?? "None"}</dd>
											</div>
											<div>
												<dt>Evaluation</dt>
												<dd>{shown.result.evaluation} cp</dd>
											</div>
											<div>
												<dt>Search depth</dt>
												<dd>{shown.result.analysis.root.depth}</dd>
											</div>
											<div>
												<dt>Seed</dt>
												<dd>{shown.seed}</dd>
											</div>
										</dl>
									</section>
									<AnalysisTree
										analysis={shown.result.analysis}
										expanded={shown.expanded}
										selected={shown.selected}
										onToggle={(id) =>
											setShown({
												...shown,
												expanded: toggleNode(shown.expanded, id),
											})
										}
										onSelect={(id) => setShown({ ...shown, selected: id })}
									/>
								</>
							) : (
								<div className="empty-analysis">
									<svg
										aria-hidden="true"
										viewBox="0 0 32 32"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.7"
									>
										<path d="M8 9v14m0-6h10a6 6 0 0 0 6-6V9" />
										<circle cx="8" cy="6" r="3" />
										<circle cx="8" cy="26" r="3" />
										<circle cx="24" cy="6" r="3" />
									</svg>
									<p>
										{running
											? "Searching the position…"
											: "Run a search to explore its variations."}
									</p>
								</div>
							)}
						</section>
					</div>
				</div>
			</main>
		</>
	);
}
