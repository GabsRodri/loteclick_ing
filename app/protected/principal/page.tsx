// app/protected/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { BookOpenIcon, TractorIcon, BookIcon, ShieldCheckIcon, FileTextIcon, CheckCircleIcon, ListTodoIcon, HelpCircleIcon, ClockIcon, CogIcon } from "lucide-react";
import Image from "next/image";

export default async function DashboardPage() {

  const supabase = await createClient();
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  const { data: existingUser, error: fetchError } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", userData.user?.id)
    .single();

  if (!existingUser) redirect("/sign-in");

  const role = existingUser?.rol

 return (
    <section className="w-full min-h-screen bg-gradient-to-br from-background to-muted/40 py-8 px-4 sm:px-6 lg:px-12">
      <div className="flex flex-col items-center text-center mb-8">
        {/* Logo fuera del cuadro */}
        <div className="flex-shrink-0">
          <Image
            src="/logo-claro.png"
            alt="Logo claro"
            width={150}
            height={150}
            className="dark:hidden"
            priority
          />
          <Image
            src="/logo-dark.png"
            alt="Logo oscuro"
            width={150}
            height={150}
            className="hidden dark:block"
            priority
          />
        </div>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-primary mb-2 dark:text-gray-100">
          ¡Bienvenido a LoteClick!
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground dark:text-gray-100">
          Estás autenticado como <span className="font-semibold text-foreground dark:text-gray-400">{role}</span>
        </p>
      </div>

      <div className="mt-10 grid gap-14 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
        {role === "admin" && (
          <>
            <Card title="Auditoría" link="/protected/auditoria" icon={<FileTextIcon className="w-12 h-8" />} />
            <Card title="Gestión legal" link="/protected/moduloLegal/transaccionesLegales" icon={<ShieldCheckIcon className="w-12 h-8" />} />
            <Card title="Proyectos" link="/protected/moduloProyectos/proyectos" icon={<FileTextIcon className="w-12 h-8" />} />
            <Card title="Capacitación" link="/protected/capacitacion" icon={<BookIcon className="w-12 h-8" />} />
          </>
        )}

        {role === "supervisor" && (
          <>
            <Card title="Revisión de lotes" link="/protected/moduloProyectos/lotes" icon={<ListTodoIcon className="w-12 h-8" />} />
            <Card title="Gestión legal" link="/protected/moduloLegal/transaccionesLegales" icon={<ShieldCheckIcon className="w-12 h-8" />} />
            <Card title="Maquinaria" link="/protected/moduloMaquinaria/maquinaria" icon={<TractorIcon className="w-12 h-8" />} />
            <Card title="Capacitación" link="/protected/capacitacion" icon={<BookOpenIcon className="w-12 h-8" />} />
          </>
        )}

        {role === "empleado" && (
          <>
            <Card title="Ventas" link="/protected/moduloClientes/ventas" icon={<CheckCircleIcon className="w-12 h-8" />} />
            <Card title="Lista de clientes" link="/protected/moduloClientes/clientes" icon={<ListTodoIcon className="w-12 h-8" />} />
            <Card title="Maquinaria en uso" link="/protected/moduloMaquinaria/alquilerMaquinaria" icon={<TractorIcon className="w-12 h-8" />} />
            <Card title="Capacitación" link="/protected/capacitacion" icon={<HelpCircleIcon className="w-12 h-8" />} />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center border-primary/40 text-sm text-muted-foreground dark:text-gray-400 border-t pt-4 dark:border-gray-700">
        <p>Contacto: contacto@loteclick.com | Tel: +57 300 123 4567</p>
        <p>© {new Date().getFullYear()} LoteClick. Todos los derechos reservados.</p>
      </footer>
    </section>
  );
}

function Card({ title, link, icon }: { title: string; link: string; icon: React.ReactNode }) {
  return (
    <a
      href={link}
      className="w-full max-w-xs p-6 rounded-2xl border border-primary/40 bg-card shadow-sm hover:shadow-md hover:border-primary transition text-left dark:border-gray-700 dark:hover:bg-zinc-800"
    >
      <div className="flex items-center gap-4 mb-3 text-primary dark:text-gray-100">
        {icon}
        <h2 className="text-lg font-semibold dark:text-gray-100">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground dark:text-gray-400">Ir a {title.toLowerCase()} →</p>
    </a>
  );
}
