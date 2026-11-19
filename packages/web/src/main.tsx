import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing #root");

createRoot(root).render(
	<StrictMode>
		{/* Wrapped because fetch called as a method of another object, like props.fetchFn(...), throws "Illegal invocation". */}
		<App fetchFn={(url, init) => fetch(url, init)} />
	</StrictMode>,
);
