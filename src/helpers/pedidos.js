export const obtenerSubtotalPedido = (pedido) =>
  Number(pedido?.subtotal ?? pedido?.total ?? 0);

export const obtenerCostoEnvioPedido = (pedido) =>
  Number(pedido?.envio?.costo || 0);

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
