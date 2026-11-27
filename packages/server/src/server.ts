import {
	createServer as createHttpServer,
	type IncomingMessage,
	type Server,
	type ServerResponse,
} from "node:http";
import type { AddressInfo } from "node:net";
import { type Clock, search as coreSearch } from "@chessalyzer/core";
import { parseSearchRequest } from "./request.ts";

export type ServerDeps = {
	/** Where a seed comes from when the request has none. Injected so tests can pin it. */
	readonly newSeed: () => number;
	/** The clock every search measures its budget against. Injected so tests can run searches on fake time. */
	readonly clock: Clock;
	/** Defaults to core's; injectable so tests can make it fail. */
	readonly search?: typeof coreSearch;
};

export type RunningServer = {
	/** Base URL, e.g. `http://127.0.0.1:54321/`, with the port actually bound (useful when asked for 0). */
	readonly url: string;
	readonly close: () => Promise<void>;
};

const SEARCH_PATH = "/api/search";

export function createServer(deps: ServerDeps): Server {
	return createHttpServer((req, res) => {
		handle(req, res, deps).catch((error: unknown) => {
			sendJson(res, 500, { error: message(error) });
		});
	});
}

/** `port` 0 binds an ephemeral port; read the real one from the returned `url`. */
export function startServer(options: {
	readonly port: number;
	readonly host?: string;
	readonly deps: ServerDeps;
}): Promise<RunningServer> {
	const { port, host = "127.0.0.1", deps } = options;
	const server = createServer(deps);
	return new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, host, () => {
			server.off("error", reject);
			const address = server.address() as AddressInfo;
			resolve({
				url: `http://${host}:${address.port}/`,
				close: () => close(server),
			});
		});
	});
}

async function handle(
	req: IncomingMessage,
	res: ServerResponse,
	deps: ServerDeps,
): Promise<void> {
	// The base only exists to let URL parse a path; the host header is never trusted for routing.
	const { pathname } = new URL(req.url ?? "/", "http://localhost");
	if (pathname !== SEARCH_PATH) {
		sendJson(res, 404, { error: `no route for ${pathname}` });
		return;
	}
	// QUERY rather than POST: a search is safe and idempotent, so caches and retries may treat it like GET,
	// but its input is a body rather than a query string.
	if (req.method !== "QUERY") {
		res.setHeader("allow", "QUERY");
		sendJson(res, 405, { error: `${req.method} not allowed; use QUERY` });
		return;
	}

	const parsed = parseSearchRequest(await readBody(req));
	if (!parsed.ok) {
		sendJson(res, 400, { error: parsed.error });
		return;
	}
	const { position, algorithm, budgetMs } = parsed.request;
	const seed = parsed.request.seed ?? deps.newSeed();
	// Echoed so any response, including one whose seed the server picked, can be replayed exactly.
	const result = (deps.search ?? coreSearch)(
		position,
		{ algorithm, budgetMs, seed },
		{ clock: deps.clock },
	);
	sendJson(res, 200, { ...result, seed });
}

async function readBody(req: IncomingMessage): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of req) chunks.push(chunk as Buffer);
	return Buffer.concat(chunks).toString("utf8");
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
	if (res.headersSent) {
		res.destroy();
		return;
	}
	res.statusCode = status;
	res.setHeader("content-type", "application/json; charset=utf-8");
	res.end(JSON.stringify(body));
}

function close(server: Server): Promise<void> {
	return new Promise((resolve, reject) => {
		server.close((error) => (error ? reject(error) : resolve()));
		// fetch keeps connections alive; without this, close waits for them to time out.
		server.closeAllConnections();
	});
}

function message(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
