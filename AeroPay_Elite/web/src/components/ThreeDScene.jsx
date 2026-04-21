import React, { Suspense, lazy } from "react";
import UiIcon from "./UiIcon";

const RouteOrbScene = lazy(() => import("./Scene3D/RouteOrbScene"));

function ThreeDFallback({ title, subtitle }) {
  return (
    <div className="three-d-fallback" role="img" aria-label="3D fallback route preview">
      <svg viewBox="0 0 460 220" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="orbGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#38d8ff" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#8aa8ff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#060b16" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="orbArc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38d8ff" />
            <stop offset="100%" stopColor="#ffbe5a" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="460" height="220" fill="#060b16" />
        <circle cx="230" cy="110" r="76" fill="url(#orbGlow)" />
        <circle cx="230" cy="110" r="45" stroke="url(#orbArc)" strokeWidth="3" fill="none" />
        <path d="M 70 140 C 156 28, 304 28, 390 140" fill="none" stroke="url(#orbArc)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="70" cy="140" r="7" fill="#38d8ff" />
        <circle cx="390" cy="140" r="7" fill="#ffbe5a" />
      </svg>
      <div className="three-d-copy">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

export default function ThreeDScene({
  title = "3D Route Intelligence",
  subtitle = "Live orbital preview for route, fare momentum, and sustainability signals.",
  fromCode = "DEL",
  toCode = "NRT",
  delayRiskLabel = "Medium",
  weatherSeverity = "moderate",
  reduceMotion = false,
  threeDEnabled = true,
}) {
  const supportsResizeObserver = typeof window !== "undefined" && typeof window.ResizeObserver !== "undefined";
  const showFallback = reduceMotion || !threeDEnabled || !supportsResizeObserver;

  if (showFallback) {
    return (
      <section className="glass card three-d-shell">
        <header className="three-d-header">
          <h3><UiIcon name="cube" size={16} /> {title}</h3>
          <span className="policy-badge ok">Static mode</span>
        </header>
        <ThreeDFallback title={title} subtitle={subtitle} />
      </section>
    );
  }

  return (
    <section className="glass card three-d-shell">
      <header className="three-d-header">
        <h3><UiIcon name="cube" size={16} /> {title}</h3>
        <span className="policy-badge ok">Interactive 3D</span>
      </header>
      <div className="three-d-canvas-shell" role="img" aria-label="Interactive 3D route orb preview">
        <Suspense fallback={<ThreeDFallback title={title} subtitle={subtitle} />}>
          <RouteOrbScene
            fromCode={fromCode}
            toCode={toCode}
            delayRiskLabel={delayRiskLabel}
            weatherSeverity={weatherSeverity}
          />
        </Suspense>
      </div>
      <div className="chip-row">
        <span className="policy-badge ok">{fromCode} -&gt; {toCode}</span>
        <span className={`policy-badge ${delayRiskLabel === "High" ? "warn" : "ok"}`}>Delay Risk: {delayRiskLabel}</span>
        <span className={`policy-badge ${weatherSeverity === "elevated" ? "warn" : "ok"}`}>Weather: {weatherSeverity}</span>
      </div>
      <p className="three-d-hint">Live orbital intensity responds to route risk profile. Fallback mode remains available on low-capability devices.</p>
    </section>
  );
}
