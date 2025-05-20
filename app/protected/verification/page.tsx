
import VerificationButton from "@/app/components/verification-button";


export default function VerificationPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-start bg-background text-center px-4 pt-24">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 dark:text-gray-100">¡Registro exitoso!</h1>
          <p className="text-gray-600 mb-6 dark:text-gray-400">
            Ya está verificado. Puedes darle al botón para continuar.
          </p>
          <VerificationButton />
        </div>
      );
    
}
