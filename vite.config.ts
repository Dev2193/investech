import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Where the dev server forwards /api/* (the API in ./server, started by `npm run dev`).
  const apiTarget = env.API_PROXY_TARGET || "http://localhost:8787";
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
