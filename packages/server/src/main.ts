// The only module that touches the process: everything else takes the port, seed source and clock as arguments.
import { randomInt } from "node:crypto";
import { portFrom } from "./port.ts";
import { startServer } from "./server.ts";

const server = await startServer({
	port: portFrom(process.argv.slice(2), process.env),
	host: process.env.HOST,
	deps: {
		// Non-negative and below 2^31 so a seed reads cleanly and fits any 32-bit PRNG an algorithm might use.
		newSeed: () => randomInt(0, 2 ** 31),
		// Monotonic, unlike Date.now, so a wall-clock adjustment cannot stretch or cut short a search budget.
		clock: () => performance.now(),
	},
});
console.log(`chessalyzer server listening on ${server.url}`);
