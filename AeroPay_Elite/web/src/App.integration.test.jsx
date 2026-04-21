import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import App from "./App";

function mockApi(url, options = {}) {
  if (url.endsWith("/wallet")) {
    return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { balance: 1500, travelPoints: 100, escrowHeld: 0 } }) });
  }
  if (url.includes("/boarding-pass")) {
    return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { pnr: "PNR-1", gate: "A1", seat: "1A" } }) });
  }
  if (url.endsWith("/search")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          results: [
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
          ],
        },
      }),
    });
  }
  if (url.endsWith("/seat-lock/start")) {
    return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { lockId: "LOCK-1", expiresAt: Date.now() + 10000 } }) });
  }
  if (url.endsWith("/corporate/approval/request")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({ ok: true, data: { token: "APR-123ABC", approvedBy: "manager.mock@aeropay.local" } }),
    });
  }
  if (url.includes("/seat-lock/")) {
    return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { remainingMs: 9000 } }) });
  }
  if (url.endsWith("/bnpl/assess")) {
    return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { riskBand: "Low", plans: [] } }) });
  }
  if (url.endsWith("/price-freeze")) {
    return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { lockFee: 12 } }) });
  }
  return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: {} }), blob: async () => new Blob() });
}

test("out-of-policy itinerary shows manager approval flow and token", async () => {
  const storage = {};
  vi.stubGlobal("localStorage", {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => {
      storage[key] = String(value);
    },
  });
  vi.stubGlobal("fetch", vi.fn(mockApi));

  render(
    <MemoryRouter initialEntries={["/search"]}>
      <App />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Run Concierge Search" }));

  await waitFor(() => {
    expect(screen.getByText("SkyJet | Business")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Select"));

  await waitFor(() => {
    expect(screen.getByText(/Manager Approval Required/)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText("Request Manager Approval"));

  await waitFor(() => {
    expect(screen.getByText("APR-123ABC")).toBeInTheDocument();
  });
});

test("global search shortcut toggles overlay and restores focus on close", async () => {
  const storage = {};
  vi.stubGlobal("localStorage", {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => {
      storage[key] = String(value);
    },
  });
  vi.stubGlobal("fetch", vi.fn(mockApi));

  render(
    <MemoryRouter initialEntries={["/search"]}>
      <App />
    </MemoryRouter>
  );

  const trigger = screen.getByRole("button", { name: /Toggle notifications/i });
  trigger.focus();
  expect(document.activeElement).toBe(trigger);

  const overlay = document.querySelector(".search-overlay");
  expect(overlay).not.toHaveClass("open");

  fireEvent.keyDown(window, { key: "k", ctrlKey: true });

  await waitFor(() => {
    expect(overlay).toHaveClass("open");
  });

  const searchInput = screen.getByPlaceholderText("Search notifications, routes, and more... (Cmd+K)");
  expect(document.activeElement).toBe(searchInput);

  fireEvent.keyDown(window, { key: "Escape" });

  await waitFor(() => {
    expect(overlay).not.toHaveClass("open");
  });
  expect(document.activeElement).toBe(trigger);
});

test("search announces loading state while concierge request is running", async () => {
  const storage = {};
  vi.stubGlobal("localStorage", {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => {
      storage[key] = String(value);
    },
  });

  vi.stubGlobal("fetch", vi.fn((url, options = {}) => {
    if (url.endsWith("/wallet")) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { balance: 1500, travelPoints: 100, escrowHeld: 0 } }) });
    }
    if (url.includes("/boarding-pass")) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { pnr: "PNR-1", gate: "A1", seat: "1A" } }) });
    }
    if (url.endsWith("/search")) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({
              ok: true,
              data: {
                results: [
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
                ],
              },
            }),
          });
        }, 120);
      });
    }
    return mockApi(url, options);
  }));

  render(
    <MemoryRouter initialEntries={["/search"]}>
      <App />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Run Concierge Search" }));

  await waitFor(() => {
    expect(screen.getByText("Running concierge route search...")).toBeInTheDocument();
  });

  const searchSection = document.querySelector(".section-stack");
  expect(searchSection).toHaveAttribute("aria-busy", "true");

});
