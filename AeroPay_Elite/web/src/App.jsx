import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import ResultsPage from "./pages/ResultsPage";
import CheckoutPage from "./pages/CheckoutPage";
import WalletPage from "./pages/WalletPage";
import ESGPage from "./pages/ESGPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import BookingHistoryPage from "./pages/BookingHistoryPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import UiIcon from "./components/UiIcon";
import ActionToast from "./components/ActionToast";
import NotificationCenter from "./components/NotificationCenter";
import SearchOverlay from "./components/SearchOverlay";
import { API_BASE, jsonFetch } from "./lib/api";
import { getApproval, saveApproval } from "./lib/approvalStorage";
import { formatInrFromUsd } from "./lib/currency";

function makeSessionKey() {
  return `sess-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function formatTimer(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

function formatClock(iso) {
  if (!iso) return "--:--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const DEFAULT_TRAVELER = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  type: "Adult",
};

function makeTravelersFromSearch(search) {
  const travelers = [];
  for (let i = 0; i < search.adults; i += 1) {
    travelers.push({ ...DEFAULT_TRAVELER, type: "Adult" });
  }
  for (let i = 0; i < search.children; i += 1) {
    travelers.push({ ...DEFAULT_TRAVELER, type: "Child" });
  }
  for (let i = 0; i < search.infants; i += 1) {
    travelers.push({ ...DEFAULT_TRAVELER, type: "Infant" });
  }
  return travelers.length ? travelers : [{ ...DEFAULT_TRAVELER, type: "Adult" }];
}

const DEFAULT_SEARCH = {
  tripType: "round-trip",
  from: "DEL",
  to: "NRT",
  departDate: "2026-05-15",
  returnDate: "2026-05-22",
  cabin: "Business",
  adults: 1,
  children: 0,
  infants: 0,
  budget: 1400,
  nonStopOnly: false,
  alliance: "any",
  maxLayover: 240,
  baggageIncludedOnly: false,
  flexibleDates: false,
  refundableOnly: false,
  departureWindowPreset: "any",
};

const NAV = [
  { label: "Search", path: "/search", icon: "search" },
  { label: "Dashboard", path: "/dashboard", icon: "chart" },
  { label: "My Portfolio", path: "/portfolio", icon: "portfolio" },
  { label: "My Trips", path: "/trips", icon: "trips" },
  { label: "Wallet", path: "/wallet", icon: "wallet" },
  { label: "Account", path: "/account", icon: "account" },
  { label: "ESG Impact", path: "/esg", icon: "leaf" },
  { label: "Settings", path: "/settings", icon: "settings" },
];

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCSV(data, filename) {
  const headers = ["ID", "Type", "Severity", "Title", "Text", "Path", "Timestamp", "Read", "Opens", "Dismissals"];
  const rows = data.map((item) => [
    item.id,
    item.type || "info",
    item.severity || "normal",
    `"${(item.title || "").replace(/"/g, '""')}"`,
    `"${(item.text || "").replace(/"/g, '""')}"`,
    item.path || "/",
    item.at || "",
    item.read ? "true" : "false",
    item.opens || 0,
    item.dismissals || 0,
  ]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function playNotificationSound(severity = "normal") {
  if (typeof window === "undefined") return;
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);

    const freq = severity === "critical" ? 880 : severity === "warn" ? 660 : 440;
    const duration = severity === "critical" ? 0.3 : severity === "warn" ? 0.2 : 0.15;

    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + duration);
  } catch {
    // Audio context not available
  }
}

function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted" || Notification.permission === "denied") return;
  Notification.requestPermission().catch(() => {});
}

function showBrowserNotification(title, options = {}) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const notification = new window.Notification(title, options);
    if (options.id) {
      notification.onclick = () => {
        notification.close();
      };
    }
    setTimeout(() => notification.close(), 4500);
  } catch {
    // Browser notifications can fail silently when blocked.
  }
}

