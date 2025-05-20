import { signUpAction } from "@/app/actions";
import { SubmitButton } from "@/app/components/submit-button";
import Link from "next/link";
import PasswordInput from "@/app/components/passwordInput";

export default async function Signup(props: { searchParams: Promise<{ [key: string]: string }> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-24">
      <form
        action={signUpAction}
        className="flex flex-col w-full max-w-sm gap-5 text-foreground px-4"
      >
        <div className="text-center">
          <h1 className="text-2xl text-primary font-semibold mb-1 dark:text-gray-100">Regístrate</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <Link href="/sign-in" className="text-primary underline dark:text-gray-600">
              Inicia sesión
            </Link>
          </p>
        </div>

        <div className="flex flex-col gap-1">
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
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-sm text-primary font-medium dark:text-gray-100">
              Contraseña
            </label>
          </div>
        <PasswordInput /> {/* 👈 aquí usas el nuevo componente */}
        </div>

        <SubmitButton pendingText="Registrando...">Regístrate</SubmitButton>

        {(searchParams?.error || searchParams?.message || searchParams?.success) && (
          <div className="mt-2 text-sm">
            {searchParams?.success && (
              <div className="text-green-600 border-l-2 border-green-600 pl-2">
                {searchParams.success}
              </div>
            )}
            {searchParams?.error && (
              <div className="text-red-600 border-l-2 border-red-600 pl-2">
                {searchParams.error}
              </div>
            )}
            {searchParams?.message && (
              <div className="text-gray-800 border-l-2 border-gray-400 pl-2">
                {searchParams.message}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
