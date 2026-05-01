import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectorAdmin = ({ children }) => {
  const { user, token, loading, isAuthenticated } = useAuth();

  if (loading) return null;

  if (!isAuthenticated || !token || user?.rol !== "Administrador") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectorAdmin;
