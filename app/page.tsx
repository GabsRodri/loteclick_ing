import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-8">
      {/* Contenido principal */}
      <div className="flex flex-col md:flex-row items-center mx-auto gap-8 max-w-6xl">
        {/* Logo fuera del cuadro */}
        <div className="flex-shrink-0">
          <Image
            src="/logo-claro.png"
            alt="Logo claro"
            width={224}
            height={224}
            className="dark:hidden"
          />
          <Image
            src="/logo-dark.png"
            alt="Logo oscuro"
            width={224}
            height={224}
            className="hidden dark:block"
          />
        </div>

        {/* Cuadros uno encima del otro */}
        <div className="flex flex-col gap-6 w-full">
          {/* Descripción */}
          <div className="bg-gray-100 dark:bg-gray-900 px-6 py-7 rounded-xl shadow-lg">
            <p className="text-lg text-primary/90 leading-relaxed dark:text-gray-100">
              Plataforma de gestión y trazabilidad para constructoras. Conecta información clave, asegura el acceso remoto y garantiza la seguridad de los datos mediante roles y segmentación.
            </p>
          </div>

          {/* Franja de confianza */}
          <div className="bg-primary text-background border border-primary-foreground dark:border-gray-700 dark:bg-black dark:text-gray-400 px-6 py-4 rounded-xl shadow-lg text-center">
            <p className="text-lg font-medium">
              Diseñado con enfoque en eficiencia, seguridad y crecimiento empresarial.
            </p>
          </div>
        </div>
      </div>

      {/* Beneficios */}
      <div className="border-t pt-4 mt-8 max-w-6xl mx-auto px-4 border-primary/60 dark:border-gray-700">
        <h2 className="text-5xl font-bold text-center text-primary dark:text-gray-100 mb-2 mt-3">Beneficios</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto text-center">
          <div className="bg-gray-200 dark:bg-gray-900 py-4 px-3 rounded-xl shadow">
            <h3 className="font-semibold text-lg text-primary dark:text-gray-100">Trazabilidad Total</h3>
            <p className="text-sm text-primary/90 dark:text-gray-300">Auditoría de cada acción realizada en la plataforma.</p>
          </div>
          <div className="bg-gray-200 dark:bg-gray-900 py-4 px-3 rounded-xl shadow">
            <h3 className="font-semibold text-lg text-primary dark:text-gray-100">Acceso Remoto</h3>
            <p className="text-sm text-primary/90 dark:text-gray-300">Disponible en la nube desde cualquier dispositivo.</p>
          </div>
          <div className="bg-gray-200 dark:bg-gray-900 py-4 px-3 rounded-xl shadow">
            <h3 className="font-semibold text-lg text-primary dark:text-gray-100">Seguridad por Roles</h3>
            <p className="text-sm text-primary/90 dark:text-gray-300">Acceso restringido por perfiles y permisos.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center border-primary/60 text-sm text-primary/90 dark:text-gray-400 border-t pt-4 dark:border-gray-700">
        <p>Contacto: contacto@loteclick.com | Tel: +57 300 123 4567</p>
        <p>© {new Date().getFullYear()} LoteClick. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
