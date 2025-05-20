"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react"; // icono de carga

export default function VerificationButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        console.error("No se pudo obtener el usuario");
        return;
      }

      const userId = userData.user.id;

      const { data: existingUser, error: fetchError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error al obtener usuario:", fetchError.message);
        return;
      }

      if (!existingUser) {
        const { error: insertError } = await supabase.from("usuarios").insert({
          id: userId,
          correo: userData.user.email,
          rol: "empleado",
        });

        if (insertError) {
          console.error("Error al insertar usuario:", insertError.message);
          return;
        }
      }

      const rol = existingUser?.rol ?? "empleado";

      if(!rol){
        window.location.href = "/sign-in";
      } else {
        window.location.href = "/protected/principal";
      }

    } catch (error) {
      console.error("Error al manejar el usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`mt-4 px-6 py-3 rounded-2xl bg-primary border border-primary-foreground text-primary-foreground dark:text-gray-100 dark:bg-black dark:hover:bg-zinc-800 dark:border-gray-700 font-semibold shadow-md hover:bg-primary/90 transition-colors duration-300 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin h-5 w-5" />
          Cargando...
        </>
      ) : (
        <>
          Continuar
        </>
      )}
    </button>
  );
}
