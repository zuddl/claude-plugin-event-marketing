import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Dev: serve index.html with the widget mounted for local smoke testing.
  // Build: emit a single self-contained widget.js + widget.css that auto-mounts on load.
  build: {
    target: "es2020",
    cssCodeSplit: false,
    rollupOptions: {
      input: "src/main.tsx",
      output: {
        entryFileNames: "widget.js",
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith(".css") ? "widget.css" : "assets/[name]-[hash][extname]",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(command === "build" ? "production" : "development"),
  },
}));
