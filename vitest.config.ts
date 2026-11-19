import { defineConfig } from "vitest/config";

// One root run reaches every workspace; each package owns its own test config.
export default defineConfig({
	test: {
		projects: ["packages/*"],
		// Lists every test by project so a run shows it reached each workspace.
		reporters: ["verbose"],
	},
});
