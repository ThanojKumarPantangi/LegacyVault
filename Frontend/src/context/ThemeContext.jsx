import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("legacyvault-theme");
      if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
        return saved;
      }
    } catch (_err) {
      // Storage unavailable or disabled
    }
    return "dark"; // Default to dark for security vault aesthetic
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const isSystemDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const saved = typeof window !== "undefined" ? localStorage.getItem("legacyvault-theme") : "dark";
    if (saved === "system") return isSystemDark ? "dark" : "light";
    return saved || (isSystemDark ? "dark" : "light");
  });

  const applyTheme = useCallback((targetTheme) => {
    const isSystemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effectiveTheme = targetTheme === "system" ? (isSystemDark ? "dark" : "light") : targetTheme;
    setResolvedTheme(effectiveTheme);

    const root = document.documentElement;
    if (effectiveTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("legacyvault-theme", theme);
    } catch (_err) {
      // Storage unavailable or disabled
    }

    applyTheme(theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handler);
        return () => mediaQuery.removeListener(handler);
      }
    }
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      if (prev === "dark") return "light";
      return "dark";
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resolvedTheme, isDark: resolvedTheme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

