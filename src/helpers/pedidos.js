export const obtenerSubtotalPedido = (pedido) =>
  Number(pedido?.subtotal ?? pedido?.total ?? 0);

export const obtenerDescuentoPedido = (pedido) =>
  Number(pedido?.descuento || 0);

export const obtenerCostoEnvioPedido = (pedido) =>
  Number(pedido?.envio?.costo || 0);

export const obtenerMetodoPagoPedido = (pedido) =>
  String(pedido?.metodoPago || "").trim().toLowerCase() || "mercado_pago";

export const obtenerTextoMetodoPagoPedido = (pedido) =>
  obtenerMetodoPagoPedido(pedido) === "transferencia"
    ? "Transferencia bancaria"
    : "Mercado Pago";

export const obtenerVarianteEstadoPedido = (estado) => {
  switch (estado) {
    case "Entregado":
      return "success";
    case "Despachado":
      return "primary";
    case "Preparando envío":
    case "Preparando env\u00edo":
      return "info";
    case "Cancelado":
      return "danger";
    default:
      return "warning";
  }
};

export const obtenerVarianteEstadoPago = (estado) => {
  switch (estado) {
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "warning";
  }
};

export const obtenerTextoEstadoPago = (estado) => {
  switch (estado) {
    case "approved":
      return "Aprobado";
    case "rejected":
      return "Rechazado";
    default:
      return "Pendiente";
  }
};
