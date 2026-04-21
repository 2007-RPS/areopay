export const USD_TO_INR = 83.4;

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function usdToInr(amount) {
  const numeric = Number(amount || 0);
  if (!Number.isFinite(numeric)) return 0;
  return numeric * USD_TO_INR;
}

export function inrToUsd(amount) {
  const numeric = Number(amount || 0);
  if (!Number.isFinite(numeric)) return 0;
  return numeric / USD_TO_INR;
}

export function formatInrFromUsd(amount) {
  return INR_FORMATTER.format(usdToInr(amount));
}

export function formatInr(amount) {
  const numeric = Number(amount || 0);
  if (!Number.isFinite(numeric)) return INR_FORMATTER.format(0);
  return INR_FORMATTER.format(numeric);
}
