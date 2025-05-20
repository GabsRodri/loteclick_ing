"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import jsPDF from "jspdf";

function toPlainDateString(dateStr: string) {
  if (!dateStr) return "";
  // Si es tipo "2025-04-17T00:00:00.000Z", lo recortamos
  return dateStr.split("T")[0];
}

export default function AlquilerMaquinariaEmpleado() {
  const supabase = createClient();
  const [usuario, setUsuario] = useState<any>(null);

  // Función para obtener los datos del usuario
  const obtenerUsuario = async () => {
    const user = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("usuarios")  // Tabla donde guardas la información del usuario
        .select("rol")
        .eq("id", user.data.user?.id)  // Obtener el rol según el ID del usuario
        .single();

      if (data) {
        setUsuario({ ...user, rol: data.rol });
      } else {
        console.error("Error al obtener rol:", error?.message);
      }
    }
  };

const [pagina, setPagina] = useState(1);
  const [porPagina] = useState(5); // puedes cambiar a 20, 50, etc.
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [alquileres, setAlquileres] = useState<any[]>([]);
  const [maquinaria, setMaquinaria] = useState<any[]>([]);
  const [maquinariaFiltro, setMaquinariaFiltro] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [proyectosFiltro, setProyectosFiltro] = useState<any[]>([]);
  const [form, setForm] = useState({
    maquinaria_id: "",
    proyecto_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    facturado: false,
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [filtros, setFiltros] = useState({
    facturado: "",
    total_costo: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  const [editando, setEditando] = useState(false);
  const [alquilerSeleccionado, setAlquilerSeleccionado] = useState<any>(null);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [alquilerAEliminar, setAlquilerAEliminar] = useState<any>(null);

  const fetchAlquileres = async () => {

const desde = (pagina - 1) * porPagina;
    const hasta = desde + porPagina - 1;

    let query = supabase
      .from("alquiler_maquinaria")
      .select("*, maquinaria(nombre), proyectos(nombre)" , { count: "exact" })
      .order("fecha_inicio", { ascending: false })
      .eq("eliminado", false)
      .range(desde, hasta); 

    // Aplicar filtros si existen
    if (filtros.facturado !== "") {
      query = query.eq("facturado", filtros.facturado === "Sí" ? true : filtros.facturado === "No" ? false : undefined);
    }

    if (filtros.total_costo) {
      query = query.gte("total_costo", parseFloat(filtros.total_costo));
    }

    if (filtros.fecha_inicio) {
      query = query.gte("fecha_inicio", filtros.fecha_inicio);
    }

    if (filtros.fecha_fin) {
      query = query.lte("fecha_fin", filtros.fecha_fin);
    }

    const { data, error, count } = await query;

    if (!error) {
      setAlquileres(data || []);
      if (count !== null) {
        setTotalPaginas(Math.ceil(count / porPagina));
      }
    }
    else console.error("Error al obtener alquileres:", error.message);
  };

  const fetchRelacionados = async () => {
    const [{ data: maq }, { data: proj }] = await Promise.all([
      supabase.from("maquinaria").select("id, nombre").eq("eliminado", false),
      supabase.from("proyectos").select("id, nombre").eq("eliminado", false),
    ]);
    setMaquinaria(maq || []);
    setProyectos(proj || []);

    const [{ data: maqF }, { data: projF }] = await Promise.all([
      supabase.from("maquinaria").select("id, nombre"),
      supabase.from("proyectos").select("id, nombre"),
    ]);
    setMaquinariaFiltro(maqF || []);
    setProyectosFiltro(projF || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    // Convertir fechas
    const fechaInicio = new Date(toPlainDateString(form.fecha_inicio));
    const fechaFin = form.fecha_fin ? new Date(toPlainDateString(form.fecha_fin)) : null;

    // Calcular días de alquiler
    const dias = fechaFin ? Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;

    // Consultar Supabase para obtener el costo_diario
    const { data: maquinariaData, error } = await supabase
      .from("maquinaria")
      .select("costo_diario")
      .eq("id", form.maquinaria_id)
      .single();

    if (error) {
      console.error("Error al obtener la maquinaria:", error.message);
      return;
    }

    const costo_diario = parseFloat(maquinariaData?.costo_diario ?? "0");

    if (isNaN(costo_diario)) {
      console.error("El costo diario no es válido:", maquinariaData?.costo_diario);
      return;
    }
    const total_costo = dias * costo_diario;

    console.log("Días de alquiler:", dias);
    console.log("Costo diario:", costo_diario);
    console.log("Costo total:", total_costo);

    if (editando) {
      // Si estamos editando, actualizamos el alquiler
      const { error } = await supabase
        .from("alquiler_maquinaria")
        .update({
          maquinaria_id: form.maquinaria_id,
          proyecto_id: form.proyecto_id,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin || null,
          total_costo,
          facturado: form.facturado,
        })
        .eq("id", alquilerSeleccionado.id); // Usamos el id del alquiler que estamos editando

      if (error) {
        setMensaje({ tipo: "error", texto: "Error al actualizar alquiler." });
      } else {
        setMensaje({ tipo: "success", texto: "Alquiler actualizado exitosamente." });
        setForm({ maquinaria_id: "", proyecto_id: "", fecha_inicio: "", fecha_fin: "", facturado: false });
        setEditando(false);
        setAlquilerSeleccionado(null); // Limpiar la selección de alquiler editado
        fetchAlquileres(); // Recargar la lista de alquileres
      }
    } else {
      // Si no estamos editando, insertamos un nuevo alquiler
      const { error } = await supabase.from("alquiler_maquinaria").insert({
        maquinaria_id: form.maquinaria_id,
        proyecto_id: form.proyecto_id,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || null,
        total_costo,
        facturado: form.facturado,
      });

      if (error) {
        setMensaje({ tipo: "error", texto: "Error al registrar alquiler." });
      } else {
        setMensaje({ tipo: "success", texto: "Alquiler registrado exitosamente." });
        setForm({ maquinaria_id: "", proyecto_id: "", fecha_inicio: "", fecha_fin: "", facturado: false });
        fetchAlquileres(); // Recargar la lista de alquileres
      }
    }

    setLoading(false);
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Reporte de Alquiler de Maquinaria", 10, 15);
    doc.setFontSize(8);

    const headers = ["Maquinaria", "Proyecto", "Inicio", "Fin", "Costo Total", "Facturado"];
    const colX = [10, 50, 90, 115, 140, 170];
    const startY = 25;

    headers.forEach((header, i) => {
      doc.text(header, colX[i], startY);
    });

    let y = startY + 5;
    alquileres.forEach((a) => {
      doc.text(a.maquinaria?.nombre || "-", colX[0], y);
      doc.text(a.proyectos?.nombre || "-", colX[1], y);
      doc.text(new Date(a.fecha_inicio).toISOString().split("T")[0], colX[2], y);
      doc.text(new Date(a.fecha_fin).toISOString().split("T")[0], colX[3], y);
      doc.text(String(a.total_costo || 0), colX[4], y);
      doc.text(a.facturado ? "Sí" : "No", colX[5], y);
      y += 6;
    });

    doc.save("alquiler_maquinaria.pdf");
  };

  const handleEdit = (m: any) => {
    setAlquilerSeleccionado(m);
    setForm({
      maquinaria_id: m.maquinaria_id,
      proyecto_id: m.proyecto_id,
      fecha_inicio: m.fecha_inicio,
      fecha_fin: m.fecha_fin || null,
      facturado: m.facturado,
    });
    setEditando(true);
    setAlquilerAEliminar(m);
  };

  const handleEliminarAlquiler = async () => {
    if (!alquilerAEliminar || !alquilerAEliminar.id) {
      setMensaje({ tipo: "error", texto: "No se ha seleccionado un alquiler para eliminar." });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("alquiler_maquinaria")
      .update({ eliminado: true })
      .eq("id", alquilerAEliminar.id);

    if (error) {
      setMensaje({ tipo: "error", texto: "Error al eliminar el alquiler." });
    } else {
      setMensaje({ tipo: "success", texto: "Alquiler eliminado correctamente." });
      setConfirmarEliminacion(false);
      fetchAlquileres();
      fetchRelacionados();
      setEditando(false);
      setAlquilerSeleccionado(null);
      setForm({ maquinaria_id: "", proyecto_id: "", fecha_inicio: "", fecha_fin: "", facturado: false });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRelacionados();
    fetchAlquileres();
  }, [filtros, pagina]);

  useEffect(() => {
    obtenerUsuario();
  }, []);

  useEffect(() => {
    if (mensaje) {
      const timeout = setTimeout(() => setMensaje(null), 8000);
      return () => clearTimeout(timeout);
    }
  }, [mensaje]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 mt-5 px-4">
      {/* Notificación */}
      {mensaje && (
        <div
          className={`col-span-full p-3 text-sm rounded-md text-background ${mensaje.tipo === "success" ? "bg-green-600 dark:bg-green-950" : "bg-red-600 dark:bg-red-950"
            }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Panel izquierdo */}
      <div className="p-6 border rounded-lg shadow-md bg-background space-y-4 w-full max-w-sm dark:border-gray-700">
        <h2 className="text-xl font-semibold text-primary dark:text-gray-100">{editando ? "Editar Alquiler" : "Registrar Alquiler"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "maquinaria_id", label: "Maquinaria", type: "select", options: maquinaria },
            { name: "proyecto_id", label: "Proyecto", type: "select", options: proyectos },
            { name: "fecha_inicio", label: "Fecha Inicio", type: "date" },
            { name: "fecha_fin", label: "Fecha Fin", type: "date" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block mb-1 font-medium dark:text-gray-100">{field.label}</label>
              {field.type === "select" ? (
                <select
                  required
                  value={form[field.name as keyof typeof form] as string}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="w-full border p-2 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                >
                  <option value="">Seleccionar</option>
                  {field.options?.map((option: any) => (
                    <option key={option.id} value={option.id}>
                      {option.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  required={field.name === "fecha_inicio"}
                  value={
                    field.type === "date"
                      ? form[field.name as keyof typeof form]
                        ? new Date(form[field.name as keyof typeof form] as string)
                          .toISOString()
                          .split("T")[0]
                        : ""
                      : (form[field.name as keyof typeof form] as string)
                  }
                  min={
                    field.name === "fecha_fin" && form.fecha_inicio
                      ? new Date(form.fecha_inicio).toISOString().split("T")[0]
                      : undefined
                  }
                  onChange={(e) =>
                    setForm({ ...form, [field.name]: e.target.value })
                  }
                  className="w-full border p-2 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                />
              )}
            </div>
          ))}

          {/* Campo booleano separado para evitar el error de tipo */}
          <div className="flex items-center gap-2">
            <label className="relative inline-block w-4 h-4">
              <input
                type="checkbox"
                checked={form.facturado}
                onChange={(e) => setForm({ ...form, facturado: e.target.checked })}
                className="appearance-none w-4 h-4 border border-gray-400 rounded-sm checked:bg-primary checked:border-transparent dark:border-gray-600 dark:checked:bg-zinc-600 focus:outline-none peer"
              />
              <svg
                className="absolute left-0 top-0 w-4 h-4 text-background pointer-events-none hidden peer-checked:block"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </label>
            <label className="w-full block font-medium dark:text-gray-100">Facturado</label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
          >
            {loading ? "Guardando..." : editando ? "Actualizar Alquiler" : "Registrar Alquiler"}
          </button>
          {editando && usuario?.rol === 'admin' && (
            <button
              type="button"
              onClick={() => setConfirmarEliminacion(true)}
              className="w-full bg-red-600 border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-red-700 transition-all dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
            >
              Eliminar Contrato
            </button>
          )}
        </form>
      </div>

      {confirmarEliminacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background border border-primary-foreground p-6 rounded-md shadow-lg dark:bg-black dark:text-gray-100 dark:border-gray-700 w-72 z-60">
            <h3 className="text-lg font-semibold text-center">¿Seguro de eliminar?</h3>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleEliminarAlquiler}
                className="bg-red-600 text-background px-4 py-2 border border-primary-foreground rounded-md hover:bg-red-700 transition-all dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setConfirmarEliminacion(false)}
                className="bg-gray-200 text-black px-4 py-2 border border-primary-foreground rounded-md hover:bg-gray-300 transition-all dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel derecho */}
      <div className="p-6 border rounded-lg shadow-md bg-background w-full overflow-x-auto dark:border-gray-700">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-primary dark:text-gray-100">Alquileres</h2>
          <div className="flex items-center gap-4">
            {syncing && <span className="text-sm text-gray-500 animate-pulse dark:text-gray-400">Sincronizando...</span>}
            <button
              onClick={generarPDF}
              className="bg-secundary border text-secundary-foreground px-4 py-1 rounded-md shadow-md hover:bg-gray-100 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
            >
              Generar PDF
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="border p-3 rounded-md grid sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-background shadow-sm dark:border-gray-700">
          {[
            { label: "Facturado", name: "facturado", type: "select", options: ["Sí", "No"] },
            { label: "Fecha Inicio", name: "fecha_inicio", type: "date" },
            { label: "Fecha Fin", name: "fecha_fin", type: "date" },
            { label: "Total Costo", name: "total_costo", type: "number" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium mb-1 dark:text-gray-100">{f.label}</label>
              {f.type === "select" ? (

                <select
                  required
                  value={filtros[f.name as keyof typeof filtros] || ""}
                  onChange={(e) =>
                    setFiltros({
                      ...filtros,
                      [f.name]: e.target.value, // Aquí, el valor será "Sí", "No" o "" según la opción seleccionada
                    })
                  }
                  className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                >
                  <option value="">Seleccionar</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>


              ) : (
                <input
                  type={f.type}
                  value={filtros[f.name as keyof typeof filtros]}
                  onChange={(e) => setFiltros({ ...filtros, [f.name]: e.target.value })}
                  className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                />
              )}
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="scrollable overflow-x-auto mt-4">
          <table className="w-full min-w-[600px] border text-xs bg-background shadow-lg rounded-md dark:border-gray-700">
            <thead className="bg-primary text-background dark:bg-black dark:text-gray-100">
              <tr className=" dark:border-gray-700 border-gray-300">
                <th className="border p-3">Maquinaria</th>
                <th className="border p-3">Proyecto</th>
                <th className="border p-3">Inicio</th>
                <th className="border p-3">Fin</th>
                <th className="border p-3">Costo</th>
                <th className="border p-3">Facturado</th>
              </tr>
            </thead>
            <tbody>
              {alquileres.map((a) => (
                <tr key={a.id} className="hover:bg-primary/10 dark:hover:bg-zinc-800">
                  <td className="border p-3 hover:bg-gray-50 group relative border-gray-300 dark:hover:bg-zinc-800 dark:border-gray-700">
                    <div className="relative">
                      <span className="group-hover:opacity-0 transition-opacity">{a.maquinaria?.nombre}</span>
                      <button
                        onClick={() => handleEdit(a)}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-primary dark:text-gray-400"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{a.proyectos?.nombre}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{new Date(a.fecha_inicio).toISOString().split("T")[0]}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{new Date(a.fecha_fin).toISOString().split("T")[0]}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">${a.total_costo || 0}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{a.facturado ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setPagina((p) => Math.max(p - 1, 1))}
            disabled={pagina === 1}
            className="px-3 py-1 border rounded-md bg-primary border-primary-foreground text-background hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
          >
            Anterior
          </button>

          <span className="text-sm dark:text-gray-100">Página {pagina} de {totalPaginas}</span>

          <button
            onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
            disabled={pagina === totalPaginas}
            className="px-3 py-1 border rounded-md bg-primary border-primary-foreground text-background hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
