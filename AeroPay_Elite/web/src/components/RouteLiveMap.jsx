import React, { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { fetchAirports } from "../lib/api";

const OFFLINE_AIRPORT_COORDS = {
  DEL: [28.5562, 77.1],
  NRT: [35.772, 140.3929],
  SIN: [1.3644, 103.9915],
  BOM: [19.0896, 72.8656],
  JFK: [40.6413, -73.7781],
  LHR: [51.47, -0.4543],
  DXB: [25.2532, 55.3657],
  CDG: [49.0097, 2.5479],
  BLR: [13.1986, 77.7066],
  SFO: [37.6213, -122.379],
  LAX: [33.9416, -118.4085],
  MIA: [25.7959, -80.287],
  TYO: [35.6762, 139.6503],
};

function offlineRouteCoords(fromCode, toCode) {
  const from = OFFLINE_AIRPORT_COORDS[String(fromCode || "").toUpperCase()];
  const to = OFFLINE_AIRPORT_COORDS[String(toCode || "").toUpperCase()];
  if (!from || !to) return null;
  return { from, to };
}

function MapCommandBridge({ from, to, command }) {
  const map = useMap();

  useEffect(() => {
    if (!from || !to) return;
    map.fitBounds([from, to], { padding: [30, 30] });
  }, [from, map, to]);

  useEffect(() => {
    if (!command?.type) return;
    if (command.type === "zoom-in") {
      map.zoomIn();
      return;
    }
    if (command.type === "zoom-out") {
      map.zoomOut();
      return;
    }
    if (command.type === "fit") {
      map.fitBounds([from, to], { padding: [30, 30] });
    }
  }, [command, from, map, to]);

  return null;
}

function interpolatePoint(start, end, t) {
  if (!Array.isArray(start) || !Array.isArray(end)) {
    return null;
  }
  return [
    start[0] + (end[0] - start[0]) * t,
    start[1] + (end[1] - start[1]) * t,
  ];
}

function RouteMapFallback({ fromCode, toCode }) {
  return (
    <div className="route-map-fallback" role="img" aria-label={`Route map fallback from ${fromCode} to ${toCode}`}>
      <p>Map preview unavailable in this environment.</p>
      <p>{fromCode} -&gt; {toCode}</p>
    </div>
  );
}

export default function RouteLiveMap({ fromCode = "DEL", toCode = "NRT", alternateRoutes = [] }) {
  const [coords, setCoords] = useState(null);
  const [coordsStatus, setCoordsStatus] = useState("idle");
  const [coordsSource, setCoordsSource] = useState("api");
  const [tick, setTick] = useState(Date.now());
  const [mapCommand, setMapCommand] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCoordinates() {
      try {
        setCoordsStatus("loading");
        const payload = await fetchAirports([fromCode, toCode]);
        if (cancelled) return;

        const fromAirport = payload?.airports?.[String(fromCode || "").toUpperCase()];
        const toAirport = payload?.airports?.[String(toCode || "").toUpperCase()];

        if (!fromAirport || !toAirport) {
          const fallback = offlineRouteCoords(fromCode, toCode);
          if (!fallback) {
            setCoords(null);
            setCoordsStatus("error");
            return;
          }
          setCoords(fallback);
          setCoordsSource("offline");
          setCoordsStatus("ready");
          return;
        }

        setCoords({
          from: [Number(fromAirport.lat), Number(fromAirport.lng)],
          to: [Number(toAirport.lat), Number(toAirport.lng)],
        });
        setCoordsSource("api");
        setCoordsStatus("ready");
      } catch {
        if (!cancelled) {
          const fallback = offlineRouteCoords(fromCode, toCode);
          if (!fallback) {
            setCoords(null);
            setCoordsStatus("error");
            return;
          }
          setCoords(fallback);
          setCoordsSource("offline");
          setCoordsStatus("ready");
        }
      }
    }

    loadCoordinates();
    return () => {
      cancelled = true;
    };
  }, [fromCode, toCode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const progress = useMemo(() => {
    const cycleSeconds = 90;
    return ((Math.floor(tick / 1000) % cycleSeconds) / cycleSeconds);
  }, [tick]);

  const from = coords?.from;
  const to = coords?.to;

  const movingPoint = useMemo(() => interpolatePoint(from, to, progress), [from, progress, to]);
  const mapEnabled = typeof window !== "undefined" && import.meta.env.MODE !== "test" && coordsStatus === "ready" && from && to;

  const normalizedAlternates = useMemo(() => {
    if (!Array.isArray(alternateRoutes)) return [];
    return alternateRoutes
      .map((route) => ({
        id: route.id,
        label: route.label,
        waypoints: Array.isArray(route.waypoints)
          ? route.waypoints
            .map((point) => (Array.isArray(point) && point.length >= 2
              ? [Number(point[0]), Number(point[1])]
              : null))
            .filter(Boolean)
          : [],
      }))
      .filter((route) => route.waypoints.length >= 2);
  }, [alternateRoutes]);

  if (!mapEnabled) {
    if (coordsStatus === "loading") {
      return (
        <div className="route-map-fallback" role="status" aria-live="polite">
          <p>Loading live route map...</p>
          <p>{fromCode} -&gt; {toCode}</p>
        </div>
      );
    }
    return <RouteMapFallback fromCode={fromCode} toCode={toCode} />;
  }

  return (
    <div className="route-live-map-wrap">
      <div className="route-map-controls" role="toolbar" aria-label="Map controls">
        <button type="button" className="btn secondary" onClick={() => setMapCommand({ type: "zoom-in", at: Date.now() })} aria-label="Zoom in">+</button>
        <button type="button" className="btn secondary" onClick={() => setMapCommand({ type: "zoom-out", at: Date.now() })} aria-label="Zoom out">-</button>
        <button type="button" className="btn secondary" onClick={() => setMapCommand({ type: "fit", at: Date.now() })}>Fit route</button>
      </div>
      <MapContainer className="route-live-map" center={from} zoom={3} scrollWheelZoom={false} dragging>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCommandBridge from={from} to={to} command={mapCommand} />
        <Polyline positions={[from, to]} pathOptions={{ color: "#38d8ff", weight: 4, opacity: 0.85 }} />

        {normalizedAlternates.map((route) => (
          <Polyline
            key={route.id}
            positions={route.waypoints}
            pathOptions={{ color: "#ffbe5a", weight: 2.5, opacity: 0.65, dashArray: "8 8" }}
          >
            <Tooltip>{route.label || "Alternate route"}</Tooltip>
          </Polyline>
        ))}

        <CircleMarker center={from} radius={7} pathOptions={{ color: "#38d8ff", fillColor: "#38d8ff", fillOpacity: 0.95 }}>
          <Tooltip direction="top" offset={[0, -8]} permanent>{fromCode}</Tooltip>
        </CircleMarker>

        <CircleMarker center={to} radius={7} pathOptions={{ color: "#ffbe5a", fillColor: "#ffbe5a", fillOpacity: 0.95 }}>
          <Tooltip direction="top" offset={[0, -8]} permanent>{toCode}</Tooltip>
        </CircleMarker>

        {movingPoint && (
          <CircleMarker center={movingPoint} radius={6} pathOptions={{ color: "#ffffff", fillColor: "#8aa8ff", fillOpacity: 0.95 }}>
            <Tooltip direction="right" offset={[8, 0]}>Live position</Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
      <p className="route-live-meta">Live UTC {new Date(tick).toUTCString().slice(17, 25)} | Route {fromCode} -&gt; {toCode} | Source {coordsSource === "api" ? "live API" : "offline backup"}</p>
    </div>
  );
}