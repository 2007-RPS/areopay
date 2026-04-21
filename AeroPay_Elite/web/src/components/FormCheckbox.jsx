import React from "react";

export default function FormCheckbox({ id, label, checked, onChange, helperText = "", className = "" }) {
  const messageId = `${id}-message`;

  return (
    <label className={`checkbox checkbox-field ${className}`.trim()} htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} aria-describedby={helperText ? messageId : undefined} />
      <span>{label}</span>
      {helperText ? <small id={messageId} className="field-helper">{helperText}</small> : null}
    </label>
  );
}
