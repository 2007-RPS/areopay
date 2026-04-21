# AeroPay Elite Testing Guide

This document explains how to run the automated tests and what each test area covers.

## 1. Test Commands

From the project root:

```powershell
npm run test:api
npm run test:web
npm run build
```

## 2. What Each Command Does

### `npm run test:api`

Runs the API integration tests with Node's built-in test runner.

It covers:

- search validation
- airport lookup
- route intelligence
- booking lifecycle
- payment idempotency
- health checks

### `npm run test:web`

Runs the frontend Vitest suite in run mode.

It covers:

- search validation and prompt syncing
- checkout step gating
- accessibility semantics for form inputs
- booking history filters
- dashboard and trip summaries
- results and refund views
- app-level interaction flows

### `npm run build`

Builds the frontend for production and catches bundle or syntax issues.

## 3. Existing Test Files

### API tests

- [api/api.integration.test.js](api/api.integration.test.js)

### Frontend tests

- [web/src/App.integration.test.jsx](web/src/App.integration.test.jsx)
- [web/src/AuthPage.validation.test.jsx](web/src/AuthPage.validation.test.jsx)
- [web/src/SearchPage.validation.test.jsx](web/src/SearchPage.validation.test.jsx)
- [web/src/FormInput.a11y.test.jsx](web/src/FormInput.a11y.test.jsx)
- [web/src/SearchOverlay.a11y.test.jsx](web/src/SearchOverlay.a11y.test.jsx)
- [web/src/CheckoutFlow.integration.test.jsx](web/src/CheckoutFlow.integration.test.jsx)
- [web/src/DashboardAndTrips.integration.test.jsx](web/src/DashboardAndTrips.integration.test.jsx)
- [web/src/ResultsAndRefund.integration.test.jsx](web/src/ResultsAndRefund.integration.test.jsx)

## 4. What The Tests Prove

The suite is meant to prove three things:

1. The API responds correctly and enforces validation.
2. The UI stays accessible and interactive across the main travel flows.
3. The production bundle still builds after UI and styling changes.

## 5. Useful Test Patterns

### Prefer role-based queries

For interactive elements, use role queries instead of raw text queries when possible.

Example:

```javascript
screen.getByRole("button", { name: "Select" })
```

### Prefer field-level assertions

For validation, check the field state as well as the error text.

Example:

```javascript
expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
```

### Wait for async UI updates

Search, payment, and route data are asynchronous. Use `waitFor` when a state change happens after a promise resolves.

## 6. Common Failure Causes

- API server not running when the web tests expect fetch-backed state
- LocalStorage state from a previous run affecting filter or checkout state
- Test environment differences when 3D rendering is unavailable
- Text assertions that match more than one element

## 7. Recommended Local Verification Order

If you are changing the frontend, run in this order:

1. `npm run test:web`
2. `npm run build`

If you are changing the backend, run:

1. `npm run test:api`
2. `npm run test:web`
3. `npm run build`

---

## 8. Integration Test Walkthrough

### Frontend Integration Tests

Frontend tests use Vitest with jsdom for DOM simulation and React Testing Library for user-centric queries.

#### SearchPage.validation.test.jsx

Tests the natural language prompt parser and form sync:

1. **Prompt Parsing**: Verifies the NLP engine extracts fields from prompts like "Find me a business flight to Tokyo under ₹100000"
2. **Form Sync**: Checks that editing form fields updates the prompt, and vice versa
3. **Validation**: Ensures invalid inputs (negative budget, unknown airport) show errors
4. **Currency**: Confirms all amounts use INR formatting

**Key test assertion**:
```javascript
await user.type(screen.getByLabelText("Budget"), "120000");
expect(screen.getByDisplayValue(/Rs 120000|₹120000/)).toBeInTheDocument();
```

#### CheckoutFlow.integration.test.jsx

Tests the 4-step booking flow (traveler → seats → protection → payment):

1. **Step Gating**: Verifies "Next" is disabled until current step is complete
2. **Traveler Validation**: Checks email/phone validation per step
3. **Seat Locking**: Confirms seat selections persist across step changes
4. **Payment Split**: Verifies wallet/card split slider works

