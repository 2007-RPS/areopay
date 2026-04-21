import React, { useEffect, useMemo, useState } from "react";
import FormInput from "../components/FormInput";
import FormCheckbox from "../components/FormCheckbox";
import LoadingBadge from "../components/LoadingBadge";
import AdvancedFilters from "../components/AdvancedFilters";
import { validateSearchForm } from "../lib/validation";
import { formatInr, inrToUsd, usdToInr } from "../lib/currency";

const CITY_TO_CODE = {
  tokyo: "NRT",
  singapore: "SIN",
  delhi: "DEL",
  mumbai: "BOM",
  london: "LHR",
  dubai: "DXB",
  paris: "CDG",
  newyork: "JFK",
  newyorkcity: "JFK",
  bangalore: "BLR",
  bengaluru: "BLR",
};

function normalizeLocationToken(token) {
  if (!token) return "";
  const cleaned = token.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return "";
  if (cleaned.length === 3) return cleaned.toUpperCase();
  return CITY_TO_CODE[cleaned] || "";
}

function formatDateIsoLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveRelativeWeekday(modifier, weekdayText, baseDate = new Date()) {
  const weekdayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const target = weekdayMap[weekdayText?.toLowerCase()];
  if (target === undefined) return "";

  const current = new Date(baseDate);
  current.setHours(0, 0, 0, 0);
  const currentDay = current.getDay();

  let delta = (target - currentDay + 7) % 7;
  if (modifier === "next") {
    if (delta === 0) delta = 7;
  } else if (modifier === "this") {
    if (delta === 0) {
      return formatDateIsoLocal(current);
    }
  }

  const resolved = new Date(current);
  resolved.setDate(current.getDate() + delta);
  return formatDateIsoLocal(resolved);
}

function parsePrompt(prompt) {
  const text = String(prompt || "").trim();
  if (!text) return {};

  const lower = text.toLowerCase();
  const updates = {};

  const fromMatch = lower.match(/\bfrom\s+([a-z\s]{3,}|[a-z]{3})(?=\s+to\b|\s+under\b|\s+with\b|\s+on\b|\s+next\b|\s+this\b|$)/i);
  const toMatch = lower.match(/\bto\s+([a-z\s]{3,}|[a-z]{3})(?=\s+under\b|\s+with\b|\s+on\b|\s+next\b|\s+this\b|\s+for\b|$)/i);
  const budgetMatch = lower.match(/\b(?:under|budget)\s*(?:₹|rs\.?\s*)?\s*(\d{3,9})\b/i);
  const adultsMatch = lower.match(/\b(\d{1,2})\s+adults?\b/i);
  const childrenMatch = lower.match(/\b(\d{1,2})\s+children?\b/i);
  const infantsMatch = lower.match(/\b(\d{1,2})\s+infants?\b/i);
  const departMatch = text.match(/\b(?:depart|departure|on)\s*(?:date)?\s*[:=-]?\s*(\d{4}-\d{2}-\d{2})\b/i);
  const returnMatch = text.match(/\b(?:return|back)\s*(?:date)?\s*[:=-]?\s*(\d{4}-\d{2}-\d{2})\b/i);
  const relativeMatches = [...lower.matchAll(/\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g)];
  const tomorrowMatch = /\btomorrow\b/.test(lower);
  const dayAfterTomorrowMatch = /\bday\s+after\s+tomorrow\b/.test(lower);

  const fromCode = normalizeLocationToken(fromMatch?.[1]);
  const toCode = normalizeLocationToken(toMatch?.[1]);

  if (fromCode) updates.from = fromCode;
  if (toCode) updates.to = toCode;
  if (budgetMatch?.[1]) updates.budget = inrToUsd(Number(budgetMatch[1]));
  if (adultsMatch?.[1]) updates.adults = Math.max(1, Number(adultsMatch[1]));
  if (childrenMatch?.[1]) updates.children = Math.max(0, Number(childrenMatch[1]));
  if (infantsMatch?.[1]) updates.infants = Math.max(0, Number(infantsMatch[1]));
  if (departMatch?.[1]) updates.departDate = departMatch[1];
  if (returnMatch?.[1]) updates.returnDate = returnMatch[1];

  if (!updates.departDate && dayAfterTomorrowMatch) {
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() + 2);
    updates.departDate = formatDateIsoLocal(next);
  } else if (!updates.departDate && tomorrowMatch) {
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() + 1);
    updates.departDate = formatDateIsoLocal(next);
  }

  if (relativeMatches.length > 0) {
    const first = resolveRelativeWeekday(relativeMatches[0][1], relativeMatches[0][2]);
    if (first && !updates.departDate) {
      updates.departDate = first;
    }
    if (relativeMatches.length > 1 && !updates.returnDate) {
      const second = resolveRelativeWeekday(relativeMatches[1][1], relativeMatches[1][2]);
      if (second) {
        updates.returnDate = second;
      }
    }
  }

  if (lower.includes("premium economy")) updates.cabin = "Premium Economy";
  else if (lower.includes("business")) updates.cabin = "Business";
  else if (lower.includes("first")) updates.cabin = "First";
  else if (lower.includes("economy")) updates.cabin = "Economy";

  if (lower.includes("one way") || lower.includes("one-way")) updates.tripType = "one-way";
  else if (lower.includes("multi city") || lower.includes("multi-city")) updates.tripType = "multi-city";
  else if (lower.includes("round trip") || lower.includes("round-trip")) updates.tripType = "round-trip";

  if (lower.includes("non-stop") || lower.includes("nonstop")) updates.nonStopOnly = true;

  return updates;
}

