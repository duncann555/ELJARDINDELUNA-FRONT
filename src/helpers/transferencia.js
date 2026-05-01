import { formatCurrency } from "./app";
import { CONTACTO_WHATSAPP_NUMBER } from "./contact";

export const DATOS_TRANSFERENCIA = {
  alias: import.meta.env.VITE_TRANSFER_ALIAS || "ELJARDINDELUNA",
  titular: import.meta.env.VITE_TRANSFER_TITULAR || "Nombre del titular",
  banco: import.meta.env.VITE_TRANSFER_BANCO || "Mercado Pago / Banco X",
  cuit: import.meta.env.VITE_TRANSFER_CUIT || "XX-XXXXXXXX-X",
};

export const obtenerNumeroPedidoVisible = (pedidoId) =>
  `#${String(pedidoId || "").slice(-6).toUpperCase()}`;

export const construirMensajeWhatsAppTransferencia = ({ pedidoId, total }) =>
  [
    "Hola, hice una compra en El Jardin de Luna.",
    `Pedido: ${obtenerNumeroPedidoVisible(pedidoId)}`,
    `Total transferido: ${formatCurrency(total)}`,
    "Adjunto comprobante.",
  ].join("\n");

export const construirUrlWhatsAppTransferencia = ({ pedidoId, total }) =>
  `https://wa.me/${CONTACTO_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    construirMensajeWhatsAppTransferencia({ pedidoId, total }),
  )}`;
