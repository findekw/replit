import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import { getApiBase } from "./lib/apiBase";
import App from "./App";
import "./index.css";

setBaseUrl(getApiBase());

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      // Ask for a fresh sw.js on every visit — iOS in particular defers the
      // periodic check, which left phones running a days-old app shell.
      .then((reg) => { reg.update().catch(() => undefined); })
      .catch(() => undefined);
  });
}
