export default function UnauthorizedPage() {
  return (
    <main className="w-full h-screen bg-red-50 dark:bg-red-950 flex items-start justify-center pt-24">
      <div className="max-w-md text-center px-6 py-8 bg-background rounded-2xl shadow-lg border border-red-200 dark:border-red-800">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
          Acceso denegado
        </h1>
        <p className="text-base text-gray-700 dark:text-gray-300">
          No tienes permiso para acceder a esta página.
        </p>
      </div>
    </main>
  );
}