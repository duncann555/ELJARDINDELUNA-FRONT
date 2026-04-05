import { safeJson } from "./app";

export { safeJson };

export const CHECKOUT_ENVIO_STORAGE_KEY =
  "checkout_envio_el_jardin_de_luna";
export const CHECKOUT_PEDIDO_STORAGE_KEY =
  "ultimo_pedido_el_jardin_de_luna";

export const leerStorageJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`No se pudo leer ${key}:`, error);
    return fallback;
  }
};

export const guardarStorageJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`No se pudo guardar ${key}:`, error);
  }
};

export const obtenerProductoId = (producto) => producto?._id ?? producto?.id;

const debeUsarSandboxMercadoPago = () => {
  const modoConfigurado = import.meta.env.VITE_MP_CHECKOUT_MODE?.toLowerCase();

  if (modoConfigurado === "sandbox") return true;
  if (modoConfigurado === "production") return false;

  if (typeof window === "undefined") return false;

  const { hostname } = window.location;
  return hostname === "localhost" || hostname === "127.0.0.1";
};

const normalizarTextoError = (valor) => {
  if (typeof valor !== "string") return null;

  const texto = valor.trim();
  return texto.length > 0 ? texto : null;
};

const extraerDetalleError = (data) => {
  const detalle = normalizarTextoError(data?.detalle);

  if (detalle) return detalle;

  if (Array.isArray(data?.causa)) {
    const causas = data.causa
      .map((causa) =>
        normalizarTextoError(causa?.description) ||
        normalizarTextoError(causa?.message) ||
        normalizarTextoError(causa?.code),
      )
      .filter(Boolean);

    if (causas.length > 0) {
      return causas.join(", ");
    }
  }

  if (typeof data?.causa === "object" && data?.causa !== null) {
    return (
      normalizarTextoError(data.causa?.message) ||
      normalizarTextoError(data.causa?.description)
    );
  }

  return normalizarTextoError(data?.error);
};

export const construirMensajeError = (data, fallback) => {
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.map((error) => error.msg).join(", ");
  }

  const mensaje = normalizarTextoError(data?.mensaje);
  const detalle = extraerDetalleError(data);

  if (mensaje && detalle && detalle !== mensaje) {
    return `${mensaje}: ${detalle}`;
  }

  return mensaje || detalle || fallback;
};

export const obtenerCheckoutUrl = (checkoutData) => {
  if (debeUsarSandboxMercadoPago() && checkoutData?.sandbox_init_point) {
    return checkoutData.sandbox_init_point;
  }

  if (checkoutData?.init_point) return checkoutData.init_point;
  if (checkoutData?.sandbox_init_point) return checkoutData.sandbox_init_point;

  if (checkoutData?.id) {
    const redirectUrl = new URL("https://www.mercadopago.com.ar/checkout/v1/redirect");
    redirectUrl.searchParams.set("pref_id", checkoutData.id);
    return redirectUrl.toString();
  }

  return null;
};
