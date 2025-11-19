import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { useUiStore } from "./stores/useUiStore";

// Initialize theme before first paint
try {
    useUiStore.getState().initTheme();
} catch (e) {
    // ignore if store not ready; Layout will still render
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
