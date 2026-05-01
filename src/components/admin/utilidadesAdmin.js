import {
  obtenerCostoEnvioPedido,
  obtenerDescuentoPedido,
  obtenerEstadoPagoPedido,
  obtenerMetodoPagoPedido,
  obtenerSubtotalPedido,
  obtenerTextoTipoEnvioPedido,
  obtenerTextoEstadoPago,
  obtenerTextoEstadoPedido,
  obtenerTextoMetodoPagoPedido,
  obtenerVarianteEstadoPago,
  obtenerVarianteEstadoPedido,
} from "../../helpers/pedidos";

export {
  obtenerCostoEnvioPedido,
  obtenerDescuentoPedido,
  obtenerEstadoPagoPedido,
  obtenerMetodoPagoPedido,
  obtenerSubtotalPedido,
  obtenerTextoTipoEnvioPedido,
  obtenerTextoEstadoPago,
  obtenerTextoEstadoPedido,
  obtenerTextoMetodoPagoPedido,
  obtenerVarianteEstadoPago,
  obtenerVarianteEstadoPedido,
};

export const PRODUCTO_VACIO = {
  nombre: "",
  categoria: "",
  stock: 0,
  descripcion: "",
  precio: 0,
  imagenUrl: "",
  estado: "Activo",
  destacado: false,
};

export const CATEGORIAS_PRODUCTO = [
  "Tinturas Madres",
  "Esencias Aromaticas",
  "Hierbas Naturales",
  "Aceites",
];

const ESTADOS_PEDIDO = [
  "En espera de pago",
  "Preparando env\u00edo",
  "Despachado",
  "Entregado",
  "Cancelado",
];

const ESTADOS_PEDIDO_SIN_PAGO_APROBADO = [
  "En espera de pago",
  "Cancelado",
];

export const obtenerEstadosPedidoDisponibles = ({
  estadoActual,
  estadoPago,
} = {}) => {
  const estadosBase = estadoPago === "approved"
    ? ESTADOS_PEDIDO
    : ESTADOS_PEDIDO_SIN_PAGO_APROBADO;

  return Array.from(
    new Set([
      ...(estadoActual && estadosBase.includes(estadoActual) ? [estadoActual] : []),
      ...estadosBase,
    ]),
  );
};

export const obtenerEstadosPagoDisponibles = (pedido) =>
  obtenerMetodoPagoPedido(pedido) === "transferencia"
    ? ["pending", "approved", "rejected"]
    : [obtenerEstadoPagoPedido(pedido)];

export const obtenerEstadoPedidoSugerido = ({ estadoPago, estadoPedido }) => {
  if (estadoPago === "rejected") {
    return "Cancelado";
  }

  if (
    estadoPago !== "approved" &&
    !ESTADOS_PEDIDO_SIN_PAGO_APROBADO.includes(estadoPedido)
  ) {
    return "En espera de pago";
  }

  return estadoPedido || "En espera de pago";
};

export const pedidoCuentaComoGestion = (pedido) =>
  obtenerEstadoPagoPedido(pedido) === "approved" &&
  !["En espera de pago", "Entregado", "Cancelado"].includes(pedido?.estadoPedido);

export const pedidoEstaPendienteDePago = (pedido) =>
  obtenerEstadoPagoPedido(pedido) === "pending";

export const obtenerIdUsuario = (usuario) => usuario?._id || usuario?.uid;

export const obtenerVarianteEstadoUsuario = (estado) => {
  switch (estado) {
    case "Activo":
      return "success";
    case "Suspendido":
      return "warning";
    default:
      return "secondary";
  }
};
