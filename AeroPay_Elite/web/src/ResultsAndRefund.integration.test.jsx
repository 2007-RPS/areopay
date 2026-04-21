import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, test } from "vitest";
import ResultsPage from "./pages/ResultsPage";
import BookingDetailPage from "./pages/BookingDetailPage";

const MOCK_RESULTS = [
  {
    id: "F-1",
    offerId: "OFF-1",
    carrier: "SkyJet",
    from: "DEL",
    to: "NRT",
    cabin: "Business",
    fare: 1200,
    valueScore: 70,
    sparkline: [1, 2, 3],
    demandIndex: 0.8,
    carbonKg: 700,
    policy: { inPolicy: false, reasons: ["Exceeds budget cap"] },
  },
  {
    id: "F-2",
    offerId: "OFF-2",
    carrier: "CloudAir",
    from: "DEL",
    to: "NRT",
    cabin: "Business",
    fare: 1100,
    valueScore: 76,
    sparkline: [3, 2, 1],
    demandIndex: 0.7,
    carbonKg: 620,
    policy: { inPolicy: true, reasons: [] },
  },
];

test("results compare supports add/save and shows saved comparisons", () => {
  render(
    <ResultsPage
      results={MOCK_RESULTS}
      loading={false}
      searchForm={{ budget: 2000, nonStopOnly: false }}
      onSelectFlight={() => {}}
      onFreeze={() => {}}
      onBnpl={() => {}}
      sessionKey="sess-12345678"
    />
  );

  fireEvent.click(screen.getAllByRole("button", { name: "Add to Compare" })[0]);
  fireEvent.click(screen.getAllByRole("button", { name: "Add to Compare" })[0]);

  expect(screen.getByText(/Comparing 2 offers/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Save Comparison" }));

  expect(screen.getByText("Saved Comparisons")).toBeInTheDocument();
});

test("booking detail renders refund ledger and SLA badge", () => {
  const bookings = [
    {
      id: "BK-1",
      pnr: "PNR-1",
      paymentId: "PAY-1",
      offerId: "OFF-1",
      carrier: "SkyJet",
      routeLabel: "DEL -> NRT",
      travelerName: "Arihant Singh",
      travelerEmail: "a@example.com",
      seatLabel: "P1: 2A",
      total: 1200,
      status: "REFUND_PROCESSING",
      createdAt: new Date().toISOString(),
      refund: {
        grossAmount: 1200,
        cancellationFee: 96,
        serviceFee: 24,
        netAmount: 1080,
        mode: "Original payment sources",
        stage: "PROCESSING",
      },
      timeline: [
        { id: "evt-1", type: "REFUND_INITIATED", message: "Refund workflow initiated.", at: new Date().toISOString() },
      ],
    },
  ];

  render(
    <MemoryRouter initialEntries={["/trips/BK-1"]}>
      <Routes>
        <Route path="/trips/:bookingId" element={<BookingDetailPage bookings={bookings} sessionKey="sess-12345678" onCancelBooking={() => {}} onRescheduleBooking={() => {}} />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText("Refund Ledger")).toBeInTheDocument();
  expect(screen.getByText(/Net Refund:/)).toBeInTheDocument();
  expect(screen.getByText(/ETA/)).toBeInTheDocument();
});

test("results loading view exposes live status and skeleton announcement", () => {
  render(
    <ResultsPage
      results={MOCK_RESULTS}
      loading
      searchForm={{ budget: 2000, nonStopOnly: false }}
      onSelectFlight={() => {}}
      onFreeze={() => {}}
      onBnpl={() => {}}
      sessionKey="sess-12345678"
    />
  );

  expect(screen.getByText("Refreshing offers and policy insights...")).toBeInTheDocument();
  expect(screen.getByLabelText("Loading flight offers")).toBeInTheDocument();
});
