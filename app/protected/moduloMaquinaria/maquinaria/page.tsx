"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import jsPDF from "jspdf";

export default function MaquinariaEmpleado() {
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

  const [maquinaria, setMaquinaria] = useState<any[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    tipo: "",
    descripcion: "",
    estado: "",
    costo_diario: "",
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [filtros, setFiltros] = useState({
    nombre: "",
    tipo: "",
    estado: "",
    costo_diario: "",
  });
  const [editando, setEditando] = useState(false);
  const [maquinaSeleccionada, setMaquinaSeleccionada] = useState<any>(null);
  const [tiposMaquinaria, setTiposMaquinaria] = useState<string[]>([]);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [maquinaAEliminar, setMaquinaAEliminar] = useState<any>(null);

  const fetchMaquinaria = async () => {
    setSyncing(true);

const desde = (pagina - 1) * porPagina;
    const hasta = desde + porPagina - 1;

    let query = supabase
      .from("maquinaria")
      .select("*", { count: "exact" })
      .eq("eliminado", false)
      .range(desde, hasta);

    if (filtros.nombre?.trim()) {
      query = query.ilike("nombre", `%${filtros.nombre}%`);
    }

    if (filtros.tipo?.trim()) {
      query = query.ilike("tipo", `%${filtros.tipo}%`);
    }

    if (filtros.estado?.trim()) {
      query = query.ilike("estado", `%${filtros.estado}%`);
    }

    const costoDiario = parseFloat(filtros.costo_diario);
    if (!isNaN(costoDiario)) {
      query = query.eq("costo_diario", costoDiario);
    }

    const { data, error, count } = await query;

    if (!error){
      setMaquinaria(data || []);
      if (count !== null) {
        setTotalPaginas(Math.ceil(count / porPagina));
      }
    }
    else console.error("Error al obtener maquinaria:", error.message);

    setSyncing(false);
    console.log("Maquinaria obtenida:", data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    if (editando) {
      const { error } = await supabase
        .from("maquinaria")
        .update({
          nombre: form.nombre,
          tipo: form.tipo,
          descripcion: form.descripcion,
          estado: form.estado,
          costo_diario: parseFloat(form.costo_diario),
        })
        .eq("id", maquinaSeleccionada.id);

      if (error) {
        setMensaje({ tipo: "error", texto: "Error al actualizar maquinaria." });
      } else {
        setMensaje({ tipo: "success", texto: "Maquinaria actualizada exitosamente." });
        setForm({ nombre: "", tipo: "", descripcion: "", estado: "", costo_diario: "" });
        setEditando(false);
        setMaquinaSeleccionada(null);
        fetchMaquinaria();
      }
    } else {
      const { error } = await supabase.from("maquinaria").insert({
        nombre: form.nombre,
        tipo: form.tipo,
        descripcion: form.descripcion,
        estado: form.estado,
        costo_diario: parseFloat(form.costo_diario),
      });

      if (error) {
        setMensaje({ tipo: "error", texto: "Error al registrar maquinaria." });
      } else {
        setMensaje({ tipo: "success", texto: "Maquinaria registrada exitosamente." });
        setForm({ nombre: "", tipo: "", descripcion: "", estado: "", costo_diario: "" });
        fetchMaquinaria();
      }
    }

    setLoading(false);
  };

  const generarReporte = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Reporte de Maquinaria", 10, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    const headers = ["Nombre", "Tipo", "Descripción", "Estado", "Costo Diario"];
    const colWidths = [30, 30, 50, 30, 30];
    const startY = 25;

    headers.forEach((h, i) => {
      doc.text(h, 10 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), startY);
    });
    doc.line(10, startY + 2, 200, startY + 2);

    let currentY = startY + 6;

    maquinaria.forEach((m) => {
      const desc = doc.splitTextToSize(m.descripcion || "", 50);
      doc.text(m.nombre, 10, currentY);
      doc.text(m.tipo, 40, currentY);
      doc.text(desc, 70, currentY);
      doc.text(m.estado, 120, currentY);
      doc.text(String(m.costo_diario), 150, currentY);
      currentY += desc.length * 5 + 3;
    });

    doc.save("reporte_maquinaria.pdf");
  };

  const handleEdit = (m: any) => {
    setMaquinaSeleccionada(m);
    setForm({
      nombre: m.nombre,
      tipo: m.tipo,
      descripcion: m.descripcion,
      estado: m.estado,
      costo_diario: String(m.costo_diario),
    });
    setEditando(true);
    setMaquinaAEliminar(m);
  };

  const handleEliminarMaquina = async () => {
    if (!maquinaAEliminar || !maquinaAEliminar.id) {
      setMensaje({ tipo: "error", texto: "No se ha seleccionado una maquina para eliminar." });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("maquinaria")
      .update({ eliminado: true })
      .eq("id", maquinaAEliminar.id);

    if (error) {
      setMensaje({ tipo: "error", texto: "Error al eliminar la maquina." });
    } else {
      setMensaje({ tipo: "success", texto: "Maquina eliminada correctamente." });
      setConfirmarEliminacion(false);
      fetchMaquinaria();
      setEditando(false);
      setMaquinaSeleccionada(null);
       setForm({ nombre: "", tipo: "", descripcion: "", estado: "", costo_diario: "" });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMaquinaria();
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

  useEffect(() => {
    const fetchTipos = async () => {
      const { data, error } = await supabase
        .from("maquinaria")
        .select("tipo");

      if (!error && data) {
        const tiposUnicos = Array.from(new Set(data.map((item) => item.tipo)));
        setTiposMaquinaria(tiposUnicos);
      } else {
        console.error("Error al cargar tipos de maquinaria:", error);
      }
    };

    fetchTipos();
  }, []);

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
        <h2 className="text-xl font-semibold text-primary dark:text-gray-100">{editando ? "Editar Maquinaria" : "Registrar Maquinaria"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {["nombre", "tipo", "descripcion", "estado", "costo_diario"].map((field) => (
            <div key={field}>
              <label className="block mb-1 font-medium capitalize dark:text-gray-100">{field.replace("_", " ")}</label>
              {field === "descripcion" ? (
                <textarea
                  required
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="scrollable resizable w-full border p-2 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                />
              ) : field === "estado" ? (
                <select
                  required
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                >
                  <option value="">Selecciona estado</option>
                  <option value="Disponible">Disponible</option>
                  <option value="En uso">En uso</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                </select>
              ) : (
                <input
                  required
                  type={field === "costo_diario" ? "number" : "text"}
                  step={field === "costo_diario" ? "0.01" : undefined}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  min={field === "costo_diario" ? 0 : undefined} // 👈 evitar negativos
                  className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                />
              )}
            </div>
          ))}

          <button type="submit" disabled={loading} className="w-full bg-primary border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800">
            {loading ? "Guardando..." : editando ? "Actualizar Maquinaria" : "Guardar Maquinaria"}
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
                onClick={handleEliminarMaquina}
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
          <h2 className="text-xl font-semibold text-primary dark:text-gray-100">Maquinaria Registrada</h2>
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
            { label: "Nombre", name: "nombre", type: "text" },
            { label: "Tipo", name: "tipo", type: "select", options: tiposMaquinaria },
            { label: "Estado", name: "estado", type: "select", options: ["Disponible", "En uso", "Mantenimiento"] },
            { label: "Costo Diario", name: "costo_diario", type: "number" },
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
                <th className="border p-3">Tipo</th>
                <th className="border p-3">Descripción</th>
                <th className="border p-3">Nombre</th>
                <th className="border p-3">Estado</th>
                <th className="border p-3">Costo Diario</th>
              </tr>
            </thead>
            <tbody>
              {maquinaria.map((m) => (
                <tr key={m.id} className="hover:bg-primary/10 dark:hover:bg-zinc-800">
                  <td className="border p-3 hover:bg-gray-50 group relative border-gray-300 dark:hover:bg-zinc-800 dark:border-gray-700">
                    <div className="relative">
                      <span className="group-hover:opacity-0 transition-opacity">{m.nombre}</span>
                      <button
                        onClick={() => handleEdit(m)}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-primary dark:text-gray-400"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{m.tipo}</td>
                  <td className="border p-3 max-w-[200px] dark:border-gray-700 border-gray-300">
                    <div className="scrollable max-h-[40px] overflow-y-auto whitespace-normal text-sm">
                      {m.descripcion}
                    </div>
                  </td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{m.estado}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">${m.costo_diario}</td>
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
