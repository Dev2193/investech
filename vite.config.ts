import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { handleResearchRequest } from "./supabase/functions/_shared/researchProxy";

/**
 * Local-development stand-in for the `stock-research` Supabase edge function.
 * Serves POST /api/research from the Vite dev server using the same handler code,
 * reading secrets (SEC_USER_AGENT, FINNHUB_API_KEY, FRED_API_KEY) from .env.local.
 * Those names have no VITE_ prefix, so they are never bundled into client code.
 * The client only uses it when VITE_RESEARCH_TRANSPORT=local.
 */
function researchDevProxy(env: Record<string, string>): Plugin {
  return {
    name: "research-dev-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/research", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        let raw = "";
        req.on("data", (chunk) => (raw += chunk));
        req.on("end", async () => {
          let body: unknown = null;
          try {
            body = JSON.parse(raw);
          } catch {
            // handled as malformed request
          }
          const result = await handleResearchRequest(body as never, (name) => env[name] || process.env[name]);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      researchDevProxy(env),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
