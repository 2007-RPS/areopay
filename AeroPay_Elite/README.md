# AeroPay Elite

AeroPay Elite is an MVP of an Intelligent Travel Bank with fintech-first travel booking workflows.

Backend scope is local development only (localhost), with frontend as the primary focus.

## Highlights

- Aero-Wallet with escrow hold and instant refund triggers.
- Agentic BNPL offers for selected flights.
- Price arbitrage and price freeze module.
- ESG tracker with carbon neutralization round-up.
- Corporate policy guard with manager approval branch.
- 4-step checkout and multi-source payment split.
- Idempotent payment processing and biometric confirm mock.
- Real-time seat lock timer and offline-first service worker caching.

## Project Structure

- web: React + Vite frontend
- api: Express backend mock APIs

## Run Locally

1. Start dev from project root (recommended)

```powershell
npm run dev
```

This works from the AeroPay_Elite folder and starts web with API auto-start.

2. Start web directly (API auto-starts)

```powershell
cd web
npm install
npm run dev
```

This command now starts the API automatically if it is not already running.

3. Optional: start API manually (advanced)

```powershell
cd api
npm install
npm run dev
```

Frontend runs on http://localhost:5173 and API runs on http://localhost:8080.

## Troubleshooting

- If API is unreachable, frontend now shows explicit messages like: "API server is unreachable. Start backend service and retry."
- If an endpoint is wrong, API returns a specific 404 payload with route + method.
- If request JSON is malformed, API returns a specific INVALID_JSON error.

## Documentation

- [FEATURES_AND_WORKFLOW.md](FEATURES_AND_WORKFLOW.md) explains the main features and user flows.
- [OOPS_CONCEPTS.md](OOPS_CONCEPTS.md) explains the OOP ideas used in the codebase.
- [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md) gives a compact system overview.
- [API_REFERENCE.md](API_REFERENCE.md) lists the local API endpoints and response shapes.
- [TESTING_GUIDE.md](TESTING_GUIDE.md) explains how to run and understand the test suite.

## Run Tests

API integration tests:

```powershell
cd api
npm test
```

Frontend integration test + build:

```powershell
cd web
npm test
npm run build
```
