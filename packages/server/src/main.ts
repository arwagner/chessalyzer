// The only module that touches the process: everything else takes the port and seed source as arguments.
import { randomInt } from "node:crypto";
import { portFrom } from "./port.ts";
import { startServer } from "./server.ts";

const server = await startServer({
	port: portFrom(process.argv.slice(2), process.env),
	host: process.env.HOST ?? "127.0.0.1",
	// Non-negative and below 2^31 so a seed reads cleanly and fits any 32-bit PRNG an algorithm might use.
	deps: { newSeed: () => randomInt(0, 2 ** 31) },
});
console.log(`chessalyzer server listening on ${server.url}`);
