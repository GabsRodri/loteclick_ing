// app/protected/ClientProtectedLayout.tsx
"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";

export default function ClientProtectedLayout({
  rol,
  children,
}: {
  rol: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const modulos = [
    {
      id: "financiero",
      nombre: "Financiero",
      rutas: [
        { nombre: "Finanzas", href: "/protected/moduloFinanzas" },
      ],
    },
    {
      id: "clientes",
      nombre: "Clientes",
      rutas: [
        { nombre: "Listado de clientes", href: "/protected/moduloClientes/clientes" },
        { nombre: "Contratos", href: "/protected/moduloClientes/contratos" },
        { nombre: "Pagos de los clientes", href: "/protected/moduloClientes/pagosClientes" },
        { nombre: "Ventas", href: "/protected/moduloClientes/ventas" },
      ],
    },
    {
      id: "maquinaria",
      nombre: "Maquinaria",
      rutas: [
        { nombre: "Inventario", href: "/protected/moduloMaquinaria/maquinaria" },
        { nombre: "Alquileres", href: "/protected/moduloMaquinaria/alquilerMaquinaria" },
      ],
    },
    {
      id: "proyectos",
      nombre: "Proyectos",
      rutas: [
        { nombre: "Lista de proyectos", href: "/protected/moduloProyectos/proyectos" },
        { nombre: "Lotes", href: "/protected/moduloProyectos/lotes" },
        { nombre: "Cronograma", href: "/protected/moduloProyectos/cronograma" },
        { nombre: "Entregables", href: "/protected/moduloProyectos/entregables" },
      ],
    },
    {
      id: "legal",
      nombre: "Gestión Legal",
      rutas: [
        { nombre: "Transacciones Legales", href: "/protected/moduloLegal/transaccionesLegales" },
      ],
      rolesPermitidos: ["admin", "supervisor"], // No visible para empleado
    },
    {
      id: "auditoria",
      nombre: "Auditoría",
      rutas: [
        { nombre: "Historial de Cambios", href: "/protected/auditoria" },
      ],
      rolesPermitidos: ["admin", "supervisor"],
    },
  ];

  return (
  <div className="flex h-screen">
    {/* Sidebar (Overlay en móvil, fijo en desktop) */}
    {sidebarOpen && (
      <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-background border-r text-muted-foreground p-4 overflow-y-auto dark:border-gray-700 md:static md:w-56 md:block">
        <nav className="space-y-2">
          <h2 className="mb-4 text-lg font-bold text-primary text-center dark:text-gray-100">Módulos</h2>
          {modulos.map((modulo) => {
            if (modulo.rolesPermitidos && !modulo.rolesPermitidos.includes(rol)) return null;
            return (
              <div key={modulo.id}>
                <button
                  className="w-full text-left font-semibold hover:text-foreground dark:text-gray-100 dark:hover:text-zinc-700"
                  onClick={() => toggleMenu(modulo.id)}
                >
                  {modulo.nombre}
                </button>
                {openMenus[modulo.id] && (
                  <div className="pl-1 mt-1 space-y-1 text-sm border-l-2 border-muted-foreground dark:border-gray-600 ml-2">
                    {modulo.rutas.map((ruta) => (
                      <Link
                        key={ruta.href}
                        href={ruta.href}
                        className="block pl-2 hover:underline text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-zinc-700"
                      >
                        {ruta.nombre}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    )}

    {/* Contenido principal */}
    <div className="flex-1 flex flex-col">
      <header className="p-4 border-b border-primary/40 flex justify-between items-center dark:border-gray-700">
        <button
          className="md:hidden bg-primary-foreground dark:text-gray-100 dark:bg-black dark:border-gray-700 dark:hover:bg-zinc-800"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menú"
        >
          <Menu className="text-primary" />
        </button>
        <h1 className="text-lg text-primary font-bold dark:text-gray-100">{rol}</h1>
      </header>
      <main className="p-4 overflow-y-auto flex-1">{children}</main>
    </div>
  </div>
);
}
