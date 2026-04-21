import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import SearchPage from "./pages/SearchPage";

function makeProps(overrides = {}) {
  return {
    sessionKey: "sess-12345678",
    prompt: "find route",
    setPrompt: vi.fn(),
    searchForm: {
      tripType: "round-trip",
      from: "DEL",
      to: "NRT",
      departDate: "2026-05-15",
      returnDate: "2026-05-22",
      cabin: "Business",
      adults: 1,
      children: 0,
      infants: 0,
      budget: 1400,
      nonStopOnly: false,
    },
    setSearchForm: vi.fn(),
    onSearch: vi.fn(),
    loading: false,
    searchError: "",
    ...overrides,
  };
}

test("search page blocks invalid form and shows validation error", () => {
  const props = makeProps({
    searchForm: {
      ...makeProps().searchForm,
      from: "DE",
    },
  });

  render(<SearchPage {...props} />);

  fireEvent.click(screen.getByRole("button", { name: /run concierge search/i }));

  expect(screen.getByText("From must be a valid 3-letter IATA code.")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("From must be a valid 3-letter IATA code.");
  expect(props.onSearch).not.toHaveBeenCalled();
});

test("search page calls onSearch for valid form", () => {
  const props = makeProps();

  render(<SearchPage {...props} />);

  fireEvent.click(screen.getByRole("button", { name: /run concierge search/i }));

  expect(props.onSearch).toHaveBeenCalledTimes(1);
});
