import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";

const validateProductionApiUrl = (value) => {
  const rawUrl = String(value || "").trim();

  if (!rawUrl) {
    throw new Error(
      "Falta VITE_API_URL. Configurá la URL pública de la API antes del build de producción.",
    );
  }

  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("VITE_API_URL debe ser una URL absoluta válida.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("VITE_API_URL debe usar el protocolo HTTP o HTTPS.");
  }

  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !isLocalhost) {
    throw new Error("VITE_API_URL debe usar HTTPS fuera de localhost.");
  }
};

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");

  if (mode === "production") {
    validateProductionApiUrl(environment.VITE_API_URL);
  }

  return {
    plugins: [react()],
  };
});
