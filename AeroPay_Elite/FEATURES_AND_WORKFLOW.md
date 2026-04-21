# AeroPay Elite Features And Workflow

This document explains what the app does, where the features live, and how the main user flows work.

## 1. Product Summary

AeroPay Elite is an intelligent travel-booking demo with a fintech-style checkout flow. The app combines flight search, route intelligence, live map preview, 3D route visualization, wallet payments, price freeze, BNPL, ESG tracking, and booking history.

The frontend is the main experience. The backend is a local mock API used for airports, route intelligence, search, wallet, bookings, approvals, and payment-related actions.

## 2. Main Features

### Search experience

The search page lets the user build a trip manually or by typing a natural-language prompt.

How it works:

- The structured form is on [web/src/pages/SearchPage.jsx](web/src/pages/SearchPage.jsx).
- Validation rules are in [web/src/lib/validation.js](web/src/lib/validation.js).
- Prompt parsing converts phrases like city names, budgets, dates, and cabin class into structured fields.
- The page supports advanced filters such as alliance, layover limits, baggage-only fares, flexible dates, and refundable-only fares.

### Search results

The results page shows ranked offers and lets the user compare options.

How it works:

- Flight cards are rendered in [web/src/pages/ResultsPage.jsx](web/src/pages/ResultsPage.jsx).
- Each offer can be filtered by policy, airline, departure window, fare cap, and stop count.
- Offers can be added to a compare list and saved locally.
- The top result drives the route intelligence panel and 3D preview.

### Route intelligence and live map

The app shows route-aware flight information instead of a static placeholder.

How it works:

- Airport lookup and route intel requests are handled through [web/src/lib/api.js](web/src/lib/api.js).
- The map preview component is [web/src/components/RouteLiveMap.jsx](web/src/components/RouteLiveMap.jsx).
- If live airport data is unavailable, the map falls back to a readable offline preview instead of breaking.
- Alternate routes are shown as dashed overlays when the API returns them.

### 3D route preview

The app includes a lightweight 3D orbital route preview.

How it works:

- The shell is in [web/src/components/ThreeDScene.jsx](web/src/components/ThreeDScene.jsx).
- The actual React Three Fiber scene is in [web/src/components/Scene3D/RouteOrbScene.jsx](web/src/components/Scene3D/RouteOrbScene.jsx).
- The 3D view automatically falls back to a static preview when 3D is disabled, reduced motion is enabled, or the environment cannot support the canvas.

### Checkout flow

Checkout is a four-step process with traveler details, seat selection, protection, and payment.

How it works:

- The flow lives in [web/src/pages/CheckoutPage.jsx](web/src/pages/CheckoutPage.jsx).
- Traveler data is validated per field.
- Seats, meal, baggage, lounge, insurance, and business-mode details are collected before payment.
- The final step uses a wallet/card split and supports retry logic.
- Approval is required for out-of-policy itineraries.

### Wallet and payments

The wallet shows balance, escrow, and transaction history.

How it works:

- Wallet rendering is in [web/src/pages/WalletPage.jsx](web/src/pages/WalletPage.jsx).
- Shared balance cards are in [web/src/components/WalletBalanceCard.jsx](web/src/components/WalletBalanceCard.jsx).
- Payment splits are shown through [web/src/components/PaymentSplitter.jsx](web/src/components/PaymentSplitter.jsx).

### Booking history and details

Users can revisit confirmed trips, cancellations, and refunds.

How it works:

- Summary browsing is in [web/src/pages/BookingHistoryPage.jsx](web/src/pages/BookingHistoryPage.jsx).
- The booking detail view is in [web/src/pages/BookingDetailPage.jsx](web/src/pages/BookingDetailPage.jsx).
- Refund ledger, payment attempts, route intel, and itinerary timeline are shown in the detail page.

### ESG tracking

The app includes sustainability round-up and carbon-offset tracking.

How it works:

- The dashboard surface is in [web/src/pages/ESGPage.jsx](web/src/pages/ESGPage.jsx).
- The reusable ESG component is [web/src/components/ESGTracker.jsx](web/src/components/ESGTracker.jsx).
- Carbon offset values are persisted locally and updated when the user neutralizes emissions.

### Account and settings

The app includes a local profile, preferences, and UI settings.

How it works:

- Sign-in is handled in [web/src/pages/AuthPage.jsx](web/src/pages/AuthPage.jsx).
- Profile management is in [web/src/pages/ProfilePage.jsx](web/src/pages/ProfilePage.jsx).
- Settings are in [web/src/pages/SettingsPage.jsx](web/src/pages/SettingsPage.jsx).
- Local browser storage keeps session data, preferences, loyalty tier, and notification state.

### Dashboard

The dashboard gives a compact overview of wallet, trips, ESG, and quick actions.

How it works:

- The page is in [web/src/pages/DashboardPage.jsx](web/src/pages/DashboardPage.jsx).
- It combines widgets for wallet, trips, recent bookings, and the 3D preview.
- The dashboard reads persisted values from browser storage so the snapshot stays useful across refreshes.

## 3. Currency And Presentation

The UI presents visible amounts in INR for the Indian audience.

How it works:

- Shared formatting helpers are in [web/src/lib/currency.js](web/src/lib/currency.js).
- Search budget wording and validation were adjusted to match INR presentation.
- Some internal helper names still mention USD because the backend math remains USD-based in a few places, but the user-facing copy is INR-first.

## 4. Map And 3D Fallback Behavior

The app is designed to stay usable even when the environment cannot render everything.

How it works:

- Live maps use airport lookup from the API.
- If the browser cannot render the map or route data is missing, [web/src/components/RouteLiveMap.jsx](web/src/components/RouteLiveMap.jsx) shows a fallback panel.
- If 3D is unavailable, [web/src/components/ThreeDScene.jsx](web/src/components/ThreeDScene.jsx) swaps in a static preview.

## 5. Validation And Test Coverage

The main tests were updated along with the UI.

Important test files:

- [web/src/CheckoutFlow.integration.test.jsx](web/src/CheckoutFlow.integration.test.jsx)
- [web/src/DashboardAndTrips.integration.test.jsx](web/src/DashboardAndTrips.integration.test.jsx)
- [web/src/ResultsAndRefund.integration.test.jsx](web/src/ResultsAndRefund.integration.test.jsx)
- [web/src/App.integration.test.jsx](web/src/App.integration.test.jsx)
- [web/src/AuthPage.validation.test.jsx](web/src/AuthPage.validation.test.jsx)
- [web/src/SearchPage.validation.test.jsx](web/src/SearchPage.validation.test.jsx)
- [web/src/FormInput.a11y.test.jsx](web/src/FormInput.a11y.test.jsx)

## 6. Recommended Reading Order

If you want to understand the app quickly, read these in order:

1. [README.md](README.md)
2. [FEATURES_AND_WORKFLOW.md](FEATURES_AND_WORKFLOW.md)
3. [OOPS_CONCEPTS.md](OOPS_CONCEPTS.md)
4. [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md)
