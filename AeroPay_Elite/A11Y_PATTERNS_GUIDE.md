# Accessibility (a11y) Patterns Guide - AeroPay Elite

## Overview

This document outlines the ARIA semantics and accessibility patterns implemented in AeroPay Elite to ensure form validation is properly exposed to assistive technologies (screen readers, voice control, etc.).

---

## Core Patterns Implemented

### 1. **Field-Level Error Association**

Every form input has two complementary ARIA attributes for error handling:

#### Pattern: `aria-invalid` + `aria-describedby`

```jsx
<FormInput
  label="Email"
  name="email"
  type="email"
  error={emailError}  // Error message or null/undefined
  helperText="Format: user@example.com"
/>
```

**What gets rendered:**

```html
<input
  type="email"
  aria-invalid="true"        <!-- When error present -->
  aria-describedby="email-message"
/>
<small id="email-message">
  Invalid email format    <!-- Error message -->
</small>
```

**Accessibility Benefit:**
- Screen readers announce: _"Email field, invalid, Invalid email format"_
- Users understand the specific validation failure
- Field validity state is machine-readable for automation

**Implementation Location:** [`web/src/components/FormInput.jsx`](web/src/components/FormInput.jsx)

---

### 2. **Dynamic Error Announcements**

When validation errors appear dynamically, screen readers need to announce them:

#### Pattern: `role="alert"` + `aria-live="assertive"`

```jsx
{hasValidationErrors && (
  <div role="alert" aria-live="assertive" className="error-summary">
    <h2>Please fix the following errors:</h2>
    <ul>
      <li>First name is required.</li>
      <li>Email address is invalid.</li>
    </ul>
  </div>
)}
```

**Accessibility Benefit:**
- Screen reader announces errors immediately when they appear
- `aria-live="assertive"` interrupts current speech for urgent messages
- Users don't need to manually navigate to find errors

**Implementation Locations:**
- [`web/src/pages/SearchPage.jsx`](web/src/pages/SearchPage.jsx)
- [`web/src/pages/CheckoutPage.jsx`](web/src/pages/CheckoutPage.jsx)
- [`web/src/pages/AuthPage.jsx`](web/src/pages/AuthPage.jsx)

---

### 3. **State-Based Error Tracking**

Form validation errors are tracked independently per field for granular control:

#### Pattern: Field-Specific Error States

**AuthPage Example:**
```jsx
const [nameError, setNameError] = useState("");
const [emailError, setEmailError] = useState("");

const handleValidation = () => {
  if (!name.trim()) setNameError("Name is required");
  if (!isValidEmail(email)) setEmailError("Invalid email format");
};
```

**CheckoutPage Example (Multi-Traveler):**
```jsx
const [travelerFieldErrors, setTravelerFieldErrors] = useState({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
});

// Update error for specific field:
setTravelerFieldErrors(prev => ({
  ...prev,
  email: "Invalid email format"
}));
```

**Accessibility Benefit:**
- Only affected fields show error state
- Error messages are specific to field context
- Tests can verify field-specific accessibility

---

## Component Integration

### FormInput Component

**File:** [`web/src/components/FormInput.jsx`](web/src/components/FormInput.jsx)

**Props for Accessibility:**
- `error` (string | undefined) - Error message to display and link via aria-describedby
- `helperText` (string | undefined) - Helper text (also linked via aria-describedby)
- `label` (string) - Accessible label for input

**Auto-Generated:**
- `aria-invalid={Boolean(error)}` - True when error exists
- `aria-describedby={messageId}` - Links to error/helper message
- `id={messageId}` on `<small>` element - Unique identifier

---

## Pages Using These Patterns

### 1. **AuthPage** (`web/src/pages/AuthPage.jsx`)
- **Fields:** Name, Email
- **Error Tracking:** Individual state variables (`nameError`, `emailError`)
- **Validation:** Basic required/format checks
- **Error Display:** Inline `FormInput` errors + role="alert" summary

### 2. **SearchPage** (`web/src/pages/SearchPage.jsx`)
- **Fields:** Multiple search criteria
- **Error Tracking:** Generic error state
- **Validation:** Form-level validation
- **Error Display:** role="alert" announcement

### 3. **CheckoutPage** (`web/src/pages/CheckoutPage.jsx`)
- **Fields:** Multiple traveler profiles (firstName, lastName, email, phone × N travelers)
- **Error Tracking:** `travelerFieldErrors` object with per-field errors
- **Validation:** Per-field validation with specific messages
- **Error Display:** Inline `FormInput` errors + page-level error summary

---

## Test Coverage

### Test Files

1. **Component Level:** [`web/src/components/FormInput.a11y.test.jsx`](web/src/components/FormInput.a11y.test.jsx)
   - Tests: Helper text association, error message association
   - Validates: `aria-invalid`, `aria-describedby` presence and correctness

