import { createRoot } from "react-dom/client";
import { Widget } from "./widget";
import "./styles.css";

// Auto-mount: append our own root to <body> so host pages don't need to add
// a placeholder div. If the host already mounted us once (e.g. via HMR in
// dev), skip the second mount.
function mount() {
  if (document.getElementById("event-chatbot-root")) return;
  const root = document.createElement("div");
  root.id = "event-chatbot-root";
  document.body.appendChild(root);
  createRoot(root).render(<Widget />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
