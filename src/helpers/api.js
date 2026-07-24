const environment = import.meta.env || {};
const configuredApiUrl = String(environment.VITE_API_URL || "").trim();

if (!configuredApiUrl && environment.PROD) {
  throw new Error(
    "Falta configurar VITE_API_URL. El frontend no puede iniciar sin la URL de la API.",
  );
}

export const API_URL = (
  configuredApiUrl || "http://localhost:3001/api"
).replace(/\/+$/, "");

const normalizarPath = (path) => {
  const value = String(path || "").trim();
  return value ? `${API_URL}${value.startsWith("/") ? "" : "/"}${value}` : API_URL;
};

const parseJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
};

const normalizarMensaje = (value, fallback) => {
  if (typeof value !== "string") return fallback;
  const message = value.trim();
  return message && message.length <= 240 ? message : fallback;
};

export class ApiError extends Error {
  constructor(message, { status = 0, code = "REQUEST_ERROR", fields = {} } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields && typeof fields === "object" ? fields : {};
  }
}

export const getSafeErrorMessage = (
  error,
  fallback = "No pudimos completar la solicitud. Intentá nuevamente.",
) => (error instanceof ApiError ? error.message : fallback);

export const apiRequest = async (
  path,
  {
    method = "GET",
    token = "",
    orderToken = "",
    idempotencyKey = "",
    json,
    body,
    headers = {},
    signal,
  } = {},
) => {
  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  if (orderToken) requestHeaders["X-Order-Token"] = orderToken;
  if (idempotencyKey) requestHeaders["Idempotency-Key"] = idempotencyKey;
  if (json !== undefined) requestHeaders["Content-Type"] = "application/json";

  let response;

  try {
    response = await fetch(normalizarPath(path), {
      method,
      headers: requestHeaders,
      body: json === undefined ? body : JSON.stringify(json),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError("No pudimos conectarnos con la tienda. Revisá tu conexión.");
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    const apiError = payload?.error;
    const fallback =
      response.status >= 500
        ? "La tienda no está disponible en este momento. Intentá más tarde."
        : "No pudimos completar la solicitud. Revisá los datos e intentá nuevamente.";

    throw new ApiError(normalizarMensaje(apiError?.message, fallback), {
      status: response.status,
      code: normalizarMensaje(apiError?.code, "REQUEST_ERROR"),
      fields: apiError?.fields,
    });
  }

  return payload?.data ?? null;
};
