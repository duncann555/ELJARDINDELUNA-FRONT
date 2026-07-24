export const PRODUCTO_VACIO = {
  name: "",
  slug: "",
  botanicalName: "",
  category: "",
  description: "",
  presentation: "",
  ingredients: "",
  warnings: "",
  price: "",
  stock: "",
  images: [],
  active: true,
};

export const ESTADOS_OPERATIVOS = [
  "pendiente",
  "pagado",
  "preparando",
  "enviado",
  "entregado",
  "cancelado",
];

const TRANSICIONES_OPERATIVAS = {
  pendiente: ["pendiente", "pagado", "cancelado"],
  pagado: ["pagado", "preparando", "cancelado"],
  preparando: ["preparando", "enviado", "cancelado"],
  enviado: ["enviado", "entregado"],
  entregado: ["entregado"],
  cancelado: ["cancelado"],
};

export const REVISION_NOTE_MIN_LENGTH = 3;
export const REVISION_NOTE_MAX_LENGTH = 500;

const ESTADOS_OPERATIVOS_META = {
  pendiente: { label: "Pendiente", variant: "secondary" },
  pagado: { label: "Pagado", variant: "info" },
  preparando: { label: "Preparando", variant: "warning" },
  enviado: { label: "Enviado", variant: "primary" },
  entregado: { label: "Entregado", variant: "success" },
  cancelado: { label: "Cancelado", variant: "danger" },
};

const ESTADOS_PAGO_META = {
  pending: { label: "Pendiente", variant: "warning" },
  approved: { label: "Aprobado", variant: "success" },
  authorized: { label: "Autorizado", variant: "info" },
  in_process: { label: "En proceso", variant: "info" },
  in_mediation: { label: "En mediación", variant: "warning" },
  rejected: { label: "Rechazado", variant: "danger" },
  cancelled: { label: "Cancelado", variant: "secondary" },
  refunded: { label: "Reintegrado", variant: "secondary" },
  charged_back: { label: "Contracargo", variant: "danger" },
};

export const getEstadoOperativoMeta = (estado) =>
  ESTADOS_OPERATIVOS_META[estado] || {
    label: estado || "Sin estado",
    variant: "secondary",
  };

export const getEstadoPagoMeta = (estado) =>
  ESTADOS_PAGO_META[estado] || {
    label: estado || "Sin estado",
    variant: "secondary",
  };

export const getEstadosOperativosDisponibles = (pedido) => {
  const estadoActual = String(pedido?.estadoOperativo || "").trim();
  const estadoPago = String(pedido?.estadoPago || "")
    .trim()
    .toLowerCase();
  const transiciones = TRANSICIONES_OPERATIVAS[estadoActual] || [];

  return transiciones.filter((estado) => {
    if (pedido?.requiresReview && estado !== "cancelado") return false;

    if (
      !["pendiente", "cancelado"].includes(estado) &&
      estadoPago !== "approved"
    ) {
      return false;
    }

    return true;
  });
};

export const puedeActualizarEstadoOperativo = (pedido, estado) =>
  getEstadosOperativosDisponibles(pedido).includes(estado);

export const formatCurrencyAdmin = (value) => {
  const amount = Number(value);

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

export const formatDateAdmin = (value) => {
  if (!value) return "Sin fecha";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Fecha inválida";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const getImageUrl = (image) => {
  if (typeof image === "string") return image;
  if (!image || typeof image !== "object") return "";

  return image.url || image.secureUrl || image.secure_url || "";
};

export const getProductId = (producto) => producto?.id || producto?._id || "";

export const getOrderId = (pedido) => pedido?.id || pedido?._id || "";

export const normalizarNotaRevision = (value) => String(value || "").trim();

export const getNotaRevisionError = (value) => {
  const note = normalizarNotaRevision(value);

  if (!note) {
    return "La nota de resolución es obligatoria.";
  }

  if (note.length < REVISION_NOTE_MIN_LENGTH) {
    return `La nota debe tener al menos ${REVISION_NOTE_MIN_LENGTH} caracteres.`;
  }

  if (note.length > REVISION_NOTE_MAX_LENGTH) {
    return `La nota no puede superar los ${REVISION_NOTE_MAX_LENGTH} caracteres.`;
  }

  return "";
};

export const joinMultilineValue = (value) =>
  Array.isArray(value)
    ? value.filter(Boolean).join("\n")
    : typeof value === "string"
      ? value
      : "";