**Key test assertion**:
```javascript
expect(screen.getByRole("button", { name: /Next/i })).toBeDisabled();
await user.type(emailField, "user@example.com");
// Next button becomes enabled once all fields are valid
```

#### DashboardAndTrips.integration.test.jsx

Tests dashboard rendering and trip history filtering:

1. **Dashboard Load**: Verifies stats widgets display correctly (loyalty, wallet, carbon)
2. **Trip Filters**: Checks that filtering by date/cabin works
3. **Quick Actions**: Ensures navigation links point to correct pages
4. **Local Storage**: Confirms saved preferences load on page refresh

**Key test assertion**:
```javascript
expect(screen.getByText(/Gold/i)).toBeInTheDocument(); // Loyalty status
expect(screen.getByDisplayValue(/Rs 50000|₹50000/)).toBeInTheDocument(); // Wallet
```

#### App.integration.test.jsx

Tests app-level routing and state flow:

1. **Route Navigation**: Verifies links navigate between Search → Results → Checkout
2. **State Preservation**: Checks that search context survives page transitions
3. **Session Key**: Confirms session is initialized and tracked

**Key test assertion**:
```javascript
const searchLink = screen.getByRole("link", { name: /Start Search/i });
await user.click(searchLink);
expect(screen.getByText(/Find me a flight/i)).toBeInTheDocument();
```

### Backend Integration Tests

Backend tests use Node's built-in test runner and supertest for HTTP assertions.

#### api.integration.test.js

Tests API endpoints in realistic flows:

1. **Search Flow**: Validates request → response with correct offer count
2. **Booking Lifecycle**: Creates booking → locks seat → freezes price → processes payment
3. **Idempotency**: Verifies duplicate payment requests return same result
4. **Wallet Operations**: Confirms wallet balance updates match transaction history

**Key test assertion**:
```javascript
const res = await fetch("http://localhost:8080/api/search", {
  method: "POST",
  body: JSON.stringify({ from: "DEL", to: "NRT", cabin: "Business", budget: 1200 })
});
const data = await res.json();
assert.ok(data.ok && data.data.results.length > 0);
```

---

## 9. Accessibility Testing

The test suite includes accessibility (a11y) tests that verify:

- Form labels are linked to inputs via `htmlFor` and `id`
- Buttons have descriptive `aria-label` attributes
- Invalid fields have `aria-invalid="true"`
- Error messages link to fields via `aria-describedby`

### FormInput.a11y.test.jsx

Example assertion:
```javascript
const input = screen.getByLabelText("Email Address");
expect(input).toHaveAttribute("aria-invalid", "false");

// After entering invalid email:
await user.type(input, "invalid-email");
expect(input).toHaveAttribute("aria-invalid", "true");
expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
```

---

## 10. Troubleshooting Failed Tests

### Symptom: API tests fail with "Connection refused"

**Cause**: API server is not running on port 8080

**Fix**:
```powershell
# Terminal 1
npm run dev:api

# Wait for "Server listening on http://localhost:8080" message
# Terminal 2 (in same or new shell)
npm run test:api
```

### Symptom: Web tests fail with "localStorage is not defined"

**Cause**: Vitest jsdom environment doesn't automatically include localStorage

**Fix**: Tests should already have localStorage polyfilled via the test setup file. If not, check `vitest.config.js`:
```javascript
environment: 'jsdom',
globals: true,
```

### Symptom: 3D rendering tests fail or are skipped

**Cause**: React Three Fiber and Babylon.js require canvas support; jsdom doesn't have it

**Fix**: 3D components guard against rendering in test env. This is expected and safe. Look for "ResizeObserver not available" warnings—these are benign.

### Symptom: "Wallet balance is ₹0" when tests run

**Cause**: localStorage was cleared between test runs, or app state wasn't initialized

**Fix**: Clear localStorage and restart:
```powershell
# In browser DevTools:
localStorage.clear()

# Or in test setup:
beforeEach(() => {
  localStorage.setItem('aero.wallet.balance', '50000');
});
```

