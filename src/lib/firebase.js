import { getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
  getAuth,
  linkWithCredential,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const PROVIDER_METHOD_TO_KEY = {
  "google.com": "google",
};

const estaConfiguradoFirebaseCliente = () =>
  Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim(),
  );

const obtenerAppFirebase = () => {
  if (!estaConfiguradoFirebaseCliente()) {
    throw new Error(
      "Falta configurar Firebase en el frontend para usar Google.",
    );
  }

  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp(firebaseConfig);
};

const crearProveedor = (providerKey) => {
  switch (providerKey) {
    case "google": {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      return provider;
    }
    default:
      throw new Error("El proveedor social solicitado no es valido.");
  }
};

const obtenerClaveProveedorDesdeMetodo = (method) =>
  PROVIDER_METHOD_TO_KEY[String(method || "").trim()] || "";

const obtenerCredencialDesdeError = (providerKey, error) => {
  switch (providerKey) {
    case "google":
      return GoogleAuthProvider.credentialFromError(error);
    default:
      return null;
  }
};

const construirPayloadAutenticacionSocial = async ({
  auth,
  user,
  provider,
  requestedProvider = provider,
  linked = false,
}) => {
  const idToken = await user.getIdToken(true);

  await signOut(auth);

  return {
    idToken,
    email: user.email || "",
    displayName: user.displayName || "",
    provider,
    requestedProvider,
    linked,
  };
};

const resolverProveedorVinculacion = (methods, attemptedProviderKey) =>
  methods
    .map(obtenerClaveProveedorDesdeMetodo)
    .find((providerKey) => providerKey && providerKey !== attemptedProviderKey);

const vincularCuentasPorEmailExistente = async ({
  auth,
  attemptedProviderKey,
  error,
}) => {
  const email = String(error?.customData?.email || "").trim().toLowerCase();
  const pendingCredential =
    obtenerCredencialDesdeError(attemptedProviderKey, error) ||
    error?.credential ||
    null;

  if (!email || !pendingCredential) {
    throw error;
  }

  const signInMethods = await fetchSignInMethodsForEmail(auth, email);
  const existingProviderKey = resolverProveedorVinculacion(
    signInMethods,
    attemptedProviderKey,
  );

  if (!existingProviderKey) {
    throw new Error(
      "Ese email ya esta asociado a otro metodo de acceso. Inicia sesion primero con el metodo original para vincular la cuenta.",
    );
  }

  const existingProviderResult = await signInWithPopup(
    auth,
    crearProveedor(existingProviderKey),
  );

  const linkedResult = await linkWithCredential(
    existingProviderResult.user,
    pendingCredential,
  );

  return construirPayloadAutenticacionSocial({
    auth,
    user: linkedResult.user,
    provider: existingProviderKey,
    requestedProvider: attemptedProviderKey,
    linked: true,
  });
};

const normalizarErrorAutenticacionFirebase = (error) => {
  const code = String(error?.code || "");

  if (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request"
  ) {
    return "Cancelaste el inicio con la cuenta social.";
  }

  if (code === "auth/account-exists-with-different-credential") {
    return "Ese email ya esta asociado a otro metodo de acceso.";
  }

  return error?.message || "No se pudo iniciar la autenticacion social.";
};

export const autenticarConProveedorFirebase = async (providerKey) => {
  const auth = getAuth(obtenerAppFirebase());

  try {
    const provider = crearProveedor(providerKey);
    const result = await signInWithPopup(auth, provider);

    return construirPayloadAutenticacionSocial({
      auth,
      user: result.user,
      provider: providerKey,
    });
  } catch (error) {
    if (String(error?.code || "") === "auth/account-exists-with-different-credential") {
      try {
        return await vincularCuentasPorEmailExistente({
          auth,
          attemptedProviderKey: providerKey,
          error,
        });
      } catch (linkingError) {
        throw new Error(normalizarErrorAutenticacionFirebase(linkingError));
      }
    }

    throw new Error(normalizarErrorAutenticacionFirebase(error));
  }
};
