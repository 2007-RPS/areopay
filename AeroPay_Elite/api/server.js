import cors from "cors";
import express from "express";
import PDFDocument from "pdfkit";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { appendEvent, loadState, readSeededFlights, saveState } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT || 8080);
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (origin === ORIGIN || DEV_ORIGIN_PATTERN.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
}));
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' http://localhost:5173 http://localhost:5174 http://localhost:5175 http://localhost:8080");
  next();
});

function createRateLimiter(maxRequests, windowMs) {
  const counters = new Map();
  return (req, res, next) => {
    const ip = req.ip || "unknown";
    const now = Date.now();
    const bucket = counters.get(ip) || [];
    const active = bucket.filter((t) => now - t < windowMs);
    if (active.length >= maxRequests) {
      return res.status(429).json({ ok: false, message: "Rate limit exceeded" });
    }
    active.push(now);
    counters.set(ip, active);
    next();
  };
}

app.use(createRateLimiter(120, 60_000));

const initialState = loadState();
let wallet = initialState.wallet;

const rates = {
  USD: 1,
  EUR: 0.91,
  INR: 83.4,
  SGD: 1.36,
  AED: 3.67,
};

const AIRPORTS = {
  DEL: { code: "DEL", name: "Indira Gandhi International", city: "Delhi", lat: 28.5562, lng: 77.1 },
  NRT: { code: "NRT", name: "Narita International", city: "Tokyo", lat: 35.772, lng: 140.3929 },
  SIN: { code: "SIN", name: "Changi Airport", city: "Singapore", lat: 1.3644, lng: 103.9915 },
  BOM: { code: "BOM", name: "Chhatrapati Shivaji Maharaj International", city: "Mumbai", lat: 19.0896, lng: 72.8656 },
  JFK: { code: "JFK", name: "John F. Kennedy International", city: "New York", lat: 40.6413, lng: -73.7781 },
  LHR: { code: "LHR", name: "Heathrow Airport", city: "London", lat: 51.47, lng: -0.4543 },
  DXB: { code: "DXB", name: "Dubai International", city: "Dubai", lat: 25.2532, lng: 55.3657 },
  CDG: { code: "CDG", name: "Charles de Gaulle", city: "Paris", lat: 49.0097, lng: 2.5479 },
  BLR: { code: "BLR", name: "Kempegowda International", city: "Bengaluru", lat: 13.1986, lng: 77.7066 },
  SFO: { code: "SFO", name: "San Francisco International", city: "San Francisco", lat: 37.6213, lng: -122.379 },
  LAX: { code: "LAX", name: "Los Angeles International", city: "Los Angeles", lat: 33.9416, lng: -118.4085 },
  MIA: { code: "MIA", name: "Miami International", city: "Miami", lat: 25.7959, lng: -80.287 },
  TYO: { code: "TYO", name: "Tokyo (Metro)", city: "Tokyo", lat: 35.6762, lng: 139.6503 },
};

const policyConfig = {
  budgetCap: 1400,
  preferredCarriers: ["AeroBlue", "Skylink", "NDCX"],
  maxCabin: "Business",
};

const flights = readSeededFlights();

const seatLocks = new Map(Object.entries(initialState.seatLocks || {}));
const escrowLedger = new Map(Object.entries(initialState.escrowLedger || {}));
const idempotencyStore = new Map(Object.entries(initialState.idempotencyStore || {}));
const approvals = new Map(Object.entries(initialState.approvals || {}));
const seededFlightCount = flights.length;

if (seededFlightCount > 0) {
  console.log(`[api] Loaded ${seededFlightCount} seeded flights.`);
} else {
  console.warn("[api] No seeded flights loaded from data/flights-data.json.");
}

function syncState() {
  saveState({
    wallet,
    approvals: Object.fromEntries(approvals.entries()),
    seatLocks: Object.fromEntries(seatLocks.entries()),
    escrowLedger: Object.fromEntries(escrowLedger.entries()),
    idempotencyStore: Object.fromEntries(idempotencyStore.entries()),
  });
}

function sendError(res, status, code, message, fields) {
  const body = { ok: false, code, message };
  if (fields && Object.keys(fields).length > 0) {
    body.fields = fields;
  }
  return res.status(status).json(body);
}

