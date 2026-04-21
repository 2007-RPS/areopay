# AeroPay Elite API Reference

This document describes the local backend API used by the frontend.

## 1. Base URL

The API runs locally on port 8080.

- Base path: `/api`
- Dev URL: `http://localhost:8080/api`

## 2. Common Response Shape

Most endpoints return a JSON object in this shape:

```json
{
  "ok": true,
  "data": {}
}
```

Errors use this shape:

```json
{
  "ok": false,
  "code": "VALIDATION_ERROR",
  "message": "Search payload is invalid"
}
```

Some validation errors also include a `fields` object.

## 3. Health

### GET `/api/health`

Returns readiness and basic counts.

Useful fields:

- `dataReady`
- `flightCount`
- `bookingCount`
- `eventCount`
- `uptimeSeconds`

## 4. Wallet

### GET `/api/wallet`

Returns the current wallet state.

Typical fields:

- `balance`
- `travelPoints`
- `escrowHeld`

## 5. Bookings

### GET `/api/bookings`

Returns the local booking list, capped to the latest 100 records.

### POST `/api/bookings`

Saves a booking record locally.

### GET `/api/bookings/:bookingId`

Returns one booking by ID.

### PATCH `/api/bookings/:bookingId`

Updates booking state.

### POST `/api/bookings/:bookingId/refund-request`

Moves a booking into refund-processing state.

## 6. Boarding Pass

### GET `/api/boarding-pass/:pnr`

Returns a mock boarding pass preview for the requested PNR.

Useful fields:

- `pnr`
- `gate`
- `zone`
- `seat`
- `boardingTime`
- `status`

## 7. Airports

### GET `/api/airports?codes=DEL,NRT,ZZZ`

Returns airport metadata for the requested comma-separated codes.

Response data:

- `airports`: known airport objects keyed by code
- `missing`: codes that are not supported

This endpoint powers the live route map preview.

## 8. Route Intelligence

### GET `/api/routes/intel?from=DEL&to=NRT`

Returns route-level metadata for the selected origin and destination.

Useful fields:

- `from`
- `to`
- `weather`
- `delayRisk`
- `alternates`
- `generatedAt`

This endpoint powers the results page, booking detail page, and live map overlays.

## 9. Search

### POST `/api/search`

Runs the concierge-style search.

Request body shape:

```json
{
  "prompt": "Find me a business flight to Tokyo under $1200 next Tuesday",
  "search": {
    "from": "DEL",
    "to": "NRT",
    "cabin": "Business",
    "tripType": "round-trip",
    "budget": 1200,
    "nonStopOnly": false
  }
}
```

Response data:

- `results`: enriched flight offers

The backend validates search payloads and returns `VALIDATION_ERROR` if the request is malformed.

## 10. Price Freeze

### POST `/api/price-freeze`

Returns a mock freeze quote based on fare and demand.

Useful fields:

- `lockFee`
- `validHours`
- `volatility`
- `estimatedUpside`
- `recommendedFor`

## 11. BNPL

### POST `/api/bnpl/assess`

Returns a financing assessment for the selected fare.

Useful fields:

- `riskBand`
- `apr`
- `approved`
- `suggestedDownPayment`
- `plans`
- `reason`

## 12. Corporate Approval

### POST `/api/corporate/approval/request`

Creates or reuses a manager approval token for out-of-policy bookings.

Useful fields:

- `token`
- `approvedBy`

## 13. Seat Lock

### POST `/api/seat-lock/start`

Starts a temporary seat lock.

### GET `/api/seat-lock/:lockId`

Checks remaining lock time.

## 14. Escrow

### POST `/api/escrow/hold`

Creates a temporary escrow hold during payment.

### POST `/api/escrow/confirm`

Confirms escrow after successful booking completion.

### POST `/api/escrow/refund`

Releases escrow after a refund or failed flow.

## 15. Payment

### POST `/api/payment`

Processes split payment with idempotency support.

Important request fields:

- `amount`
- `walletPart`
- `cardPart`
- `idempotencyKey`
- `outOfPolicy`
- `approvalToken`

Important behavior:

- Repeated requests with the same idempotency key return replayed results.
- Out-of-policy payments require a manager approval token.

## 16. Invoice

### POST `/api/invoice/pdf`

Generates a PDF invoice for the selected booking.

This is used by the checkout page when the user exports the invoice.

---

## 17. Detailed Response Examples

### GET `/api/health`

```json
{
  "ok": true,
  "data": {
    "ok": true,
    "dataReady": true,
    "flightCount": 1200,
    "bookingCount": 45,
    "eventCount": 892,
    "uptimeSeconds": 3642
  }
}
```

### POST `/api/search` Success

```json
{
  "ok": true,
  "data": {
    "results": [
      {
        "offerId": "DEL-NRT-BIZ-001",
        "carrier": "AI",
        "from": "DEL",
        "to": "NRT",
        "departAt": "2026-04-28T14:30:00Z",
        "arriveAt": "2026-04-29T08:15:00Z",
        "fare": 1050,
        "cabin": "Business",
        "stops": 0,
        "policyCompliance": {
          "isOutOfPolicy": false,
          "violatedRules": []
        },
        "estRouteIntelDelay": 12
      }
    ]
  }
}
```

### POST `/api/search` Validation Error

```json
{
  "ok": false,
  "code": "VALIDATION_ERROR",
  "message": "Search payload is invalid",
  "fields": {
    "budget": "Budget must be a positive number",
    "from": "Invalid airport code"
  }
}
```

