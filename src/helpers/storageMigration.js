const LEGACY_LOCAL_KEYS = [
  "eljardinluna_auth_token",
  "eljardinluna_auth_user",
  "admin_token",
  "admin_user",
  "adminToken",
  "checkout_envio_el_jardin_de_luna",
  "ultimo_pedido_el_jardin_de_luna",
  "eljardinluna_theme",
];

const LEGACY_SESSION_KEYS = ["eljardinluna_logout_en_curso"];
const LEGACY_LOCAL_PREFIXES = [
  "eljardinluna_carrito:",
  "firebase:authUser:",
];

const removeKeys = (storage, keys) => {
  keys.forEach((key) => storage.removeItem(key));
};

export const clearLegacyBrowserStorage = () => {
  try {
    removeKeys(localStorage, LEGACY_LOCAL_KEYS);

    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (
        key &&
        LEGACY_LOCAL_PREFIXES.some((prefix) => key.startsWith(prefix))
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Algunos navegadores bloquean el storage; la aplicación puede continuar.
  }

  try {
    removeKeys(sessionStorage, LEGACY_SESSION_KEYS);
  } catch {
    // Algunos navegadores bloquean el storage; la aplicación puede continuar.
  }

  try {
    indexedDB?.deleteDatabase("firebaseLocalStorageDb");
  } catch {
    // La base pertenecía a la autenticación pública eliminada.
  }
};
