import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	// The search client calls the relative /api/search, so in dev Vite forwards it to `npm start`'s address.
	server: { proxy: { "/api": "http://127.0.0.1:3001" } },
});