function buildPromptFromForm(searchForm) {
  const cabin = (searchForm.cabin || "Business").toLowerCase();
  const tripTypeLabel =
    searchForm.tripType === "one-way"
      ? "one-way"
      : searchForm.tripType === "multi-city"
        ? "multi-city"
        : "round-trip";
  const route = `from ${searchForm.from || "DEL"} to ${searchForm.to || "NRT"}`;
  const departPart = searchForm.departDate ? ` depart ${searchForm.departDate}` : "";
  const returnPart = searchForm.tripType !== "one-way" && searchForm.returnDate ? ` return ${searchForm.returnDate}` : "";
  const budget = searchForm.budget ? ` under ${formatInr(usdToInr(searchForm.budget))}` : "";
  const nonstop = searchForm.nonStopOnly ? " with non-stop only" : "";
  const travelers = `${Math.max(1, searchForm.adults || 1)} adults ${Math.max(0, searchForm.children || 0)} children ${Math.max(0, searchForm.infants || 0)} infants`;
  return `Find ${cabin} ${tripTypeLabel} flight ${route}${departPart}${returnPart}${budget}${nonstop} for ${travelers}`.trim();
}

function mergePromptIntoForm(prev, prompt) {
  const updates = parsePrompt(prompt);
  if (!Object.keys(updates).length) {
    return { next: prev, changed: false };
  }

  let changed = false;
  const next = { ...prev };
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && next[key] !== value) {
      next[key] = value;
      changed = true;
    }
  });
  return { next, changed };
}

