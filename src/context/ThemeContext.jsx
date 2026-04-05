/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext();
const STORAGE_KEY = "eljardinluna_theme";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

const obtenerTemaInicial = () => {
  if (typeof window === "undefined") {
    return THEME_LIGHT;
  }

  const temaGuardado = window.localStorage.getItem(STORAGE_KEY);
  if (temaGuardado === THEME_DARK || temaGuardado === THEME_LIGHT) {
    return temaGuardado;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? THEME_DARK
    : THEME_LIGHT;
};

const aplicarTemaDocumento = (theme) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.setAttribute("data-bs-theme", theme);
  document.documentElement.style.colorScheme = theme;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(obtenerTemaInicial);

  useEffect(() => {
    aplicarTemaDocumento(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDarkMode: theme === THEME_DARK,
      setTheme,
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK,
        ),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  }

  return context;
};
