# AeroPay Elite Architecture Notes

This document gives a compact view of how the app is structured end to end.

## 1. High-Level Layout

The repository is split into two main parts:

- `api/` for local mock backend endpoints
- `web/` for the React + Vite frontend

The frontend is the visible product surface. The backend provides airport lookup, route intelligence, payments, wallet, approvals, and booking data for the UI.

## 2. Data Flow

Typical flow:

1. The user enters a search prompt or uses the structured form.
2. The frontend validates and normalizes the search input.
3. The frontend sends a search request through [web/src/lib/api.js](web/src/lib/api.js).
4. Results render in [web/src/pages/ResultsPage.jsx](web/src/pages/ResultsPage.jsx).
5. The lead route drives the map and 3D preview.
6. The user selects a flight and moves into checkout.
7. Payment updates wallet, bookings, and timeline state.

## 3. Shared UI Strategy

The app uses shared components to keep the experience consistent:

- Inputs: [web/src/components/FormInput.jsx](web/src/components/FormInput.jsx)
- Checkboxes: [web/src/components/FormCheckbox.jsx](web/src/components/FormCheckbox.jsx)
- Icons: [web/src/components/UiIcon.jsx](web/src/components/UiIcon.jsx)
- Cards and widgets: wallet, ESG, trip summary, and results components

## 4. State Strategy

The app uses a mix of React state and browser storage.

- Ephemeral UI state stays in React state.
- Persistent user preferences and history use localStorage helpers.
- The app shell in [web/src/App.jsx](web/src/App.jsx) coordinates cross-page state like selected flight, bookings, notifications, and checkout data.

## 5. Reliability Strategy

The app is designed to degrade cleanly when some features are unavailable.

- Route maps fall back when airport data or runtime support is missing.
- The 3D preview falls back when 3D cannot be rendered.
- Tests cover the most important flows so the UI remains stable after updates.

## 6. Suggested Next Docs

If you want even more documentation later, the most useful additions would be:

- `API_REFERENCE.md` for endpoint-by-endpoint behavior
- `TESTING_GUIDE.md` for how to run and interpret the test suite
- `DEPLOYMENT_NOTES.md` for local setup and build output details
