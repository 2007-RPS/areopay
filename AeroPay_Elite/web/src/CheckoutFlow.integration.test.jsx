import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import App from "./App";

function createMockApi(options = {}) {
  const paymentResponses = options.paymentResponses || ["success"];
  let paymentAttempt = 0;

  return function mockApi(url) {
    if (url.endsWith("/wallet")) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { balance: 1800, travelPoints: 200, escrowHeld: 0 } }) });
    }
    if (url.includes("/boarding-pass")) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { pnr: "PNR-1", gate: "A1", seat: "2A" } }) });
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
                to: "BOM",
                cabin: "Economy",
                fare: 450,
                valueScore: 84,
                sparkline: [1, 3, 2],
                demandIndex: 0.5,
                carbonKg: 180,
                policy: { inPolicy: true, reasons: [] },
              },
            ],
          },
        }),
      });
    }
    if (url.endsWith("/seat-lock/start")) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { lockId: "LOCK-1", expiresAt: Date.now() + 20000 } }) });
    }
    if (url.includes("/seat-lock/")) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { remainingMs: 18000 } }) });
    }
    if (url.endsWith("/bnpl/assess")) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { riskBand: "Low", plans: [] } }) });
    }
    if (url.endsWith("/price-freeze")) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { lockFee: 8 } }) });
    }
    if (url.endsWith("/escrow/hold")) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { escrowId: "ESC-1" } }) });
    }
    if (url.endsWith("/payment")) {
      const response = paymentResponses[Math.min(paymentAttempt, paymentResponses.length - 1)];
      paymentAttempt += 1;

      if (response === "error") {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ ok: false, error: "Payment could not be completed." }) });
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ ok: true, json: async () => ({ ok: true, data: { paymentId: `PAY-${paymentAttempt}`, status: "SUCCESS" } }) });
        }, 80);
      });
    }
    if (url.endsWith("/escrow/confirm")) {
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: { confirmed: true } }) });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: {} }), blob: async () => new Blob() });
  };
}

function setupApp(options = {}) {
  const storage = {};
  vi.stubGlobal("localStorage", {
    getItem: (key) => storage[key] || null,
    setItem: (key, value) => {
      storage[key] = String(value);
    },
  });
  vi.stubGlobal("fetch", vi.fn(createMockApi(options)));

  render(
    <MemoryRouter initialEntries={["/search"]}>
      <App />
    </MemoryRouter>
  );
}

test("checkout blocks step progression until traveler details are complete", async () => {
  setupApp();

  fireEvent.click(screen.getByRole("button", { name: "Run Concierge Search" }));

  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: "Select" }).length).toBeGreaterThan(0);
  }, { timeout: 4000 });

  fireEvent.click(screen.getByRole("button", { name: "Select" }));

  await waitFor(() => {
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  }, { timeout: 8000 });

  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  expect(screen.queryAllByText("First name is required.").length).toBeGreaterThan(0);
  expect(screen.getByLabelText("First Name")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("First Name")).toHaveAttribute("aria-describedby", "traveler-first-name-message");
  expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
});

test("checkout email field exposes invalid semantics when email format is wrong", async () => {
  setupApp();

  fireEvent.click(screen.getByRole("button", { name: "Run Concierge Search" }));

  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: "Select" }).length).toBeGreaterThan(0);
  }, { timeout: 4000 });

  fireEvent.click(screen.getByRole("button", { name: "Select" }));

  await waitFor(() => {
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  }, { timeout: 8000 });

  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Arihant" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Singh" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "bad-email" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "+919999999999" } });

  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  expect(screen.queryAllByText("Enter a valid email address.").length).toBeGreaterThan(0);
  expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("Email")).toHaveAttribute("aria-describedby", "traveler-email-message");
});

test("checkout keyboard flow can reach final step after valid traveler details", async () => {
  setupApp();

  fireEvent.click(screen.getByRole("button", { name: "Run Concierge Search" }));

  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: "Select" }).length).toBeGreaterThan(0);
  }, { timeout: 8000 });

  fireEvent.click(screen.getByRole("button", { name: "Select" }));

  await waitFor(() => {
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  }, { timeout: 8000 });

  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Arihant" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Singh" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "arihant@example.com" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "+919999999999" } });

  const nextButton = screen.getByRole("button", { name: "Next" });
  nextButton.focus();
  expect(document.activeElement).toBe(nextButton);

  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: /2A/i }));
  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
  });

  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
    expect(screen.getByText("Review & Payment")).toBeInTheDocument();
  });
}, 10000);