### POST `/api/bnpl/assess` Approved

```json
{
  "ok": true,
  "data": {
    "riskBand": "low",
    "apr": 8.5,
    "approved": true,
    "suggestedDownPayment": 250,
    "plans": [
      {
        "months": 3,
        "monthlyPayment": 291.67,
        "totalInterest": 25
      },
      {
        "months": 6,
        "monthlyPayment": 158.33,
        "totalInterest": 50
      }
    ],
    "reason": "Good credit history"
  }
}
```

### POST `/api/price-freeze`

```json
{
  "ok": true,
  "data": {
    "lockFee": 25,
    "validHours": 48,
    "volatility": "medium",
    "estimatedUpside": 75,
    "recommendedFor": "high-demand routes"
  }
}
```

### POST `/api/corporate/approval/request` Out-of-Policy

```json
{
  "ok": true,
  "data": {
    "token": "CORP-APPROVAL-7f2c9e1d",
    "approvedBy": "manager@company.com",
    "approvalStatus": "pending"
  }
}
```

### POST `/api/payment` Success

```json
{
  "ok": true,
  "data": {
    "transactionId": "TXN-2026-04-28-12345",
    "walletDeducted": 500,
    "cardCharged": 650,
    "totalProcessed": 1150,
    "status": "completed",
    "confirmationCode": "CONF-ABC123"
  }
}
```

### POST `/api/payment` Idempotent Replay

```json
{
  "ok": true,
  "data": {
    "transactionId": "TXN-2026-04-28-12345",
    "walletDeducted": 500,
    "cardCharged": 650,
    "totalProcessed": 1150,
    "status": "completed",
    "confirmationCode": "CONF-ABC123",
    "replayed": true,
    "replayedAt": "2026-04-28T15:22:10Z"
  }
}
```

---

## 18. Error Code Glossary

These error codes are returned in the `code` field when `ok` is `false`.

| Code | Meaning | Recovery |
|------|---------|----------|
| `VALIDATION_ERROR` | Request payload failed schema validation (check `fields` object) | Correct input and retry |
| `INVALID_AIRPORT` | Airport code is not recognized | Use valid IATA codes (DEL, NRT, SFO, etc.) |
| `PRICE_MISMATCH` | Price changed between search and booking | Run new search and retry |
| `SEAT_UNAVAILABLE` | Selected seat was just booked by another user | Choose different seat and retry |
| `INSUFFICIENT_WALLET` | Wallet balance is less than requested wallet split | Reduce wallet split or add payment method |
| `LOCK_EXPIRED` | Seat lock has expired; must re-lock seats | Call seat-lock/start again |
| `BNPL_DECLINED` | BNPL financing was declined | Use alternative payment method |
| `APPROVAL_REQUIRED` | Out-of-policy booking requires manager approval | Request approval via corporate endpoint |
| `INVALID_IDEMPOTENCY_KEY` | Idempotency key format is malformed | Use UUID v4 format |
| `DUPLICATE_BOOKING` | Booking with same itinerary already exists | Check history or modify itinerary |
| `PAYMENT_DECLINED` | Card payment was declined by processor | Try different card or contact issuer |
| `ESCROW_HOLD_FAILED` | Could not place escrow hold on fare | Retry payment with reduced amount |

---

## 19. Mock Data Reference

The local backend uses in-memory mock data for development. Here's what's available:

### Airport Codes Supported

Common codes: `DEL`, `BOM`, `BLR`, `NYC`, `LAX`, `SFO`, `LHR`, `CDG`, `NRT`, `HND`, `SYD`, `ZZZ` (unknown)

Full list is in [api/mockData.js](api/mockData.js).

### Mock Bookings

The backend starts with 5-10 pre-seeded bookings for testing the trip history and dashboard:

- PNRs: `INR001` through `INR010`
- Mix of completed and cancelled statuses
- Mix of cabin types (Economy, Business, First)
- Dates spanning past 90 days and next 180 days

### Mock Search Results

Each search returns 15-25 flight offers with:

- Realistic fare variations (±15% around base fare)
- Mix of cabin classes (Economy, Business, First)
- Random delay risks (0-45%)
- Policy compliance flags for business-class budget overrides
- 0-2 stops per flight

### Mock User Wallet

- Starts with balance: ₹50,000
- Travel Points: 15,000
- Escrow Held: ₹0 (updates during checkout)

### Mock Payment Results

- ~90% of payments succeed
- ~5% BNPL assessments are declined
- ~5% corporate approvals require manager review
- Seat locks last 15 minutes (mock)
- Price freezes last 48 hours (mock)

---

## 20. Local Development Setup

### Prerequisites

1. **Node.js**: Version 18+ (check: `node --version`)
2. **npm**: Version 9+ (check: `npm --version`)
3. **Port Availability**: Ports 8080 (API) and 5173 (frontend) must be free

### Start Development

From the project root:

```powershell
# Terminal 1 - Start the mock API
npm run dev:api

# Terminal 2 - Start the frontend dev server
npm run dev:web

# Terminal 3 (optional) - Run tests in watch mode
npm run test:web -- --watch
```

### Verify Setup

- API health: Visit `http://localhost:8080/api/health` in browser
- Frontend: Visit `http://localhost:5173` in browser
- Both should show success responses or loaded pages without CORS errors

### Local Storage Persistence

The app uses browser localStorage to persist:

- Search history
- Wallet transactions
- Approval tokens
- ESG round-up donations
- Dashboard preferences

To reset: Open DevTools Console → `localStorage.clear()` → Refresh page
