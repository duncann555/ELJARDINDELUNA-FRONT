import { useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LOGOUT_EN_CURSO_KEY = "eljardinluna_logout_en_curso";

const ProtectorSesion = ({
  children,
  titulo = "Primero iniciá sesión",
  mensaje = "Necesitás una cuenta para continuar.",
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

    if (sessionStorage.getItem(LOGOUT_EN_CURSO_KEY) === "1") {
      navigate("/", {
        replace: true,
        state: { sesionCerrada: true },
      });
      return;
    }

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
