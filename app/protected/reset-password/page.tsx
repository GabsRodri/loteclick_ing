import { resetPasswordAction } from "@/app/actions";
import { SubmitButton } from "@/app/components/submit-button";
import PasswordInput from "@/app/components/passwordInput";

export default async function ResetPassword(props: { searchParams: Promise<{ [key: string]: string }> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-12">
      <form
        action={resetPasswordAction}
        className="flex flex-col w-full max-w-sm gap-5 text-foreground px-4"
      >
        <div className="text-center">
          <h1 className="text-2xl text-primary font-semibold mb-1 dark:text-gray-100">Restablecer contraseña</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Por favor, ingresa tu nueva contraseña a continuación.
          </p>
        </div>

        <div className="flex flex-col">
          <label htmlFor="password" className="text-sm text-primary font-medium mb-2 dark:text-gray-100">
            Nueva contraseña
          </label>
          <PasswordInput placeholder="Escribe tu nueva contraseña" name="password" />
        </div>

        <div className="flex flex-col">
          <label htmlFor="confirmPassword" className="text-sm text-primary font-medium mb-2 dark:text-gray-100">
            Confirmar contraseña
          </label>
          <PasswordInput placeholder="Confirma tu nueva contraseña" name="confirmPassword" />
        </div>

        <SubmitButton pendingText="Restableciendo...">Restablecer contraseña</SubmitButton>

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
