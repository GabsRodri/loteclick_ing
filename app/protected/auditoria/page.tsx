"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";

// Definir el tipo de los datos de auditoría
interface Auditoria {
  id: string;
  usuario_email: string;
  operacion: string;
  tabla: string;
  datos_antes: string;
  datos_despues: string;
  fecha: string;
}

export default function AdminDashboard() {
  const supabase = createClient();

  const [auditoriaData, setAuditoriaData] = useState<Auditoria[]>([]);
  const [filters, setFilters] = useState({
    usuario: "",
    operacion: "",
    tabla: "",
    fecha: "",
  });
  const [filteredAuditoriaData, setFilteredAuditoriaData] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true); // Estado para controlar la carga de datos
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const [itemsPerPage, setItemsPerPage] = useState(10); // Elementos por página
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        console.error("No se pudo obtener el usuario");
        return;
      }

      const { data: userInfo, error: userInfoError } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", userData.user.id)
        .single();

      if (userInfoError || userInfo?.rol !== "admin") {
        redirect("/unauthorized");
        return;
      }

      const { data: auditoriaData, error: auditoriaError } = await supabase
        .from("auditoria")
        .select("*")
        .order('fecha', { ascending: false });

      if (auditoriaError) {
        console.error("Error al obtener los datos de auditoría", auditoriaError);
        return;
      }

      setAuditoriaData(auditoriaData || []);
      setFilteredAuditoriaData(auditoriaData || []);
      setLoading(false); // Datos cargados, cambiamos el estado de carga
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = auditoriaData;

    if (filters.usuario) {
      filtered = filtered.filter((item) =>
        item.usuario_email.toLowerCase().includes(filters.usuario.toLowerCase())
      );
    }

    if (filters.operacion) {
      filtered = filtered.filter((item) =>
        item.operacion.toLowerCase().includes(filters.operacion.toLowerCase())
      );
    }

    if (filters.tabla) {
      filtered = filtered.filter((item) =>
        item.tabla.toLowerCase().includes(filters.tabla.toLowerCase())
      );
    }

    if (filters.fecha) {
      const filterDate = filters.fecha; // YYYY-MM-DD

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.fecha).toLocaleDateString('en-CA');
        return itemDate === filterDate;
      });
    }


    setFilteredAuditoriaData(filtered);
  }, [filters, auditoriaData]);

  useEffect(() => {
    if (mensaje) {
      const timeout = setTimeout(() => setMensaje(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [mensaje]);

  // Función para obtener los datos de la página actual
  const paginateData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAuditoriaData.slice(startIndex, endIndex);
  };

  // Cambiar de página
  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatJson = (jsonData: any) => {
    if (typeof jsonData === "string") {
      try {
        const parsedData = JSON.parse(jsonData);
        return Object.entries(parsedData).map(([key, value]) => (
          <div key={key}>
            <strong>{key}:</strong> {value === null ? "-" : String(value)}
          </div>
        ));
      } catch (e) {
        return <div>{jsonData}</div>;
      }
    } else if (jsonData && typeof jsonData === "object") {
      return Object.entries(jsonData).map(([key, value]) => (
        <div key={key}>
          <strong>{key}:</strong> {value === null ? "-" : String(value)}
        </div>
      ));
    } else {
      return <div>{jsonData === null ? "-" : String(jsonData)}</div>;
    }
  };

const handleRestore = async (auditoria: Auditoria) => {
  if (!auditoria.datos_antes) {
    setMensaje({ tipo: "error", texto: "No hay datos disponibles para restaurar." });
    return;
  }

  const parsedData = typeof auditoria.datos_antes === "string"
    ? JSON.parse(auditoria.datos_antes)
    : auditoria.datos_antes;

  const id = parsedData.id;
  const tabla = auditoria.tabla;

  // Restaurar eliminado: false
  const { error: updateError } = await supabase
    .from(tabla)
    .update({ eliminado: false })
    .eq("id", id);

  if (updateError) {
    console.error("Error al restaurar:", updateError);
    setMensaje({ tipo: "error", texto: "Error al restaurar el registro." });
    return;
  }

  // Eliminar el registro de auditoría original
  const { error: deleteError } = await supabase
    .from("auditoria")
    .delete()
    .eq("id", auditoria.id);

  if (deleteError) {
    console.error("Error al eliminar auditoría:", deleteError);
    setMensaje({ tipo: "error", texto: "Registro restaurado, pero no se eliminó de la auditoría." });
  }

  // Recargar los datos de auditoría
  const { data: updatedAuditoria, error: fetchError } = await supabase
    .from("auditoria")
    .select("*")
    .order("fecha", { ascending: false });

  if (fetchError) {
    console.error("Error al recargar auditoría:", fetchError);
    setMensaje({ tipo: "error", texto: "Registro restaurado, pero no se actualizaron los datos." });
    return;
  }

  // Actualizar el estado
  setAuditoriaData(updatedAuditoria || []);
  setFilteredAuditoriaData(updatedAuditoria || []);

  setMensaje({ tipo: "success", texto: "Registro restaurado correctamente." });
};

  // Páginas totales
  const totalPages = Math.ceil(filteredAuditoriaData.length / itemsPerPage);

  return (
  <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 mt-5 px-4">
    {/* Notificación */}
    {mensaje && (
      <div
        className={`col-span-full p-3 text-sm rounded-md text-background ${mensaje.tipo === "success" ? "bg-green-600 dark:bg-green-950" : "bg-red-600 dark:bg-red-950"}`}
      >
        {mensaje.texto}
      </div>
    )}

    {/* Panel izquierdo */}
    <div className="p-6 border rounded-lg shadow-md bg-background space-y-4 w-full max-w-sm dark:border-gray-700">
      <h2 className="text-xl font-semibold text-primary dark:text-gray-100">Historial de Cambios</h2>

      {/* Filtros */}
      <div className="border p-3 rounded-md grid sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-background shadow-sm dark:border-gray-700">
        <div>
          <label className="block mb-1 font-medium text-sm dark:text-gray-100">Usuario</label>
          <input
            type="text"
            placeholder="Filtrar por usuario"
            value={filters.usuario}
            onChange={(e) => setFilters({ ...filters, usuario: e.target.value })}
            className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-sm dark:text-gray-100">Operación</label>
          <input
            type="text"
            placeholder="Filtrar por operación"
            value={filters.operacion}
            onChange={(e) => setFilters({ ...filters, operacion: e.target.value })}
            className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-sm dark:text-gray-100">Tabla</label>
          <input
            type="text"
            placeholder="Filtrar por tabla"
            value={filters.tabla}
            onChange={(e) => setFilters({ ...filters, tabla: e.target.value })}
            className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-sm dark:text-gray-100">Fecha</label>
          <input
            type="date"
            value={filters.fecha}
            onChange={(e) => setFilters({ ...filters, fecha: e.target.value })}
            className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
          />
        </div>
      </div>

      {/* Mostrar los datos */}
      {loading ? (
        <p className="text-left mt-4 text-gray-500 dark:text-gray-400">Cargando datos...</p>
      ) : filteredAuditoriaData.length > 0 ? (
        <div className="overflow-x-auto mt-4">
          <table className="scrollable w-full border text-sm bg-background shadow-lg rounded-md dark:border-gray-700">
            <thead className="bg-primary text-background dark:bg-black dark:text-gray-100">
              <tr>
                <th className="border px-2 py-2 dark:border-gray-700 border-gray-300">Usuario</th>
                <th className="border px-2 py-2 dark:border-gray-700 border-gray-300">Operación</th>
                <th className="border px-2 py-2 dark:border-gray-700 border-gray-300">Tabla</th>
                <th className="border px-2 py-2 dark:border-gray-700 border-gray-300">Datos Antes</th>
                <th className="border px-2 py-2 dark:border-gray-700 border-gray-300">Datos Después</th>
                <th className="border px-2 py-2 dark:border-gray-700 border-gray-300">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {paginateData().map((auditoria) => (
                <tr key={auditoria.id}>
                  <td className="border px-1 py-1 border-gray-300 dark:border-gray-700">
                    {auditoria.usuario_email}
                    {auditoria.operacion === "DELETE" && (
                      <button
                        onClick={() => handleRestore(auditoria)}
                        className="text-sm text-primary dark:text-gray-400 hover:underline"
                      >
                        Restaurar
                      </button>
                    )}
                  </td>
                  <td className="border px-1 py-1 border-gray-300 dark:border-gray-700">
                    {auditoria.operacion}
                  </td>
                  <td className="border px-1 py-1 border-gray-300 dark:border-gray-700">
                    {auditoria.tabla}
                  </td>
                  <td className="border px-1 py-1 border-gray-300 dark:border-gray-700 align-top max-h-[60px] overflow-y-auto">
                    <div className="scrollable max-h-[60px] overflow-y-auto text-sm text-gray-800 dark:text-gray-100">
                      {formatJson(auditoria.datos_antes)}
                    </div>
                  </td>
                  <td className="border px-1 py-1 border-gray-300 dark:border-gray-700 align-top max-h-[60px] overflow-y-auto">
                    <div className="scrollable max-h-[60px] overflow-y-auto text-sm text-gray-800 dark:text-gray-100">
                      {formatJson(auditoria.datos_despues)}
                    </div>
                  </td>
                  <td className="border px-1 py-1 border-gray-300 dark:border-gray-700">
                    {formatDate(auditoria.fecha)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No se encontraron registros de auditoría.</p>
      )}

      {/* Paginación */}
      <div className="flex justify-center mt-4">
        <button
          disabled={currentPage === 1}
          onClick={() => changePage(currentPage - 1)}
          className="bg-primary border border-primary-foreground text-background px-4 py-2 mr-8 rounded-md hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
        >
          Anterior
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => changePage(currentPage + 1)}
          className="bg-primary border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
);
}