function parsePositiveMoney(value, fieldName, fields) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    fields[fieldName] = "Must be a positive number";
    return null;
  }
  return Number(amount.toFixed(2));
}

function validateSearchPayload(body) {
  const fields = {};
  const prompt = String(body?.prompt || "").trim();
  if (prompt.length > 1000) {
    fields.prompt = "Prompt must be 1000 characters or fewer";
  }

  const search = body?.search || {};
  const budget = search.budget === undefined || search.budget === null || search.budget === ""
    ? null
    : Number(search.budget);
  if (budget !== null && (!Number.isFinite(budget) || budget <= 0)) {
    fields["search.budget"] = "Budget must be a positive number";
  }

  ["from", "to", "cabin", "tripType"].forEach((field) => {
    if (search[field] !== undefined && typeof search[field] !== "string") {
      fields[`search.${field}`] = "Must be a string";
    }
  });

  if (search.nonStopOnly !== undefined && typeof search.nonStopOnly !== "boolean") {
    fields["search.nonStopOnly"] = "Must be a boolean";
  }

  return { valid: Object.keys(fields).length === 0, fields, prompt, search };
}

function getBookingById(bookingId) {
  const state = loadState();
  const bookings = Array.isArray(state.bookings) ? state.bookings : [];
  return bookings.find((item) => item.id === bookingId) || null;
}

function saveBooking(nextBooking) {
  const state = loadState();
  const bookings = Array.isArray(state.bookings) ? state.bookings : [];
  const nextBookings = bookings.some((item) => item.id === nextBooking.id)
    ? bookings.map((item) => (item.id === nextBooking.id ? nextBooking : item))
    : [nextBooking, ...bookings];

  saveState({
    ...state,
    bookings: nextBookings.slice(0, 100),
  });

  appendEvent({
    type: "booking_saved",
    at: new Date().toISOString(),
    bookingId: nextBooking.id,
    offerId: nextBooking.offerId,
  });

  return nextBooking;
}

function updateBooking(bookingId, patch, eventType = "booking_updated") {
  const state = loadState();
  const bookings = Array.isArray(state.bookings) ? state.bookings : [];
  const index = bookings.findIndex((item) => item.id === bookingId);
  if (index < 0) {
    return null;
  }

  const nextBooking = {
    ...bookings[index],
    ...patch,
  };

  saveState({
    ...state,
    bookings: bookings.map((item) => (item.id === bookingId ? nextBooking : item)),
  });

  appendEvent({
    type: eventType,
    at: new Date().toISOString(),
    bookingId,
    status: nextBooking.status || "UPDATED",
  });

  return nextBooking;
}

function validateBookingTransition(currentStatus, nextStatus) {
  if (!nextStatus || nextStatus === currentStatus) {
    return { valid: true };
  }

  const transitions = {
    CONFIRMED: ["REFUND_PROCESSING", "RESCHEDULE_REQUESTED", "CANCELLED"],
    REFUND_PROCESSING: ["REFUNDED"],
    RESCHEDULE_REQUESTED: ["CONFIRMED", "RESCHEDULED"],
    REFUNDED: [],
    CANCELLED: [],
  };

  const allowed = transitions[currentStatus] || ["CONFIRMED", "PENDING", "BOOKED", "RESCHEDULE_REQUESTED", "REFUND_PROCESSING", "CANCELLED", "RESCHEDULED", "REFUNDED"];
  return {
    valid: allowed.includes(nextStatus),
    allowed,
  };
}

function totalFare(flight) {
  return Number((flight.baseFare + flight.taxes).toFixed(2));
}

function cabinRank(cabin) {
  if (cabin === "First") return 4;
  if (cabin === "Business") return 3;
  if (cabin === "Premium Economy") return 2;
  return 1;
}

function computePolicyStatus(flight) {
  const price = totalFare(flight);
  const withinBudget = price <= policyConfig.budgetCap;
  const preferredCarrier = policyConfig.preferredCarriers.includes(flight.carrier);
  const cabinWithin = cabinRank(flight.cabin) <= cabinRank(policyConfig.maxCabin);
  const inPolicy = withinBudget && preferredCarrier && cabinWithin;
  return {
    inPolicy,
    reasons: [
      !withinBudget ? "Exceeds budget cap" : null,
      !preferredCarrier ? "Carrier outside preferred list" : null,
      !cabinWithin ? "Cabin exceeds policy" : null,
    ].filter(Boolean),
  };
}

