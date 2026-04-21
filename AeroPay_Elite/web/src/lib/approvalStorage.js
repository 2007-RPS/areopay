const KEY = "aeropay-elite-approvals";

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveApproval(offerId, approval) {
  const store = readStore();
  store[offerId] = approval;
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getApproval(offerId) {
  const store = readStore();
  return store[offerId] || null;
}
