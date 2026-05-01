import { formatCurrency } from "./app";
import { CONTACTO_WHATSAPP_NUMBER } from "./contact";

export const DATOS_TRANSFERENCIA = {
  alias: import.meta.env.VITE_TRANSFER_ALIAS || "ELJARDINDELUNA",
  titular: import.meta.env.VITE_TRANSFER_TITULAR || "SEBASTIAN FLOMENBAUN",
  banco: import.meta.env.VITE_TRANSFER_BANCO || "BANCO GALICIA",
  cuit: import.meta.env.VITE_TRANSFER_CUIT || "20-37309602-5",
};

export const obtenerNumeroPedidoVisible = (pedidoId) =>
  `#${String(pedidoId || "").slice(-6).toUpperCase()}`;

export const construirMensajeWhatsAppTransferencia = ({ pedidoId, total }) =>
  [
    "Hola, hice una compra en El Jardín de Luna.",
    `Pedido: ${obtenerNumeroPedidoVisible(pedidoId)}`,
    `Total transferido: ${formatCurrency(total)}`,
    "Adjunto comprobante.",
  ].join("\n");

export const construirUrlWhatsAppTransferencia = ({ pedidoId, total }) =>
  `https://wa.me/${CONTACTO_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    construirMensajeWhatsAppTransferencia({ pedidoId, total }),
  )}`;
