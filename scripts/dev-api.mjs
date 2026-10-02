// Starts the API server (./server) for local development.
// Installs its dependencies on first run so `npm run dev` just works.
import { existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
if (!existsSync("server/node_modules")) {
  console.log("[api] installing server dependencies…");
  const r = spawnSync(npm, ["--prefix", "server", "install", "--no-audit", "--no-fund"], { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error("[api] could not install server dependencies; the web app will run without the API.");
    process.exit(0);
  }
}
const child = spawn(npm, ["--prefix", "server", "run", "dev"], { stdio: "inherit", shell: process.platform === "win32" });
child.on("exit", (code) => process.exit(code ?? 0));
