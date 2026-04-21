import React from "react";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import FormInput from "./components/FormInput";

test("form input associates helper text through aria-describedby", () => {
  render(
    <FormInput
      id="traveler-phone"
      label="Phone"
      value=""
      onChange={() => {}}
      helperText="Use country code for faster support callback."
    />
  );

  const input = screen.getByLabelText("Phone");
  expect(input).toHaveAttribute("aria-invalid", "false");
  expect(input).toHaveAttribute("aria-describedby", "traveler-phone-message");

  const helper = screen.getByText("Use country code for faster support callback.");
  expect(helper).toHaveAttribute("id", "traveler-phone-message");
});

test("form input exposes error message with aria-invalid and aria-describedby", () => {
  render(
    <FormInput
      id="auth-email"
      label="Email"
      value="bad-email"
      onChange={() => {}}
      error="Please enter a valid email address."
    />
  );

  const input = screen.getByLabelText("Email");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAttribute("aria-describedby", "auth-email-message");

  const error = screen.getByText("Please enter a valid email address.");
  expect(error).toHaveAttribute("id", "auth-email-message");
});