function computeValueScore(flight) {
  const price = totalFare(flight);
  const priceEfficiency = Math.max(10, 100 - price / 20);
  return Math.round((flight.comfortScore * 0.55 + priceEfficiency * 0.45));
}

function getFlightDurationMinutes(flight) {
  const departure = new Date(flight.departure).getTime();
  const arrival = new Date(flight.arrival).getTime();
  if (!Number.isFinite(departure) || !Number.isFinite(arrival) || arrival <= departure) {
    return 0;
  }
  return Math.round((arrival - departure) / 60000);
}

function enrichFlight(flight) {
  const fare = totalFare(flight);
  const durationMinutes = getFlightDurationMinutes(flight);
  return {
    ...flight,
    fare,
    durationMin: durationMinutes,
    stops: flight.stops ?? (flight.cabin === "Economy" ? 1 : 0),
    valueScore: computeValueScore(flight),
    policy: computePolicyStatus(flight),
    bestFinancialRoute: Object.entries(rates)
      .map(([currency, rate]) => ({ currency, amount: Number((fare * rate).toFixed(2)) }))
      .sort((a, b) => a.amount - b.amount)[0],
  };
}

function buildFreezePlan(flight) {
  const fare = totalFare(flight);
  const demandIndex = Number(flight.demandIndex || 0.5);
  const lockFee = Number((fare * (0.012 + demandIndex * 0.02)).toFixed(2));
  const volatility = demandIndex > 0.75 ? "High" : demandIndex > 0.5 ? "Medium" : "Low";
  const estimatedUpside = Number((fare * (0.04 + demandIndex * 0.06)).toFixed(2));

  return {
    lockFee,
    validHours: 48,
    volatility,
    estimatedUpside,
    recommendedFor: volatility !== "Low",
  };
}

function buildBnplPlan(flight) {
  const fare = totalFare(flight);
  const walletBuffer = Number(wallet.balance || 0) + 1200;
  const utilization = fare > 0 ? Math.min(1, fare / Math.max(1, walletBuffer)) : 0;
  const riskBand = utilization > 0.75 ? "High" : utilization > 0.45 ? "Medium" : "Low";
  const apr = riskBand === "High" ? 0.18 : riskBand === "Medium" ? 0.12 : 0.07;
  const downPayment = Number((fare * (riskBand === "High" ? 0.25 : riskBand === "Medium" ? 0.18 : 0.12)).toFixed(2));
  const plans = [3, 6, 9].map((months) => {
    const installment = Number((((fare - downPayment) * (1 + apr)) / months).toFixed(2));
    return { months, apr, installment };
  });

  return {
    riskBand,
    apr,
    approved: riskBand !== "High" || fare <= policyConfig.budgetCap,
    suggestedDownPayment: downPayment,
    plans,
    reason:
      riskBand === "Low"
        ? "Strong match for light financing"
        : riskBand === "Medium"
          ? "Use a down payment to reduce monthly load"
          : "Consider manager approval or a larger upfront amount",
  };
}

function resolveAirport(code) {
  if (!code) return null;
  return AIRPORTS[String(code).toUpperCase()] || null;
}

function computeMidpoint(fromAirport, toAirport, curve = 0.0) {
  const midLat = (fromAirport.lat + toAirport.lat) / 2 + curve;
  const midLng = (fromAirport.lng + toAirport.lng) / 2 + curve * 1.8;
  return [Number(midLat.toFixed(4)), Number(midLng.toFixed(4))];
}