export default function SearchPage({ sessionKey, prompt, setPrompt, searchForm, setSearchForm, onSearch, loading = false, searchError = "" }) {
  const [autoSync, setAutoSync] = useState(true);
  const [lastEditedSource, setLastEditedSource] = useState("form");
  const [localError, setLocalError] = useState("");

  const spotlightDestinations = [
    {
      city: "Tokyo",
      note: "High-demand tech corridor",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=80",
    },
    {
      city: "Singapore",
      note: "Efficient business routing",
      image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=80",
    },
  ];

  function setField(field, value) {
    setLastEditedSource("form");
    setSearchForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePromptChange(value) {
    setLastEditedSource("prompt");
    setPrompt(value);
  }

  function usePromptTemplate(value) {
    setLastEditedSource("prompt");
    setPrompt(value);
  }

  function adjustCount(field, delta) {
    setLastEditedSource("form");
    setSearchForm((prev) => {
      const min = field === "adults" ? 1 : 0;
      return {
        ...prev,
        [field]: Math.max(min, prev[field] + delta),
      };
    });
  }

  const generatedPrompt = useMemo(() => buildPromptFromForm(searchForm), [searchForm]);
  const budgetInr = useMemo(() => Math.round(usdToInr(searchForm.budget || 0)), [searchForm.budget]);

  useEffect(() => {
    if (!autoSync) return;
    if (lastEditedSource !== "form") return;
    if (prompt === generatedPrompt) return;
    setPrompt(generatedPrompt);
  }, [autoSync, generatedPrompt, lastEditedSource, prompt, setPrompt]);

  useEffect(() => {
    if (!autoSync) return;
    if (lastEditedSource !== "prompt") return;
    if (!prompt?.trim()) return;
    setSearchForm((prev) => {
      const { next, changed } = mergePromptIntoForm(prev, prompt);
      return changed ? next : prev;
    });
  }, [autoSync, lastEditedSource, prompt, setSearchForm]);

  function handleAutoSyncToggle(enabled) {
    setAutoSync(enabled);
    if (!enabled) return;

    setSearchForm((prev) => {
      const { next, changed } = mergePromptIntoForm(prev, prompt);
      if (changed) {
        const rebuilt = buildPromptFromForm(next);
        if (rebuilt !== prompt) {
          setPrompt(rebuilt);
        }
        setLastEditedSource("form");
        return next;
      }

      const rebuilt = buildPromptFromForm(prev);
      if (rebuilt !== prompt) {
        setPrompt(rebuilt);
      }
      setLastEditedSource("form");
      return prev;
    });
  }

  function handleSearchClick() {
    const validationError = validateSearchForm(searchForm);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError("");
    onSearch();
  }

  return (
    <section className="section-stack" aria-busy={loading}>
      <section className="page-hero search-hero glass card">
        <div className="search-hero-content">
          <p className="hero-eyebrow">AeroNova concierge</p>
          <h2>Plan Smarter Routes With Finance Built In</h2>
          <p>Run one guided search for route quality, policy fit, freeze potential, and BNPL readiness.</p>
          <div className="hero-kpi-row">
            <span className="policy-badge ok">42M fares indexed</span>
            <span className="policy-badge ok">Policy-aware pricing</span>
            <span className="policy-badge ok">Live risk insights</span>
          </div>
        </div>
        <div className="page-hero-meta">
          <span className="policy-badge ok">Local-only backend</span>
          <span className="policy-badge ok">Session {sessionKey.slice(-8)}</span>
        </div>
        <div className="destination-spotlight-grid">
          {spotlightDestinations.map((item) => (
            <article key={item.city} className="destination-spotlight-card">
              <img src={item.image} alt={`${item.city} skyline`} loading="lazy" />
              <div>
                <strong>{item.city}</strong>
                <p>{item.note}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="search-box glass card">
        <div className="trip-tabs">
          <button type="button" className={`btn secondary ${searchForm.tripType === "one-way" ? "active" : ""}`} onClick={() => setField("tripType", "one-way")}>One Way</button>
          <button type="button" className={`btn secondary ${searchForm.tripType === "round-trip" ? "active" : ""}`} onClick={() => setField("tripType", "round-trip")}>Round Trip</button>
          <button type="button" className={`btn secondary ${searchForm.tripType === "multi-city" ? "active" : ""}`} onClick={() => setField("tripType", "multi-city")}>Multi City</button>
        </div>

        <div className="search-grid">
          <FormInput id="search-from" label="From" value={searchForm.from} onChange={(e) => setField("from", e.target.value.toUpperCase())} placeholder="DEL" />
          <FormInput id="search-to" label="To" value={searchForm.to} onChange={(e) => setField("to", e.target.value.toUpperCase())} placeholder="NRT" />
          <FormInput id="search-departure" label="Departure" type="date" value={searchForm.departDate} onChange={(e) => setField("departDate", e.target.value)} />
          <FormInput id="search-return" label="Return" type="date" value={searchForm.returnDate} onChange={(e) => setField("returnDate", e.target.value)} disabled={searchForm.tripType === "one-way"} />
          <FormInput id="search-cabin" label="Cabin" as="select" value={searchForm.cabin} onChange={(e) => setField("cabin", e.target.value)}>
              <option>Economy</option>
              <option>Premium Economy</option>
              <option>Business</option>
              <option>First</option>
            </FormInput>
          <FormInput id="search-budget" label="Budget (INR)" type="number" min={8000} value={budgetInr} onChange={(e) => setField("budget", inrToUsd(Number(e.target.value || 0)))} />
        </div>

        <div className="control-row">
          <div className="traveller-picker">
            <span>Adults</span>
            <button type="button" className="small-btn" onClick={() => adjustCount("adults", -1)}>-</button>
            <strong>{searchForm.adults}</strong>
            <button type="button" className="small-btn" onClick={() => adjustCount("adults", 1)}>+</button>
          </div>
          <div className="traveller-picker">
            <span>Children</span>
            <button type="button" className="small-btn" onClick={() => adjustCount("children", -1)}>-</button>
            <strong>{searchForm.children}</strong>
            <button type="button" className="small-btn" onClick={() => adjustCount("children", 1)}>+</button>
          </div>
          <div className="traveller-picker">
            <span>Infants</span>
            <button type="button" className="small-btn" onClick={() => adjustCount("infants", -1)}>-</button>
            <strong>{searchForm.infants}</strong>
            <button type="button" className="small-btn" onClick={() => adjustCount("infants", 1)}>+</button>
          </div>
          <FormCheckbox id="search-non-stop" label="Non-stop only" checked={searchForm.nonStopOnly} onChange={(e) => setField("nonStopOnly", e.target.checked)} />
        </div>

        <FormCheckbox id="search-auto-sync" label="Auto sync prompt and trip fields" checked={autoSync} onChange={(e) => handleAutoSyncToggle(e.target.checked)} />
        <FormInput
          id="search-prompt"
          label="AeroNova Concierge Prompt"
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          placeholder="Find me a business flight to Tokyo under Rs 120000 next Tuesday"
          helperText="Natural language search updates the structured fields when auto sync is enabled."
        />
        <div className="btn-row">
          <button type="button" aria-label="Run Concierge Search" className="btn primary" onClick={handleSearchClick} disabled={loading}>Search</button>
        </div>
        {loading ? <LoadingBadge text="Running concierge route search..." /> : null}
        {localError ? <p className="search-error" role="alert" aria-live="assertive">{localError}</p> : null}
        {!localError && searchError ? <p className="search-error" role="alert" aria-live="assertive">{searchError}</p> : null}
        <div className="chip-row quick-fill-row">
          <button type="button" className="chip-btn" onClick={() => usePromptTemplate("Best non-stop business flight from DEL to NRT under Rs 120000")}>Use Non-stop Prompt</button>
          <button type="button" className="chip-btn" onClick={() => usePromptTemplate("Lowest carbon economy round-trip from DEL to SIN under Rs 100000")}>Use ESG Prompt</button>
          <button type="button" className="chip-btn" onClick={() => usePromptTemplate("Policy compliant business weekday flight from DEL to LHR under Rs 140000")}>Use Policy Prompt</button>
        </div>
      </section>

      <AdvancedFilters searchForm={searchForm} onChange={setField} />

      <section className="glass card prompt-examples">
        <h3>Starter Prompts</h3>
        <div className="chip-row">
          <span className="policy-badge ok">Board meeting trip under Rs 120000 with one stop max</span>
          <span className="policy-badge ok">Lowest carbon business route to Singapore this Friday</span>
          <span className="policy-badge ok">Family itinerary with freeze and split payment options</span>
        </div>
      </section>
    </section>
  );
}
