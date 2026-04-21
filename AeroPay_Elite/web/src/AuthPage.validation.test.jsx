import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import AuthPage from "./pages/AuthPage";

test("auth page shows validation messages before login", () => {
  const onLogin = vi.fn();

  render(<AuthPage sessionKey="sess-12345678" onLogin={onLogin} />);

  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
  expect(screen.getByText("Full name is required.")).toBeInTheDocument();
  expect(screen.getByLabelText("Full Name")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("Full Name")).toHaveAttribute("aria-describedby", "auth-name-message");
  expect(onLogin).not.toHaveBeenCalled();

  fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Arihant" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b" } });
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));

  expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText("Email")).toHaveAttribute("aria-describedby", "auth-email-message");
  expect(onLogin).not.toHaveBeenCalled();
});

test("auth page submits valid profile", () => {
  const onLogin = vi.fn();

  render(<AuthPage sessionKey="sess-12345678" onLogin={onLogin} />);

  fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Arihant Singh" } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "arihant@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));

  expect(onLogin).toHaveBeenCalledWith({
    name: "Arihant Singh",
    email: "arihant@example.com",
  });
});
