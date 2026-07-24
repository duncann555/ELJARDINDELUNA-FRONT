/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest } from "../helpers/api";

const AuthContext = createContext(null);
const ADMIN_TOKEN_KEY = "eljardinluna_admin_token";

const leerToken = () => {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

const guardarToken = (token) => {
  try {
    if (token) {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch {
    // La sesión sigue funcionando en memoria si el navegador bloquea el storage.
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(leerToken);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(Boolean(leerToken()));

  const logout = useCallback(() => {
    guardarToken("");
    setToken("");
    setAdmin(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!token || admin) return undefined;

    const controller = new AbortController();

    const validarSesion = async () => {
      try {
        const data = await apiRequest("/admin/sesion", {
          token,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setAdmin(data?.admin || null);
        }
      } catch (error) {
        if (error?.name !== "AbortError" && !controller.signal.aborted) {
          logout();
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void validarSesion();
    return () => controller.abort();
  }, [admin, logout, token]);

  const login = useCallback(async ({ email, password }) => {
    const data = await apiRequest("/admin/login", {
      method: "POST",
      json: { email: String(email || "").trim(), password },
    });
    const nextToken = String(data?.token || "");

    if (!nextToken || !data?.admin) {
      throw new Error("La API no devolvió una sesión de administración válida.");
    }

    guardarToken(nextToken);
    setToken(nextToken);
    setAdmin(data.admin);
    setLoading(false);

    return { token: nextToken, admin: data.admin };
  }, []);

  const value = useMemo(
    () => ({
      token,
      admin,
      login,
      logout,
      isAuthenticated: Boolean(token && admin),
      loading,
    }),
    [admin, loading, login, logout, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