### Symptom: Text assertion fails: "Unable to find element with text: RS 100000"

**Cause**: Currency formatting changed or locale settings differ

**Fix**: Use regex instead of exact text:
```javascript
// Instead of:
expect(screen.getByText("Rs 100000")).toBeInTheDocument();

// Use:
expect(screen.getByText(/Rs|₹/)).toBeInTheDocument();
// Or be more specific:
expect(screen.getByText(/Rs\s*100000|₹100000/)).toBeInTheDocument();
```

---

## 11. Test Coverage Details

### Coverage by Feature

| Feature | Test File | Coverage Type |
|---------|-----------|---|
| Natural Language Search | SearchPage.validation.test.jsx | Unit + Integration |
| 4-Step Checkout | CheckoutFlow.integration.test.jsx | Integration |
| Dashboard & History | DashboardAndTrips.integration.test.jsx | Integration |
| Results & Filtering | ResultsAndRefund.integration.test.jsx | Integration |
| Form Accessibility | FormInput.a11y.test.jsx | Accessibility |
| App Navigation | App.integration.test.jsx | Integration |
| API Endpoints | api.integration.test.js | Integration |
| Authentication | AuthPage.validation.test.jsx | Unit |

### Coverage Gaps (Intentionally Out of Scope)

- **3D Scene Rendering**: Canvas-based, tested manually
- **Live Map**: Requires external tile server, mocked in tests
- **PDF Generation**: Tested via manual export, not automated
- **Email Notifications**: Out-of-scope for local backend
- **Analytics Tracking**: No assertions (fire-and-forget)

---

## 12. Running Tests in Watch Mode

For active development, watch mode re-runs tests on file changes:

```powershell
# Frontend tests in watch mode
npm run test:web -- --watch

# API tests in watch mode (if supported by test runner)
npm run test:api -- --watch
```

### Watch Mode Tips

- Tests re-run only for modified test files and their dependencies
- Use `.only` on a single test to isolate during debugging:
  ```javascript
  it.only('should validate email', () => {
    // This test runs in isolation
  });
  ```
- Use `.skip` to disable a test temporarily:
  ```javascript
  it.skip('should process payment', () => {
    // This test is skipped
  });
  ```

---

## 13. Manual Testing Checklist

After automated tests pass, manually verify these flows:

### Search Page
- [ ] Prompt parsing works ("Find me a business flight to Tokyo under ₹120000")
- [ ] Form sync works (editing form updates prompt and vice versa)
- [ ] Currency displays as INR (₹) not USD ($)
- [ ] "Advanced Filters" expands/collapses smoothly
- [ ] Date picker works on mobile

### Results Page
- [ ] Flights load and display correctly
- [ ] Sorting by price/duration works
- [ ] Filtering by cabin/stops/time window works
- [ ] 3D route preview renders (if 3D enabled)
- [ ] Live route map shows correct airports

### Checkout Flow
- [ ] Step indicator highlights correctly (active/completed/pending)
- [ ] Step 1: Traveler form validates email/phone
- [ ] Step 2: Seat grid displays all seats with pricing
- [ ] Step 3: ESG round-up toggle works
- [ ] Step 4: Payment split slider updates dynamically
- [ ] "Back" button disables on Step 1, "Next" disables on Step 4

### Dashboard
- [ ] KPI tiles display (loyalty, wallet, carbon, locale)
- [ ] Trip history filters work
- [ ] Quick action links navigate correctly
- [ ] 3D orb previews on sidebar (if 3D enabled)

### Responsive (Mobile < 820px)
- [ ] Search hero collapses to 1 column
- [ ] Checkout steps stack vertically
- [ ] Touch interactions work (no hover-only elements)
- [ ] Buttons are min 44x44px for accessibility

---

## 14. CI/CD Integration Readiness

The test suite is ready for CI/CD. Typical pipeline:

```yaml
name: Test & Build

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:api
      - run: npm run test:web
      - run: npm run build
```

Key points:

- Tests run in parallel; no manual setup needed
- Build artifact (dist/) can be deployed directly
- All tests must pass before merge