2. **Page Level:** [`web/src/pages/AuthPage.validation.test.jsx`](web/src/pages/AuthPage.validation.test.jsx)
   - Tests: Field validation, error display, state changes
   - Validates: Real form fields receive ARIA attributes when errors occur

3. **Integration Level:** [`web/src/CheckoutFlow.integration.test.jsx`](web/src/CheckoutFlow.integration.test.jsx)
   - Tests: Multi-step flow, traveler field validation, error handling
   - Validates: End-to-end accessibility across complex forms

### Running Tests

```bash
# All tests
npm --prefix web test

# Specific file
npm --prefix web test -- FormInput.a11y.test.jsx

# Watch mode
npm --prefix web test -- --watch
```

---

## Testing Queries

### Correct Query Methods

When testing form validation with multiple error instances, use specific queries:

❌ **Wrong** (throws with multiple matches):
```javascript
screen.getByText("First name is required.")
```

✅ **Correct** (handles multiple elements):
```javascript
expect(screen.queryAllByText("First name is required.").length).toBeGreaterThan(0);
```

✅ **Better** (field-specific validation):
```javascript
expect(screen.getByLabelText("First Name")).toHaveAttribute("aria-invalid", "true");
expect(screen.getByLabelText("First Name")).toHaveAttribute("aria-describedby");
```

---

## Implementation Checklist

When adding form validation to a new page:

- [ ] Create field-specific error state variables
- [ ] Use `FormInput` component with `error` prop
- [ ] Add validation logic that sets error messages
- [ ] Add `role="alert"` + `aria-live="assertive"` summary div
- [ ] Write component/page-level tests
- [ ] Verify with screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] Run `npm run test` and verify all tests pass
- [ ] Run `npm run build` and verify production build succeeds

---

## Screen Reader Testing

### Windows (NVDA - Free)

1. Download: https://www.nvaccess.org/download/
2. Start NVDA (Insert key toggles speech)
3. Navigate forms with Tab/Shift+Tab
4. NVDA announces field name + value + state + error message
5. Trigger validation (press form button)
6. NVDA announces role="alert" summary immediately

### Example Output:
```
"Name field, blank"
[User types invalid input]
"Name field, invalid, Please enter a valid name"
[Page announces error]
"Alert: Please fix the following errors: Name is invalid"
```

---

## WCAG Compliance

These patterns satisfy:

- **WCAG 2.1 Level A - 3.3.1 Error Identification:** Errors identified to user
- **WCAG 2.1 Level AA - 3.3.3 Error Suggestion:** Specific error messages provided
- **WCAG 2.1 Level AA - 3.3.4 Error Prevention:** Form submission prevented until valid
- **WCAG 2.1 Level AAA - 4.1.2 Name, Role, Value:** All form fields have accessible name, role, and state

---

## Common Patterns for Extension

### Pattern: Add New Form Page

```jsx
// 1. Create error state
const [fieldError, setFieldError] = useState("");

// 2. Add FormInput
<FormInput
  label="Field Label"
  name="fieldName"
  error={fieldError}
  helperText="Optional help text"
/>

// 3. Add validation
const validateField = () => {
  if (!value) {
    setFieldError("Field is required");
    return false;
  }
  setFieldError("");
  return true;
};

// 4. Add error summary
{hasErrors && (
  <div role="alert" aria-live="assertive">
    <h2>Validation Errors</h2>
    <ul>{/* List errors */}</ul>
  </div>
)}
```

### Pattern: Add New Field to Existing Form

1. Add to error state object (e.g., `travelerFieldErrors.newField`)
2. Add `FormInput` with `error={travelerFieldErrors.newField}`
3. Add validation logic to `validateField()` function
4. Add test assertions for aria-invalid and aria-describedby

---

## Troubleshooting

### Issue: Screen reader not announcing errors

**Check:**
- FormInput receives `error` prop
- `<small>` element has unique `id`
- Input has `aria-describedby` pointing to `<small>` id
- Error message container is in DOM (not hidden until announced)

### Issue: Tests failing with "multiple elements with text"

**Solution:**
```javascript
// Use queryAllByText to check existence
const errors = screen.queryAllByText("Error message");
expect(errors.length).toBeGreaterThan(0);

// Or target specific element
expect(screen.getByLabelText("Field Name")).toHaveAttribute("aria-invalid", "true");
```

### Issue: aria-invalid always false

**Check:**
- Error state is being set by validation
- FormInput component receives error prop correctly
- Conditional rendering isn't hiding the input

---

## Resources

- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Form Accessibility](https://webaim.org/articles/form_validation/)
- [MDN: aria-invalid](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-invalid)
- [MDN: aria-describedby](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** April 17, 2026  
**Status:** All patterns implemented and tested ✅
