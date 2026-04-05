import Swal from "sweetalert2";

export const mostrarLoginRequeridoCarrito = () =>
  Swal.fire({
    icon: "info",
    title: "Hey! Primero inicia sesion",
    text:
      "Para agregar productos al carrito necesitas estar logueado. Inicia sesion o crea tu cuenta para seguir comprando.",
    confirmButtonText: "Entendido",
  });
