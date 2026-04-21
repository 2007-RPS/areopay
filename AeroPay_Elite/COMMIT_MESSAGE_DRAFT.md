feat(aeropay): add API-driven live route intelligence and map integration

## Summary
- Add backend airport lookup and route-intelligence endpoints.
- Integrate API-backed live route map in search results and booking detail pages.
- Add alternate route overlays, delay/weather insights, and map controls.
- Expand integration tests for airport lookup and route intelligence.
- Add repository ignore rules to prevent generated/dependency artifacts from polluting commits.

## Backend
- Add airport registry and route intelligence model in api/server.js.
- Add endpoints:
  - GET /api/airports?codes=<IATA,...>
  - GET /api/routes/intel?from=<IATA>&to=<IATA>
- Add integration coverage in api/api.integration.test.js.

## Frontend
- Add API helpers in web/src/lib/api.js:
  - fetchAirports
  - fetchRouteIntel
- Refactor web/src/components/RouteLiveMap.jsx to fetch coordinates from API.
- Add alternate route rendering and map toolbar actions.
- Update web/src/pages/ResultsPage.jsx to lazy-load map and show live route KPIs.
- Update web/src/pages/BookingDetailPage.jsx with booking-linked route map continuity.
- Add route-intel supporting styles in web/src/styles.css.

## Quality
- API tests passing.
- Web tests passing.
- Production build passing.

## Repo hygiene
- Add root .gitignore and project .gitignore updates for node_modules, dist, logs, env files, and temp classroom artifacts.
