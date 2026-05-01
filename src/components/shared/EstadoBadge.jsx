const normalizar = (value) => String(value || "").trim();
const normalizarClave = (value) => normalizar(value).toLowerCase();

const MAPAS_BADGES = {
  pedido: {
    "en espera de pago": { label: "En espera", tone: "amber" },
    "preparando envío": { label: "En preparación", tone: "lavender" },
    "preparando envio": { label: "En preparación", tone: "lavender" },
    despachado: { label: "Enviado", tone: "blue" },
    entregado: { label: "Entregado", tone: "olive" },
    cancelado: { label: "Cancelado", tone: "terracotta" },
  },
  pago: {
    pending: { label: "Pago pendiente", tone: "orange" },
    approved: { label: "Pagado", tone: "sage" },
    rejected: { label: "Pago rechazado", tone: "rose" },
    refunded: { label: "Reembolsado", tone: "slate" },
  },
  producto: {
    activo: { label: "Activo", tone: "herbal" },
    visible: { label: "Activo", tone: "herbal" },
    inactivo: { label: "Suspendido", tone: "warm-gray" },
    suspendido: { label: "Suspendido", tone: "warm-gray" },
  },
  usuario: {
    activo: { label: "Activo", tone: "herbal" },
    suspendido: { label: "Suspendido", tone: "ochre" },
    administrador: { label: "Admin", tone: "terracotta" },
    usuario: { label: "Cliente", tone: "slate" },
  },
  stock: {
    sin_stock: { label: "Sin stock", tone: "terracotta" },
    bajo: { label: "Stock bajo", tone: "mustard" },
    disponible: { label: "Disponible", tone: "sage" },
  },
  categoria: {
    "tinturas madres": { tone: "herbal" },
    "esencias aromaticas": { label: "Esencias", tone: "lavender" },
    "esencias aromáticas": { label: "Esencias", tone: "lavender" },
    "hierbas naturales": { tone: "herbal-soft" },
    "cosmetica natural": { label: "Cosmética natural", tone: "earth-rose" },
    "cosmética natural": { tone: "earth-rose" },
    aceites: { tone: "gold" },
    aromas: { tone: "blue-lavender" },
  },
  pagoMetodo: {
    mercado_pago: { label: "Mercado Pago", tone: "blue" },
    transferencia: { label: "Transferencia", tone: "sage" },
  },
  envio: {
    andreani_domicilio: { label: "Andreani", tone: "slate-blue" },
    andreani_sucursal: { label: "Andreani", tone: "slate-blue" },
    cadete_local: { label: "A coordinar", tone: "olive" },
  },
  general: {
    total: { tone: "slate" },
    activo: { tone: "herbal" },
    pendiente: { tone: "amber" },
    destacado: { label: "Destacado", tone: "gold" },
  },
};

export const obtenerConfigBadge = ({ tipo = "general", valor, label }) => {
  const valorNormalizado = normalizar(valor || label);
  const mapa = MAPAS_BADGES[tipo] || MAPAS_BADGES.general;
  const config = mapa[normalizarClave(valorNormalizado)] || {};

  return {
    label: label || config.label || valorNormalizado || "Sin estado",
    tone: config.tone || "neutral",
  };
};

export const obtenerStockBadge = (stock) => {
  const cantidad = Number(stock || 0);

  if (cantidad <= 0) {
    return { tipo: "stock", valor: "sin_stock" };
  }

  if (cantidad <= 5) {
    return { tipo: "stock", valor: "bajo", label: `${cantidad} en stock` };
  }

  return { tipo: "stock", valor: "disponible", label: `${cantidad} en stock` };
};

export default function EstadoBadge({
  tipo = "general",
  valor,
  label,
  tone,
  className = "",
  as: Component = "span",
}) {
  const config = obtenerConfigBadge({ tipo, valor, label });
  const badgeTone = tone || config.tone;

  return (
    <Component
      className={`estado-badge estado-badge--${badgeTone} ${className}`.trim()}
    >
      {config.label}
    </Component>
  );
}
