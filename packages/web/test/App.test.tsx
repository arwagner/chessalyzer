// @vitest-environment jsdom
import { parsePosition, type SearchResult, search } from "@chessalyzer/core";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { App, START_FEN } from "../src/App.tsx";
import type { FetchFn } from "../src/searchClient.ts";

afterEach(cleanup);

const MATE_IN_ONE = "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1";

function searched(fen: string): SearchResult {
	const parsed = parsePosition(fen);
	if (!parsed.ok) throw new Error(parsed.error);
	// random's analysis is one ply deep, so the stub answers with minimax's to give the tree nodes to expand.
	// The fake clock moves on 1 ms a reading, so 500 ms buys minimax a depth 2 search here.
	let now = 0;
	return search(
		parsed.position,
		{ algorithm: "minimax", budgetMs: 500, seed: 0 },
		{ clock: () => now++ },
	);
}

function respond(status: number, body: unknown): FetchFn {
	return async () =>
		new Response(JSON.stringify(body), {
			status,
			headers: { "content-type": "application/json" },
		});
}

function board(): HTMLElement {
	return screen.getByRole("figure", { name: "Board" });
}

function rowOf(move: string): HTMLElement {
	const li = screen.getByRole("button", { name: move }).closest("li");
	if (li === null) throw new Error(`no row for ${move}`);
	return li;
}

async function submitSearch(
	fetchFn: FetchFn,
	fen = MATE_IN_ONE,
): Promise<void> {
	render(<App fetchFn={fetchFn} />);
	fireEvent.change(screen.getByLabelText("FEN"), { target: { value: fen } });
	fireEvent.click(screen.getByRole("button", { name: "Run search" }));
	await screen.findByRole("list", { name: "Analysis" });
}

describe("App", () => {
	test("starts on the start position with every control the form needs", () => {
		render(<App fetchFn={respond(500, {})} />);

		expect(screen.getByLabelText("FEN")).toHaveProperty("value", START_FEN);
		expect(board().dataset.fen).toBe(START_FEN);
		const algorithms = within(screen.getByLabelText("Algorithm")).getAllByRole(
			"option",
		);
		expect(algorithms.map((o) => o.textContent)).toEqual(["random"]);
		const budget = screen.getByLabelText("Budget (ms)");
		expect(
			within(budget)
				.getAllByRole("option")
				.map((o) => o.textContent),
		).toEqual(["100", "250", "500", "1000", "2000", "5000"]);
		expect(budget).toHaveProperty("value", "500");
		expect(screen.getByLabelText("Seed")).toBeTruthy();
	});

	test("labels the side to move as the position preview changes", () => {
		render(<App fetchFn={respond(500, {})} />);
		expect(within(board()).getByText("White to move")).toBeTruthy();
		fireEvent.change(screen.getByLabelText("FEN"), {
			target: { value: START_FEN.replace(" w ", " b ") },
		});
		expect(within(board()).getByText("Black to move")).toBeTruthy();
		fireEvent.change(screen.getByLabelText("FEN"), { target: { value: "?" } });
		expect(within(board()).queryByText(/to move/)).toBeNull();
	});

	test("sends the form's values to the search client", async () => {
		const bodies: unknown[] = [];
		const fetchFn: FetchFn = async (url, init) => {
			bodies.push({ url, body: JSON.parse(init.body) });
			return respond(200, { ...searched(MATE_IN_ONE), seed: 9 })(url, init);
		};
		render(<App fetchFn={fetchFn} />);
		fireEvent.change(screen.getByLabelText("FEN"), {
			target: { value: MATE_IN_ONE },
		});
		fireEvent.change(screen.getByLabelText("Budget (ms)"), {
			target: { value: "2000" },
		});
		fireEvent.change(screen.getByLabelText("Seed"), { target: { value: "9" } });
		fireEvent.click(screen.getByRole("button", { name: "Run search" }));
		await screen.findByRole("list", { name: "Analysis" });

		expect(bodies).toEqual([
			{
				url: "/api/search",
				body: {
					fen: MATE_IN_ONE,
					algorithm: "random",
					budgetMs: 2000,
					seed: 9,
				},
			},
		]);
	});

	test("expanding a node and clicking its child shows the child's position on the board", async () => {
		const result = searched(MATE_IN_ONE);
		await submitSearch(respond(200, { ...result, seed: 1 }));
		expect(board().dataset.fen).toBe(MATE_IN_ONE);

		const first = result.analysis.root.children[0];
		const grandchild = first?.children[0];
		if (!first?.move || !grandchild?.move)
			throw new Error("analysis too shallow");
		expect(screen.queryByRole("button", { name: grandchild.move })).toBeNull();

		fireEvent.click(
			screen.getByRole("button", { name: `Expand ${first.move}` }),
		);
		fireEvent.click(screen.getByRole("button", { name: grandchild.move }));

		expect(board().dataset.fen).toBe(grandchild.fen);
		expect(within(board()).getByText(grandchild.fen)).toBeTruthy();
		expect(grandchild.fen).not.toBe(MATE_IN_ONE);
	});

	test("highlights the chosen move's row and only that row among its siblings", async () => {
		const result = searched(MATE_IN_ONE);
		await submitSearch(respond(200, { ...result, seed: 1 }));

		expect(result.chosenMove).toBe("Ra8#");
		expect(rowOf("Ra8#").classList.contains("chosen")).toBe(true);
		const others = result.analysis.root.children.filter(
			(c) => c.move !== "Ra8#",
		);
		expect(others.length).toBeGreaterThan(0);
		for (const c of others) {
			expect(rowOf(c.move ?? "").classList.contains("chosen")).toBe(false);
		}
	});

	test("shows the chosen move, evaluation, search depth and seed of the result", async () => {
		const result = searched(MATE_IN_ONE);
		await submitSearch(respond(200, { ...result, seed: 4321 }));

		const summary = screen.getByRole("region", { name: "Search result" });
		for (const [label, value] of [
			["Chosen move", "Ra8#"],
			["Evaluation", `${result.evaluation} cp`],
			["Search depth", "2"],
			["Seed", "4321"],
		] as const) {
			expect(
				within(summary).getByText(label).nextElementSibling?.textContent,
			).toBe(value);
		}
	});

	test("shows the server's message when it rejects the search with a 400", async () => {
		render(<App fetchFn={respond(400, { error: "invalid FEN: nonsense" })} />);
		fireEvent.change(screen.getByLabelText("FEN"), {
			target: { value: "nonsense" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Run search" }));

		expect((await screen.findByRole("alert")).textContent).toBe(
			"invalid FEN: nonsense",
		);
		expect(screen.queryByRole("list", { name: "Analysis" })).toBeNull();
	});

	test("shows a network failure next to the form", async () => {
		render(
			<App fetchFn={() => Promise.reject(new TypeError("fetch failed"))} />,
		);
		fireEvent.click(screen.getByRole("button", { name: "Run search" }));

		expect((await screen.findByRole("alert")).textContent).toBe("fetch failed");
	});
});
