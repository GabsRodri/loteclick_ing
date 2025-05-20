"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import jsPDF from "jspdf";

export default function ContratosEmpleado() {
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

  const [contratos, setContratos] = useState<any[]>([]);
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [proyectosFiltro, setProyectosFiltro] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [clientesFiltro, setClientesFiltro] = useState<any[]>([]);
  const [form, setForm] = useState({
    proyecto_id: "",
    cliente_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    monto_total: "",
    estado: "",
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [filtros, setFiltros] = useState({
    proyecto_id: "",
    cliente_id: "",
    estado: "",
    monto_total: "",
  });
  const [editando, setEditando] = useState(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState<any>(null);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [contratoAEliminar, setContratoAEliminar] = useState<any>(null);

  // Fetch de contratos
  const fetchContratos = async () => {
    setSyncing(true);

    const desde = (pagina - 1) * porPagina;
    const hasta = desde + porPagina - 1;

    let query = supabase
      .from("contratos")
      .select("*", { count: "exact" })
      .eq("eliminado", false) // Filtra solo las que no están eliminadas
      .range(desde, hasta);

    if (filtros.proyecto_id?.trim()) {
      query = query.eq("proyecto_id", filtros.proyecto_id.trim());
    }

    if (filtros.cliente_id?.trim()) {
      query = query.eq("cliente_id", filtros.cliente_id.trim());
    }


    if (filtros.estado?.trim()) {
      query = query.ilike("estado", `%${filtros.estado}%`);
    }

    const montoTotal = parseFloat(filtros.monto_total);
    if (!isNaN(montoTotal)) {
      query = query.eq("monto_total", montoTotal);
    }

    const { data, error, count } = await query;

      if (!error) {
      setContratos(data || []);
      if (count !== null) {
        setTotalPaginas(Math.ceil(count / porPagina));
      }
    }

    setSyncing(false);
  };

  // Fetch de proyectos y clientes
  const fetchProyectosYClientes = async () => {
    const { data: proyectosDataF, error: proyectosErrorF } = await supabase
      .from("proyectos")
      .select("id, nombre");

    if (!proyectosErrorF) setProyectosFiltro(proyectosDataF || []);

    const { data: proyectosData, error: proyectosError } = await supabase
      .from("proyectos")
      .select("id, nombre")
      .eq("eliminado", false);

    if (!proyectosError) setProyectos(proyectosData || []);

    const { data: clientesDataF, error: clientesErrorF } = await supabase
      .from("clientes")
      .select("id, nombre");

    if (!clientesErrorF) setClientesFiltro(clientesDataF || []);

    const { data: clientesData, error: clientesError } = await supabase
      .from("clientes")
      .select("id, nombre")
      .eq("eliminado", false);

    if (!clientesError) setClientes(clientesData || []);
  };

  // Registrar o actualizar contrato
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    if (editando) {
      const { error } = await supabase
        .from("contratos")
        .update({
          proyecto_id: form.proyecto_id,
          cliente_id: form.cliente_id,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin,
          monto_total: parseFloat(form.monto_total),
          estado: form.estado,
        })
        .eq("id", contratoSeleccionado.id);

      if (error) {
        setMensaje({ tipo: "error", texto: "Error al actualizar contrato." });
      } else {
        setMensaje({ tipo: "success", texto: "Contrato actualizado exitosamente." });
        setForm({ proyecto_id: "", cliente_id: "", fecha_inicio: "", fecha_fin: "", monto_total: "", estado: "" });
        setEditando(false);
        setContratoSeleccionado(null);
        fetchContratos();
      }
    } else {
      const { error } = await supabase.from("contratos").insert({
        proyecto_id: form.proyecto_id,
        cliente_id: form.cliente_id,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        monto_total: parseFloat(form.monto_total),
        estado: form.estado,
      });

      if (error) {
        setMensaje({ tipo: "error", texto: "Error al registrar contrato." });
      } else {
        setMensaje({ tipo: "success", texto: "Contrato registrado exitosamente." });
        setForm({ proyecto_id: "", cliente_id: "", fecha_inicio: "", fecha_fin: "", monto_total: "", estado: "" });
        fetchContratos();
      }
    }

    setLoading(false);
  };

  // Generar reporte en PDF
  const generarReporte = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Reporte de Contratos", 10, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    const headers = ["Proyecto ID", "Cliente ID", "Fecha Inicio", "Fecha Fin", "Monto Total", "Estado"];
    const colWidths = [30, 30, 30, 30, 30, 30];
    const startY = 25;

    headers.forEach((h, i) => {
      doc.text(h, 10 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), startY);
    });
    doc.line(10, startY + 2, 200, startY + 2);

    let currentY = startY + 6;

    contratos.forEach((c) => {
      const proyecto = proyectosFiltro.find((p) => p.id === c.proyecto_id);
      const cliente = clientesFiltro.find((cl) => cl.id === c.cliente_id);

      const nombreProyecto = proyecto ? proyecto.nombre : "Desconocido";
      const nombreCliente = cliente ? cliente.nombre : "Desconocido";

      doc.text(nombreProyecto, 10, currentY);
      doc.text(nombreCliente, 40, currentY);
      doc.text(c.fecha_inicio, 70, currentY);
      doc.text(c.fecha_fin, 100, currentY);
      doc.text(String(c.monto_total), 130, currentY);
      doc.text(c.estado, 160, currentY);
      currentY += 6;
    });

    doc.save("reporte_contratos.pdf");
  };

  // Editar contrato
  const handleEdit = (c: any) => {
    setContratoSeleccionado(c);
    setForm({
      proyecto_id: c.proyecto_id,
      cliente_id: c.cliente_id,
      fecha_inicio: c.fecha_inicio,
      fecha_fin: c.fecha_fin,
      monto_total: String(c.monto_total),
      estado: c.estado,
    });
    setEditando(true);
    setContratoAEliminar(c);
  };

  const handleEliminarContrato = async () => {
    if (!contratoAEliminar || !contratoAEliminar.id) {
      console.error("No se ha seleccionado un contrato o falta el ID.");
      setMensaje({ tipo: "error", texto: "No se ha seleccionado un contrato para eliminar." });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("contratos")
      .update({ eliminado: true })
      .eq("id", contratoAEliminar.id);

    if (error) {
      console.error("Error al eliminar contrato:", error);
      setMensaje({ tipo: "error", texto: "Error al eliminar contrato." });
    } else {
      setMensaje({ tipo: "success", texto: "Contrato eliminado exitosamente." });
      setConfirmarEliminacion(false); // Cerrar el cuadro de confirmación
      fetchContratos();
      fetchProyectosYClientes();
      setEditando(false);
      setContratoSeleccionado(null);
      setForm({ proyecto_id: "", cliente_id: "", fecha_inicio: "", fecha_fin: "", monto_total: "", estado: "" });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchContratos();
    fetchProyectosYClientes();
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
        <h2 className="text-xl font-semibold text-primary dark:text-gray-100">{editando ? "Editar Contrato" : "Registrar Contrato"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "proyecto_id", label: "Proyecto", type: "select", options: proyectos },
            { name: "cliente_id", label: "Cliente", type: "select", options: clientes },
            { name: "fecha_inicio", label: "Fecha de inicio", type: "date" },
            { name: "fecha_fin", label: "Fecha de fin", type: "date" },
            { name: "monto_total", label: "Monto total", type: "number" },
            { name: "estado", label: "Estado", type: "select", options: ["Activo", "Inactivo"] }
          ].map((field) => (
            <div key={field.name}>
              <label className="block mb-1 font-medium capitalize dark:text-gray-100">
                {field.label}
              </label>
              {field.type === "select" ? (
                <select
                  required
                  value={form[field.name as keyof typeof form] as string}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="w-full border p-2 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                >
                  <option value="">Selecciona</option>
                  {field.options?.map((option: any) => (
                    <option key={option.id || option} value={option.id || option}>
                      {option.nombre || option}
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
                    field.type === "number"
                      ? "0" // Evitar valores negativos
                      : field.name === "fecha_fin" && form.fecha_inicio
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

          {/* Botón de acción */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
          >
            {loading ? "Cargando..." : editando ? "Actualizar contrato" : "Registrar contrato"}
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
                onClick={handleEliminarContrato}
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
          <h2 className="text-xl font-semibold text-primary dark:text-gray-100">Contratos Registrados</h2>
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
            { label: "Proyecto", name: "proyecto_id", type: "select", options: proyectosFiltro, optionLabel: "nombre" },
            { label: "Cliente", name: "cliente_id", type: "select", options: clientesFiltro, optionLabel: "nombre" },
            { label: "Estado", name: "estado", type: "select", options: ["Activo", "Inactivo"] },
            { label: "Monto Total", name: "monto_total", type: "number" },
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
                      [f.name]: e.target.value,
                    })
                  }
                  className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                >
                  <option value="">Seleccionar</option>
                  {Array.isArray(f.options) && typeof f.options[0] === "string" ? (
                    f.options.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))
                  ) : (
                    f.options?.map((option: any) => (
                      <option key={option.id} value={option.id}>
                        {option[f.optionLabel || "nombre"]}
                      </option>
                    ))
                  )}
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
                <th className="border p-3">Proyecto</th>
                <th className="border p-3">Cliente</th>
                <th className="border p-3">Fecha Inicio</th>
                <th className="border p-3">Fecha Fin</th>
                <th className="border p-3">Monto Total</th>
                <th className="border p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((contrato) => (
                <tr key={contrato.id} className="hover:bg-primary/10 dark:hover:bg-zinc-800">
                  <td className="border p-3 hover:bg-gray-50 group relative border-gray-300 dark:hover:bg-zinc-800 dark:border-gray-700">
                    <div className="relative">
                      <span className="group-hover:opacity-0 transition-opacity">{
                        proyectosFiltro.find((proyecto) => proyecto.id === contrato.proyecto_id)?.nombre || "Proyecto no encontrado"
                      }</span>
                      <button
                        onClick={() => handleEdit(contrato)}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-primary dark:text-gray-400"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{
                    clientesFiltro.find((cliente) => cliente.id === contrato.cliente_id)?.nombre || "Cliente no encontrado"
                  }</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{contrato.fecha_inicio}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{contrato.fecha_fin}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">${contrato.monto_total}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{contrato.estado}</td>
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
