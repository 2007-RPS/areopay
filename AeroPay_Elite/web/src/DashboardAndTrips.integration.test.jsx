import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import DashboardPage from "./pages/DashboardPage";
import BookingHistoryPage from "./pages/BookingHistoryPage";

function stubStorage(initial = {}) {
  const storage = { ...initial };
  vi.stubGlobal("localStorage", {
    getItem: (key) => (key in storage ? storage[key] : null),
    setItem: (key, value) => {
      storage[key] = String(value);
    },
    removeItem: (key) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    },
  });
}

test("dashboard surfaces persisted account snapshot", () => {
  stubStorage({
    "aero.profile.loyaltyStatus": JSON.stringify("platinum"),
    "aero.profile.paymentMethods": JSON.stringify([{ id: "card-1" }, { id: "card-2" }]),
    "aero.profile.preferences": JSON.stringify({ seatType: "aisle", mealPreference: "vegan" }),
    "aero.wallet.transactions": JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]),
    "aero.wallet.filter": JSON.stringify("refund"),
    "aero.esg.roundup": JSON.stringify(18.5),
    "aero.esg.carbonHistory": JSON.stringify([{ id: 1 }, { id: 2 }]),
    "aero.settings.theme": JSON.stringify("light"),
    "aero.settings.language": JSON.stringify("es"),
  });

  render(
    <MemoryRouter>
      <DashboardPage
        profile={{ name: "Avery Stone", email: "avery@example.com" }}
        bookings={[]}
        wallet={{ balance: 240, travelPoints: 80, escrowHeld: 20 }}
        resultsCount={4}
        sessionKey="sess-12345678"
      />
    </MemoryRouter>
  );

  expect(screen.getAllByText("PLATINUM", { selector: "strong" })[0]).toBeInTheDocument();
  expect(screen.getAllByText("₹1,542.90", { selector: "strong" })[0]).toBeInTheDocument();
  expect(screen.getAllByText("light / es", { selector: "strong" })[0]).toBeInTheDocument();
  expect(screen.getByText("Preferred seat: aisle")).toBeInTheDocument();
  expect(screen.getByText("Saved wallet transactions: 3")).toBeInTheDocument();
  expect(screen.getByText("Carbon offsets tracked: 2")).toBeInTheDocument();
});

test("booking history filters and sorts trips", () => {
  const bookings = [
    {
      id: "B-1",
      routeLabel: "DEL -> NRT",
      pnr: "PNR-1",
      travelerName: "Alex",
      seatLabel: "12A",
      total: 900,
      createdAt: "2026-04-16T10:00:00.000Z",
      status: "CONFIRMED",
      timeline: [],
    },
    {
      id: "B-2",
      routeLabel: "SFO -> LHR",
      pnr: "PNR-2",
      travelerName: "Jordan",
      seatLabel: "1A",
      total: 1200,
      createdAt: "2026-04-14T10:00:00.000Z",
      status: "REFUND_PROCESSING",
      timeline: [],
    },
  ];

  render(
    <MemoryRouter>
      <BookingHistoryPage bookings={bookings} sessionKey="sess-12345678" onCancelBooking={() => {}} />
    </MemoryRouter>
  );

  expect(screen.getByText("DEL -> NRT")).toBeInTheDocument();
  expect(screen.getByText("SFO -> LHR")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Filter by status"), { target: { value: "REFUND_PROCESSING" } });

  expect(screen.queryByText("DEL -> NRT")).not.toBeInTheDocument();
  expect(screen.getByText("SFO -> LHR")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Search trips"), { target: { value: "PNR-2" } });

  expect(screen.getByText("SFO -> LHR")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Sort trips"), { target: { value: "oldest" } });

  expect(screen.getByText("1 shown")).toBeInTheDocument();
});

test("booking history restores persisted filters and supports clear action", () => {
  stubStorage({
    "aero.trips.filters": JSON.stringify({
      statusFilter: "REFUND_PROCESSING",
      sortMode: "oldest",
      query: "PNR-2",
    }),
  });

  const bookings = [
    {
      id: "B-1",
      routeLabel: "DEL -> NRT",
      pnr: "PNR-1",
      travelerName: "Alex",
      seatLabel: "12A",
      total: 900,
      createdAt: "2026-04-16T10:00:00.000Z",
      status: "CONFIRMED",
      timeline: [],
    },
    {
      id: "B-2",
      routeLabel: "SFO -> LHR",
      pnr: "PNR-2",
      travelerName: "Jordan",
      seatLabel: "1A",
      total: 1200,
      createdAt: "2026-04-14T10:00:00.000Z",
      status: "REFUND_PROCESSING",
      timeline: [],
    },
  ];

  render(
    <MemoryRouter>
      <BookingHistoryPage bookings={bookings} sessionKey="sess-12345678" onCancelBooking={() => {}} />
    </MemoryRouter>
  );

  expect(screen.queryByText("DEL -> NRT")).not.toBeInTheDocument();
  expect(screen.getByText("SFO -> LHR")).toBeInTheDocument();
  const savedFiltersButton = screen.getByRole("button", { name: "Saved filters active" });
  expect(savedFiltersButton).toBeInTheDocument();
  expect(savedFiltersButton).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByLabelText("Search trips")).toHaveValue("PNR-2");
  expect(screen.getByLabelText("Filter by status")).toHaveValue("REFUND_PROCESSING");
  expect(screen.getByLabelText("Sort trips")).toHaveValue("oldest");

  fireEvent.click(savedFiltersButton);

  expect(screen.getByText("Status:", { selector: "strong" })).toBeInTheDocument();
  expect(screen.getByText("Sort:", { selector: "strong" })).toBeInTheDocument();
  expect(screen.getByText("Query:", { selector: "strong" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Clear trip filters" }));

  expect(screen.getByLabelText("Search trips")).toHaveValue("");
  expect(screen.getByLabelText("Filter by status")).toHaveValue("all");
  expect(screen.getByLabelText("Sort trips")).toHaveValue("newest");
  expect(screen.queryByRole("button", { name: "Saved filters active" })).not.toBeInTheDocument();
  expect(screen.queryByText("Status:", { selector: "strong" })).not.toBeInTheDocument();
  expect(screen.getByText("DEL -> NRT")).toBeInTheDocument();
  expect(screen.getByText("SFO -> LHR")).toBeInTheDocument();
});