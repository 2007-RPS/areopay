import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import FlightResultCard from "../components/FlightResultCard";
import FlightResultCardSkeleton from "../components/FlightResultCardSkeleton";
import FormInput from "../components/FormInput";
import FormCheckbox from "../components/FormCheckbox";
import LoadingBadge from "../components/LoadingBadge";
import SkeletonLoader from "../components/SkeletonLoader";
import SearchContextCard from "../components/SearchContextCard";
import ThreeDScene from "../components/ThreeDScene";
import { fetchRouteIntel } from "../lib/api";
import { formatInrFromUsd, inrToUsd, usdToInr } from "../lib/currency";

const RouteLiveMap = lazy(() => import("../components/RouteLiveMap"));

export default function ResultsPage({ results, loading, searchForm, onSelectFlight, onFreeze, onBnpl, sessionKey, freeze, bnpl, travelFinanceNote, travelFinanceSource, reduceMotion = false, threeDEnabled = true }) {
  const [sortBy, setSortBy] = useState("value-desc");
  const [inPolicyOnly, setInPolicyOnly] = useState(false);
  const [maxFare, setMaxFare] = useState(searchForm?.budget || 2000);
  const [nonStopOnly, setNonStopOnly] = useState(Boolean(searchForm?.nonStopOnly));
  const [departureWindow, setDepartureWindow] = useState(searchForm?.departureWindowPreset || "any");
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [comparedIds, setComparedIds] = useState([]);
  const [pinnedCompareId, setPinnedCompareId] = useState("");
  const [savedComparisons, setSavedComparisons] = useState(() => {
    try {
      if (typeof localStorage === "undefined" || typeof localStorage.getItem !== "function") {
        return [];
      }
      const raw = localStorage.getItem("aero.savedComparisons");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [routeIntel, setRouteIntel] = useState(null);
  const [routeIntelStatus, setRouteIntelStatus] = useState("idle");

  const enrichedResults = useMemo(() => results.map((flight, idx) => ({
    ...flight,
    stops: idx % 3 === 0 ? 0 : 1,
    departureHour: 7 + (idx * 4),
    durationMin: 350 + (idx * 45),
    layoverMin: idx % 3 === 0 ? 0 : 75 + (idx * 20),
    alliance: ["star", "oneworld", "skyteam"][idx % 3],
    baggageIncluded: idx % 2 === 0,
    refundable: idx % 3 !== 2,
  })), [results]);

  const airlines = useMemo(() => Array.from(new Set(enrichedResults.map((f) => f.carrier))), [enrichedResults]);

  function inDepartureWindow(flight) {
    if (departureWindow === "any") return true;
    if (departureWindow === "morning") return flight.departureHour >= 5 && flight.departureHour < 12;
    if (departureWindow === "afternoon") return flight.departureHour >= 12 && flight.departureHour < 18;
    return flight.departureHour >= 18 || flight.departureHour < 5;
  }

  function toggleAirline(carrier) {
    setSelectedAirlines((prev) => (
      prev.includes(carrier)
        ? prev.filter((item) => item !== carrier)
        : [...prev, carrier]
    ));
  }

  function toggleCompare(flightId) {
    setComparedIds((prev) => {
      if (prev.includes(flightId)) {
        if (pinnedCompareId === flightId) {
          setPinnedCompareId("");
        }
        return prev.filter((id) => id !== flightId);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, flightId];
    });
  }

  useEffect(() => {
    if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") {
      localStorage.setItem("aero.savedComparisons", JSON.stringify(savedComparisons));
    }
  }, [savedComparisons]);

  function saveCurrentComparison() {
    if (!comparedFlights.length) return;
    const item = {
      id: `cmp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      flights: comparedFlights.map((f) => ({
        id: f.id,
        route: `${f.from} -> ${f.to}`,
        carrier: f.carrier,
        fare: f.fare,
      })),
    };
    setSavedComparisons((prev) => [item, ...prev].slice(0, 5));
  }

  const visibleResults = useMemo(() => {
    let list = [...enrichedResults];

    if (inPolicyOnly) {
      list = list.filter((f) => f.policy.inPolicy);
    }

    if (nonStopOnly) {
      list = list.filter((f) => f.stops === 0);
    }

    if (selectedAirlines.length) {
      list = list.filter((f) => selectedAirlines.includes(f.carrier));
    }

    if (searchForm?.alliance && searchForm.alliance !== "any") {
      list = list.filter((f) => f.alliance === searchForm.alliance);
    }

    if (searchForm?.baggageIncludedOnly) {
      list = list.filter((f) => f.baggageIncluded);
    }

    if (searchForm?.refundableOnly) {
      list = list.filter((f) => f.refundable);
    }

    if (Number(searchForm?.maxLayover || 0) > 0) {
      list = list.filter((f) => f.stops === 0 || f.layoverMin <= Number(searchForm.maxLayover));
    }

    list = list.filter(inDepartureWindow);
    list = list.filter((f) => f.fare <= maxFare);

    list.sort((a, b) => {
      if (sortBy === "fare-asc") return a.fare - b.fare;
      if (sortBy === "fare-desc") return b.fare - a.fare;
      if (sortBy === "duration-asc") return a.durationMin - b.durationMin;
      if (sortBy === "carbon-asc") return a.carbonKg - b.carbonKg;
      return b.valueScore - a.valueScore;
    });

    return list;
  }, [enrichedResults, inPolicyOnly, nonStopOnly, selectedAirlines, departureWindow, maxFare, sortBy, searchForm]);

  const comparedFlights = useMemo(() => enrichedResults.filter((f) => comparedIds.includes(f.id)), [enrichedResults, comparedIds]);
  const comparedFlightsSorted = useMemo(() => {
    if (!pinnedCompareId) return comparedFlights;
    return [...comparedFlights].sort((a, b) => {
      if (a.id === pinnedCompareId) return -1;
      if (b.id === pinnedCompareId) return 1;
      return 0;
    });
  }, [comparedFlights, pinnedCompareId]);

  const compareWinners = useMemo(() => {
    if (!comparedFlights.length) {
      return { fare: "", duration: "", carbon: "", value: "" };
    }

    const fareWinner = [...comparedFlights].sort((a, b) => a.fare - b.fare)[0]?.id || "";
    const durationWinner = [...comparedFlights].sort((a, b) => a.durationMin - b.durationMin)[0]?.id || "";
    const carbonWinner = [...comparedFlights].sort((a, b) => a.carbonKg - b.carbonKg)[0]?.id || "";
    const valueWinner = [...comparedFlights].sort((a, b) => b.valueScore - a.valueScore)[0]?.id || "";

    return {
      fare: fareWinner,
      duration: durationWinner,
      carbon: carbonWinner,
      value: valueWinner,
    };
  }, [comparedFlights]);

  const leadFlight = visibleResults[0];
  const maxFareInr = useMemo(() => Math.round(usdToInr(maxFare)), [maxFare]);

  useEffect(() => {
    let cancelled = false;

    async function loadRouteIntel() {
      if (!leadFlight?.from || !leadFlight?.to) {
        setRouteIntel(null);
        setRouteIntelStatus("idle");
        return;
      }

      try {
        setRouteIntelStatus("loading");
        const intel = await fetchRouteIntel(leadFlight.from, leadFlight.to);
        if (cancelled) return;
        setRouteIntel(intel);
        setRouteIntelStatus("ready");
      } catch {
        if (!cancelled) {
          setRouteIntel(null);
          setRouteIntelStatus("error");
        }
      }
    }

    loadRouteIntel();
    return () => {
      cancelled = true;
    };
  }, [leadFlight?.from, leadFlight?.to]);

  return (
    <section className="section-stack">
      <section className="page-hero glass card">
        <div>
          <h2>Results</h2>
          <p>Compare offers with value score, policy state, and financial-route hints.</p>
        </div>
        <div className="page-hero-meta">
          <span className="policy-badge ok">Local-only backend</span>
          <span className="policy-badge ok">Session {sessionKey.slice(-8)}</span>
        </div>
      </section>

      <SearchContextCard searchForm={searchForm} />

      <section className="glass card results-controls">
        {loading ? <LoadingBadge text="Refreshing offers and policy insights..." /> : null}
        <div className="filter-grid">
          <FormInput id="results-sort" label="Sort By" as="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="value-desc">Best Value</option>
              <option value="fare-asc">Fare: Low to High</option>
              <option value="fare-desc">Fare: High to Low</option>
              <option value="duration-asc">Fastest Duration</option>
              <option value="carbon-asc">Lowest Carbon</option>
            </FormInput>

          <FormInput id="results-max-fare" label="Max Fare (INR)" type="number" min={8000} value={maxFareInr} onChange={(e) => setMaxFare(inrToUsd(Number(e.target.value || 0)))} />

          <FormCheckbox id="results-policy-only" label="Show in-policy only" checked={inPolicyOnly} onChange={(e) => setInPolicyOnly(e.target.checked)} />

          <FormCheckbox id="results-non-stop" label="Non-stop only" checked={nonStopOnly || searchForm?.nonStopOnly} onChange={(e) => setNonStopOnly(e.target.checked)} />

          <FormInput id="results-departure-window" label="Departure Window" as="select" value={departureWindow} onChange={(e) => setDepartureWindow(e.target.value)}>
              <option value="any">Any Time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening/Night</option>
            </FormInput>

          <div className="chip-row inline-airline-chips">
            {airlines.map((airline) => (
              <button type="button" key={airline} className={`chip-btn ${selectedAirlines.includes(airline) ? "active" : ""}`} onClick={() => toggleAirline(airline)}>
                {airline}
              </button>
            ))}
          </div>

          <div className="policy-badge ok">{visibleResults.length} offers found</div>
        </div>
      </section>

      {leadFlight && (
        <section className="glass card route-intel-card">
          <div className="panel-top">
            <div>
              <h3>Route Intelligence</h3>
              <p>Top ranked option right now: {leadFlight.carrier} {leadFlight.from} -&gt; {leadFlight.to}</p>
            </div>
            <span className="policy-badge ok">Updated this search</span>
          </div>
          <div className="route-intel-grid">
            <div className="route-map-visual" aria-hidden="true">
              <Suspense fallback={<div className="route-map-fallback"><p>Loading live route map...</p><p>{leadFlight.from} -&gt; {leadFlight.to}</p></div>}>
                <RouteLiveMap fromCode={leadFlight.from} toCode={leadFlight.to} alternateRoutes={routeIntel?.alternates || []} />
              </Suspense>
            </div>
            <div className="route-intel-kpis">
              <p><strong>Lead fare:</strong> {formatInrFromUsd(leadFlight.fare)}</p>
              <p><strong>Value score:</strong> {leadFlight.valueScore} / 100</p>
              <p><strong>Carbon:</strong> {leadFlight.carbonKg} kg</p>
              {routeIntelStatus === "loading" && <p><strong>Route Intel:</strong> Updating live weather and delay profile...</p>}
              {routeIntel && (
                <>
                  <p><strong>Delay risk:</strong> {routeIntel.delayRisk?.label || "Unknown"} ({Math.round((Number(routeIntel.delayRisk?.score || 0)) * 100)}%)</p>
                  <p><strong>Weather:</strong> {routeIntel.weather?.severity || "Unknown"} | Wind {routeIntel.weather?.enRouteWindKts || "-"} kts</p>
                  {Array.isArray(routeIntel.alternates) && routeIntel.alternates.length > 0 && (
                    <div className="chip-row route-intel-chips">
                      {routeIntel.alternates.filter(Boolean).map((item, index) => (
                        <span key={item.id || `${item.label || "alt"}-${index}`} className="policy-badge warn">{item.label || "Alternate"} ({item.etaDeltaMin ? `+${item.etaDeltaMin}m` : "timing pending"})</span>
                      ))}
                    </div>
                  )}
                </>
              )}
              {routeIntelStatus === "error" && <p><strong>Route Intel:</strong> Live route insights are temporarily unavailable.</p>}
            </div>
          </div>
          <ThreeDScene
            title="3D Route Preview"
            subtitle="Interactive orbital scene for this route cluster with motion-aware fallbacks."
            fromCode={leadFlight.from}
            toCode={leadFlight.to}
            delayRiskLabel={routeIntel?.delayRisk?.label || "Medium"}
            weatherSeverity={routeIntel?.weather?.severity || "moderate"}
            reduceMotion={reduceMotion}
            threeDEnabled={threeDEnabled}
          />
        </section>
      )}

      {(freeze || bnpl) && (
        <section className="glass card finance-summary">
          <div className="panel-top">
            <div>
              <h3>Travel Finance Snapshot</h3>
              <p>{travelFinanceNote || "Price freeze and BNPL estimates are ready for the selected route."}</p>
            </div>
            <span className="policy-badge ok">{travelFinanceSource === "local" ? "Local fallback" : travelFinanceSource === "api" ? "API-backed" : "Ready"}</span>
          </div>

          <div className="finance-grid">
            {freeze && (
              <div className="finance-card">
                <strong>Price Freeze</strong>
                <p>Lock fee: {formatInrFromUsd(freeze.lockFee)}</p>
                <p>Valid for {freeze.validHours} hours</p>
                <p>Volatility: {freeze.volatility || "Medium"}</p>
                <p>Estimated upside: {formatInrFromUsd(Number(freeze.estimatedUpside || 0))}</p>
              </div>
            )}
            {bnpl && (
              <div className="finance-card">
                <strong>Agentic BNPL</strong>
                <p>Risk band: {bnpl.riskBand}</p>
                <p>Suggested down payment: {formatInrFromUsd(Number(bnpl.suggestedDownPayment || 0))}</p>
                <p>APR: {(Number(bnpl.apr || 0) * 100).toFixed(1)}%</p>
                <p>{bnpl.reason}</p>
              </div>
            )}
          </div>

          {bnpl?.plans?.length ? (
            <div className="chip-row bnpl-plan-row">
              {bnpl.plans.map((plan) => (
                <span key={plan.months} className="policy-badge ok">{plan.months} mo: {formatInrFromUsd(plan.installment)}</span>
              ))}
            </div>
          ) : null}
        </section>
      )}

      {loading ? (
        <section aria-live="polite">
          <SkeletonLoader className="sr-only" ariaLabel="Loading flight offers" />
          <div className="grid two">
            <FlightResultCardSkeleton />
            <FlightResultCardSkeleton />
          </div>
        </section>
      ) : null}
      <div className="grid two">
        {!loading && visibleResults.map((flight) => (
          <div key={flight.id} className="stack">
            <FlightResultCard flight={flight} onSelect={onSelectFlight} onFreeze={onFreeze} onBnpl={onBnpl} />
            <button type="button" className={`btn secondary compare-btn ${comparedIds.includes(flight.id) ? "active" : ""}`} onClick={() => toggleCompare(flight.id)} disabled={!comparedIds.includes(flight.id) && comparedIds.length >= 2}>
              {comparedIds.includes(flight.id) ? "Remove Compare" : "Add to Compare"}
            </button>
          </div>
        ))}
      </div>

      {!loading && visibleResults.length === 0 && (
        <section className="glass card empty-state-card">
          <h3>No matching flights</h3>
          <p>Try increasing max fare, clearing airline chips, or switching departure window.</p>
          <div className="btn-row">
            <button type="button" className="btn secondary" onClick={() => { setInPolicyOnly(false); setNonStopOnly(false); setDepartureWindow("any"); setSelectedAirlines([]); }}>Reset Filters</button>
            <button type="button" className="btn secondary" onClick={() => setMaxFare((v) => v + 200)}>Increase Max Fare +200</button>
          </div>
        </section>
      )}

      {comparedFlights.length > 0 && (
        <section className="glass card compare-panel">
          <h3>Compare Offers</h3>
          <div className="compare-grid">
            {comparedFlightsSorted.map((flight) => (
              <div key={`compare-${flight.id}`} className={`compare-item ${pinnedCompareId === flight.id ? "pinned" : ""}`}>
                <strong>{flight.carrier} {flight.from} {" -> "} {flight.to}</strong>
                <div className="chip-row compare-winners">
                  {compareWinners.fare === flight.id && <span className="policy-badge ok">Best Fare</span>}
                  {compareWinners.duration === flight.id && <span className="policy-badge ok">Fastest</span>}
                  {compareWinners.carbon === flight.id && <span className="policy-badge ok">Lowest Carbon</span>}
                  {compareWinners.value === flight.id && <span className="policy-badge ok">Top Value</span>}
                </div>
                <p>Fare: {formatInrFromUsd(flight.fare)}</p>
                <p>Stops: {flight.stops === 0 ? "Non-stop" : `${flight.stops} stop`}</p>
                <p>Duration: {Math.floor(flight.durationMin / 60)}h {flight.durationMin % 60}m</p>
                <p>Carbon: {flight.carbonKg} kg</p>
                <p>Value: {flight.valueScore} / 100</p>
                <button type="button" className="btn secondary" onClick={() => setPinnedCompareId((prev) => (prev === flight.id ? "" : flight.id))}>
                  {pinnedCompareId === flight.id ? "Unpin" : "Pin"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {savedComparisons.length > 0 && (
        <section className="glass card compare-panel">
          <h3>Saved Comparisons</h3>
          <div className="timeline-list">
            {savedComparisons.map((item) => (
              <div key={item.id} className="timeline-item">
                <strong>{new Date(item.createdAt).toLocaleString()}</strong>
                <p>{item.flights.map((f) => `${f.carrier} ${f.route} ${formatInrFromUsd(f.fare)}`).join(" | ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {comparedFlights.length > 0 && (
        <section className="sticky-compare-bar glass">
          <div>
            Comparing {comparedFlights.length} offer{comparedFlights.length > 1 ? "s" : ""}
          </div>
          <div className="btn-row">
            <button type="button" className="btn secondary" onClick={saveCurrentComparison}>Save Comparison</button>
            <button type="button" className="btn secondary" onClick={() => setComparedIds([])}>Clear</button>
          </div>
        </section>
      )}
    </section>
  );
}
