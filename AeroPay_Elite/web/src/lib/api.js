const normalizedBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export const API_BASE = normalizedBase;

export class ApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ApiError";
    this.status = details.status || 0;
    this.code = details.code || "API_ERROR";
    this.userMessage = details.userMessage || message;
    this.path = details.path || "";
    this.cause = details.cause;
  }
}

function mapStatusToMessage(status, backendMessage, path) {
  if (status === 400) return backendMessage || "Request validation failed. Please review your input.";
  if (status === 401) return backendMessage || "Authentication required for this action.";
  if (status === 403) return backendMessage || "You are not authorized for this action.";
  if (status === 404) return backendMessage || `Requested API endpoint was not found: ${path}`;
  if (status === 409) return backendMessage || "Conflict detected while processing your request.";
  if (status === 422) return backendMessage || "Input could not be processed. Please check values.";
  if (status === 429) return backendMessage || "Too many requests. Please retry in a moment.";
  if (status >= 500) return backendMessage || "Server error occurred while processing your request.";
  return backendMessage || `Request failed with status ${status}`;
}

export async function jsonFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  let res;

  try {
    res = await fetch(url, options);
  } catch (error) {
    throw new ApiError("Network request failed", {
      code: "API_UNREACHABLE",
      path,
      cause: error,
      userMessage: "API server is unreachable. Start backend service and retry.",
    });
  }

  const contentType = typeof res.headers?.get === "function"
    ? (res.headers.get("content-type") || "")
    : "application/json";
  const isJson = contentType.includes("application/json");
  let payload;

  try {
    payload = isJson ? await res.json() : await res.text();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const backendMessage = isJson ? payload?.message || payload?.error || "" : String(payload || "");
    throw new ApiError(backendMessage || `Request failed (${res.status})`, {
      status: res.status,
      path,
      code: isJson ? payload?.code || "API_HTTP_ERROR" : "API_HTTP_ERROR",
      userMessage: mapStatusToMessage(res.status, backendMessage, path),
    });
  }

  if (!isJson) {
    throw new ApiError("Invalid API response format", {
      status: res.status,
      path,
      code: "API_INVALID_RESPONSE",
      userMessage: "Server responded with unexpected format. Please retry.",
    });
  }

  return payload;
}

export async function fetchAirports(codes) {
  const uniqueCodes = Array.from(new Set((codes || []).map((item) => String(item || "").toUpperCase().trim()).filter(Boolean)));
  if (!uniqueCodes.length) {
    return { airports: {}, missing: [] };
  }

  const payload = await jsonFetch(`/airports?codes=${encodeURIComponent(uniqueCodes.join(","))}`);
  return payload.data || { airports: {}, missing: [] };
}

export async function fetchRouteIntel(fromCode, toCode) {
  const from = String(fromCode || "").toUpperCase().trim();
  const to = String(toCode || "").toUpperCase().trim();
  if (!from || !to) {
    return null;
  }
  const payload = await jsonFetch(`/routes/intel?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  return payload.data || null;
}
