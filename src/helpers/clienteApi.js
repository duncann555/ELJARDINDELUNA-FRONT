import {
  API_URL,
  buildAuthHeaders,
  getApiErrorMessage,
  safeJson,
} from "./app";

const normalizarRutaApi = (ruta) => {
  const rutaNormalizada = String(ruta || "").trim();

  if (!rutaNormalizada) {
    return API_URL;
  }

  return `${API_URL}${rutaNormalizada.startsWith("/") ? "" : "/"}${rutaNormalizada}`;
};

const construirHeadersSolicitud = ({ token, headers = {}, json } = {}) => {
  const headersBase = token ? buildAuthHeaders(token, headers) : { ...headers };

  if (json === undefined) {
    return headersBase;
  }

  return {
    "Content-Type": "application/json",
    ...headersBase,
  };
};

export const solicitarApi = async (
  ruta,
  { token = "", json, body, headers, ...opciones } = {},
) => {
  const respuesta = await fetch(normalizarRutaApi(ruta), {
    ...opciones,
    headers: construirHeadersSolicitud({ token, headers, json }),
    body: json === undefined ? body : JSON.stringify(json),
  });

  const datos = await safeJson(respuesta);

  return {
    respuesta,
    datos,
  };
};

export const leerDatosApi = ({
  respuesta,
  datos,
  mensajeError = "No se pudo completar la solicitud.",
}) => {
  if (!respuesta.ok) {
    throw new Error(getApiErrorMessage(datos, mensajeError));
  }

  return datos;
};

export const solicitarJsonApi = async (
  ruta,
  { mensajeError, ...opciones } = {},
) => {
  const resultado = await solicitarApi(ruta, opciones);

  return leerDatosApi({
    respuesta: resultado.respuesta,
    datos: resultado.datos,
    mensajeError,
  });
};
