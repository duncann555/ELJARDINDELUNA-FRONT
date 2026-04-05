export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const INVALID_STORAGE_VALUES = new Set(["", "null", "undefined"]);
const AUTH_ERROR_MESSAGES = [
  "token no es valido",
  "autenticacion no esta configurada",
];

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;

  return `${normalized}${"=".repeat(padding)}`;
};

export const normalizeToken = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.replace(/^Bearer\s+/i, "").trim();

  return INVALID_STORAGE_VALUES.has(normalized) ? "" : normalized;
};

export const getJwtPayload = (token) => {
  const normalizedToken = normalizeToken(token);

  if (!normalizedToken || typeof window === "undefined" || typeof window.atob !== "function") {
    return null;
  }

  const [, payloadSegment] = normalizedToken.split(".");

  if (!payloadSegment) {
    return null;
  }

  try {
    const decoded = window.atob(decodeBase64Url(payloadSegment));
    const json = decodeURIComponent(
      Array.from(decoded)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const normalizedToken = normalizeToken(token);

  if (!normalizedToken) {
    return false;
  }

  const payload = getJwtPayload(normalizedToken);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
};

export const buildAuthHeaders = (token, headers = {}) => {
  const normalizedToken = normalizeToken(token);

  if (!normalizedToken) {
    return { ...headers };
  }

  return {
    ...headers,
    "x-token": normalizedToken,
    Authorization: `Bearer ${normalizedToken}`,
  };
};

export const isAuthError = (response, data) => {
  const status = Number(response?.status || 0);

  if (status === 401 || status === 403) {
    return true;
  }

  const message = typeof data?.mensaje === "string" ? data.mensaje.toLowerCase() : "";

  return AUTH_ERROR_MESSAGES.some((candidate) => message.includes(candidate));
};

export const getApiValidationErrors = (data) => {
  const rawErrors = Array.isArray(data)
    ? data
    : Array.isArray(data?.errors)
      ? data.errors
      : [];

  return rawErrors
    .map((error) => {
      if (typeof error === "string") {
        return error;
      }

      if (typeof error?.msg === "string") {
        return error.msg;
      }

      if (typeof error?.message === "string") {
        return error.message;
      }

      return "";
    })
    .filter(Boolean);
};

export const getApiErrorMessage = (data, fallbackMessage) => {
  const [firstValidationError] = getApiValidationErrors(data);

  if (firstValidationError) {
    return firstValidationError;
  }

  if (typeof data?.detalle === "string" && data.detalle.trim()) {
    return data.detalle;
  }

  if (typeof data?.mensaje === "string" && data.mensaje.trim()) {
    return data.mensaje;
  }

  return fallbackMessage;
};

export const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

export const formatDate = (
  value,
  options = {
    dateStyle: "short",
    timeStyle: "short",
  },
) =>
  value ? new Date(value).toLocaleString("es-AR", options) : "-";
