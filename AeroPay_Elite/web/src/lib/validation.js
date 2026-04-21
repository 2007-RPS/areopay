export function isEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function isPhone(value = "") {
  const digits = String(value).replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export function isIataCode(value = "") {
  return /^[A-Z]{3}$/.test(String(value).trim().toUpperCase());
}

export function isFutureOrToday(dateString = "") {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
}

export function validateSearchForm(form) {
  if (!isIataCode(form.from)) return "From must be a valid 3-letter IATA code.";
  if (!isIataCode(form.to)) return "To must be a valid 3-letter IATA code.";
  if (!form.departDate || !isFutureOrToday(form.departDate)) return "Departure date must be today or later.";
  if (form.tripType !== "one-way") {
    if (!form.returnDate) return "Return date is required for round-trip and multi-city searches.";
    if (new Date(form.returnDate) < new Date(form.departDate)) return "Return date cannot be earlier than departure date.";
  }
  if (!Number.isFinite(form.budget) || Number(form.budget) < 100) return "Budget must be at least ₹8,340.";
  return "";
}

export function validateTraveler(traveler) {
  if (!traveler.firstName?.trim()) return "First name is required.";
  if (!traveler.lastName?.trim()) return "Last name is required.";
  if (!isEmail(traveler.email)) return "Enter a valid email address.";
  if (!isPhone(traveler.phone)) return "Enter a valid phone number.";
  return "";
}

export function validateBusinessDetails(companyName, taxId) {
  if (!companyName?.trim()) return "Company name is required in business mode.";
  if (!taxId?.trim()) return "Company Tax ID / GSTIN is required in business mode.";
  return "";
}
