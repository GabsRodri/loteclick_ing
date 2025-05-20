"use client";
import { useEffect, useState } from "react";

export function OnlineGuard({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [hydrated, setHydrated] = useState(false); // Para evitar render anticipado

  useEffect(() => {
    setHydrated(true);
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    updateOnlineStatus(); // Estado inicial

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  if (!hydrated) return null; // Espera a montar en cliente

  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 text-center p-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Sin conexión a Internet</h1>
          <p>Por favor verifica tu conexión para continuar usando LoteClick.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
