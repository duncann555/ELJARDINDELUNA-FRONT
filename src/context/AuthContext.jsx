/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import {
  API_URL,
  getApiErrorMessage,
  getJwtPayload,
  isTokenExpired,
  normalizeToken,
  safeJson,
} from "../helpers/app";

const AuthContext = createContext();

const ADMIN_ROLE = "Administrador";
const AUTH_MODE = {
  NONE: "none",
  USER: "user",
  ADMIN: "admin",
};

const STORAGE_KEYS = {
  authToken: "eljardinluna_auth_token",
  authUser: "eljardinluna_auth_user",
  adminToken: "eljardinluna_admin_token",
  adminUser: "eljardinluna_admin_user",
};

const leerJson = (storageKey) => {
  try {
    const rawValue = localStorage.getItem(storageKey);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
};

const normalizarUsuario = (userData) => {
  const source = userData && typeof userData === "object" ? userData : {};

  return {
    uid: source.uid || source._id || "",
    nombre: source.nombre || "",
    apellido: source.apellido || "",
    email: source.email || "",
    telefono: source.telefono || "",
    rol: source.rol || "Usuario",
    carrito: Array.isArray(source.carrito) ? source.carrito : [],
  };
};

const limpiarPersistenciaCompleta = () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
};

const persistirSesion = (user, token) => {
  localStorage.setItem(STORAGE_KEYS.authToken, token);
  localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(user));
};

const leerSesionPersistida = () => {
  const user = normalizarUsuario(leerJson(STORAGE_KEYS.authUser));
  const token = normalizeToken(localStorage.getItem(STORAGE_KEYS.authToken));

  if (!user?.uid || !token || isTokenExpired(token)) {
    return null;
  }

  return { user, token };
};

const crearErrorAuth = (message) => {
  const error = new Error(message);
  error.isAuthError = true;
  return error;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  const limpiarSesionLocal = () => {
    setUser(null);
    setToken("");
    limpiarPersistenciaCompleta();
  };

  const aplicarSesion = (nextUser, nextToken) => {
    const normalizedUser = normalizarUsuario(nextUser);
    const normalizedToken = normalizeToken(nextToken);

    if (!normalizedUser?.uid || !normalizedToken) {
      throw crearErrorAuth("No se pudo recuperar una sesion valida.");
    }

    setUser(normalizedUser);
    setToken(normalizedToken);
    persistirSesion(normalizedUser, normalizedToken);
  };

  useEffect(() => {
    const session = leerSesionPersistida();

    if (session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      aplicarSesion(session.user, session.token);
    } else {
      limpiarPersistenciaCompleta();
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const normalizedToken = normalizeToken(token);

    if (!normalizedToken) {
      return undefined;
    }

    if (isTokenExpired(normalizedToken)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      limpiarSesionLocal();
      return undefined;
    }

    const payload = getJwtPayload(normalizedToken);

    if (!payload?.exp) {
      return undefined;
    }

    const refreshDelay = Math.max(payload.exp * 1000 - Date.now() - 30_000, 0);
    const timeoutId = window.setTimeout(() => {
      limpiarSesionLocal();
    }, refreshDelay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [token]);

  const loginConEmailYPassword = async (email, password) => {
    limpiarPersistenciaCompleta();

    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      throw crearErrorAuth(getApiErrorMessage(data, "Error al iniciar sesion."));
    }

    const loggedUser = normalizarUsuario(data?.usuario || data);
    const loggedToken = normalizeToken(data?.token);

    aplicarSesion(loggedUser, loggedToken);

    return {
      user: loggedUser,
      token: loggedToken,
      destination: loggedUser.rol === ADMIN_ROLE ? "/admin" : "/",
    };
  };

  const registrarUsuario = async (payload) => {
    limpiarPersistenciaCompleta();

    const response = await fetch(`${API_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      throw crearErrorAuth(getApiErrorMessage(data, "No se pudo crear la cuenta."));
    }

    const createdUser = normalizarUsuario(data?.usuario || data);
    const createdToken = normalizeToken(data?.token);

    aplicarSesion(createdUser, createdToken);

    return {
      user: createdUser,
      token: createdToken,
      destination: createdUser.rol === ADMIN_ROLE ? "/admin" : "/",
    };
  };

  const solicitarRecuperacionPassword = async (email) => {
    const response = await fetch(`${API_URL}/usuarios/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      throw crearErrorAuth(
        getApiErrorMessage(
          data,
          "No se pudo iniciar la recuperacion de contrasena.",
        ),
      );
    }

    return data || {
      mensaje:
        "Si el email existe, te enviaremos un enlace para restablecer tu contrasena.",
    };
  };

  const restablecerPassword = async (tokenValue, password) => {
    const response = await fetch(`${API_URL}/usuarios/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenValue, password }),
    });

    const data = await safeJson(response);

    if (!response.ok) {
      throw crearErrorAuth(
        getApiErrorMessage(data, "No se pudo restablecer la contrasena."),
      );
    }

    return data || {
      mensaje: "La contrasena se actualizo correctamente",
    };
  };

  const logout = async () => {
    limpiarSesionLocal();
  };

  const authMode = user?.rol === ADMIN_ROLE ? AUTH_MODE.ADMIN : AUTH_MODE.USER;
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authMode,
        loginConEmailYPassword,
        loginAdmin: loginConEmailYPassword,
        registrarUsuario,
        solicitarRecuperacionPassword,
        restablecerPassword,
        logout,
        isAuthenticated,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
