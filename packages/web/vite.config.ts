import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Must match the `--port` in packages/server's `dev` script; a test keeps the two in step.
export const DEV_API_PORT = 3001;

// Pinned and strict so the README's URL is the one you get, rather than Vite quietly picking the next port.
const DEV_WEB_PORT = 5173;

export default defineConfig({
	plugins: [react()],
	server: {
		port: DEV_WEB_PORT,
		strictPort: true,
		// Same origin for the browser, so the search client calls the relative `/api/search` with no CORS and no hard-coded host.
		proxy: { "/api": `http://127.0.0.1:${DEV_API_PORT}` },
	},
});
