// app/components/PasswordInput.tsx
"use client";

import { useState } from "react";

interface PasswordInputProps {
  placeholder?: string;
  name?: string;  // Añadimos una prop para 'name'
}

export default function PasswordInput({ placeholder, name }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          name={name || "password"}  // Usamos el valor de 'name' o 'password' por defecto
          placeholder={placeholder || "Tu contraseña"}
          required
          className="border border-gray-300 rounded px-3 py-2 text-sm w-full dark:border-zinc-700 dark:bg-black focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-zinc-800"
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary dark:text-gray-400 px-2 py-1"
        >
          {showPassword ? "Ocultar" : "Ver"}
        </button>
      </div>
    </div>
  );
}
