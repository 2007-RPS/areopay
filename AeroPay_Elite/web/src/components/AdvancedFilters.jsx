import React from "react";
import FormInput from "./FormInput";
import FormCheckbox from "./FormCheckbox";

export default function AdvancedFilters({ searchForm, onChange }) {
  return (
    <section className="advanced-filters glass card">
      <div className="panel-top">
        <div>
          <h3>Advanced Search Controls</h3>
          <p>Fine-tune alliance, layovers, baggage, and flexibility before running concierge search.</p>
        </div>
        <span className="policy-badge ok">Phase 1</span>
      </div>

      <div className="filter-grid advanced-filter-grid">
        <FormInput
          id="search-alliance"
          label="Alliance"
          as="select"
          value={searchForm.alliance || "any"}
          onChange={(event) => onChange("alliance", event.target.value)}
        >
          <option value="any">Any Alliance</option>
          <option value="star">Star Alliance</option>
          <option value="oneworld">Oneworld</option>
          <option value="skyteam">SkyTeam</option>
        </FormInput>

        <FormInput
          id="search-max-layover"
          label="Max Layover (minutes)"
          type="number"
          min={30}
          step={15}
          value={searchForm.maxLayover}
          onChange={(event) => onChange("maxLayover", Number(event.target.value || 0))}
        />

        <FormInput
          id="search-departure-window-preset"
          label="Preferred Departure Window"
          as="select"
          value={searchForm.departureWindowPreset || "any"}
          onChange={(event) => onChange("departureWindowPreset", event.target.value)}
        >
          <option value="any">Any Time</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening / Night</option>
        </FormInput>

        <FormCheckbox
          id="search-baggage-included"
          label="Baggage included fares only"
          checked={Boolean(searchForm.baggageIncludedOnly)}
          onChange={(event) => onChange("baggageIncludedOnly", event.target.checked)}
        />

        <FormCheckbox
          id="search-flexible-dates"
          label="Flexible dates (+/- 2 days)"
          checked={Boolean(searchForm.flexibleDates)}
          onChange={(event) => onChange("flexibleDates", event.target.checked)}
        />

        <FormCheckbox
          id="search-refundable-only"
          label="Refundable fares only"
          checked={Boolean(searchForm.refundableOnly)}
          onChange={(event) => onChange("refundableOnly", event.target.checked)}
        />
      </div>
    </section>
  );
}
