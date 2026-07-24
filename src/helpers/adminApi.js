import { ApiError, apiRequest } from "./api.js";

const asArray = (value) => (Array.isArray(value) ? value : []);

const requireToken = (token) => {
  if (typeof token !== "string" || !token.trim()) {
    throw new ApiError("La sesión administrativa no está disponible.", {
      status: 401,
      code: "ADMIN_SESSION_REQUIRED",
    });
  }

  return token.trim();
};

const requestAdmin = (path, token, options = {}) =>
  apiRequest(path, {
    ...options,
    token: requireToken(token),
  });

export const isAdminSessionError = (error) =>
  error instanceof ApiError && [401, 403].includes(error.status);

export const listarProductosAdmin = async (token, { signal } = {}) => {
  const data = await requestAdmin("/admin/productos", token, { signal });
  return asArray(data?.productos);
};

export const crearProductoAdmin = async (token, formData) => {
  const data = await requestAdmin("/admin/productos", token, {
    method: "POST",
    body: formData,
  });
  return data?.producto || null;
};

export const actualizarProductoAdmin = async (
  token,
  productoId,
  formData,
) => {
  const data = await requestAdmin(
    `/admin/productos/${encodeURIComponent(productoId)}`,
    token,
    {
      method: "PUT",
      body: formData,
    },
  );
  return data?.producto || null;
};

export const actualizarVisibilidadProductoAdmin = async (
  token,
  productoId,
  active,
) => {
  const data = await requestAdmin(
    `/admin/productos/${encodeURIComponent(productoId)}/active`,
    token,
    {
      method: "PATCH",
      json: { active: Boolean(active) },
    },
  );
  return data?.producto || null;
};

export const listarPedidosAdmin = async (token, { signal } = {}) => {
  const data = await requestAdmin("/admin/pedidos", token, { signal });
  return asArray(data?.pedidos);
};

export const obtenerPedidoAdmin = async (token, pedidoId, { signal } = {}) => {
  const data = await requestAdmin(
    `/admin/pedidos/${encodeURIComponent(pedidoId)}`,
    token,
    { signal },
  );
  return data?.pedido || null;
};

export const actualizarEstadoPedidoAdmin = async (
  token,
  pedidoId,
  estadoOperativo,
) => {
  const data = await requestAdmin(
    `/admin/pedidos/${encodeURIComponent(pedidoId)}/estado`,
    token,
    {
      method: "PATCH",
      json: { estadoOperativo },
    },
  );
  return data?.pedido || null;
};

export const resolverRevisionPedidoAdmin = async (
  token,
  pedidoId,
  note,
) => {
  const data = await requestAdmin(
    `/admin/pedidos/${encodeURIComponent(pedidoId)}/revision`,
    token,
    {
      method: "PATCH",
      json: {
        resolved: true,
        note: String(note || "").trim(),
      },
    },
  );
  return data?.pedido || null;
};
