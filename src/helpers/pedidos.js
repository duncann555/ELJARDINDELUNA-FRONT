export const obtenerSubtotalPedido = (pedido) =>
  Number(pedido?.subtotal ?? pedido?.total ?? 0);

export const obtenerDescuentoPedido = (pedido) =>
  Number(pedido?.descuento || 0);

export const obtenerCostoEnvioPedido = (pedido) =>
  Number(pedido?.envio?.costo || 0);

export const obtenerTipoEnvioPedido = (pedido) =>
  String(pedido?.envio?.tipo || pedido?.datosEnvio?.tipo || "")
    .trim()
    .toLowerCase();

export const obtenerTextoTipoEnvioPedido = (pedido) => {
  switch (obtenerTipoEnvioPedido(pedido)) {
    case "andreani_sucursal":
      return "Andreani a sucursal";
    case "cadete_local":
      return "Acordar con el vendedor";
    case "andreani_domicilio":
      return "Andreani a domicilio";
    default:
      return pedido?.envio?.proveedor || "Envío nacional";
  }
};

export const obtenerMetodoPagoPedido = (pedido) =>
  String(pedido?.metodoPago || "").trim().toLowerCase() || "mercado_pago";

export const obtenerEstadoPagoPedido = (pedido) =>
  String(pedido?.estadoPago || pedido?.pago?.estado || "pending")
    .trim()
    .toLowerCase();

export const obtenerTextoMetodoPagoPedido = (pedido) =>
  obtenerMetodoPagoPedido(pedido) === "transferencia"
    ? "Transferencia bancaria"
    : "Mercado Pago";

export const obtenerTextoEstadoPedido = (estado) => {
  switch (estado) {
    case "Preparando envío":
    case "Preparando env\u00edo":
      return "Preparando envío";
    case "En espera de pago":
    case "Despachado":
    case "Entregado":
    case "Cancelado":
      return estado;
    default:
      return estado || "Sin estado";
  }
};

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
      return "Pagado";
    case "rejected":
      return "Rechazado";
    default:
      return "Pendiente";
  }
};
