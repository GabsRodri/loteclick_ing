"use client";

import { signInAction } from "@/app/actions";
import { SubmitButton } from "@/app/components/submit-button";
import Link from "next/link";
import PasswordInput from "@/app/components/passwordInput";
import { useSearchParams } from "next/navigation";

export default function SignIn (){
  const searchParams = useSearchParams();  // Usa el hook para obtener los parámetros

  const message = searchParams.get('message');  // Obtén el valor de 'message'
  const error = searchParams.get('error');      // Obtén el valor de 'error'
  const success = searchParams.get('success');  // Obtén el valor de 'success'

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-24">
      <h1 className="text-2xl text-primary font-semibold mb-1 dark:text-gray-100">Iniciar sesión</h1>
      <form
        action={signInAction}
        className="flex flex-col w-full max-w-sm gap-5 text-foreground px-4 dark:text-gray-100"
      >
        <div className="text-center">
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¿No tienes cuenta?{" "}
            <Link href="/sign-up" className="text-primary underline dark:text-gray-600">
              Regístrate
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-primary font-medium dark:text-gray-100">
            Correo electrónico
          </label>
          <input
           id="email"
            type="email"
            name="email"
            placeholder="tucorreo@ejemplo.com"
            required
            autoComplete="email" 
            className="border border-gray-300 dark:border-zinc-700 dark:bg-black rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-zinc-800"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-sm text-primary font-medium dark:text-gray-100">
              Contraseña
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary underline ml-2 dark:text-gray-600"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <PasswordInput /> {/* 👈 aquí usas el nuevo componente */}
        </div>

        <SubmitButton pendingText="Iniciando...">Iniciar sesión</SubmitButton>

        {(error || message || success) && (
          <div className="mt-1 text-sm">
            {success && (
              <div className="text-green-600 border-l-2 border-green-600 pl-2">
                {success}
              </div>
            )}
            {error && (
              <div className="text-red-600 border-l-2 border-red-600 pl-2">
                {error}
              </div>
            )}
            {message && (
              <div className="text-gray-800 border-l-2 border-gray-400 pl-2">
                {message}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
