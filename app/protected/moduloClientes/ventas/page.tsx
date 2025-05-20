"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import jsPDF from "jspdf";

export default function VentasEmpleado() {
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

  const [ventas, setVentas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [clientesFiltro, setClientesFiltro] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuariosFiltro, setUsuariosFiltro] = useState<any[]>([]);
  const [form, setForm] = useState({
    cliente_id: "",
    fecha_venta: "",
    monto_total: "",
    estado: "",
    usuario_id: "",
  });
  const [filtros, setFiltros] = useState({
    cliente_id: "",
    fecha_venta: "",
    estado: "",
    monto_total: "",
    usuario_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any>(null);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [ventaAEliminar, setVentaAEliminar] = useState<any>(null);

  const fetchVentas = async () => {
    setSyncing(true);

    const desde = (pagina - 1) * porPagina;
    const hasta = desde + porPagina - 1;

    let query = supabase
      .from("ventas")
      .select(`*,
        clientes ( nombre ),
        usuarios ( correo )
      `, { count: "exact" })
      .eq("eliminado", false) // Filtra solo las que no están eliminadas
      .range(desde, hasta);

    if (filtros.cliente_id) query = query.eq("cliente_id", filtros.cliente_id);
    if (filtros.estado) query = query.ilike("estado", `%${filtros.estado}%`);
    if (filtros.fecha_venta) query = query.eq("fecha_venta", filtros.fecha_venta);
    if (filtros.monto_total) query = query.gte("monto_total", parseFloat(filtros.monto_total));
    if (filtros.usuario_id) query = query.eq("usuario_id", filtros.usuario_id);

    const { data, error, count } = await query;
    if (!error) {
      setVentas(data || []);
      if (count !== null) {
        setTotalPaginas(Math.ceil(count / porPagina));
      }
    }
    else console.error("Error al obtener ventas:", error.message);

    setSyncing(false);
  };

  const fetchClientes = async () => {
    // Para filtros (mostrar todos, incluso los eliminados)
    const { data: dataFiltro, error: errorFiltro } = await supabase
      .from("clientes")
      .select("id, nombre");

    if (!errorFiltro) setClientesFiltro(dataFiltro || []);

    // Para selects del formulario (solo los activos)
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre")
      .eq("eliminado", false);

    if (!error) setClientes(data || []);
  };

  const fetchUsuarios = async () => {
    // Para filtros (mostrar todos, incluso los eliminados)
    const { data: dataFiltro, error: errorFiltro } = await supabase
      .from("usuarios")
      .select("id, correo");

    if (!errorFiltro) setUsuariosFiltro(dataFiltro || []);

    // Para selects del formulario (solo los activos)
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, correo")
      .eq("eliminado", false);

    if (!error) setUsuarios(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      cliente_id: form.cliente_id,
      fecha_venta: form.fecha_venta,
      monto_total: parseFloat(form.monto_total),
      estado: form.estado,
      usuario_id: form.usuario_id,
    };

    let error;
    if (editando) {
      ({ error } = await supabase.from("ventas").update(payload).eq("id", ventaSeleccionada.id));
    } else {
      ({ error } = await supabase.from("ventas").insert(payload));
    }

    if (error) {
      setMensaje({ tipo: "error", texto: "Error al guardar la venta." });
    } else {
      setMensaje({ tipo: "success", texto: editando ? "Venta actualizada." : "Venta registrada." });
      setForm({ cliente_id: "", fecha_venta: "", monto_total: "", estado: "", usuario_id: "" });
      setEditando(false);
      fetchVentas();
    }

    setLoading(false);
  };

  const handleEdit = (v: any) => {
    setVentaSeleccionada(v);
    const fechaFormateada = v.fecha_venta ? v.fecha_venta.split("T")[0] : "";
    setForm({
      cliente_id: v.cliente_id,
      fecha_venta: fechaFormateada,
      monto_total: String(v.monto_total),
      estado: v.estado,
      usuario_id: v.usuario_id,
    });
    setEditando(true);
    setVentaAEliminar(v);
  };

  const handleEliminarVenta = async () => {
    if (!ventaAEliminar || !ventaAEliminar.id) {
      setMensaje({ tipo: "error", texto: "No se ha seleccionado una venta para eliminar." });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("ventas")
      .update({ eliminado: true })
      .eq("id", ventaAEliminar.id);

    if (error) {
      setMensaje({ tipo: "error", texto: "Error al eliminar la venta." });
    } else {
      setMensaje({ tipo: "success", texto: "Venta eliminada correctamente." });
      setConfirmarEliminacion(false);
      fetchVentas();
      fetchClientes();
      fetchUsuarios();
      setEditando(false);
      setVentaSeleccionada(null);
      setForm({ cliente_id: "", fecha_venta: "", monto_total: "", estado: "", usuario_id: "" });
    }

    setLoading(false);
  };

  const generarReporte = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Ventas", 10, 15);
    doc.setFontSize(8);

    const headers = ["Cliente", "Usuario", "Fecha", "Monto", "Estado"];
    const startY = 25;
    headers.forEach((h, i) => doc.text(h, 10 + i * 38, startY));
    doc.line(10, startY + 2, 200, startY + 2);

    let currentY = startY + 6;
    ventas.forEach((v) => {
      const nombreCliente = v.clientes?.nombre || v.cliente_id;
      const correoUsuario = v.usuarios?.correo || v.usuario_id;
      doc.text(nombreCliente, 10, currentY);
      doc.text(correoUsuario, 48, currentY);
      doc.text(v.fecha_venta?.split("T")[0] || "", 86, currentY);
      doc.text(String(v.monto_total), 124, currentY);
      doc.text(v.estado, 162, currentY);
      currentY += 6;
    });

    doc.save("reporte_ventas.pdf");
  };

  useEffect(() => {
    fetchVentas();
    fetchClientes();
    fetchUsuarios();
  }, [filtros, pagina]);

  useEffect(() => {
    obtenerUsuario();
  }, []);

  useEffect(() => {
    if (mensaje) {
      const timeout = setTimeout(() => setMensaje(null), 5000);
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
        <h2 className="text-xl font-semibold text-primary dark:text-gray-100">
          {editando ? "Editar Venta" : "Registrar Venta"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "cliente_id", label: "Cliente", type: "select", options: clientes },
            { name: "usuario_id", label: "Usuario", type: "select", options: usuarios, labelField: "correo" },
            { name: "fecha_venta", label: "Fecha de venta", type: "date" },
            { name: "monto_total", label: "Monto total", type: "number" },
            { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "Pagado", "Cancelado"] }
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
                      {option[field.labelField || "nombre"] || option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  required
                  min={field.type === "number" ? 0 : undefined} // 👈 evitar negativos
                  value={
                    field.type === "date"
                      ? form[field.name as keyof typeof form]
                        ? new Date(form[field.name as keyof typeof form] as string).toISOString().split("T")[0]
                        : ""
                      : form[field.name as keyof typeof form]
                  }
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="w-full border p-2 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
          >
            {loading ? "Cargando..." : editando ? "Actualizar venta" : "Registrar venta"}
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
                onClick={handleEliminarVenta}
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

      {/* Panel derecho: filtros + tabla */}
      <div className="p-6 border rounded-lg shadow-md bg-background w-full overflow-x-auto dark:border-gray-700">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-primary dark:text-gray-100">Ventas Registradas</h2>
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
        <div className="border p-3 rounded-md grid sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-background shadow-sm dark:border-gray-700">
          {[
            { label: "Cliente", name: "cliente_id", type: "select", options: clientesFiltro, optionLabel: "nombre" },
            { label: "Usuario", name: "usuario_id", type: "select", options: usuariosFiltro, optionLabel: "correo" },
            { label: "Fecha de venta", name: "fecha_venta", type: "date" },
            { label: "Estado", name: "estado", type: "select", options: ["Pendiente", "Pagado", "Cancelado"] },
            { label: "Monto Total", name: "monto_total", type: "number" },
          ].map((f) => (
            <div key={f.name} className="col-span-1">
              <label className="block text-sm font-medium mb-1 dark:text-gray-100">{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={filtros[f.name as keyof typeof filtros] || ""}
                  onChange={(e) => setFiltros({ ...filtros, [f.name]: e.target.value })}
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
                  value={filtros[f.name as keyof typeof filtros] || ""}
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
                <th className="border p-3">Cliente</th>
                <th className="border p-3">Usuario</th>
                <th className="border p-3">Fecha</th>
                <th className="border p-3">Monto Total</th>
                <th className="border p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-primary/10 dark:hover:bg-zinc-800">
                  <td className="border p-3 hover:bg-gray-50 group relative border-gray-300 dark:hover:bg-zinc-800 dark:border-gray-700">
                    <div className="relative">
                      <span className="group-hover:opacity-0 transition-opacity">
                        {venta.clientes?.nombre || venta.cliente_id}
                      </span>
                      <button
                        onClick={() => handleEdit(venta)}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-primary dark:text-gray-400"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{venta.usuarios?.correo || venta.usuario_id}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{venta.fecha_venta?.split("T")[0]}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">${venta.monto_total}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{venta.estado}</td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No hay ventas registradas.
                  </td>
                </tr>
              )}
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
