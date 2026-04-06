/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import {
  getApiErrorMessage,
  getJwtPayload,
  isTokenExpired,
  normalizeToken,
} from "../helpers/app";
import { solicitarApi } from "../helpers/clienteApi";

const AuthContext = createContext();

const ADMIN_ROLE = "Administrador";

const STORAGE_KEYS = {
  authToken: "eljardinluna_auth_token",
  authUser: "eljardinluna_auth_user",
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
    estado: source.estado || "Activo",
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

    const { respuesta, datos } = await solicitarApi("/usuarios/iniciar-sesion", {
      method: "POST",
      json: { email, password },
    });

    if (!respuesta.ok) {
      throw crearErrorAuth(
        getApiErrorMessage(datos, "Error al iniciar sesion."),
      );
    }

    const loggedUser = normalizarUsuario(datos?.usuario || datos);
    const loggedToken = normalizeToken(datos?.token);

    aplicarSesion(loggedUser, loggedToken);

    return {
      user: loggedUser,
      token: loggedToken,
      destination: loggedUser.rol === ADMIN_ROLE ? "/admin" : "/",
    };
  };

  const loginConFirebaseSocial = async ({ provider, idToken, telefono = "" }) => {
    limpiarPersistenciaCompleta();

    const payload = {
      provider,
      idToken,
    };

    if (String(telefono || "").trim()) {
      payload.telefono = String(telefono).replace(/\D/g, "");
    }

    const { respuesta, datos } = await solicitarApi(
      "/usuarios/iniciar-sesion-social",
      {
      method: "POST",
      json: payload,
      },
    );

    if (respuesta.status === 428 || datos?.requiereTelefono) {
      return {
        requiresPhone: true,
        message:
          getApiErrorMessage(
            datos,
            "Necesitamos tu numero de WhatsApp para completar el acceso.",
          ),
        profile: datos?.perfil || {},
      };
    }

    if (!respuesta.ok) {
      throw crearErrorAuth(
        getApiErrorMessage(
          datos,
          "No se pudo completar el acceso con tu cuenta social.",
        ),
      );
    }

    const loggedUser = normalizarUsuario(datos?.usuario || datos);
    const loggedToken = normalizeToken(datos?.token);

    aplicarSesion(loggedUser, loggedToken);

    return {
      user: loggedUser,
      token: loggedToken,
      destination: loggedUser.rol === ADMIN_ROLE ? "/admin" : "/",
    };
  };

  const registrarUsuario = async (payload) => {
    limpiarPersistenciaCompleta();

    const { respuesta, datos } = await solicitarApi("/usuarios", {
      method: "POST",
      json: payload,
    });

    if (!respuesta.ok) {
      throw crearErrorAuth(
        getApiErrorMessage(datos, "No se pudo crear la cuenta."),
      );
    }

    const createdUser = normalizarUsuario(datos?.usuario || datos);
    const createdToken = normalizeToken(datos?.token);

    aplicarSesion(createdUser, createdToken);

    return {
      user: createdUser,
      token: createdToken,
      destination: createdUser.rol === ADMIN_ROLE ? "/admin" : "/",
    };
  };

  const solicitarRecuperacionPassword = async (email) => {
    const { respuesta, datos } = await solicitarApi(
      "/usuarios/recuperar-password",
      {
      method: "POST",
      json: { email },
      },
    );

    if (!respuesta.ok) {
      throw crearErrorAuth(
        getApiErrorMessage(
          datos,
          "No se pudo iniciar la recuperacion de contrasena.",
        ),
      );
    }

    return datos || {
      mensaje:
        "Si el email existe, te enviaremos un enlace para restablecer tu contrasena.",
    };
  };

  const restablecerPassword = async (tokenValue, password) => {
    const { respuesta, datos } = await solicitarApi(
      "/usuarios/restablecer-password",
      {
      method: "POST",
      json: { token: tokenValue, password },
      },
    );

    if (!respuesta.ok) {
      throw crearErrorAuth(
        getApiErrorMessage(datos, "No se pudo restablecer la contrasena."),
      );
    }

    return datos || {
      mensaje: "La contrasena se actualizo correctamente",
    };
  };

  const logout = async () => {
    limpiarSesionLocal();
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginConEmailYPassword,
        loginConFirebaseSocial,
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
