import { solicitarJsonApi } from "./clienteApi";

const CACHE_TTL_MS = 60_000;
let productosCache = {
  data: null,
  timestamp: 0,
  promise: null,
};

export const limpiarCacheProductosPublicos = () => {
  productosCache = {
    data: null,
    timestamp: 0,
    promise: null,
  };
};

export const obtenerProductosPublicos = async ({ force = false } = {}) => {
  const ahora = Date.now();
  const cacheVigente =
    !force &&
    productosCache.data &&
    ahora - productosCache.timestamp < CACHE_TTL_MS;

  if (cacheVigente) {
    return productosCache.data;
  }

  if (!force && productosCache.promise) {
    return productosCache.promise;
  }

  productosCache.promise = solicitarJsonApi("/productos", {
    mensajeError: "No se pudieron cargar los productos.",
  })
    .then((datos) => {
      const productos = Array.isArray(datos) ? datos : [];
      productosCache = {
        data: productos,
        timestamp: Date.now(),
        promise: null,
      };
      return productos;
    })
    .catch((error) => {
      productosCache.promise = null;
      throw error;
    });

  return productosCache.promise;
};
