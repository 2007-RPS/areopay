import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const webDir = resolve(__dirname, "..");
const apiDir = resolve(__dirname, "..", "..", "api");
const healthUrl = process.env.API_HEALTH_URL || "http://localhost:8080/api/health";

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

async function wait(ms) {
  await new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

async function isApiHealthy() {
  try {
    const res = await fetch(healthUrl);
    return res.ok;
  } catch {
    return false;
  }
}

function runProcess(label, cwd, args) {
  const command = isWin ? "cmd.exe" : npmCmd;
  const commandArgs = isWin
    ? ["/d", "/s", "/c", `${npmCmd} ${args.join(" ")}`]
    : args;

  const proc = spawn(command, commandArgs, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  proc.on("error", (err) => {
    console.error(`[${label}] failed to start:`, err.message);
  });
  return proc;
}

let apiProc = null;
let webProc = null;

async function main() {
  const apiAlreadyRunning = await isApiHealthy();
  if (apiAlreadyRunning) {
    console.log("[dev] API already running on http://localhost:8080");
  } else {
    console.log("[dev] Starting API server...");
    apiProc = runProcess("api", apiDir, ["run", "dev"]);

    let healthy = false;
    for (let i = 0; i < 30; i += 1) {
      await wait(350);
      healthy = await isApiHealthy();
      if (healthy) break;
    }

    if (!healthy) {
      console.warn("[dev] API did not report healthy status yet. Starting web anyway.");
    } else {
      console.log("[dev] API is healthy.");
    }
  }

  console.log("[dev] Starting web server...");
  webProc = runProcess("web", webDir, ["run", "dev:web"]);

  webProc.on("exit", (code) => {
    if (apiProc && !apiProc.killed) {
      apiProc.kill("SIGTERM");
    }
    process.exit(code ?? 0);
  });
}

function shutdown() {
  if (webProc && !webProc.killed) {
    webProc.kill("SIGTERM");
  }
  if (apiProc && !apiProc.killed) {
    apiProc.kill("SIGTERM");
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((err) => {
  console.error("[dev] Startup failed:", err.message);
  shutdown();
  process.exit(1);
});

