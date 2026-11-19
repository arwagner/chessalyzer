import type { Algorithm, SearchResult } from "@chessalyzer/engine";
import { type FormEvent, useState } from "react";
import { Board } from "./Board.tsx";
import { type FetchFn, runSearch } from "./searchClient.ts";
import { TraceTree } from "./TraceTree.tsx";
import {
	type Expanded,
	initialExpanded,
	selectNode,
	toggleNode,
} from "./traceTree.ts";

export const START_FEN =
	"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** The algorithms offered in the picker; more join as the engine gains them. */
const ALGORITHMS: readonly Algorithm[] = ["random"];

// The server rejects anything deeper: the trace grows too big to send or draw.
const DEPTHS = [1, 2, 3, 4, 5] as const;

type Shown = {
	readonly result: SearchResult;
	readonly seed: number | undefined;
	readonly expanded: Expanded;
	readonly selected: number;
};

/** `fetchFn` is the network, passed in so tests can stand in for the server. */
export function App({ fetchFn }: { readonly fetchFn: FetchFn }) {
	const [fen, setFen] = useState(START_FEN);
	const [algorithm, setAlgorithm] = useState<Algorithm>("random");
	const [seedText, setSeedText] = useState("");
	const [depth, setDepth] = useState(1);
	const [running, setRunning] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [shown, setShown] = useState<Shown | null>(null);

	async function run(event: FormEvent): Promise<void> {
		event.preventDefault();
		setRunning(true);
		const seed = seedText.trim() === "" ? undefined : Number(seedText);
		const outcome = await runSearch(
			{ fen, algorithm, depth, ...(seed === undefined ? {} : { seed }) },
			fetchFn,
		);
		setRunning(false);
		if (outcome.ok) {
			const { trace } = outcome.result;
			setError(null);
			setShown({
				result: outcome.result,
				seed: outcome.seed,
				expanded: initialExpanded(trace),
				selected: trace.root.id,
			});
		} else {
			setError(outcome.error.message);
			// A result left up would no longer match the form, so it goes with the failed run.
			setShown(null);
		}
	}

	// Before any search the board previews what the user typed.
	const boardFen = shown ? selectNode(shown.result.trace, shown.selected) : fen;

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
					Depth{" "}
					<select
						value={depth}
						onChange={(e) => setDepth(Number(e.target.value))}
					>
						{DEPTHS.map((d) => (
							<option key={d} value={d}>
								{d}
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
					Best move <strong>{shown.result.bestMove ?? "none"}</strong>, score{" "}
					<strong>{shown.result.score}</strong>, seed{" "}
					<strong>{shown.seed ?? "unknown"}</strong>
				</p>
			)}
			<div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
				<Board fen={boardFen} />
				{shown && (
					<TraceTree
						trace={shown.result.trace}
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