function getErrorMessage(error, fallback) {
  if (error && typeof error === "object") {
    const maybeUserMessage = error.userMessage;
    if (typeof maybeUserMessage === "string" && maybeUserMessage.trim()) {
      return maybeUserMessage;
    }
    const maybeMessage = error.message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return fallback;
}

function mergeById(primary = [], secondary = []) {
  const map = new Map();
  [...secondary, ...primary].forEach((item) => {
    if (item?.id) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

function makeTimelineEvent(type, message, meta = null) {
  return {
    id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    type,
    message,
    at: new Date().toISOString(),
    meta,
  };
}

function formatPaymentRecommendation(recommendation) {
  if (!recommendation) return "No recommendation captured";
  return `${recommendation.strategy} / ${recommendation.fundingPriority} - ${recommendation.reason}`;
}

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const toastTimerRef = useRef(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [prompt, setPrompt] = useState("Find me a business flight to Tokyo under ₹100000 next Tuesday");
  const [searchForm, setSearchForm] = useState(DEFAULT_SEARCH);
  const [searchError, setSearchError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => loadJson("aero.auth", false));
  const [profile, setProfile] = useState(() => loadJson("aero.profile", { name: "", email: "" }));
  const [bookings, setBookings] = useState(() => loadJson("aero.bookings", []));
  const [reduceMotion, setReduceMotion] = useState(() => {
    const stored = loadJson("aero.reduceMotion", null);
    if (stored !== null) return stored;
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });
  const [threeDEnabled, setThreeDEnabled] = useState(() => loadJson("aero.3dEnabled", true));
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0, travelPoints: 0, escrowHeld: 0 });
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bnpl, setBnpl] = useState(null);
  const [selectedBnplPlan, setSelectedBnplPlan] = useState(null);
  const [freeze, setFreeze] = useState(null);
  const [travelFinanceNote, setTravelFinanceNote] = useState("");
  const [travelFinanceSource, setTravelFinanceSource] = useState("");
  const [insurance, setInsurance] = useState(() => loadJson("aero.checkout.insurance", true));
  const [businessMode, setBusinessMode] = useState(() => loadJson("aero.checkout.businessMode", false));
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [checkoutStep, setCheckoutStep] = useState(() => loadJson("aero.checkout.step", 1));
  const [walletSplit, setWalletSplit] = useState(() => loadJson("aero.checkout.walletSplit", 0));
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentFailure, setPaymentFailure] = useState(null);
  const [sessionKey, setSessionKey] = useState(makeSessionKey());
  const [lockId, setLockId] = useState("");
  const [lockRemaining, setLockRemaining] = useState(0);
  const [esgRoundup, setEsgRoundup] = useState(() => loadJson("aero.checkout.esgRoundup", 0));
  const [boardingPass, setBoardingPass] = useState(null);
  const [approval, setApproval] = useState(null);
  const [travelers, setTravelers] = useState([{ ...DEFAULT_TRAVELER, type: "Adult" }]);
  const [activeTravelerIndex, setActiveTravelerIndex] = useState(0);
  const [seatChoices, setSeatChoices] = useState([null]);
  const [ancillaries, setAncillaries] = useState({ meal: false, extraBaggage: false, lounge: false });
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState(() => {
    const stored = loadJson("aero.notifications", []);
    return Array.isArray(stored)
      ? stored.map((item) => ({
          ...item,
          read: item.read ?? true,
          severity: item.severity || "normal",
          opens: item.opens || 0,
          dismissals: item.dismissals || 0,
        }))
      : [];
  });
  const [notificationAnalytics, setNotificationAnalytics] = useState(() =>
    loadJson("aero.notifications.analytics", {
      totalCreated: 0,
      totalDismissed: 0,
      totalOpened: 0,
      typeBreakdown: { success: 0, warn: 0, error: 0, info: 0 },
      severityBreakdown: { critical: 0, warn: 0, normal: 0 },
    })
  );
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasSeenNotificationTips, setHasSeenNotificationTips] = useState(() => loadJson("aero.notifications.tipsSeen", false));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [apiHealth, setApiHealth] = useState({
    status: "checking",
    checkedAt: "",
    message: "Checking backend status...",
  });
  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  function showToast(payload, options = {}) {
    if (!payload?.text) return;
    const persist = options.persist !== false;
    const severity = payload.severity || "normal";
    const entry = {
      id: `ntf-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
      type: payload.type || "info",
      severity,
      title: payload.title || "Update",
      text: payload.text,
      path: location.pathname,
      at: new Date().toISOString(),
      read: false,
      opens: 0,
      dismissals: 0,
    };

    if (persist) {
      setNotifications((prev) => [entry, ...prev].slice(0, 24));
      setNotificationAnalytics((prev) => ({
        ...prev,
        totalCreated: prev.totalCreated + 1,
        typeBreakdown: {
          ...prev.typeBreakdown,
          [entry.type]: (prev.typeBreakdown[entry.type] || 0) + 1,
        },
        severityBreakdown: {
          ...prev.severityBreakdown,
          [severity]: (prev.severityBreakdown[severity] || 0) + 1,
        },
      }));
    }

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({
      id: entry.id,
      type: entry.type,
      severity,
      title: entry.title,
      text: entry.text,
    });

    if (severity !== "normal") {
      playNotificationSound(severity);
      if (severity === "critical" || severity === "warn") {
        showBrowserNotification(entry.title, { body: entry.text, id: entry.id });
      }
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2600);
  }

  function clearNotifications() {
    setNotifications([]);
    showToast({ type: "info", title: "Notification Center", text: "History cleared." }, { persist: false });
  }

  function removeNotification(notificationId) {
    setNotifications((prev) => {
      const item = prev.find((i) => i.id === notificationId);
      if (item) {
        setNotificationAnalytics((pa) => ({
          ...pa,
          totalDismissed: pa.totalDismissed + 1,
        }));
      }
      return prev.filter((i) => i.id !== notificationId);
    });
  }

  function markNotificationRead(notificationId) {
    setNotifications((prev) => prev.map((item) => (
      item.id === notificationId ? { ...item, read: true } : item
    )));
  }

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    showToast({ type: "info", title: "Notification Center", text: "All notifications marked as read." }, { persist: false });
  }

  function openNotification(item) {
    if (!item?.path) return;
    if (item.id) {
      markNotificationRead(item.id);
      setNotifications((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, opens: (i.opens || 0) + 1 } : i))
      );
      setNotificationAnalytics((prev) => ({
        ...prev,
        totalOpened: prev.totalOpened + 1,
      }));
    }
    setIsNotificationOpen(false);
    navigate(item.path);
  }

  function exportNotificationsJSON() {
    const timestamp = new Date().toISOString().split("T")[0];
    downloadJSON(notifications, `notifications-export-${timestamp}.json`);
    showToast({
      type: "success",
      title: "Export Complete",
      text: `${notifications.length} notifications exported as JSON.`,
    });
  }

  function exportNotificationsCSV() {
    const timestamp = new Date().toISOString().split("T")[0];
    downloadCSV(notifications, `notifications-export-${timestamp}.csv`);
    showToast({
      type: "success",
      title: "Export Complete",
      text: `${notifications.length} notifications exported as CSV.`,
    });
  }

  useEffect(() => {
    jsonFetch("/wallet")
      .then((r) => setWallet(r.data))
      .catch((error) => {
        showToast({
          type: "warn",
          title: "Wallet Sync Unavailable",
          text: getErrorMessage(error, "Could not load wallet from API."),
        }, { persist: false });
      });

    jsonFetch("/boarding-pass/PNR-MOCK-2026")
      .then((r) => setBoardingPass(r.data))
      .catch((error) => {
        showToast({
          type: "warn",
          title: "Boarding Pass Preview Unavailable",
          text: getErrorMessage(error, "Could not load boarding pass preview."),
        }, { persist: false });
      });

    jsonFetch("/bookings")
      .then((r) => {
        const apiBookings = Array.isArray(r.data) ? r.data : [];
        if (apiBookings.length) {
          setBookings((prev) => mergeById(apiBookings, prev));
        }
      })
      .catch((error) => {
        showToast({
          type: "warn",
          title: "Booking History Sync Unavailable",
          text: getErrorMessage(error, "Could not load booking history from API."),
        }, { persist: false });
      });

    requestNotificationPermission();
  }, []);

  useEffect(() => {
    localStorage.setItem("aero.notifications.analytics", JSON.stringify(notificationAnalytics));
  }, [notificationAnalytics]);

  useEffect(() => {
    localStorage.setItem("aero.auth", JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("aero.profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("aero.bookings", JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem("aero.reduceMotion", JSON.stringify(reduceMotion));
  }, [reduceMotion]);

  useEffect(() => {
    localStorage.setItem("aero.3dEnabled", JSON.stringify(threeDEnabled));
  }, [threeDEnabled]);

  useEffect(() => {
    localStorage.setItem("aero.notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("aero.notifications.tipsSeen", JSON.stringify(hasSeenNotificationTips));
  }, [hasSeenNotificationTips]);

  useEffect(() => {
    localStorage.setItem("aero.checkout.insurance", JSON.stringify(insurance));
  }, [insurance]);

  useEffect(() => {
    localStorage.setItem("aero.checkout.businessMode", JSON.stringify(businessMode));
  }, [businessMode]);

  useEffect(() => {
    localStorage.setItem("aero.checkout.step", JSON.stringify(checkoutStep));
  }, [checkoutStep]);

  useEffect(() => {
    localStorage.setItem("aero.checkout.walletSplit", JSON.stringify(walletSplit));
  }, [walletSplit]);

  useEffect(() => {
    localStorage.setItem("aero.checkout.esgRoundup", JSON.stringify(esgRoundup));
  }, [esgRoundup]);

  useEffect(() => {
    let mounted = true;

    async function checkApiHealth() {
      setApiHealth((prev) => ({
        ...prev,
        status: prev.checkedAt ? "retrying" : "checking",
      }));

      try {
        await jsonFetch("/health");
        if (!mounted) return;
        setApiHealth({
          status: "online",
          checkedAt: new Date().toISOString(),
          message: "Backend API is reachable.",
        });
      } catch (error) {
        if (!mounted) return;
        setApiHealth({
          status: "offline",
          checkedAt: new Date().toISOString(),
          message: getErrorMessage(error, "API server is unreachable. Start backend service and retry."),
        });
      }
    }

    checkApiHealth();
    const id = setInterval(checkApiHealth, 15000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!isNotificationOpen || hasSeenNotificationTips) return;
    setHasSeenNotificationTips(true);
    showToast(
      {
        type: "info",
        title: "Notification Shortcuts",
        text: "Use N to toggle, Shift+R to mark all read, and Esc to close.",
      },
      { persist: false }
    );
  }, [isNotificationOpen, hasSeenNotificationTips]);

  useEffect(() => {
    function isTypingTarget(target) {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }

    function handleKeydown(event) {
      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && key === "k") {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      if (isTypingTarget(event.target)) return;

      if (!event.ctrlKey && !event.metaKey && !event.altKey && key === "n") {
        event.preventDefault();
        setIsNotificationOpen((prev) => !prev);
        return;
      }

      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.shiftKey && key === "r") {
        event.preventDefault();
        if (unreadCount > 0) {
          markAllNotificationsRead();
        }
        return;
      }

      if (key === "escape") {
        if (isNotificationOpen) {
          event.preventDefault();
          setIsNotificationOpen(false);
        }
        if (isSearchOpen) {
          event.preventDefault();
          setIsSearchOpen(false);
        }
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isNotificationOpen, isSearchOpen, unreadCount]);

  useEffect(() => {
    if (!lockId) return;
    const id = setInterval(async () => {
      try {
        const r = await jsonFetch(`/seat-lock/${lockId}`);
        setLockRemaining(r.data.remainingMs);
      } catch {
        setLockRemaining(0);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lockId]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!selected) {
      setApproval(null);
      return;
    }
    setApproval(getApproval(selected.offerId));
  }, [selected]);

  const total = useMemo(() => {
    if (!selected) return 0;
    const seatFee = seatChoices.reduce((sum, seat) => sum + (seat?.price || 0), 0);
    const ancillaryFee = (ancillaries.meal ? 18 : 0) + (ancillaries.extraBaggage ? 40 : 0) + (ancillaries.lounge ? 55 : 0);
    const insuranceFee = insurance ? 26 : 0;
    const freezeFee = freeze?.lockFee || 0;
    return Number((selected.fare + seatFee + ancillaryFee + insuranceFee + freezeFee + esgRoundup).toFixed(2));
  }, [selected, seatChoices, ancillaries, insurance, freeze, esgRoundup]);

  async function runSearch() {
    setLoading(true);
    setSearchError("");
    try {
      const structuredPrompt = `Find ${searchForm.cabin} ${searchForm.tripType} flight from ${searchForm.from} to ${searchForm.to} under ₹${Math.round(searchForm.budget * 83.4)}`;
      const r = await jsonFetch("/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt || structuredPrompt,
          search: searchForm,
        }),
      });
      setResults(r.data.results);
      showToast({ type: "success", title: "Search Complete", text: `${r.data.results.length} offers ready for review.` });
      navigate("/search/results");
    } catch (error) {
      setResults([]);
      const message = getErrorMessage(error, "Unable to complete search.");
      setSearchError(message);
      showToast({ type: "error", title: "Search Failed", text: message });
      navigate("/search");
    } finally {
      setLoading(false);
    }
  }

  async function onSelectFlight(flight) {
    setSelected(flight);
    setApproval(getApproval(flight.offerId));
    setFreeze(null);
    setBnpl(null);
    setSelectedBnplPlan(null);
    setTravelFinanceNote("");
    setTravelFinanceSource("");
    const nextTravelers = makeTravelersFromSearch(searchForm);
    setTravelers(nextTravelers);
    setActiveTravelerIndex(0);
    setSeatChoices(nextTravelers.map(() => null));
    setAncillaries({ meal: false, extraBaggage: false, lounge: false });
    setCheckoutStep(1);
    setPaymentResult(null);
    setPaymentFailure(null);
    setWalletSplit(Math.min(wallet.balance, flight.fare));
    const lock = await jsonFetch("/seat-lock/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId: flight.offerId }),
    });
    setLockId(lock.data.lockId);
    showToast({ type: "info", title: "Flight Selected", text: `Seat lock started for ${flight.carrier} (${flight.from} to ${flight.to}).` });
    navigate("/portfolio");
  }

  async function onFreeze(flight) {
    setTravelFinanceNote("Analyzing freeze option...");
    setTravelFinanceSource("calculating");
    try {
      const r = await jsonFetch("/price-freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fare: flight.fare, demandIndex: flight.demandIndex }),
      });
      setFreeze(r.data);
      setTravelFinanceNote(r.data.recommendedFor ? "Freeze recommended for this route." : "Freeze is optional; volatility is low.");
      setTravelFinanceSource("api");
      showToast({ type: "success", title: "Price Freeze Ready", text: `Lock fee ${formatInrFromUsd(Number(r.data.lockFee || 0))} for ${r.data.validHours || 48}h.` });
    } catch {
      const fallback = estimateFreeze(flight);
      setFreeze(fallback);
      setTravelFinanceNote("API unavailable. Showing local freeze estimate.");
      setTravelFinanceSource("local");
      showToast({ type: "warn", title: "Local Freeze Estimate", text: "Showing fallback freeze values while API is unavailable." });
    }
  }

  async function onBnpl(flight) {
    setTravelFinanceNote("Checking financing options...");
    setTravelFinanceSource("calculating");
    try {
      const r = await jsonFetch("/bnpl/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fare: flight.fare }),
      });
      setBnpl(r.data);
      setSelectedBnplPlan(pickRecommendedPlan(r.data));
      setTravelFinanceNote(r.data.approved ? "BNPL is available with the current plan set." : "BNPL needs a larger upfront amount or approval.");
      setTravelFinanceSource("api");
      showToast({ type: r.data.approved ? "success" : "warn", title: "BNPL Assessment", text: r.data.approved ? "Financing plans are available for this itinerary." : "BNPL requires a stronger upfront component or approval." });
    } catch {
      const fallback = estimateBnpl(flight);
      setBnpl(fallback);
      setSelectedBnplPlan(pickRecommendedPlan(fallback));
      setTravelFinanceNote("API unavailable. Showing local BNPL estimate.");
      setTravelFinanceSource("local");
      showToast({ type: "warn", title: "Local BNPL Estimate", text: "Showing fallback BNPL values while API is unavailable." });
    }
  }

  async function maybeBiometricConfirm(amount) {
    if (amount <= 500) return true;
    if (!window.PublicKeyCredential) {
      return window.confirm("FaceID unavailable. Use fallback confirmation?");
    }
    return window.confirm("Confirm with FaceID mock for transaction over ₹41500?");
  }

  async function processPayment(options = {}) {
    if (!selected || processing) return;
    const {
      fundingPriority = "wallet-first",
      splitStrategy = "manual",
      autoRetry = false,
      recommendation = null,
      idempotencyKey,
    } = options;

    const canPay = selected.policy.inPolicy || Boolean(approval?.token);
    if (!canPay) {
      showToast({ type: "warn", title: "Approval Required", text: "Manager approval is needed before payment." });
      return;
    }
    const approved = await maybeBiometricConfirm(total);
    if (!approved) {
      showToast({ type: "warn", title: "Payment Paused", text: "Biometric confirmation was canceled." });
      return;
    }

    setProcessing(true);
    setPaymentFailure(null);
    try {
      const maxAttempts = autoRetry ? 2 : 1;
      let payment = null;
      const paymentAttempts = [];

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const requestKey = attempt === 0 ? (idempotencyKey || sessionKey) : makeSessionKey();
        const attemptNumber = attempt + 1;

        if (attempt > 0) {
          setSessionKey(requestKey);
          showToast({ type: "info", title: "Retrying Payment", text: "Automatically retrying payment with a fresh idempotency key." }, { persist: false });
        }

        try {
          const hold = await jsonFetch("/escrow/hold", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: total, offerId: selected.offerId }),
          });

          const cardPart = Number((total - walletSplit).toFixed(2));
          payment = await jsonFetch("/payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Idempotency-Key": requestKey,
            },
            body: JSON.stringify({
              amount: total,
              walletPart: walletSplit,
              cardPart,
              idempotencyKey: requestKey,
              outOfPolicy: !selected.policy.inPolicy,
              approvalToken: approval?.token || "",
              paymentProfile: {
                fundingPriority,
                splitStrategy,
              },
              bnplPlan: selectedBnplPlan
                ? {
                  months: selectedBnplPlan.months,
                  apr: selectedBnplPlan.apr,
                  installment: selectedBnplPlan.installment,
                }
                : null,
            }),
          });

          if (selected.policy.inPolicy) {
            await jsonFetch("/escrow/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ escrowId: hold.data.escrowId, pnr: "PNR-MOCK-2026" }),
            });
          }

          if (!selected.policy.inPolicy) {
            await jsonFetch("/escrow/refund", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ escrowId: hold.data.escrowId }),
            });
          }

          paymentAttempts.push({
            attempt: attemptNumber,
            idempotencyKey: requestKey,
            status: "SUCCESS",
            message: `Payment attempt ${attemptNumber} succeeded.`,
            at: new Date().toISOString(),
          });

          break;
        } catch (error) {
          paymentAttempts.push({
            attempt: attemptNumber,
            idempotencyKey: requestKey,
            status: "FAILED",
            message: getErrorMessage(error, "Payment could not be completed."),
            at: new Date().toISOString(),
          });

          if (attempt === maxAttempts - 1) {
            throw error;
          }
        }
      }

      if (!payment) {
        throw new Error("Payment did not complete.");
      }

      const refreshed = await jsonFetch("/wallet");
      setWallet(refreshed.data);
      setPaymentResult(payment.data);
      setPaymentFailure(null);

      const newBooking = {
        id: `BK-${Date.now()}`,
        pnr: "PNR-MOCK-2026",
        paymentId: payment.data.paymentId,
        offerId: selected.offerId,
        carrier: selected.carrier,
        routeLabel: `${selected.from} -> ${selected.to}`,
        travelerName: travelers.map((t) => `${t.firstName} ${t.lastName}`.trim()).join(", "),
        travelerEmail: travelers[0]?.email || "",
        passengerCount: travelers.length,
        seatLabel: seatChoices.map((seat, index) => {
          const label = seat ? `${seat.id} (${seat.type})` : "Not Selected";
          return `P${index + 1}: ${label}`;
        }).join(" | "),
        total,
        bnplPlan: selectedBnplPlan
          ? {
            months: selectedBnplPlan.months,
            apr: selectedBnplPlan.apr,
            installment: selectedBnplPlan.installment,
          }
          : null,
        paymentMeta: {
          splitStrategy,
          fundingPriority,
          autoRetry,
          recommendation,
          attempts: paymentAttempts,
        },
        status: "CONFIRMED",
        createdAt: new Date().toISOString(),
        timeline: [
          makeTimelineEvent("PAYMENT_INITIATED", `Payment started with ${splitStrategy} split and ${fundingPriority} priority.`, {
            splitStrategy,
            fundingPriority,
            autoRetry,
            recommendation: formatPaymentRecommendation(recommendation),
          }),
          ...paymentAttempts.map((attempt) => makeTimelineEvent("PAYMENT_ATTEMPT", attempt.message, attempt)),
          makeTimelineEvent("BOOKING_CREATED", "Booking created with payment authorization."),
          ...(selectedBnplPlan
            ? [makeTimelineEvent("BNPL_PLAN_CAPTURED", `${selectedBnplPlan.months}-month BNPL plan captured at checkout.`)]
            : []),
          makeTimelineEvent("PAYMENT_CONFIRMED", "Funds captured and booking moved to confirmed state."),
          makeTimelineEvent("TICKET_CONFIRMED", "E-ticket and PNR confirmed for all passengers."),
        ],
      };

      setBookings((prev) => {
        const paymentId = payment.data.paymentId;
        if (prev.some((item) => item.paymentId === paymentId)) {
          return prev;
        }

        return [newBooking, ...prev];
      });

      jsonFetch("/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBooking),
      }).catch(() => {});

      setSessionKey(makeSessionKey());
      setCheckoutStep(4);
      showToast({ type: "success", title: "Payment Confirmed", text: `Booking confirmed and PNR issued for ${travelers.length} traveler(s).` });
    } catch (error) {
      const message = getErrorMessage(error, "Payment could not be completed.");
      setPaymentFailure({ message, at: new Date().toISOString() });
      showToast({ type: "error", title: "Payment Failed", text: message });
    } finally {
      setProcessing(false);
    }
  }

  function retryPayment(options = {}) {
    const retryKey = makeSessionKey();
    setSessionKey(retryKey);
    processPayment({ ...options, idempotencyKey: retryKey });
  }

  function handleLogin(nextProfile) {
    setProfile(nextProfile);
    setIsAuthenticated(true);
    showToast({ type: "success", title: "Welcome", text: `Signed in as ${nextProfile.name || "traveler"}.` });
    navigate("/account");
  }

  function handleLogout() {
    setIsAuthenticated(false);
    showToast({ type: "info", title: "Signed Out", text: "Your account session has ended." });
    navigate("/auth");
  }

  function cancelBooking(bookingId) {
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return;

    const processingPatch = {
      status: "REFUND_PROCESSING",
      refund: {
        grossAmount: booking.total,
        cancellationFee: Number((booking.total * 0.08).toFixed(2)),
        serviceFee: Number((booking.total * 0.02).toFixed(2)),
        netAmount: Number((booking.total * 0.9).toFixed(2)),
        mode: "Original payment sources",
        stage: "PROCESSING",
      },
      timeline: [
        ...(booking.timeline || []),
        makeTimelineEvent("CANCEL_REQUESTED", "Cancellation requested by traveler."),
        makeTimelineEvent("REFUND_INITIATED", "Refund workflow initiated to original payment sources."),
      ],
    };

    showToast({ type: "info", title: "Cancellation Submitted", text: `Booking ${bookingId} is now in refund processing.` });
    setBookings((prev) => prev.map((item) => (
      item.id === bookingId && item.status !== "REFUNDED"
        ? { ...item, ...processingPatch }
        : item
    )));

    jsonFetch(`/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(processingPatch),
    }).catch(() => {});

    setTimeout(() => {
      const completedPatch = {
        status: "REFUNDED",
        refund: {
          ...(booking.refund || {}),
          stage: "COMPLETED",
          completedAt: new Date().toISOString(),
        },
        timeline: [
          ...(booking.timeline || []),
          makeTimelineEvent("REFUND_COMPLETED", "Refund completed and booking closed."),
        ],
      };

      setBookings((prev) => prev.map((item) => (
        item.id === bookingId && item.status === "REFUND_PROCESSING"
          ? { ...item, ...completedPatch }
          : item
      )));
      showToast({ type: "success", title: "Refund Completed", text: `Booking ${bookingId} has been refunded.` });

      jsonFetch(`/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completedPatch),
      }).catch(() => {});
    }, 1200);
  }

  function rescheduleBooking(bookingId) {
    const booking = bookings.find((item) => item.id === bookingId);
    const patch = booking
      ? {
        status: "RESCHEDULE_REQUESTED",
        timeline: [
          ...(booking.timeline || []),
          makeTimelineEvent("RESCHEDULE_REQUESTED", "Reschedule request submitted and pending airline confirmation."),
        ],
      }
      : null;

    if (patch) {
      jsonFetch(`/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).catch(() => {});
    }

    showToast({ type: "info", title: "Reschedule Requested", text: `Reschedule request sent for booking ${bookingId}.` });
    setBookings((prev) => prev.map((item) => (
      item.id === bookingId && patch
        ? {
          ...item,
          ...patch,
        }
        : item
    )));
  }

  async function requestManagerApproval() {
    if (!selected || selected.policy.inPolicy) return;
    try {
      const r = await jsonFetch("/corporate/approval/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: selected.offerId, reasons: selected.policy.reasons }),
      });
      saveApproval(selected.offerId, r.data);
      setApproval(r.data);
      showToast({ type: "success", title: "Approval Granted", text: `Token ${r.data.token} is now active for checkout.` });
    } catch (error) {
      showToast({ type: "error", title: "Approval Failed", text: getErrorMessage(error, "Could not request manager approval.") });
    }
  }

  async function downloadInvoice() {
    if (!selected) return;
    try {
      const response = await fetch(`${API_BASE}/invoice/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: businessMode ? "Business" : "Personal",
          companyName,
          taxId,
          offerId: selected.offerId,
          total,
          carbonContribution: esgRoundup,
        }),
      });
      if (!response.ok) {
        throw new Error("Invoice generation failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoice-aeropay-elite.pdf";
      a.click();
      URL.revokeObjectURL(url);
      showToast({ type: "success", title: "Invoice Downloaded", text: "Your invoice PDF has been generated." });
    } catch (error) {
      showToast({ type: "error", title: "Invoice Failed", text: getErrorMessage(error, "Could not download invoice.") });
    }
  }

  const showSkeleton = loading;
  const travelerReady = travelers.length > 0 && travelers.every((t) => Boolean(t.firstName && t.lastName && t.email && t.phone));
  const seatReady = seatChoices.length === travelers.length && seatChoices.every(Boolean);
  const bookingReady = Boolean(travelerReady && seatReady);
  const canPay = selected ? (selected.policy.inPolicy || Boolean(approval?.token)) && bookingReady : false;
  const currentNavLabel = NAV.find((item) => location.pathname.startsWith(item.path))?.label;

  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);
  const routeSegment = (location.pathname.split("/").filter(Boolean)[0] || "search").toLowerCase();

  function handleParallax(event) {
    if (reduceMotion) return;
    const { innerWidth, innerHeight } = window;
    const x = ((event.clientX / innerWidth) - 0.5) * 12;
    const y = ((event.clientY / innerHeight) - 0.5) * 12;
    setParallax({ x, y });
  }

  return (
    <div className={`app-root ${reduceMotion ? "reduce-motion" : ""}`} style={{ "--px": `${parallax.x}px`, "--py": `${parallax.y}px` }}>
      <button
        type="button"
        className="nav-toggle btn secondary"
        onClick={() => setIsNavOpen((value) => !value)}
        aria-expanded={isNavOpen}
        aria-controls="primary-sidebar"
        aria-label={isNavOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <UiIcon name="menu" size={15} />
        <span>{isNavOpen ? "Close Menu" : "Menu"}</span>
      </button>

      <div
        className={`sidebar-backdrop ${isNavOpen ? "open" : ""}`}
        aria-hidden="true"
        onClick={() => setIsNavOpen(false)}
      />

      <aside className={`sidebar glass ${isNavOpen ? "open" : ""}`} id="primary-sidebar">
        <div className="brand-block">
          <img className="brand-logo" src="/brand-orb.svg" alt="AeroNova brand mark" />
          <p className="brand-kicker">Adaptive Travel Finance</p>
          <h1>AeroNova Pulse</h1>
          <p className="brand-subtitle">A flagship booking studio with premium policy-aware commerce flows.</p>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {NAV.map((item) => (
            <button
              key={item.path}
              className={`nav-btn ${currentNavLabel === item.label ? "active" : ""}`}
              onClick={() => {
                navigate(item.path);
                setIsNavOpen(false);
              }}
            >
              <span className="nav-btn-content">
                <UiIcon name={item.icon} size={15} />
                <span>{item.label}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-note">Localhost mode | API :8080</div>
        <button className="btn secondary motion-toggle" onClick={() => setReduceMotion((v) => !v)}>
          {reduceMotion ? "Enable Motion" : "Reduce Motion"}
        </button>
      </aside>

      <main className={`content route-${routeSegment}`} onMouseMove={handleParallax} onMouseLeave={() => setParallax({ x: 0, y: 0 })}>
        <header className="top-strip glass" key={`top-strip-${location.pathname}`}>
          <div className="strip-item">
            <span><UiIcon name="session" size={13} /> Session</span>
            <strong>{sessionKey.slice(-16)}</strong>
          </div>
          <div className="strip-item strip-action mobile-nav-strip">
            <span>
              <UiIcon name="menu" size={13} /> Navigation
            </span>
            <button
              type="button"
              className="btn secondary strip-btn nav-toggle-inline"
              onClick={() => setIsNavOpen((value) => !value)}
              aria-expanded={isNavOpen}
              aria-controls="primary-sidebar"
            >
              {isNavOpen ? "Close" : "Open"} Menu
            </button>
          </div>
          <div className="strip-item">
            <span><UiIcon name="timer" size={13} /> Seat Lock</span>
            <strong>{lockId ? formatTimer(lockRemaining) : "Not Started"}</strong>
          </div>
          <div className="strip-item">
            <span><UiIcon name="wallet" size={13} /> Wallet</span>
            <strong>{formatInrFromUsd(wallet.balance)}</strong>
          </div>
          <div className="strip-item">
            <span><UiIcon name="shield" size={13} /> API Status</span>
            <strong className={`api-status-pill ${apiHealth.status}`} title={apiHealth.message}>
              {apiHealth.status === "online" && `Online • ${formatClock(apiHealth.checkedAt)}`}
              {apiHealth.status === "offline" && `Offline • ${formatClock(apiHealth.checkedAt)}`}
              {apiHealth.status === "retrying" && "Retrying..."}
              {apiHealth.status === "checking" && "Checking..."}
            </strong>
          </div>
          <div className="strip-item strip-action">
            <span>
              <UiIcon name="spark" size={13} /> Notifications
              <em className="kbd-chip" aria-hidden="true">N</em>
            </span>
            <button
              type="button"
              className={`btn secondary strip-btn ${unreadCount ? "has-unread" : ""}`.trim()}
              onClick={() => setIsNotificationOpen((v) => !v)}
              title="Toggle notifications (N). Mark all read with Shift+R."
              aria-label="Toggle notifications. Shortcut N. Mark all read with Shift+R."
            >
              {isNotificationOpen ? "Hide" : "Open"} ({unreadCount})
            </button>
          </div>
        </header>

        <section className="feedback-ribbon glass" key={`feedback-ribbon-${location.pathname}`}>
          <strong>{lockId ? "Seat lock active" : "Search ready"}</strong>
          <span>{canPay ? "All validations passed for checkout" : "Complete passenger and seat steps to unlock payment"}</span>
        </section>

        <section className={`page-shell route-transition route-${routeSegment}`} key={location.pathname}>
          <Routes>
            <Route path="/" element={<Navigate to="/search" replace />} />
            <Route
              path="/search"
              element={<SearchPage sessionKey={sessionKey} prompt={prompt} setPrompt={setPrompt} searchForm={searchForm} setSearchForm={setSearchForm} onSearch={runSearch} loading={showSkeleton} searchError={searchError} />}
            />
            <Route
              path="/search/results"
              element={<ResultsPage sessionKey={sessionKey} results={results} loading={showSkeleton} searchForm={searchForm} onSelectFlight={onSelectFlight} onFreeze={onFreeze} onBnpl={onBnpl} freeze={freeze} bnpl={bnpl} travelFinanceNote={travelFinanceNote} travelFinanceSource={travelFinanceSource} reduceMotion={reduceMotion} threeDEnabled={threeDEnabled} />}
            />
            <Route
              path="/dashboard"
              element={<ProtectedRoute isAuthenticated={isAuthenticated}><DashboardPage profile={profile} bookings={bookings} wallet={wallet} resultsCount={results.length} sessionKey={sessionKey} reduceMotion={reduceMotion} threeDEnabled={threeDEnabled} /></ProtectedRoute>}
            />
            <Route
              path="/portfolio"
              element={<CheckoutPage selected={selected} freeze={freeze} insurance={insurance} setInsurance={setInsurance} businessMode={businessMode} setBusinessMode={setBusinessMode} companyName={companyName} setCompanyName={setCompanyName} taxId={taxId} setTaxId={setTaxId} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} walletSplit={walletSplit} setWalletSplit={setWalletSplit} wallet={wallet} total={total} processing={processing} lockId={lockId} lockRemaining={lockRemaining} canPay={canPay} paymentResult={paymentResult} paymentFailure={paymentFailure} sessionKey={sessionKey} bnpl={bnpl} selectedBnplPlan={selectedBnplPlan} onSelectBnplPlan={setSelectedBnplPlan} esgRoundup={esgRoundup} setEsgRoundup={setEsgRoundup} approval={approval} onRequestApproval={requestManagerApproval} onProcessPayment={processPayment} onRetryPayment={retryPayment} onDownloadInvoice={downloadInvoice} travelers={travelers} setTravelers={setTravelers} activeTravelerIndex={activeTravelerIndex} setActiveTravelerIndex={setActiveTravelerIndex} seatChoices={seatChoices} setSeatChoices={setSeatChoices} ancillaries={ancillaries} setAncillaries={setAncillaries} bookingReady={bookingReady} />}
            />
            <Route
              path="/auth"
              element={<AuthPage sessionKey={sessionKey} onLogin={handleLogin} />}
            />
            <Route
              path="/trips"
              element={<ProtectedRoute isAuthenticated={isAuthenticated}><BookingHistoryPage bookings={bookings} sessionKey={sessionKey} onCancelBooking={cancelBooking} /></ProtectedRoute>}
            />
            <Route
              path="/trips/:bookingId"
              element={<ProtectedRoute isAuthenticated={isAuthenticated}><BookingDetailPage bookings={bookings} sessionKey={sessionKey} onCancelBooking={cancelBooking} onRescheduleBooking={rescheduleBooking} /></ProtectedRoute>}
            />
            <Route
              path="/wallet"
              element={<WalletPage wallet={wallet} sessionKey={sessionKey} />}
            />
            <Route
              path="/account"
              element={<ProtectedRoute isAuthenticated={isAuthenticated}><ProfilePage profile={profile} sessionKey={sessionKey} onUpdateProfile={setProfile} onLogout={handleLogout} /></ProtectedRoute>}
            />
            <Route
              path="/esg"
              element={<ESGPage selected={selected} esgRoundup={esgRoundup} setEsgRoundup={setEsgRoundup} sessionKey={sessionKey} />}
            />
            <Route
              path="/settings"
              element={<SettingsPage boardingPass={boardingPass} sessionKey={sessionKey} reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} threeDEnabled={threeDEnabled} setThreeDEnabled={setThreeDEnabled} />}
            />
          </Routes>
        </section>

        <NotificationCenter
          open={isNotificationOpen}
          notifications={notifications}
          unreadCount={unreadCount}
          analytics={notificationAnalytics}
          onClose={() => setIsNotificationOpen(false)}
          onClearAll={clearNotifications}
          onMarkAllRead={markAllNotificationsRead}
          onMarkRead={markNotificationRead}
          onRemove={removeNotification}
          onOpenNotification={openNotification}
          onExportJSON={exportNotificationsJSON}
          onExportCSV={exportNotificationsCSV}
        />

        <ActionToast toast={toast} onClose={() => setToast(null)} />

        <SearchOverlay
          open={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          notifications={notifications}
          onOpenNotification={openNotification}
        />
      </main>
    </div>
  );
}