function buildRouteIntel(fromCode, toCode) {
  const fromAirport = resolveAirport(fromCode);
  const toAirport = resolveAirport(toCode);
  if (!fromAirport || !toAirport) {
    return null;
  }

  const distanceIndex = Math.min(1, Math.abs(fromAirport.lng - toAirport.lng) / 180);
  const delayScore = Number((0.28 + distanceIndex * 0.45).toFixed(2));
  const weatherSeverity = delayScore > 0.65 ? "elevated" : delayScore > 0.45 ? "moderate" : "low";

  const alternateA = {
    id: `${fromCode}-${toCode}-ALT-A`,
    label: "Northern jet stream path",
    etaDeltaMin: 18,
    carbonDeltaKg: 22,
    waypoints: [
      [fromAirport.lat, fromAirport.lng],
      computeMidpoint(fromAirport, toAirport, 6.2),
      [toAirport.lat, toAirport.lng],
    ],
  };

  const alternateB = {
    id: `${fromCode}-${toCode}-ALT-B`,
    label: "Southern smoother air path",
    etaDeltaMin: 25,
    carbonDeltaKg: 12,
    waypoints: [
      [fromAirport.lat, fromAirport.lng],
      computeMidpoint(fromAirport, toAirport, -5.1),
      [toAirport.lat, toAirport.lng],
    ],
  };

  return {
    from: fromAirport,
    to: toAirport,
    weather: {
      severity: weatherSeverity,
      from: fromAirport.city,
      to: toAirport.city,
      enRouteWindKts: Math.round(42 + delayScore * 38),
      note: weatherSeverity === "elevated"
        ? "Convective build-up likely near midpoint corridor"
        : weatherSeverity === "moderate"
          ? "Patchy turbulence expected in cruise segment"
          : "Stable corridor with light headwinds",
    },
    delayRisk: {
      score: delayScore,
      label: delayScore > 0.65 ? "High" : delayScore > 0.45 ? "Medium" : "Low",
      reasons: [
        "Hub congestion trend",
        weatherSeverity === "elevated" ? "Weather re-route probability" : "Seasonal flow variability",
      ],
    },
    alternates: [alternateA, alternateB],
    generatedAt: new Date().toISOString(),
  };
}

app.get("/api/health", (req, res) => {
  const state = loadState();
  res.json({
    ok: true,
    dataReady: seededFlightCount > 0,
    flightCount: seededFlightCount,
    bookingCount: Array.isArray(state.bookings) ? state.bookings.length : 0,
    eventCount: Array.isArray(state.analytics?.events) ? state.analytics.events.length : 0,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/wallet", (req, res) => {
  res.json({ ok: true, data: wallet });
});

app.get("/api/bookings", (req, res) => {
  res.json({ ok: true, data: (loadState().bookings || []).slice(0, 100) });
});

app.get("/api/boarding-pass/:pnr", (req, res) => {
  const { pnr } = req.params;
  res.json({
    ok: true,
    data: {
      pnr,
      gate: "A12",
      zone: "Priority",
      seat: "4A",
      boardingTime: "2026-04-22T05:45:00Z",
      status: "Ready",
    },
  });
});

app.get("/api/airports", (req, res) => {
  const codesRaw = String(req.query?.codes || "").trim();
  if (!codesRaw) {
    return sendError(res, 400, "VALIDATION_ERROR", "codes query parameter is required", {
      codes: "Provide comma-separated airport codes",
    });
  }

  const codes = codesRaw
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  const found = {};
  const missing = [];
  codes.forEach((code) => {
    const airport = resolveAirport(code);
    if (airport) {
      found[code] = airport;
    } else {
      missing.push(code);
    }
  });

  res.json({ ok: true, data: { airports: found, missing } });
});

app.get("/api/routes/intel", (req, res) => {
  const from = String(req.query?.from || "").trim().toUpperCase();
  const to = String(req.query?.to || "").trim().toUpperCase();
  if (!from || !to) {
    return sendError(res, 400, "VALIDATION_ERROR", "from and to query parameters are required", {
      from: "Required",
      to: "Required",
    });
  }

  const intel = buildRouteIntel(from, to);
  if (!intel) {
    return sendError(res, 404, "ROUTE_NOT_SUPPORTED", `No route intelligence available for ${from} -> ${to}`);
  }

  res.json({ ok: true, data: intel });
});

app.post("/api/search", (req, res) => {
  const validation = validateSearchPayload(req.body);
  if (!validation.valid) {
    return sendError(res, 400, "VALIDATION_ERROR", "Search payload is invalid", validation.fields);
  }

  const { prompt, search } = validation;
  const query = prompt.toLowerCase();
  const budgetFromPrompt = query.match(/under\s*\$?(\d+)/);
  const budget = Number(search.budget || budgetFromPrompt?.[1] || Number.POSITIVE_INFINITY);
  const from = String(search.from || "").toUpperCase();
  const to = String(search.to || "").toUpperCase();
  const cabin = String(search.cabin || "").trim();
  const tripType = String(search.tripType || "round-trip");
  const nonStopOnly = Boolean(search.nonStopOnly);

  const results = flights
    .map(enrichFlight)
    .filter((flight) => (!from || flight.from === from))
    .filter((flight) => (!to || flight.to === to))
    .filter((flight) => (!cabin || flight.cabin === cabin))
    .filter((flight) => (tripType === "one-way" ? true : true))
    .filter((flight) => (!nonStopOnly || flight.stops === 0))
    .filter((flight) => flight.fare <= budget)
    .sort((a, b) => b.valueScore - a.valueScore);

  appendEvent({
    type: "search",
    at: new Date().toISOString(),
    query: { prompt, search },
    resultCount: results.length,
  });

  res.json({ ok: true, data: { query: prompt, policyConfig, results, rates } });
});

app.post("/api/bnpl/assess", (req, res) => {
  const fields = {};
  const fare = parsePositiveMoney(req.body?.fare, "fare", fields);
  if (!fields.fare && fare === null) {
    fields.fare = "Must be a positive number";
  }
  if (Object.keys(fields).length > 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "BNPL payload is invalid", fields);
  }
  const flight = flights.find((item) => totalFare(item) === fare) || { demandIndex: 0.5, baseFare: fare, taxes: 0, cabin: "Business", comfortScore: 80 };
  res.json({ ok: true, data: { ...buildBnplPlan(flight), fare } });
});

app.post("/api/price-freeze", (req, res) => {
  const fields = {};
  const fare = parsePositiveMoney(req.body?.fare, "fare", fields);
  const demandIndex = Number(req.body?.demandIndex ?? 0.5);
  if (!Number.isFinite(demandIndex) || demandIndex < 0 || demandIndex > 1) {
    fields.demandIndex = "Must be a number between 0 and 1";
  }
  if (Object.keys(fields).length > 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "Price freeze payload is invalid", fields);
  }
  const flight = flights.find((item) => totalFare(item) === fare && Number(item.demandIndex || 0.5) === demandIndex) || { baseFare: fare, taxes: 0, demandIndex };
  res.json({ ok: true, data: { ...buildFreezePlan(flight), fare } });
});

