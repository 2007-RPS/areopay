import React from "react";
import UiIcon from "./UiIcon";

function getIconName(type) {
  if (type === "success") return "check";
  if (type === "error") return "shield";
  if (type === "warn") return "timer";
  return "spark";
}

export default function ActionToast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className={`action-toast action-toast-${toast.type || "info"}`} role="status" aria-live="polite">
      <div className="action-toast-icon" aria-hidden="true">
        <UiIcon name={getIconName(toast.type)} size={16} />
      </div>
      <div className="action-toast-copy">
        <strong>{toast.title || "Update"}</strong>
        <span>{toast.text}</span>
      </div>
      <button type="button" className="action-toast-close" onClick={onClose} aria-label="Dismiss notification">
        Close
      </button>
    </div>
  );
}
