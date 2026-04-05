import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { mostrarLoginRequeridoCarrito } from "../../helpers/carrito";

const ProtectorCarrito = ({ children }) => {
  const navigate = useNavigate();
  const { loading, token, isAuthenticated } = useAuth();
  const redireccionRealizadaRef = useRef(false);
  const tieneSesionActiva = Boolean(isAuthenticated && token);

  useEffect(() => {
    if (loading || tieneSesionActiva || redireccionRealizadaRef.current) {
      return;
    }

    redireccionRealizadaRef.current = true;
    void mostrarLoginRequeridoCarrito();
    navigate("/", { replace: true });
  }, [loading, navigate, tieneSesionActiva]);

  if (loading || !tieneSesionActiva) {
    return null;
  }

  return children;
};

export default ProtectorCarrito;
