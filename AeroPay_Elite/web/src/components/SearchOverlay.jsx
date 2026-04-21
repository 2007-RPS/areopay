import React, { useEffect, useMemo, useRef, useState } from "react";
import UiIcon from "./UiIcon";

function formatTime(iso) {
  if (!iso) return "now";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function SearchOverlay({
  open,
  onClose,
  notifications = [],
  onOpenNotification,
}) {
  const overlayRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (!open) return undefined;

    lastFocusedRef.current = document.activeElement;

    const overlayElement = overlayRef.current;
    if (!overlayElement) return undefined;

    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      '[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    const focusables = Array.from(overlayElement.querySelectorAll(focusableSelector));
    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const items = Array.from(overlayElement.querySelectorAll(focusableSelector));
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    overlayElement.addEventListener("keydown", handleKeyDown);

    return () => {
      overlayElement.removeEventListener("keydown", handleKeyDown);
      if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === "function") {
        lastFocusedRef.current.focus();
      }
    };
  }, [open, onClose]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return { all: [], notifications: [] };

    const query = searchTerm.toLowerCase();
    const notificationMatches = notifications.filter((item) => {
      const text = [item.title, item.text, item.path, item.type, item.severity]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    });

    return {
      all: [...notificationMatches],
      notifications: notificationMatches,
    };
  }, [searchTerm, notifications]);

  const hasResults = searchResults.all.length > 0;

  return (
    <>
      {open && <div className="search-overlay-backdrop" onClick={onClose} aria-hidden="true" />}
      <div className={`search-overlay glass ${open ? "open" : ""}`} ref={overlayRef} role="dialog" aria-modal="true" aria-label="Global search">
        <div className="search-overlay-header">
          <div className="search-overlay-input-wrapper">
            <UiIcon name="search" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notifications, routes, and more... (Cmd+K)"
              autoFocus
              className="search-overlay-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-overlay-clear"
                onClick={() => setSearchTerm("")}
              >
                <UiIcon name="close" size={14} />
              </button>
            )}
          </div>
          <button type="button" className="search-overlay-close" onClick={onClose}>
            <UiIcon name="close" size={18} />
          </button>
        </div>

        <div className="search-overlay-content">
          {!searchTerm.trim() ? (
            <div className="search-overlay-empty">
              <p>Search notifications, events, and more...</p>
              <div className="search-tips">
                <div className="search-tip">
                  <kbd>Cmd</kbd> + <kbd>K</kbd> to open this search
                </div>
                <div className="search-tip">
                  <kbd>Esc</kbd> to close
                </div>
              </div>
            </div>
          ) : !hasResults ? (
            <div className="search-overlay-empty">
              <p>No results found for "{searchTerm}"</p>
              <span className="search-subtitle">Try searching for notification titles, types, or severity levels</span>
            </div>
          ) : (
            <>
              <div className="search-overlay-categories">
                <button
                  type="button"
                  className={`search-category ${activeCategory === "all" ? "active" : ""}`}
                  onClick={() => setActiveCategory("all")}
                >
                  All ({searchResults.all.length})
                </button>
                <button
                  type="button"
                  className={`search-category ${activeCategory === "notifications" ? "active" : ""}`}
                  onClick={() => setActiveCategory("notifications")}
                >
                  Notifications ({searchResults.notifications.length})
                </button>
              </div>

              <div className="search-overlay-results">
                {(activeCategory === "all" || activeCategory === "notifications") &&
                  searchResults.notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="search-result-item notification-result"
                      onClick={() => {
                        onOpenNotification(item);
                        onClose();
                      }}
                    >
                      <div className="result-icon">
                        <UiIcon
                          name={
                            item.type === "success"
                              ? "check"
                              : item.type === "error"
                                ? "shield"
                                : item.type === "warn"
                                  ? "timer"
                                  : "spark"
                          }
                          size={14}
                        />
                      </div>
                      <div className="result-content">
                        <div className="result-title">
                          {item.title || "Update"}
                          <span className={`result-type result-type-${item.type || "info"}`}>
                            {item.type || "info"}
                          </span>
                        </div>
                        <p className="result-text">{item.text}</p>
                        <div className="result-meta">
                          <span>{item.path || "/"}</span>
                          <span>{formatTime(item.at)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>

        <div className="search-overlay-footer">
          <div className="search-footer-hint">
            Press <kbd>Esc</kbd> to close
          </div>
        </div>
      </div>
    </>
  );
}
