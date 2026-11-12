// Static Hallmark lint of src/ (studio script; Node only, works on macOS and Windows).
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
const studio = process.env.VEON_WEB_STUDIO || path.join(os.homedir(), "Documents", "ai-web-studio");
const r = spawnSync(process.execPath, [path.join(studio, "quality", "scripts", "hallmark_check.mjs"), "src", "--static"], { stdio: "inherit" });
process.exit(r.status ?? 1);
