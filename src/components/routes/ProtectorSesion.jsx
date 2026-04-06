import { useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectorSesion = ({
  children,
  titulo = "Primero inicia sesion",
  mensaje = "Necesitas una cuenta activa para continuar.",
}) => {
  const navigate = useNavigate();
  const { loading, token, isAuthenticated } = useAuth();
  const redireccionRealizadaRef = useRef(false);
  const tieneSesionActiva = Boolean(isAuthenticated && token);

  useEffect(() => {
    if (loading || tieneSesionActiva || redireccionRealizadaRef.current) {
      return;
    }

    redireccionRealizadaRef.current = true;

    void Swal.fire({
      icon: "info",
      title: titulo,
      text: mensaje,
      confirmButtonText: "Entendido",
    });

    navigate("/", { replace: true });
  }, [loading, mensaje, navigate, tieneSesionActiva, titulo]);

  if (loading || !tieneSesionActiva) {
    return null;
  }

  return children;
};

export default ProtectorSesion;
