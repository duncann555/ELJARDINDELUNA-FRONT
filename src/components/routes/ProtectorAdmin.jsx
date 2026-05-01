import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isTokenExpired } from "../../helpers/app";
import { solicitarApi } from "../../helpers/clienteApi";

const ProtectorAdmin = ({ children }) => {
  const { user, token, loading, isAuthenticated, logout } = useAuth();
  const [validandoAdmin, setValidandoAdmin] = useState(true);
  const [tokenAdminValido, setTokenAdminValido] = useState(false);

  useEffect(() => {
    let desmontado = false;

    const validarTokenAdmin = async () => {
      if (
        loading ||
        !isAuthenticated ||
        !token ||
        user?.rol !== "Administrador" ||
        isTokenExpired(token)
      ) {
        if (!desmontado) {
          setTokenAdminValido(false);
          setValidandoAdmin(false);
        }
        return;
      }

      try {
        setValidandoAdmin(true);

        const { respuesta } = await solicitarApi("/usuarios/admin/validar-token", {
          method: "GET",
          token,
        });

        if (!respuesta.ok) {
          await logout();
          if (!desmontado) {
            setTokenAdminValido(false);
          }
          return;
        }

        if (!desmontado) {
          setTokenAdminValido(true);
        }
      } catch (error) {
        console.error("No se pudo validar la sesion admin:", error);
        await logout();
        if (!desmontado) {
          setTokenAdminValido(false);
        }
      } finally {
        if (!desmontado) {
          setValidandoAdmin(false);
        }
      }
    };

    void validarTokenAdmin();

    return () => {
      desmontado = true;
    };
  }, [isAuthenticated, loading, logout, token, user?.rol]);

  if (loading || validandoAdmin) return null;

  if (!isAuthenticated || !token || user?.rol !== "Administrador" || !tokenAdminValido) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectorAdmin;
