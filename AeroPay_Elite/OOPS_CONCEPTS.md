# OOP Concepts Used In AeroPay Elite

This document explains the object-oriented programming ideas used in the codebase and where they appear.

## 1. Overview

The frontend is written in React, so the app uses component-based composition rather than class-heavy inheritance. Still, the project uses core OOP ideas such as encapsulation, abstraction, modularity, reusability, and composition.

## 2. Encapsulation

Encapsulation means keeping related state and behavior together and exposing only what other parts of the app need.

Where it appears:

- [web/src/components/FormInput.jsx](web/src/components/FormInput.jsx) keeps label, input, helper text, and error handling together.
- [web/src/components/FormCheckbox.jsx](web/src/components/FormCheckbox.jsx) wraps checkbox behavior and its helper text.
- [web/src/lib/approvalStorage.js](web/src/lib/approvalStorage.js) hides the localStorage access logic behind `saveApproval` and `getApproval`.
- [web/src/lib/browserStorage.js](web/src/lib/browserStorage.js) hides JSON parsing and writing behind utility functions.

Why it matters:

- Other pages do not need to know how ARIA attributes or storage details are implemented.
- The UI stays simpler because each component owns its own behavior.

## 3. Abstraction

Abstraction means exposing a simple interface while hiding the implementation details.

Where it appears:

- [web/src/lib/api.js](web/src/lib/api.js) exposes `jsonFetch`, `fetchAirports`, and `fetchRouteIntel` without making the UI care about HTTP parsing.
- [web/src/components/ThreeDScene.jsx](web/src/components/ThreeDScene.jsx) hides whether the route preview is interactive or a static fallback.
- [web/src/components/RouteLiveMap.jsx](web/src/components/RouteLiveMap.jsx) hides the map, fallback, and airport-loading logic behind one component.

Why it matters:

- Pages can ask for data or visuals without re-implementing the transport or rendering logic.
- The code is easier to maintain when the API or rendering layer changes.

## 4. Reusability

Reusability means writing pieces once and reusing them in many places.

Where it appears:

- [web/src/components/UiIcon.jsx](web/src/components/UiIcon.jsx) provides a shared icon system.
- [web/src/components/FlightResultCard.jsx](web/src/components/FlightResultCard.jsx) is reused for every result card.
- [web/src/components/WalletBalanceCard.jsx](web/src/components/WalletBalanceCard.jsx) is reused on the wallet and checkout surfaces.
- [web/src/components/ESGTracker.jsx](web/src/components/ESGTracker.jsx) is reused on the ESG page and checkout page.
- [web/src/components/NotificationCenter.jsx](web/src/components/NotificationCenter.jsx) is reused across the app shell.

Why it matters:

- Shared behavior stays consistent.
- UI updates can be made in one place instead of many pages.

## 5. Composition

Composition means building larger screens out of smaller parts.

Where it appears:

- [web/src/App.jsx](web/src/App.jsx) composes the whole product from pages, modals, shells, and shared utilities.
- [web/src/pages/CheckoutPage.jsx](web/src/pages/CheckoutPage.jsx) composes traveler inputs, seat selection, payment split, ESG tracking, approval, and invoice actions.
- [web/src/pages/ResultsPage.jsx](web/src/pages/ResultsPage.jsx) composes filters, cards, comparison tools, route intel, and 3D preview.

Why it matters:

- Big screens stay readable because each section is owned by a smaller component.
- Features can be rearranged without rewriting everything.

## 6. Modularity

Modularity means separating the app into small independent units.

Where it appears:

- Frontend pages live in [web/src/pages](web/src/pages).
- Shared UI lives in [web/src/components](web/src/components).
- API helpers and business utilities live in [web/src/lib](web/src/lib).
- Styling lives in [web/src/styles.css](web/src/styles.css).

Why it matters:

- Each file has a clearer responsibility.
- Testing becomes easier because each module can be checked separately.

## 7. Polymorphism-Like Behavior

React does not use classical inheritance for UI, but it does use polymorphism-like behavior through props and conditional rendering.

Where it appears:

- [web/src/components/ThreeDScene.jsx](web/src/components/ThreeDScene.jsx) changes its output based on `reduceMotion` and `threeDEnabled`.
- [web/src/components/RouteLiveMap.jsx](web/src/components/RouteLiveMap.jsx) changes between live map, loading state, and fallback state.
- [web/src/components/NotificationCenter.jsx](web/src/components/NotificationCenter.jsx) changes between list view and analytics view.

Why it matters:

- One component can behave differently in different situations without needing separate page-level code.

## 8. State Management As Object State

Many components keep their own local state, which is a practical form of object state management.

Where it appears:

- [web/src/pages/SearchPage.jsx](web/src/pages/SearchPage.jsx) manages the search form, prompt sync, and validation state.
- [web/src/pages/CheckoutPage.jsx](web/src/pages/CheckoutPage.jsx) manages traveler inputs, seat choices, split strategy, and payment status.
- [web/src/pages/WalletPage.jsx](web/src/pages/WalletPage.jsx) manages transaction filters and wallet history.
- [web/src/pages/SettingsPage.jsx](web/src/pages/SettingsPage.jsx) manages accessibility and preference toggles.

Why it matters:

- State stays close to the part of the UI that uses it.
- The app avoids one giant global state object for every feature.

## 9. Data Hiding And Validation

Validation is part of keeping bad data out of the rest of the app.

Where it appears:

- [web/src/lib/validation.js](web/src/lib/validation.js) centralizes email, phone, IATA, travel date, search, and business validation.
- [web/src/pages/AuthPage.jsx](web/src/pages/AuthPage.jsx) validates name and email before login.
- [web/src/pages/SearchPage.jsx](web/src/pages/SearchPage.jsx) validates route and budget inputs before search.
- [web/src/pages/CheckoutPage.jsx](web/src/pages/CheckoutPage.jsx) validates travelers, seats, and business details.

Why it matters:

- Invalid data is rejected early.
- Components downstream can assume cleaner input.

## 10. Real Examples By Feature

### Search flow

- Abstraction: prompt parsing is hidden inside the page.
- Encapsulation: the search form and prompt sync are owned by SearchPage.
- Modularity: validation logic stays in the shared validation helper.

### Checkout flow

- Composition: traveler form, payment split, approval, BNPL, and ESG are combined into one flow.
- Reusability: shared inputs and cards are reused.
- Encapsulation: checkout state stays inside CheckoutPage.

### Route map and 3D preview

- Abstraction: the pages do not care whether the route view is live, loading, or fallback.
- Composition: the results and booking detail pages embed these visual components.
- Polymorphism-like behavior: each component adapts its output based on environment and data availability.

## 11. Why This Style Fits React

Classic inheritance is not the main pattern in this project. React favors composition, props, and small focused components. That is still aligned with OOP ideas because the same goals apply: isolate responsibilities, reuse behavior, and expose clear interfaces.

## 12. Short Takeaway

The app uses OOP ideas in a modern React way:

- Encapsulation through self-contained components
- Abstraction through API helpers and fallback components
- Reusability through shared UI elements
- Composition through page assembly
- Modular design through clear folder separation
