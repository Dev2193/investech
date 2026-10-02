/**
 * Loads server/.env (if present) into process.env for local development.
 * In production, set real environment variables on the host instead.
 * Imported first in index.ts so config.ts sees the values.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.cwd(), ".env");
if (existsSync(file)) {
  try {
    process.loadEnvFile(file);
  } catch (e) {
    console.warn(`Could not load ${file}: ${(e as Error).message}`);
  }
}