app.post("/api/corporate/approval/request", (req, res) => {
  const offerId = String(req.body?.offerId || "");
  const reasons = Array.isArray(req.body?.reasons) ? req.body.reasons : [];
  if (!offerId) return res.status(400).json({ ok: false, message: "Offer ID required" });

  const token = `APR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const approval = {
    token,
    offerId,
    reasons,
    approvedBy: "manager.mock@aeropay.local",
    approvedAt: new Date().toISOString(),
  };
  approvals.set(token, approval);
  syncState();
  res.json({ ok: true, data: approval });
});

app.get("/api/corporate/approval/:token", (req, res) => {
  const token = String(req.params.token || "");
  const approval = approvals.get(token);
  if (!approval) return res.status(404).json({ ok: false, message: "Approval not found" });
  res.json({ ok: true, data: approval });
});

app.post("/api/seat-lock/start", (req, res) => {
  const offerId = String(req.body?.offerId || "");
  const lockId = crypto.randomUUID();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  seatLocks.set(lockId, { lockId, offerId, expiresAt });
  syncState();
  res.json({ ok: true, data: { lockId, offerId, expiresAt } });
});

app.get("/api/seat-lock/:lockId", (req, res) => {
  const lock = seatLocks.get(req.params.lockId);
  if (!lock) return res.status(404).json({ ok: false, message: "Lock not found" });
  const remainingMs = Math.max(0, lock.expiresAt - Date.now());
  res.json({ ok: true, data: { ...lock, remainingMs, active: remainingMs > 0 } });
});

app.post("/api/escrow/hold", (req, res) => {
  const fields = {};
  const offerId = String(req.body?.offerId || "").trim();
  const holdAmount = parsePositiveMoney(req.body?.amount, "amount", fields);
  if (!offerId) {
    fields.offerId = "Offer ID is required";
  }
  if (Object.keys(fields).length > 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "Escrow payload is invalid", fields);
  }
  const escrowId = crypto.randomUUID();
  wallet.escrowHeld = Number((wallet.escrowHeld + holdAmount).toFixed(2));
  escrowLedger.set(escrowId, {
    escrowId,
    offerId,
    amount: holdAmount,
    status: "HELD",
    createdAt: new Date().toISOString(),
  });
  syncState();
  res.json({ ok: true, data: escrowLedger.get(escrowId) });
});

app.post("/api/escrow/confirm", (req, res) => {
  const escrowId = String(req.body?.escrowId || "");
  const pnr = String(req.body?.pnr || "PNR-MOCK-2026");
  const entry = escrowLedger.get(escrowId);
  if (!entry) return res.status(404).json({ ok: false, message: "Escrow not found" });
  if (entry.status !== "HELD") return res.status(409).json({ ok: false, message: "Escrow already finalized" });
  entry.status = "PNR_CONFIRMED";
  entry.pnr = pnr;
  wallet.escrowHeld = Number((wallet.escrowHeld - entry.amount).toFixed(2));
  wallet.balance = Number((wallet.balance - entry.amount).toFixed(2));
  syncState();
  res.json({ ok: true, data: entry, wallet });
});

app.post("/api/escrow/refund", (req, res) => {
  const escrowId = String(req.body?.escrowId || "");
  const entry = escrowLedger.get(escrowId);
  if (!entry) return res.status(404).json({ ok: false, message: "Escrow not found" });
  if (entry.status !== "HELD") return res.status(409).json({ ok: false, message: "Escrow already finalized" });
  entry.status = "REFUND_TRIGGERED";
  wallet.escrowHeld = Number((wallet.escrowHeld - entry.amount).toFixed(2));
  syncState();
  res.json({ ok: true, data: entry, wallet });
});

app.post("/api/payment", (req, res) => {
  const key = String(req.headers["x-idempotency-key"] || req.body?.idempotencyKey || "");
  if (!key) return sendError(res, 400, "VALIDATION_ERROR", "Missing idempotency key", { idempotencyKey: "Required" });
  if (idempotencyStore.has(key)) {
    return res.json({ ok: true, replay: true, data: idempotencyStore.get(key) });
  }

  const fields = {};
  const amount = parsePositiveMoney(req.body?.amount, "amount", fields);
  const walletPart = parsePositiveMoney(req.body?.walletPart, "walletPart", fields) || 0;
  const cardPart = parsePositiveMoney(req.body?.cardPart, "cardPart", fields) || 0;
  const outOfPolicy = Boolean(req.body?.outOfPolicy);
  const approvalToken = String(req.body?.approvalToken || "");

  if (Object.keys(fields).length > 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "Payment payload is invalid", fields);
  }

  if (outOfPolicy) {
    const approval = approvals.get(approvalToken);
    if (!approval) {
      return sendError(res, 403, "MANAGER_APPROVAL_REQUIRED", "Manager approval required");
    }
  }

  if (Math.abs(walletPart + cardPart - amount) > 0.01) {
    return sendError(res, 400, "PAYMENT_SPLIT_MISMATCH", "Payment split mismatch", {
      amount: "Must equal walletPart + cardPart",
    });
  }

  if (walletPart > wallet.balance) {
    return sendError(res, 400, "WALLET_FUNDS_INSUFFICIENT", "Wallet funds insufficient");
  }

  wallet.balance = Number((wallet.balance - walletPart).toFixed(2));
  const response = {
    paymentId: `PAY-${Date.now()}`,
    amount,
    walletPart,
    cardPart,
    status: "AUTHORIZED",
    sessionKey: key,
    approvedAt: new Date().toISOString(),
  };
  idempotencyStore.set(key, response);
  syncState();
  res.json({ ok: true, replay: false, data: response, wallet });
});

app.post("/api/bookings", (req, res) => {
  const booking = req.body || {};
  if (!booking.id || !booking.offerId) {
    return sendError(res, 400, "VALIDATION_ERROR", "Booking payload is invalid", {
      id: "Booking ID is required",
      offerId: "Offer ID is required",
    });
  }
  const nextBooking = {
    ...booking,
    createdAt: booking.createdAt || new Date().toISOString(),
  };
  saveBooking(nextBooking);
  res.json({ ok: true, data: nextBooking });
});

app.get("/api/bookings/:bookingId", (req, res) => {
  const booking = getBookingById(String(req.params.bookingId || ""));
  if (!booking) {
    return sendError(res, 404, "BOOKING_NOT_FOUND", "Booking not found");
  }
  res.json({ ok: true, data: booking });
});

app.post("/api/bookings/:bookingId/refund-request", (req, res) => {
  const bookingId = String(req.params.bookingId || "");
  const booking = getBookingById(bookingId);
  if (!booking) {
    return sendError(res, 404, "BOOKING_NOT_FOUND", "Booking not found");
  }
  if (booking.status === "REFUNDED") {
    return sendError(res, 409, "BOOKING_ALREADY_REFUNDED", "Booking already refunded");
  }

  const patch = {
    status: "REFUND_PROCESSING",
    refund: {
      ...(booking.refund || {}),
      stage: "PROCESSING",
      requestedAt: new Date().toISOString(),
      requestReason: String(req.body?.reason || "customer_request"),
    },
    timeline: [
      ...(booking.timeline || []),
      {
        code: "REFUND_REQUESTED",
        label: "Refund requested",
        at: new Date().toISOString(),
        note: String(req.body?.reason || "Customer requested refund."),
      },
    ],
  };

  const updated = updateBooking(bookingId, patch, "booking_refund_requested");
  res.json({ ok: true, data: updated });
});

app.patch("/api/bookings/:bookingId", (req, res) => {
  const bookingId = String(req.params.bookingId || "");
  const patch = req.body || {};
  const current = getBookingById(bookingId);
  if (!current) {
    return sendError(res, 404, "BOOKING_NOT_FOUND", "Booking not found");
  }

  if (patch.status && patch.status !== current.status) {
    const transition = validateBookingTransition(current.status, patch.status);
    if (!transition.valid) {
      return sendError(res, 409, "INVALID_BOOKING_STATE", `Cannot transition booking from ${current.status} to ${patch.status}`, {
        status: `Allowed transitions: ${transition.allowed.join(", ") || "none"}`,
      });
    }
  }

  const nextBooking = updateBooking(bookingId, patch);
  res.json({ ok: true, data: nextBooking });
});

app.post("/api/invoice/pdf", (req, res) => {
  const payload = req.body || {};
  const mode = payload.mode || "Personal";
  const total = Number(payload.total || 0);
  const gst = Number((total * 0.05).toFixed(2));
  const carbonContribution = Number(payload.carbonContribution || 0);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=invoice-aeropay-elite.pdf");

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(20).text("AeroPay Elite Invoice", { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice ID: INV-${Date.now()}`);
  doc.text(`Mode: ${mode}`);
  doc.text(`Tax ID: ${payload.taxId || "N/A"}`);
  doc.text(`Company: ${payload.companyName || "N/A"}`);
  doc.text(`Trip Offer: ${payload.offerId || "N/A"}`);
  doc.moveDown();
  doc.text(`Base Amount: USD ${total.toFixed(2)}`);
  doc.text(`GST (5%): USD ${gst.toFixed(2)}`);
  doc.text(`Carbon Neutralization: USD ${carbonContribution.toFixed(2)}`);
  doc.text(`Grand Total: USD ${(total + gst + carbonContribution).toFixed(2)}`);
  doc.moveDown();
  doc.text("Compliance: NDC-ready mock invoice for MVP integration.");
  doc.end();
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    code: "ROUTE_NOT_FOUND",
    message: `No API route found for ${req.method} ${req.path}`,
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      ok: false,
      code: "INVALID_JSON",
      message: "Malformed JSON body. Please check request payload.",
    });
  }

  if (err?.message?.startsWith("CORS blocked for origin")) {
    return res.status(403).json({
      ok: false,
      code: "CORS_BLOCKED",
      message: err.message,
    });
  }

  return res.status(500).json({
    ok: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error occurred.",
  });
});

export { app };

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  app.listen(PORT, () => {
    console.log(`AeroPay Elite API running on http://localhost:${PORT}`);
  });
}
