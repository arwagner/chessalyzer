export const DEFAULT_PORT = 3001;

/**
 * The port `main` listens on: `--port <n>` or `--port=<n>`, else `PORT`, else `DEFAULT_PORT`. Takes argv
 * and env as arguments so `main` stays the only code that touches the process.
 */
export function portFrom(
	argv: readonly string[],
	env: Readonly<Record<string, string | undefined>>,
): number {
	const raw = argFor("--port", argv) ?? env.PORT;
	if (raw === undefined) return DEFAULT_PORT;
	const port = Number(raw);
	if (!/^\d+$/.test(raw) || port > 65535) {
		throw new RangeError(`port must be an integer from 0 to 65535, got ${raw}`);
	}
	return port;
}

function argFor(flag: string, argv: readonly string[]): string | undefined {
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === flag) return argv[i + 1] ?? "";
		if (arg?.startsWith(`${flag}=`)) return arg.slice(flag.length + 1);
	}
	return undefined;
}
