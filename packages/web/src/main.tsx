import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

createRoot(root).render(
	<StrictMode>
		{/* Wrapped so fetch is called on its own, never as a method of something else. */}
		<App fetchFn={(url, init) => fetch(url, init)} />
	</StrictMode>,
);
