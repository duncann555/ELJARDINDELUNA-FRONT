import Swal from "sweetalert2";

export const mostrarLoginRequeridoCarrito = () =>
  Swal.fire({
    icon: "info",
    title: "Primero iniciá sesión",
    text:
      "Para agregar productos al carrito necesitás estar logueado. Iniciá sesión o creá tu cuenta para seguir comprando.",
    confirmButtonText: "Entendido",
  });
