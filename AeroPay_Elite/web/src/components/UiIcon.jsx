import React from "react";

const ICONS = {
  menu: "M4 6h16 M4 12h16 M4 18h16",
  search: "M11 19a8 8 0 1 1 5.3-14l4.9 4.9-1.4 1.4-4.9-4.9A6 6 0 1 0 17 11h2a8 8 0 0 1-8 8z",
  portfolio: "M4 6h16v12H4z M9 6V4h6v2",
  trips: "M3 12l18-6-6 18-3-7-7-3z",
  wallet: "M4 8h16v10H4z M15 13h4",
  card: "M4 8h16v8H4z M4 11h16",
  account: "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z M4 20a8 8 0 0 1 16 0",
  leaf: "M4 14c6 0 10-4 12-10 2 6-2 14-10 16-2-1-2-4-2-6z",
  settings: "M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4z M4 12h2 M18 12h2 M12 4v2 M12 18v2 M6.3 6.3l1.4 1.4 M16.3 16.3l1.4 1.4 M17.7 6.3l-1.4 1.4 M7.7 16.3l-1.4 1.4",
  session: "M4 7h16v10H4z M8 11h8 M8 14h5",
  timer: "M12 7v5l3 2 M9 4h6 M12 22a8 8 0 1 1 8-8 8 8 0 0 1-8 8z",
  usd: "M12 4v16 M16 7a4 4 0 0 0-4-2 3 3 0 0 0 0 6 3 3 0 0 1 0 6 4 4 0 0 1-4-2",
  spark: "M3 17l6-6 4 4 8-8",
  cube: "M12 3 20 7 12 11 4 7 12 3 M4 7v10l8 4 8-4V7 M12 11v10",
  map: "M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z",
  plane: "M2 13l20-6-5 8-5-1-4 4-1-5-5 0z",
  shield: "M12 3l8 3v6c0 5-3 9-8 11-5-2-8-6-8-11V6z",
  check: "M5 12l4 4 10-10",
  download: "M12 2v10 M5 15l7 7 7-7 M8 8l4 4 4-4",
  chart: "M4 20h16 M4 10l4 6 4-4 4 8 M8 20v-8 M12 20v-2 M16 20v-6",
  list: "M4 8h16 M4 12h16 M4 16h16",
  history: "M4 12a8 8 0 1 0 2.3-5.7 M4 4v4h4 M12 7v6l4 2",
  bell: "M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22z M6 17h12l-1.2-1.7V11a4.8 4.8 0 0 0-3.2-4.5V5a1.6 1.6 0 0 0-3.2 0v1.5A4.8 4.8 0 0 0 7.2 11v4.3z",
  target: "M12 2v3 M12 19v3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M2 12h3 M19 12h3 M12 7a5 5 0 1 1-5 5 5 5 0 0 1 5-5z",
  shopping: "M6 6h15l-1.5 7.5H7.5z M6 6L5 3H2 M9 20a1 1 0 1 0 0 .1 M17 20a1 1 0 1 0 0 .1",
  undo: "M9 14l-4-4 4-4 M5 10h8a5 5 0 1 1 0 10h-2",
  ticket: "M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z",
  close: "M6 6l12 12 M18 6l-12 12",
};

export default function UiIcon({ name, size = 16, className = "" }) {
  const d = ICONS[name] || ICONS.spark;

  return (
    <svg
      className={`ui-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}