test("confirm payment stays disabled until final step and required inputs are complete", async () => {
  setupApp();

  fireEvent.click(screen.getByRole("button", { name: "Run Concierge Search" }));

  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: "Select" }).length).toBeGreaterThan(0);
  }, { timeout: 8000 });

  fireEvent.click(screen.getByRole("button", { name: "Select" }));

  await waitFor(() => {
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  }, { timeout: 8000 });

  const confirmPaymentButton = screen.getByRole("button", { name: "Confirm Payment" });
  expect(confirmPaymentButton).toBeDisabled();
  expect(screen.getByText("Complete traveler details and seat selection to enable payment.")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Arihant" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Singh" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "arihant@example.com" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "+919999999999" } });

  const nextButton = screen.getByRole("button", { name: "Next" });
  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });
  expect(confirmPaymentButton).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: /2A/i }));
  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
  });
  expect(confirmPaymentButton).toBeDisabled();

  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Confirm Payment" })).toBeEnabled();
  }, { timeout: 3000 });
}, 10000);

test("checkout stepper updates aria-current and completed labels across steps", async () => {
  setupApp();

  fireEvent.click(screen.getByRole("button", { name: "Run Concierge Search" }));

  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: "Select" }).length).toBeGreaterThan(0);
  }, { timeout: 8000 });

  fireEvent.click(screen.getByRole("button", { name: "Select" }));

  await waitFor(() => {
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  }, { timeout: 8000 });

  const stepOneInitial = screen.getByLabelText("Step 1: Traveler current");
  expect(stepOneInitial).toHaveAttribute("aria-current", "step");

  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Arihant" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Singh" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "arihant@example.com" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "+919999999999" } });

  fireEvent.click(screen.getByRole("button", { name: "Next" }));

  await waitFor(() => {
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  expect(screen.getByLabelText("Step 1: Traveler completed")).not.toHaveAttribute("aria-current");
  expect(screen.getByLabelText("Step 2: Seats current")).toHaveAttribute("aria-current", "step");
}, 10000);

test("checkout navigation controls update focus and enabled states across steps", async () => {
  setupApp();

  fireEvent.click(screen.getByRole("button", { name: "Run Concierge Search" }));

  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: "Select" }).length).toBeGreaterThan(0);
  }, { timeout: 8000 });

  fireEvent.click(screen.getByRole("button", { name: "Select" }));

  await waitFor(() => {
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  }, { timeout: 8000 });

  const backButton = screen.getByRole("button", { name: "Back" });
  const nextButton = screen.getByRole("button", { name: "Next" });

  expect(backButton).toBeDisabled();
  nextButton.focus();
  expect(document.activeElement).toBe(nextButton);

  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Arihant" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Singh" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "arihant@example.com" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "+919999999999" } });

  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  expect(backButton).toBeEnabled();
  backButton.focus();
  expect(document.activeElement).toBe(backButton);

  fireEvent.click(backButton);

  await waitFor(() => {
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  });
  expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
});

test("checkout status messaging moves from readiness warning to busy processing state", async () => {
  setupApp();

  fireEvent.click(screen.getByRole("button", { name: "Run Concierge Search" }));

  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: "Select" }).length).toBeGreaterThan(0);
  }, { timeout: 8000 });

  fireEvent.click(screen.getByRole("button", { name: "Select" }));

  await waitFor(() => {
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  }, { timeout: 8000 });

  expect(screen.getByRole("alert")).toHaveTextContent("Complete traveler details and seat selection to enable payment.");

  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Arihant" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Singh" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "arihant@example.com" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "+919999999999" } });

  const nextButton = screen.getByRole("button", { name: "Next" });
  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: /2A/i }));

  await waitFor(() => {
    expect(screen.queryByText("Complete traveler details and seat selection to enable payment.")).not.toBeInTheDocument();
  });

  fireEvent.click(nextButton);
  await waitFor(() => {
    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
  });

  fireEvent.click(nextButton);
  await waitFor(() => {
    expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Confirm Payment" })).toBeEnabled();
  }, { timeout: 3000 });

  fireEvent.click(screen.getByRole("button", { name: "Confirm Payment" }));

  await waitFor(() => {
    expect(screen.getByText(/Payment SUCCESS/)).toBeInTheDocument();
  });
}, 10000);

test("checkout smart recommendation applies split and funding controls", async () => {
  setupApp();

  fireEvent.click(screen.getByRole("button", { name: "Run Concierge Search" }));

  await waitFor(() => {
    expect(screen.getAllByRole("button", { name: "Select" }).length).toBeGreaterThan(0);
  }, { timeout: 8000 });

  fireEvent.click(screen.getByRole("button", { name: "Select" }));

  await waitFor(() => {
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  }, { timeout: 8000 });

  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Arihant" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Singh" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "arihant@example.com" } });
  fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "+919999999999" } });

  const nextButton = screen.getByRole("button", { name: "Next" });
  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: /2A/i }));
  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
  });

  fireEvent.click(nextButton);

  await waitFor(() => {
    expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: "Apply Recommended Setup" }));

  expect(screen.getByText("Wallet: ₹39,698.40")).toBeInTheDocument();
  expect(screen.getByLabelText("Funding Priority")).toHaveValue("wallet-first");
}, 10000);