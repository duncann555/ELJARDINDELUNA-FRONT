export const FINAL_PAYMENT_STATES = new Set([
  "approved",
  "rejected",
  "cancelled",
  "cancelado",
  "refunded",
  "charged_back",
]);

export const normalizePaymentState = (value) => {
  const state = String(value || "").toLowerCase();

  if (state === "approved" || state === "rejected") return state;
  if (state === "cancelled" || state === "cancelado") return "cancelled";
  if (state === "refunded" || state === "charged_back") return state;

  return "pending";
};

export const shouldReleaseCheckoutAttempt = (value) =>
  FINAL_PAYMENT_STATES.has(normalizePaymentState(value));

export const shouldConsumePurchasedCart = (value) =>
  normalizePaymentState(value) === "approved";

export const redirectToPaymentProvider = (
  checkoutUrl,
  assign = (url) => window.location.assign(url),
) => {
  assign(checkoutUrl);
};
