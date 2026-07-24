import { apiRequest } from "./api.js";

const texto = (value) => (typeof value === "string" ? value.trim() : "");
const numero = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizarProducto = (source = {}) => {
  const images = Array.isArray(source.images)
    ? source.images.map(texto).filter(Boolean)
    : [texto(source.imagenUrl || source.imagen)].filter(Boolean);
  const active =
    typeof source.active === "boolean"
      ? source.active
      : String(source.estado || "Activo").toLowerCase() !== "inactivo";

  return {
    id: texto(source.id || source._id),
    name: texto(source.name || source.nombre),
    slug: texto(source.slug),
    botanicalName: texto(source.botanicalName),
    category: texto(source.category || source.categoria),
    description: texto(source.description || source.descripcion),
    presentation: texto(source.presentation),
    ingredients: texto(source.ingredients),
    warnings: texto(source.warnings),
    price: Math.max(0, numero(source.price ?? source.precio)),
    stock: Math.max(0, Math.trunc(numero(source.stock))),
    images,
    active,
  };
};

export const getProductIdentifier = (product) =>
  String(product?.id || product?._id || "").trim();

export const obtenerProductos = async ({ signal } = {}) => {
  const data = await apiRequest("/productos", { signal });
  const products = Array.isArray(data?.productos) ? data.productos : [];

  return products
    .map(normalizarProducto)
    .filter((product) => product.id && product.name && product.active);
};

export const obtenerProducto = async (identifier, { signal } = {}) => {
  const data = await apiRequest(
    `/productos/${encodeURIComponent(String(identifier || ""))}`,
    { signal },
  );
  const product = normalizarProducto(data?.producto);

  return product.id && product.active ? product : null;
};
