import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const stateFile = path.join(dataDir, "state.json");
const isTestRun = process.env.NODE_ENV === "test"
  || process.env.npm_lifecycle_event === "test"
  || process.env.npm_command === "test"
  || process.execArgv.includes("--test")
  || process.argv.some((arg) => String(arg).includes("node:test"));

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

const defaultState = {
  wallet: {
    currency: "USD",
    balance: 1740.45,
    travelPoints: 12650,
    escrowHeld: 0,
  },
  approvals: {},
  seatLocks: {},
  escrowLedger: {},
  idempotencyStore: {},
  bookings: [],
  analytics: {
    events: [],
  },
};

let memoryState = structuredClone(defaultState);

function cloneState(state) {
  return structuredClone(state);
}

export function loadState() {
  if (isTestRun) {
    return cloneState(memoryState);
  }

  ensureDataDir();
  return {
    ...cloneState(defaultState),
    ...readJson(stateFile, {}),
  };
}

export function saveState(nextState) {
  if (isTestRun) {
    memoryState = {
      ...cloneState(memoryState),
      ...cloneState(nextState),
    };
    return cloneState(memoryState);
  }

  const current = loadState();
  const merged = {
    ...current,
    ...nextState,
  };
  writeJson(stateFile, merged);
  return merged;
}

export function readSeededFlights() {
  const seedPath = path.join(dataDir, "flights-data.json");
  return readJson(seedPath, []);
}

export function appendEvent(event) {
  const state = loadState();
  const nextEvents = [...(state.analytics?.events || []), event].slice(-500);
  saveState({
    ...state,
    analytics: {
      ...(state.analytics || {}),
      events: nextEvents,
    },
  });
}
