"use client"; 

import { forgotPasswordAction } from "@/app/actions";
import { SubmitButton } from "@/app/components/submit-button";
import Link from "next/link";
// Importar el hook para acceder a los searchParams
import { useSearchParams } from 'next/navigation';

export default function ForgotPassword(){
   const searchParams = useSearchParams();  // Obtener los parámetros de la URL

  const message = searchParams.get('message');  // Obtener el parámetro 'message'
  const error = searchParams.get('error');  // Obtener el parámetro 'error'
  const success = searchParams.get('success');  // Obtener el parámetro 'success'

  return (
   <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 mt-5 px-4">
    <div className="min-h-screen flex flex-col items-center pt-24">
      <form
        action={forgotPasswordAction}
        className="flex flex-col w-full max-w-sm gap-4 text-foreground px-4"
      >
        <div>
          <h1 className="text-2xl text-primary font-semibold mb-1 dark:text-gray-100">Restablecer contraseña</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <Link href="/sign-in" className="text-primary underline dark:text-gray-600">
              Inicia sesión
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <label htmlFor="email" className="text-sm text-primary font-medium dark:text-gray-100">
            Correo electrónico
          </label>
          <input
            type="email"
            name="email"
            placeholder="tucorreo@ejemplo.com"
            required
            className="border border-gray-300 rounded px-3 py-2 text-sm dark:border-zinc-700 dark:bg-black dark:focus:ring-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <SubmitButton pendingText="Restableciendo...">Restablecer contraseña</SubmitButton>

        {(error || message || success) && (
          <div className="mt-2 text-sm">
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
       </div>
  );
}
