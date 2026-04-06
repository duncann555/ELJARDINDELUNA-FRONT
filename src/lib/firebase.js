import { getApps, initializeApp } from "firebase/app";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const isFirebaseClientConfigured = () =>
  Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim(),
  );

const getFirebaseApp = () => {
  if (!isFirebaseClientConfigured()) {
    throw new Error(
      "Falta configurar Firebase en el frontend para usar Google o Facebook.",
    );
  }

  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp(firebaseConfig);
};

const createProvider = (providerKey) => {
  switch (providerKey) {
    case "google": {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      return provider;
    }
    case "facebook": {
      const provider = new FacebookAuthProvider();
      provider.addScope("email");
      provider.setCustomParameters({ display: "popup" });
      return provider;
    }
    default:
      throw new Error("El proveedor social solicitado no es valido.");
  }
};

const normalizeFirebaseAuthError = (error) => {
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
  try {
    const auth = getAuth(getFirebaseApp());
    const provider = createProvider(providerKey);
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();

    await signOut(auth);

    return {
      idToken,
      email: result.user.email || "",
      displayName: result.user.displayName || "",
    };
  } catch (error) {
    throw new Error(normalizeFirebaseAuthError(error));
  }
};
