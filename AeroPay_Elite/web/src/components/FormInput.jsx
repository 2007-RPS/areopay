import React from "react";

export default function FormInput({
  id,
  label,
  value,
  onChange,
  error = "",
  helperText = "",
  as = "input",
  className = "",
  ...props
}) {
  const Component = as;
  const messageId = `${id}-message`;

  return (
    <div className={`form-field ${error ? "has-error" : ""} ${className}`.trim()}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <Component
        id={id}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? messageId : undefined}
        {...props}
      />
      {error ? <small id={messageId} className="field-error">{error}</small> : null}
      {!error && helperText ? <small id={messageId} className="field-helper">{helperText}</small> : null}
    </div>
  );
}
