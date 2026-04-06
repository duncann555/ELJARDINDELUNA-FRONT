import {
  obtenerCostoEnvioPedido,
  obtenerSubtotalPedido,
  obtenerVarianteEstadoPago,
  obtenerVarianteEstadoPedido,
} from "../../helpers/pedidos";

export {
  obtenerCostoEnvioPedido,
  obtenerSubtotalPedido,
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
  oferta: false,
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

export const obtenerEstadosPedidoDisponibles = (pedido) => {
  const estadosBase =
    pedido?.pago?.estado === "approved"
      ? ESTADOS_PEDIDO
      : ESTADOS_PEDIDO_SIN_PAGO_APROBADO;

  return Array.from(
    new Set([
      ...(pedido?.estadoPedido ? [pedido.estadoPedido] : []),
      ...estadosBase,
    ]),
  );
};

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
