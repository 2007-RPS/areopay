import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import SearchOverlay from "./components/SearchOverlay";

test("search overlay traps focus and closes on Escape", () => {
  const onClose = vi.fn();
  const onOpenNotification = vi.fn();

  render(
    <SearchOverlay
      open
      onClose={onClose}
      onOpenNotification={onOpenNotification}
      notifications={[
        {
          id: "n-1",
          title: "SkyJet update",
          text: "Flight now boarding",
          type: "info",
          severity: "normal",
          path: "/trips",
          at: new Date().toISOString(),
        },
      ]}
    />
  );

  const dialog = screen.getByRole("dialog", { name: "Global search" });
  const input = screen.getByPlaceholderText("Search notifications, routes, and more... (Cmd+K)");

  expect(document.activeElement).toBe(input);

  fireEvent.change(input, { target: { value: "SkyJet" } });

  const focusables = dialog.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
  );
  const last = focusables[focusables.length - 1];
  last.focus();

  fireEvent.keyDown(dialog, { key: "Tab" });
  expect(document.activeElement).toBe(input);

  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("search overlay restores previous focus when closed", () => {
  const onClose = vi.fn();
  const onOpenNotification = vi.fn();

  const { rerender } = render(
    <div>
      <button type="button">Open Search</button>
      <SearchOverlay open={false} onClose={onClose} onOpenNotification={onOpenNotification} notifications={[]} />
    </div>
  );

  const trigger = screen.getByRole("button", { name: "Open Search" });
  trigger.focus();
  expect(document.activeElement).toBe(trigger);

  rerender(
    <div>
      <button type="button">Open Search</button>
      <SearchOverlay open onClose={onClose} onOpenNotification={onOpenNotification} notifications={[]} />
    </div>
  );

  expect(document.activeElement).not.toBe(trigger);

  rerender(
    <div>
      <button type="button">Open Search</button>
      <SearchOverlay open={false} onClose={onClose} onOpenNotification={onOpenNotification} notifications={[]} />
    </div>
  );

  expect(document.activeElement).toBe(trigger);
});
