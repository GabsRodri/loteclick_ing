"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import jsPDF from "jspdf";

export default function PagosClientesEmpleado() {
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

  const [pagos, setPagos] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [contratosFiltro, setContratosFiltro] = useState<any[]>([]);
  const [form, setForm] = useState({
    contrato_id: "",
    categoria: "",
    referencia: "",
    metodo: "",
    fecha_pago: "",
    monto: "",
  });
  const [filtros, setFiltros] = useState({
    contrato_id: "",
    categoria: "",
    metodo: "",
    fecha_pago: "",
    monto: "",
  });
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<any>(null);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [pagoAEliminar, setPagoAEliminar] = useState<any>(null);


  const fetchPagos = async () => {
    setSyncing(true);

    const desde = (pagina - 1) * porPagina;
    const hasta = desde + porPagina - 1;

    let query = supabase
      .from("pagos_clientes")
      .select(`
        *,
        contratos (
          id,
          proyecto_id,
          cliente_id,
          proyectos ( nombre ),
          clientes ( nombre )
        )
      `, { count: "exact" })
      .eq("eliminado", false) // Filtra solo las que no están eliminadas
      .range(desde, hasta);

    if (filtros.contrato_id) query = query.eq("contrato_id", filtros.contrato_id);
    if (filtros.categoria) query = query.ilike("categoria", `%${filtros.categoria}%`);
    if (filtros.metodo) query = query.ilike("metodo", filtros.metodo);
    if (filtros.fecha_pago) query = query.eq("fecha_pago", filtros.fecha_pago);
    if (filtros.monto) query = query.gte("monto", parseFloat(filtros.monto));

    const { data, error, count } = await query;
    if (!error) {
      setPagos(data || []);
      if (count !== null) {
        setTotalPaginas(Math.ceil(count / porPagina));
      }
    }
    else console.error("Error al obtener pagos:", error.message);

    setSyncing(false);
  };


  const fetchContratos = async () => {
    const { data: dataFiltro, error: errorFiltro } = await supabase
      .from("contratos")
      .select("id, proyectos(nombre), clientes(nombre)");
    if (!errorFiltro) setContratosFiltro(dataFiltro || []);

    const { data, error } = await supabase
      .from("contratos")
      .select("id, proyectos(nombre), clientes(nombre)")
      .eq("eliminado", false);
    if (!error) setContratos(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      contrato_id: form.contrato_id,
      categoria: form.categoria,
      referencia: form.referencia,
      metodo: form.metodo,
      fecha_pago: form.fecha_pago,
      monto: parseFloat(form.monto),
    };

    let error;
    if (editando) {
      ({ error } = await supabase.from("pagos_clientes").update(payload).eq("id", pagoSeleccionado.id));
    } else {
      ({ error } = await supabase.from("pagos_clientes").insert(payload));
    }

    if (error) {
      setMensaje({ tipo: "error", texto: "Error al guardar el pago." });
    } else {
      setMensaje({ tipo: "success", texto: editando ? "Pago actualizado." : "Pago registrado." });
      setForm({ contrato_id: "", categoria: "", referencia: "", metodo: "", fecha_pago: "", monto: "" });
      setEditando(false);
      fetchPagos();
    }

    setLoading(false);
  };

  const handleEdit = (p: any) => {
    setPagoSeleccionado(p);

    // Asegurarte de que la fecha está en formato "YYYY-MM-DD"
    const fechaFormateada = p.fecha_pago ? p.fecha_pago.split("T")[0] : "";

    setForm({
      contrato_id: p.contrato_id,
      categoria: p.categoria,
      referencia: p.referencia,
      metodo: p.metodo,
      fecha_pago: fechaFormateada,
      monto: String(p.monto),
    });
    setEditando(true);
    setPagoAEliminar(p);
  };

  const handleEliminarPago = async () => {
    if (!pagoAEliminar || !pagoAEliminar.id) {
      console.error("No se ha seleccionado un pago o falta el ID.");
      setMensaje({ tipo: "error", texto: "No se ha seleccionado un pago para eliminar." });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("pagos_clientes")
      .update({ eliminado: true })
      .eq("id", pagoAEliminar.id);

    if (error) {
      console.error("Error al eliminar pago:", error);
      setMensaje({ tipo: "error", texto: "Error al eliminar pago." });
    } else {
      setMensaje({ tipo: "success", texto: "Pago eliminado exitosamente." });
      setConfirmarEliminacion(false); // Cerrar el cuadro de confirmación
      fetchPagos();
      fetchContratos();
      setEditando(false);
      setPagoSeleccionado(null);
      setForm({ contrato_id: "", categoria: "", referencia: "", metodo: "", fecha_pago: "", monto: "" });
    }

    setLoading(false);
  };


  const generarReporte = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Pagos de Clientes", 10, 15);
    doc.setFontSize(8);

    const headers = ["Contrato", "Categoría", "Referencia", "Método", "Fecha", "Monto"];
    const startY = 25;

    headers.forEach((h, i) => doc.text(h, 10 + i * 30, startY));
    doc.line(10, startY + 2, 200, startY + 2);

    let currentY = startY + 6;
    pagos.forEach((p) => {
      const contrato = contratosFiltro.find((c) => c.id === p.contrato_id);
      const nombreContrato = contrato ? `${contrato.proyectos.nombre} - ${contrato.clientes.nombre}` : p.contrato_id;
      doc.text(nombreContrato || "", 10, currentY);
      doc.text(p.categoria, 40, currentY);
      doc.text(p.referencia, 70, currentY);
      doc.text(p.metodo, 100, currentY);
      doc.text(p.fecha_pago.split("T")[0], 130, currentY);
      doc.text(String(p.monto), 160, currentY);
      currentY += 6;
    });

    doc.save("reporte_pagos_clientes.pdf");
  };

  useEffect(() => {
    fetchPagos();
    fetchContratos();
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
        <h2 className="text-xl font-semibold text-primary dark:text-gray-100">{editando ? "Editar Pago" : "Registrar Pago"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "contrato_id", label: "Contrato", type: "select", options: contratos.map(c => ({ id: c.id, nombre: `${c.proyectos.nombre} - ${c.clientes.nombre}` })) },
            { name: "categoria", label: "Categoría", type: "text" },
            { name: "referencia", label: "Referencia", type: "text" },
            { name: "metodo", label: "Método", type: "text" },
            { name: "fecha_pago", label: "Fecha de pago", type: "date" },
            { name: "monto", label: "Monto", type: "number" },
          ].map(field => (
            <div key={field.name}>
              <label className="block mb-1 font-medium capitalize dark:text-gray-100">{field.label}</label>
              {field.type === "select" ? (
                <select
                  required
                  value={form[field.name as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  className="w-full border p-2 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                >
                  <option value="">Selecciona</option>
                  {field.options?.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  required
                  value={form[field.name as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
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
            {loading ? "Cargando..." : editando ? "Actualizar pago" : "Registrar pago"}
          </button>
          {editando && usuario?.rol === 'admin' && (
            <button
              type="button"
              onClick={() => setConfirmarEliminacion(true)}
              className="w-full bg-red-600 border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-red-700 transition-all dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
            >
              Eliminar Pago
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
                onClick={handleEliminarPago}
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
          <h2 className="text-xl font-semibold text-primary dark:text-gray-100">Pagos Registrados</h2>
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
            {
              label: "Contrato",
              name: "contrato_id",
              type: "select",
              options: contratosFiltro,
              isObject: true,
              getLabel: (c: any) => `${c.proyectos?.nombre || ''} - ${c.clientes?.nombre || ''}`,
            },
            { label: "Categoría", name: "categoria", type: "text" },
            { label: "Método", name: "metodo", type: "text" },
            { label: "Fecha de Pago", name: "fecha_pago", type: "date" },
            { label: "Monto", name: "monto", type: "number" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium mb-1 dark:text-gray-100">{f.label}</label>
              {f.type === "select" ? (
                <select
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
                  {Array.isArray(f.options) &&
                    f.options.map((option: any) => (
                      <option key={option.id} value={option.id}>
                        {f.isObject && f.getLabel ? f.getLabel(option) : option}
                      </option>
                    ))}
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
                <th className="border p-3">Contrato</th>
                <th className="border p-3">Categoría</th>
                <th className="border p-3">Referencia</th>
                <th className="border p-3">Método</th>
                <th className="border p-3">Fecha</th>
                <th className="border p-3">Monto</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => {
                const contrato = contratosFiltro.find((c) => c.id === p.contrato_id);
                const nombreContrato = contrato ? `${contrato.proyectos.nombre} - ${contrato.clientes.nombre}` : p.contrato_id;
                return (
                  <tr key={p.id} className="hover:bg-primary/10 dark:hover:bg-zinc-800">
                    <td className="border p-3 hover:bg-gray-50 group relative border-gray-300 dark:hover:bg-zinc-800 dark:border-gray-700">
                      <div className="relative">
                        <span className="group-hover:opacity-0 transition-opacity">{nombreContrato}</span>
                        <button
                          onClick={() => handleEdit(p)}
                          className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-primary dark:text-gray-400"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                    <td className="border p-3 dark:border-gray-700 border-gray-300">{p.categoria}</td>
                    <td className="border p-3 dark:border-gray-700 border-gray-300">{p.referencia}</td>
                    <td className="border p-3 dark:border-gray-700 border-gray-300">{p.metodo}</td>
                    <td className="border p-3 dark:border-gray-700 border-gray-300">{p.fecha_pago?.split("T")[0]}</td>
                    <td className="border p-3 dark:border-gray-700 border-gray-300">${p.monto}</td>
                  </tr>
                );
              })}
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
