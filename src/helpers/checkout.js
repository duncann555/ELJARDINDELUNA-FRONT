import { apiRequest } from "./api.js";

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const normalizeCheckoutConfiguration = (data = {}) => {
  const rawShippingCost = data?.entrega?.costoDomicilio;
  const shippingCost = Number(rawShippingCost);

  if (
    rawShippingCost === null ||
    rawShippingCost === undefined ||
    rawShippingCost === "" ||
    !Number.isFinite(shippingCost) ||
    shippingCost < 0
  ) {
    throw new Error(
      "La API no devolvió un costo de envío a domicilio válido.",
    );
  }

  return {
    costoDomicilio: money(shippingCost),
    retiroDisponible: data?.entrega?.retiroDisponible === true,
  };
};

export const obtenerConfiguracionCheckout = async ({ signal } = {}) => {
  const data = await apiRequest("/checkout/configuracion", { signal });
  return normalizeCheckoutConfiguration(data);
};

export const calcularTotalesCheckout = (
  subtotal,
  metodo,
  configuration,
) => {
  const safeSubtotal = Math.max(0, money(subtotal));
  const shipping =
    metodo === "domicilio"
      ? Math.max(0, money(configuration?.costoDomicilio))
      : 0;

  return {
    subtotal: safeSubtotal,
    costoEnvio: shipping,
    total: money(safeSubtotal + shipping),
  };
};

export const totalesCoinciden = (displayed, order) =>
  ["subtotal", "costoEnvio", "total"].every(
    (field) => money(displayed?.[field]) === money(order?.[field]),
  );

export const TERMINAL_CHECKOUT_ERROR_CODES = new Set([
  "MERCADO_PAGO_UNAVAILABLE",
  "MERCADO_PAGO_NOT_CONFIGURED",
  "MERCADO_PAGO_INVALID_RESPONSE",
  "CHECKOUT_EXPIRED",
  "CHECKOUT_STATE_CHANGED",
  "IDEMPOTENCY_KEY_REUSED",
]);
