"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import jsPDF from "jspdf";

export default function ProyectosEmpleado() {
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

  const [proyectos, setProyectos] = useState<any[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "",
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [filtros, setFiltros] = useState({
    nombre: "",
    estado: "",
    fecha_inicio: "",
    fecha_fin: "",
  });
  const [editando, setEditando] = useState(false); // Nuevo estado para editar
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<any>(null); // Estado para el proyecto a editar
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [proyectoAEliminar, setProyectoAEliminar] = useState<any>(null);

  const fetchProyectos = async () => {
    setSyncing(true);

    const desde = (pagina - 1) * porPagina;
    const hasta = desde + porPagina - 1;

    const { data, count, error } = await supabase
      .from("proyectos")
      .select("*", { count: "exact" }) // 👈 importante para saber cuántos hay
      .eq("eliminado", false)
      .order("created_at", { ascending: false })
      .ilike("nombre", `%${filtros.nombre}%`)
      .ilike("estado", `%${filtros.estado}%`)
      .gte("fecha_inicio", filtros.fecha_inicio || "1900-01-01")
      .lte("fecha_fin", filtros.fecha_fin || "2100-01-01")
      .range(desde, hasta); // 👈 paginación real

    if (!error) {
      setProyectos(data || []);
      if (count !== null) {
        setTotalPaginas(Math.ceil(count / porPagina));
      }
    }

    setSyncing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      setMensaje({ tipo: "error", texto: "No se pudo obtener el usuario." });
      setLoading(false);
      return;
    }

    const { data: userInfo, error: userInfoError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", userData.user.id)
      .single();

    if (userInfoError || !userInfo) {
      setMensaje({ tipo: "error", texto: "Error al obtener el empleado." });
      setLoading(false);
      return;
    }

    if (editando) {
      // Actualizar proyecto si estamos en modo de edición
      const { error } = await supabase
        .from("proyectos")
        .update({
          nombre: form.nombre,
          descripcion: form.descripcion,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin,
          estado: form.estado,
        })
        .eq("id", proyectoSeleccionado.id);

      if (error) {
        setMensaje({ tipo: "error", texto: "Error al actualizar proyecto." });
      } else {
        setMensaje({ tipo: "success", texto: "Proyecto actualizado exitosamente." });
        setForm({
          nombre: "",
          descripcion: "",
          fecha_inicio: "",
          fecha_fin: "",
          estado: "",
        });
        setEditando(false); // Salir del modo de edición
        setProyectoSeleccionado(null); // Limpiar el proyecto seleccionado
        fetchProyectos();
      }
    } else {
      // Crear proyecto si no estamos en modo de edición
      const { error } = await supabase.from("proyectos").insert({
        nombre: form.nombre,
        descripcion: form.descripcion,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        estado: form.estado,
        usuario_id: userInfo.id,
        creado_por: userData.user.email,
      });

      if (error) {
        setMensaje({ tipo: "error", texto: "Error al registrar proyecto." });
      } else {
        setMensaje({ tipo: "success", texto: "Proyecto registrado exitosamente." });
        setForm({
          nombre: "",
          descripcion: "",
          fecha_inicio: "",
          fecha_fin: "",
          estado: "",
        });
        fetchProyectos();
      }
    }

    setLoading(false);
  };

  const generarReporte = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Reporte de Proyectos", 10, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    const marginLeft = 10;
    const marginTop = 25;
    const columnWidth = 30;

    doc.text("Nombre", marginLeft, marginTop);
    doc.text("Descripción", marginLeft + columnWidth, marginTop);
    doc.text("Estado", marginLeft + columnWidth * 2, marginTop);
    doc.text("Fecha de Inicio", marginLeft + columnWidth * 3, marginTop);
    doc.text("Fecha de Fin", marginLeft + columnWidth * 4, marginTop);
    doc.text("Creado por", marginLeft + columnWidth * 5, marginTop);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, marginTop + 2, marginLeft + columnWidth * 6, marginTop + 2);

    let currentY = marginTop;

    proyectos.forEach((p, i) => {
      const desc = doc.splitTextToSize(p.descripcion, columnWidth);
      const numLines = desc.length;

      // Altura de la fila base (puedes ajustar esto si tu fuente tiene tamaño distinto)
      const lineHeight = 7;

      currentY += lineHeight;

      // Dibujar los textos
      doc.text(p.nombre, marginLeft, currentY);
      doc.text(desc, marginLeft + columnWidth, currentY);
      doc.text(p.estado, marginLeft + columnWidth * 2, currentY);
      doc.text(p.fecha_inicio, marginLeft + columnWidth * 3, currentY);
      doc.text(p.fecha_fin, marginLeft + columnWidth * 4, currentY);
      doc.text(p.creado_por, marginLeft + columnWidth * 5, currentY);

      // Ajustar currentY para la siguiente fila, basado en cuántas líneas ocupó la descripción
      currentY += numLines + lineHeight;
    });
    doc.save("reporte_proyectos.pdf");
  };

  const handleEdit = (proyecto: any) => {
    setProyectoSeleccionado(proyecto);
    setForm({
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion,
      fecha_inicio: proyecto.fecha_inicio,
      fecha_fin: proyecto.fecha_fin,
      estado: proyecto.estado,
    });
    setEditando(true); // Habilitar modo de edición
    setProyectoAEliminar(proyecto);
  };

  const handleEliminarProyecto = async () => {
    if (!proyectoAEliminar || !proyectoAEliminar.id) {
      setMensaje({ tipo: "error", texto: "No se ha seleccionado un proyecto para eliminar." });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("proyectos")
      .update({ eliminado: true })
      .eq("id", proyectoAEliminar.id);

    if (error) {
      setMensaje({ tipo: "error", texto: "Error al eliminar el proyecto." });
    } else {
      setMensaje({ tipo: "success", texto: "Proyecto eliminada correctamente." });
      setConfirmarEliminacion(false);
      fetchProyectos();
      setEditando(false);
      setProyectoSeleccionado(null);
      setForm({ nombre: "", descripcion: "", fecha_inicio: "", fecha_fin: "", estado: "", });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProyectos();
  }, [filtros, pagina]);


  useEffect(() => {
    obtenerUsuario();
  }, []);

  useEffect(() => {
    if (mensaje) {
      const timeout = setTimeout(() => {
        setMensaje(null);
      }, 8000);
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
        <h2 className="text-xl font-semibold text-primary dark:text-gray-100">{editando ? "Editar Proyecto" : "Registrar Proyecto"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {["nombre", "descripcion", "fecha_inicio", "fecha_fin", "estado"].map((field) => (
            <div key={field}>
              <label className="block mb-1 font-medium capitalize dark:text-gray-100">{field.replace("_", " ")}</label>
              {field === "descripcion" ? (
                <textarea
                  required
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="resizable scrollable w-full border p-2 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                />
              ) : field === "estado" ? (
                <select
                  required
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                >
                  <option value="">Selecciona estado</option>
                  <option value="En progreso">En progreso</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              ) : (
                <input
                  required
                  type={field.includes("fecha") ? "date" : "text"}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  min={
                    field === "fecha_fin" && form["fecha_inicio"]
                      ? new Date(form["fecha_inicio"] as string).toISOString().split("T")[0]
                      : undefined
                  }
                  className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
          >
            {loading ? "Guardando..." : editando ? "Actualizar Proyecto" : "Guardar Proyecto"}
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
                onClick={handleEliminarProyecto}
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
          <h2 className="text-xl font-semibold text-primary dark:text-gray-100">Proyectos Registrados</h2>
          <div className="flex items-center gap-4">
            {syncing && <span className="text-sm text-gray-500 animate-pulse dark:text-gray-400">Sincronizando...</span>}
            <button
              onClick={generarReporte}
              className="bg-secundary border text-secundary-foreground px-4 py-1 rounded-md shadow-md hover:bg-gray-100 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
            >
              Generar PDF
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="border p-3 rounded-md grid sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-background shadow-sm dark:border-gray-700">
          {[
            { label: "Estado", name: "estado", type: "select", options: ["En progreso", "Finalizado"] },
            { label: "Fecha de Inicio", name: "fecha_inicio", type: "date" },
            { label: "Fecha de Fin", name: "fecha_fin", type: "date" },
            { label: "Nombre", name: "nombre", type: "text" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium mb-1 dark:text-gray-100">{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={filtros[f.name as keyof typeof filtros]}
                  onChange={(e) => setFiltros({ ...filtros, [f.name]: e.target.value })}
                  className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                >
                  <option value="">Seleccionar</option>
                  {f.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
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
                <th className="border p-3">Nombre</th>
                <th className="border p-3">Inicio</th>
                <th className="border p-3">Fin</th>
                <th className="border p-3">Estado</th>
                <th className="border p-3">Descripción</th>
                <th className="border p-3">Creado por</th>
                <th className="border p-3">Creado en</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((p) => (
                <tr key={p.id} className="hover:bg-primary/10 dark:hover:bg-zinc-800">
                  <td className="border p-3 hover:bg-gray-50 group relative border-gray-300 dark:hover:bg-zinc-800 dark:border-gray-700">
                    <div className="relative">
                      <span className="group-hover:opacity-0 transition-opacity">{p.nombre}</span>
                      <button
                        onClick={() => handleEdit(p)}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-primary dark:text-gray-400"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{p.fecha_inicio}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{p.fecha_fin}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{p.estado}</td>
                  <td className="border p-3 max-w-[200px] dark:border-gray-700 border-gray-300">
                    <div className="scrollable max-h-[40px] overflow-y-auto whitespace-normal text-sm">
                      {p.descripcion}
                    </div>
                  </td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{p.creado_por}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{new Date(p.created_at).toLocaleDateString()}</td>
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
