"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";

export default function SupervisorDashboardLegal() {
  const supabase = createClient();
  const router = useRouter();

  const [pagina, setPagina] = useState(1);
  const [porPagina] = useState(5); // puedes cambiar a 20, 50, etc.
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [rol, setRol] = useState<string | null>(null);
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingTransacciones, setLoadingTransacciones] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [filteredTransacciones, setFilteredTransacciones] = useState<any[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [legalAEliminar, setLegalAEliminar] = useState<any>(null);

  const [form, setForm] = useState({
    tipo: "",
    descripcion: "",
    valor: "",
    estado_legal: "válido",
  });

  const [filtro, setFiltro] = useState({
    tipo: "",
    estado: "",
    descripcion: "",
    valor_min: "",
    valor_max: "",
  });

  // Obtener usuario
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push("/sign-in");
        return;
      }

      setUserEmail(user.email ?? null);
      setUserId(user.id);

      const { data: userInfo, error: userError } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .single();

      if (userError || !userInfo) {
        router.push("/unauthorized");
        return;
      }

      if (userInfo.rol !== "admin" && userInfo.rol !== "supervisor") {
        router.push("/unauthorized");
        return;
      }

      setRol(userInfo.rol);
      setLoadingUser(false);
    };

    fetchUser();
  }, [supabase, router]);

  // Obtener transacciones
  useEffect(() => {
  if (!loadingUser) {
    const fetchData = async () => {
      setLoadingTransacciones(true);

      const from = (pagina - 1) * porPagina;
      const to = from + porPagina - 1;

      const { data, count, error } = await supabase
        .from("transacciones_legales")
        .select("*", { count: "exact" })
        .eq("eliminado", false)
        .order("fecha", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Error al obtener transacciones:", error.message);
      } else if (data) {
        setTransacciones(data);
        setFilteredTransacciones(data);
        setTotalPaginas(Math.ceil((count || 0) / porPagina));
      }

      setLoadingTransacciones(false);
    };

    fetchData();
  }
}, [loadingUser, supabase, pagina]);


  // Obtener filtros
  useEffect(() => {
    const filtradas = transacciones.filter((t) => {
      const tipoOk = t.tipo.toLowerCase().includes(filtro.tipo.toLowerCase());
      const descripcionOk = t.descripcion.toLowerCase().includes(filtro.descripcion.toLowerCase());
      const estadoLegalOk = t.estado_legal.toLowerCase().includes(filtro.estado.toLowerCase());

      // Convertir el valor a número para comparación
      const valor = Number(t.valor);
      const valorMinOk = filtro.valor_min === "" || valor >= Number(filtro.valor_min);
      const valorMaxOk = filtro.valor_max === "" || valor <= Number(filtro.valor_max);

      return tipoOk && descripcionOk && estadoLegalOk && valorMinOk && valorMaxOk;
    });

    setFilteredTransacciones(filtradas);
  }, [filtro, transacciones]);


  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const dataToSend = {
      tipo: form.tipo,
      descripcion: form.descripcion,
      valor: parseFloat(form.valor),
      estado_legal: form.estado_legal,
    };

    if (editandoId) {
      const { error } = await supabase.from("transacciones_legales").update(dataToSend).eq("id", editandoId);
      if (error) {
        setSuccessMessage({ tipo: "error", texto: "Error al actualizar: " + error.message });
      } else {
        setSuccessMessage({ tipo: "success", texto: "Transacción actualizada exitosamente." });
      }
    } else {
      const { error } = await supabase.from("transacciones_legales").insert({
        ...dataToSend,
        usuario_id: userId,
        fecha: new Date(),
        creado_por: userEmail,
      });

      if (error) {
        setSuccessMessage({ tipo: "error", texto: "Error: " + error.message });
      } else {
        setSuccessMessage({ tipo: "success", texto: "Transacción registrada exitosamente." });
      }
    }

    setForm({ tipo: "", descripcion: "", valor: "", estado_legal: "válido" });
    setEditandoId(null);
    const { data } = await supabase.from("transacciones_legales").select("*").order("fecha", { ascending: false }).eq("eliminado", false);
    if (data) {
      setTransacciones(data);
      setFilteredTransacciones(data);
    }

    setTimeout(() => setSuccessMessage(null), 4000);
    setLoading(false);
  };

  const handleEdit = (t: any) => {
    setForm({
      tipo: t.tipo,
      descripcion: t.descripcion,
      valor: t.valor,
      estado_legal: t.estado_legal,
    });
    setEditandoId(t.id);
    setLegalAEliminar(t);
  };

  const handleEliminarLegal = async () => {
    if (!legalAEliminar || !legalAEliminar.id) {
      setSuccessMessage({ tipo: "error", texto: "No se ha seleccionado una transacción para eliminar." });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("transacciones_legales")
      .update({ eliminado: true })
      .eq("id", legalAEliminar.id);

    if (error) {
      setSuccessMessage({ tipo: "error", texto: "Error al eliminar la transacción." });
    } else {
      setSuccessMessage({ tipo: "success", texto: "Transacción eliminada correctamente." });
      setConfirmarEliminacion(false);

      setForm({ tipo: "", descripcion: "", valor: "", estado_legal: "válido" });
      setEditandoId(null);
      const { data } = await supabase.from("transacciones_legales").select("*").order("fecha", { ascending: false }).eq("eliminado", false);
      if (data) {
        setTransacciones(data);
        setFilteredTransacciones(data);
      }
    }
     setTimeout(() => setSuccessMessage(null), 4000);
    setLoading(false);
  };


  const handleGenerarPDF = () => {
    const doc = new jsPDF();

    let y = 15;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte Legal de Transacciones", 14, y);
    y += 10;

    // Encabezados
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Tipo", 14, y);
    doc.text("Descripción", 44, y);
    doc.text("Valor", 114, y);
    doc.text("Estado", 144, y);
    doc.text("Fecha", 174, y);
    y += 3;
    doc.line(14, y, 200, y); // Línea debajo del encabezado
    y += 5;

    transacciones.forEach((t, index) => {
      const fecha = new Date(t.fecha).toLocaleDateString();
      const descripcion = t.descripcion.length > 40 ? t.descripcion.slice(0, 37) + "..." : t.descripcion;

      if (y > pageHeight - 20) {
        doc.addPage();
        y = 15;
      }

      doc.text(t.tipo, 14, y);
      doc.text(descripcion, 44, y);
      doc.text(`$${t.valor}`, 114, y);
      doc.text(t.estado_legal, 144, y);
      doc.text(fecha, 174, y);

      y += 7;
    });

    doc.save("reporte_transacciones_legales.pdf");
  };

  const hayVencidas = filteredTransacciones.some(t => t.estado_legal === "Vencido");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 mt-1 px-4 w-full max-w-7xl mx-auto">

      {/* Panel izquierdo - Formulario */}
      <div className="p-6 border rounded-lg shadow-md bg-background space-y-4 w-full max-w-md dark:border-gray-700">
        <h2 className="text-xl font-semibold text-primary dark:text-gray-100">{editandoId ? "Editar Transacción" : "Registrar Transacción Legal"}</h2>

        {successMessage && (
          <div
            className={`text-background px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all duration-300 ${successMessage.tipo === "success" ? "bg-green-600 dark:bg-green-950" : "bg-red-600 dark:bg-red-950"
              }`}
          >
            {successMessage.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium dark:text-gray-100">Tipo de transacción</label>
            <input
              type="text"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
              placeholder="Ej: Compra, contrato, etc."
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium dark:text-gray-100">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="scrollable resizable w-full border p-2 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
              placeholder="Detalles de la transacción"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium dark:text-gray-100">Valor</label>
            <input
              type="number"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
              placeholder="Ej: 500000"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium dark:text-gray-100">Estado legal</label>
            <select
              value={form.estado_legal}
              onChange={(e) => setForm({ ...form, estado_legal: e.target.value })}
              className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
              required
            >
              <option value="">Selecciona estado</option>
              <option value="Válido">Válido</option>
              <option value="Vencido">Vencido</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
          >
            {loading ? "Registrando..." : editandoId ? "Actualizar Transacción" : "Registrar Transacción"}
          </button>
         {editandoId && rol === 'admin' && (
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
                onClick={handleEliminarLegal}
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


      {/* Panel derecho - Tabla */}
      <div className="p-6 border rounded-lg shadow-md bg-background w-full overflow-x-auto dark:border-gray-700">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-primary dark:text-gray-100">
            Transacciones Registradas
          </h2>
          <div className="flex items-center gap-4">
            <button onClick={handleGenerarPDF} className="bg-secundary border text-secundary-foreground px-4 py-1 rounded-md shadow-md hover:bg-gray-100 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800">Generar Reporte</button>
          </div>
        </div>

        {/* Filtros */}
        <div className="border p-3 rounded-md grid sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-background shadow-sm dark:border-gray-700">
          {[
            { label: "Tipo", name: "tipo", type: "text", placeholder: "Ej: Ingreso, Gasto" },
            { label: "Estado Legal", name: "estado", type: "select", options: ["Válido", "Pendiente", "Vencido"] },
            { label: "Descripción", name: "descripcion", type: "text", placeholder: "Buscar por texto" },
            { label: "Valor Mínimo", name: "valor_min", type: "number", placeholder: "Desde..." },
            { label: "Valor Máximo", name: "valor_max", type: "number", placeholder: "Hasta..." },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium mb-1 dark:text-gray-100">{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={filtro[f.name as keyof typeof filtro]}
                  onChange={(e) => setFiltro({ ...filtro, [f.name]: e.target.value })}
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
                  placeholder={f.placeholder}
                  value={filtro[f.name as keyof typeof filtro]}
                  onChange={(e) => setFiltro({ ...filtro, [f.name]: e.target.value })}
                  className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                />
              )}
            </div>
          ))}
        </div>

        {hayVencidas && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm shadow-md dark:bg-red-800 dark:border-red-600 dark:text-red-300">
            Se han detectado transacciones con permisos de construcción vencidos. Verifica su estado para evitar problemas legales.
          </div>
        )}

        {/* Tabla */}
        <div className="scrollable overflow-x-auto mt-4">
          <table className="w-full min-w-[600px] border text-xs bg-background shadow-lg rounded-md dark:border-gray-700">
            <thead className="bg-primary text-background dark:bg-black dark:text-gray-100">
              <tr>
                <th className="border p-3 dark:border-gray-700 border-gray-300">Tipo</th>
                <th className="border p-3 dark:border-gray-700 border-gray-300">Descripción</th>
                <th className="border p-3 dark:border-gray-700 border-gray-300">Valor</th>
                <th className="border p-3 dark:border-gray-700 border-gray-300">Estado Legal</th>
                <th className="border p-3 dark:border-gray-700 border-gray-300">Fecha</th>
                <th className="border p-3 dark:border-gray-700 border-gray-300">Creado por</th>
              </tr>
            </thead>
            <tbody>
              {loadingTransacciones ? (
                <tr className="hover:bg-primary/10 dark:hover:bg-zinc-800">
                  <td colSpan={6} className="text-sm text-gray-500 animate-pulse dark:text-gray-400">
                    Cargando transacciones...
                  </td>
                </tr>
              ) : (
                filteredTransacciones.map((t) => (
                  <tr key={t.id} className="hover:bg-primary/10 dark:hover:bg-zinc-800">
                    <td className="border p-3 hover:bg-gray-50 group relative dark:hover:bg-zinc-800 dark:border-gray-700">
                      <div className="relative">
                        <span className="group-hover:opacity-0 transition-opacity">{t.tipo}</span>
                        <button
                          onClick={() => handleEdit(t)}
                          className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-primary dark:text-gray-400"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                    <td className="border p-3 max-w-[200px] dark:border-gray-700 border-gray-300">
                      <div className="scrollable max-h-[40px] overflow-y-auto whitespace-normal text-sm">
                        {t.descripcion}
                      </div>
                    </td>
                    <td className="border p-3 dark:border-gray-700 border-gray-300">${t.valor}</td>
                    <td className="border p-3 dark:border-gray-700 border-gray-300">{t.estado_legal}</td>
                    <td className="border p-3 dark:border-gray-700 border-gray-300">{new Date(t.fecha).toLocaleString()}</td>
                    <td className="border p-3 dark:border-gray-700 border-gray-300">{t.creado_por}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setPagina((prev) => Math.max(prev - 1, 1))}
            disabled={pagina === 1}
            className="px-3 py-1 border rounded-md bg-primary border-primary-foreground text-background hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
          >
            Anterior
          </button>

          <span className="text-sm dark:text-gray-100">Página {pagina} de {totalPaginas}</span>

          <button
            onClick={() => setPagina((prev) => Math.min(prev + 1, totalPaginas))}
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