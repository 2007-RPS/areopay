import React, { useMemo, useState } from "react";
import UiIcon from "./UiIcon";

const FILTERS = ["all", "success", "warn", "error", "info"];

function formatTime(iso) {
  if (!iso) return "now";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function SeverityBadge({ severity }) {
  const severityConfig = {
    critical: { color: "#ff0000", label: "Critical" },
    warn: { color: "#ffbe5a", label: "Warning" },
    normal: { color: "#4dde98", label: "Normal" },
  };
  const config = severityConfig[severity] || severityConfig.normal;
  return (
    <span className={`notification-severity notification-severity-${severity || "normal"}`} title={config.label}>
      {config.label}
    </span>
  );
}

function AnalyticsView({ analytics }) {
  return (
    <div className="notification-analytics">
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Total Created</h4>
          <p className="analytics-number">{analytics?.totalCreated || 0}</p>
        </div>
        <div className="analytics-card">
          <h4>Total Opened</h4>
          <p className="analytics-number">{analytics?.totalOpened || 0}</p>
        </div>
        <div className="analytics-card">
          <h4>Total Dismissed</h4>
          <p className="analytics-number">{analytics?.totalDismissed || 0}</p>
        </div>
      </div>

      <div className="analytics-section">
        <h4>By Type</h4>
        <div className="analytics-breakdown">
          {Object.entries(analytics?.typeBreakdown || {}).map(([type, count]) => (
            <div key={type} className="breakdown-item">
              <span>{type === "info" ? "Info" : type[0].toUpperCase() + type.slice(1)}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-section">
        <h4>By Severity</h4>
        <div className="analytics-breakdown">
          {Object.entries(analytics?.severityBreakdown || {}).map(([severity, count]) => (
            <div key={severity} className="breakdown-item">
              <span>{severity[0].toUpperCase() + severity.slice(1)}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter({
  open,
  notifications = [],
  unreadCount = 0,
  analytics,
  onClose,
  onClearAll,
  onMarkAllRead,
  onMarkRead,
  onRemove,
  onOpenNotification,
  onExportJSON,
  onExportCSV,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("list");

  const counts = useMemo(() => {
    const next = { all: notifications.length, success: 0, warn: 0, error: 0, info: 0 };
    notifications.forEach((item) => {
      const type = item.type || "info";
      next[type] = (next[type] || 0) + 1;
    });
    return next;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return notifications.filter((item) => {
      if (activeFilter !== "all" && (item.type || "info") !== activeFilter) {
        return false;
      }
      if (!query) {
        return true;
      }

      const text = [item.title, item.text, item.path].filter(Boolean).join(" ").toLowerCase();
      return text.includes(query);
    });
  }, [activeFilter, notifications, searchTerm]);

  return (
    <aside className={`notification-center glass ${open ? "open" : ""}`} aria-hidden={!open}>
      <header className="notification-head">
        <div>
          <p className="hero-eyebrow">Action Feed</p>
          <h3>Notification Center ({unreadCount} unread)</h3>
          <p className="shortcut-hint">Shortcuts: N toggle | Shift+R mark all read | Esc close</p>
        </div>
        <div className="btn-row">
          <button type="button" className="btn secondary" onClick={onMarkAllRead} disabled={!unreadCount}>
            <UiIcon name="check" size={14} /> Mark All Read
          </button>
          <button type="button" className="btn secondary" onClick={onExportJSON} disabled={!notifications.length} title="Export as JSON">
            <UiIcon name="download" size={14} /> JSON
          </button>
          <button type="button" className="btn secondary" onClick={onExportCSV} disabled={!notifications.length} title="Export as CSV">
            <UiIcon name="download" size={14} /> CSV
          </button>
          <button type="button" className="btn secondary" onClick={onClearAll} disabled={!notifications.length}>
            <UiIcon name="timer" size={14} /> Clear All
          </button>
          <button type="button" className="btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </header>

      <div className="notification-tab-bar">
        <button
          type="button"
          className={`notification-tab ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          <UiIcon name="list" size={14} /> Feed
        </button>
        <button
          type="button"
          className={`notification-tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <UiIcon name="chart" size={14} /> Analytics
        </button>
      </div>

      {activeTab === "analytics" ? (
        <AnalyticsView analytics={analytics} />
      ) : (
        <>
          <div className="notification-toolbar">
            <div className="notification-filters" role="tablist" aria-label="Notification filter">
              {FILTERS.map((filter) => {
                const label = filter === "all" ? "All" : filter[0].toUpperCase() + filter.slice(1);
                return (
                  <button
                    key={filter}
                    type="button"
                    role="tab"
                    className={`notification-filter-chip ${activeFilter === filter ? "active" : ""}`}
                    aria-selected={activeFilter === filter}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {label} ({counts[filter] || 0})
                  </button>
                );
              })}
            </div>

            <label className="notification-search">
              <UiIcon name="search" size={14} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search title, message, or route"
              />
            </label>
          </div>

          {!notifications.length ? (
            <div className="notification-empty">
              <p>No activity yet. Actions like search, approval, or payment will appear here.</p>
            </div>
          ) : (
            <div className="notification-list">
              {!filteredNotifications.length ? (
                <div className="notification-empty">
                  <p>No entries match this filter. Try another type or clear your search.</p>
                </div>
              ) : null}
              {filteredNotifications.map((item) => (
                <article
                  key={item.id}
                  className={`notification-item notification-${item.type || "info"} ${item.read ? "" : "notification-unread"}`.trim()}
                >
                  <div className="notification-item-head">
                    <strong>
                      <UiIcon
                        name={item.type === "success" ? "check" : item.type === "error" ? "shield" : item.type === "warn" ? "timer" : "spark"}
                        size={14}
                      />
                      {item.title || "Update"}
                    </strong>
                    <SeverityBadge severity={item.severity} />
                    <small>{formatTime(item.at)}</small>
                  </div>
                  <p>{item.text}</p>
                  <div className="notification-item-foot">
                    <span>{item.path || "/"}</span>
                    <div className="notification-item-stats">
                      <span title="Times opened">{item.opens || 0}x opened</span>
                    </div>
                    <div className="notification-actions">
                      {!item.read ? <button type="button" onClick={() => onMarkRead?.(item.id)}>Mark Read</button> : null}
                      <button type="button" onClick={() => onOpenNotification?.(item)}>
                        Open
                      </button>
                      <button type="button" onClick={() => onRemove(item.id)}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
