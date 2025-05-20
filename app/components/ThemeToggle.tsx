"use client";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("modoOscuro");
    const isDark = stored === "activado";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove("dark");
      localStorage.setItem("modoOscuro", "desactivado");
      setDarkMode(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("modoOscuro", "activado");
      setDarkMode(true);
    }
  };

  // No renderizar hasta saber si está activado el modo oscuro o no
  if (darkMode === null) return null;

  return (
    <button
      onClick={toggleTheme}
      className="text-xl transition hover:scale-110"
      aria-label="Cambiar modo de tema"
    >
      {darkMode ? "🔆" : "🌙"}
    </button>
  );
}
