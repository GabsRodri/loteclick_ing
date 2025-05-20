"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import jsPDF from "jspdf";

export default function ClientesEmpleado() {
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

  const [clientes, setClientes] = useState<any[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    direccion: "",
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [filtros, setFiltros] = useState({
    nombre: "",
    correo: "",
    telefono: "",
  });
  const [editando, setEditando] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState<any>(null);

  const fetchClientes = async () => {
    setSyncing(true);

    const desde = (pagina - 1) * porPagina;
    const hasta = desde + porPagina - 1;

    let query = supabase.from("clientes").select("*", { count: "exact" }).eq("eliminado", false).range(desde, hasta);

    if (filtros.nombre?.trim()) {
      query = query.ilike("nombre", `%${filtros.nombre}%`);
    }

    if (filtros.correo?.trim()) {
      query = query.ilike("correo", `%${filtros.correo}%`);
    }

    if (filtros.telefono?.trim()) {
      query = query.ilike("telefono", `%${filtros.telefono}%`);
    }

    const { data, error, count } = await query;

    
    if (!error) {
      setClientes(data || []);
      if (count !== null) {
        setTotalPaginas(Math.ceil(count / porPagina));
      }
    }
    else console.error("Error al obtener clientes:", error.message);

    setSyncing(false);
    console.log("Clientes obtenidos:", data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    if (editando) {
      const { error } = await supabase
        .from("clientes")
        .update({
          nombre: form.nombre,
          correo: form.correo,
          telefono: form.telefono,
          direccion: form.direccion,
        })
        .eq("id", clienteSeleccionado.id);

      if (error) {
        setMensaje({ tipo: "error", texto: "Error al actualizar cliente." });
      } else {
        setMensaje({ tipo: "success", texto: "Cliente actualizado exitosamente." });
        setForm({ nombre: "", correo: "", telefono: "", direccion: "" });
        setEditando(false);
        setClienteSeleccionado(null);
        fetchClientes();
      }
    } else {
      const { error } = await supabase.from("clientes").insert({
        nombre: form.nombre,
        correo: form.correo,
        telefono: form.telefono,
        direccion: form.direccion,
      });

      if (error) {
        setMensaje({ tipo: "error", texto: "Error al registrar cliente." });
      } else {
        setMensaje({ tipo: "success", texto: "Cliente registrado exitosamente." });
        setForm({ nombre: "", correo: "", telefono: "", direccion: "" });
        fetchClientes();
      }
    }

    setLoading(false);
  };


const handleEliminarCliente = async () => {
  if (!clienteAEliminar || !clienteAEliminar.id) {
    console.error("No se ha seleccionado un cliente o falta el ID.");
    setMensaje({ tipo: "error", texto: "No se ha seleccionado un cliente para eliminar." });
    return;
  }

  setLoading(true);

   const { error } = await supabase
      .from("clientes")
      .update({ eliminado: true })
      .eq("id", clienteAEliminar.id);

  if (error) {
    console.error("Error al eliminar cliente:", error);
    setMensaje({ tipo: "error", texto: "Error al eliminar cliente." });
  } else {
    setMensaje({ tipo: "success", texto: "Cliente eliminado exitosamente." });
    setConfirmarEliminacion(false); // Cerrar el cuadro de confirmación
    fetchClientes(); // Volver a cargar los clientes
    setEditando(false);
    setClienteSeleccionado(null);
    setForm({ nombre: "", correo: "", telefono: "", direccion: "" });
  }

  setLoading(false);
};


  const generarReporte = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Reporte de Clientes", 10, 15);

    doc.setFont("helvetica", "plain");
    doc.setFontSize(8);

    const headers = ["Nombre", "Correo", "Teléfono", "Dirección"];
    const colWidths = [40, 60, 40, 70]; // Ancho de cada columna (ajustado)

    const startY = 25; // Y de inicio para las cabeceras
    let currentY = startY + 10; // Espacio para las filas

    // Dibuja las cabeceras
    headers.forEach((h, i) => {
      const x = 10 + colWidths.slice(0, i).reduce((a, b) => a + b, 0); // Calcula la posición X
      doc.text(h, x, startY);
    });

    // Dibuja la línea de separación
    doc.line(10, startY + 2, 200, startY + 2);

    clientes.forEach((c) => {
      const data = [
        c.nombre,
        c.correo,
        c.telefono,
        c.direccion,
      ];

      data.forEach((dato, i) => {
        const x = 10 + colWidths.slice(0, i).reduce((a, b) => a + b, 0); // Calcula la posición X
        doc.text(dato, x, currentY);
      });

      currentY += 6; // Incrementa la posición Y para la siguiente fila
    });

    // Guarda el PDF
    doc.save("reporte_clientes.pdf");
  };

  const handleEdit = (c: any) => {
    setClienteSeleccionado(c);
    setForm({
      nombre: c.nombre,
      correo: c.correo,
      telefono: c.telefono,
      direccion: c.direccion,
    });
    setEditando(true);
    setClienteAEliminar(c);  // Establecemos el cliente a eliminar
  };

  useEffect(() => {
    fetchClientes();
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
        <h2 className="text-xl font-semibold text-primary dark:text-gray-100">{editando ? "Editar Cliente" : "Registrar Cliente"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {["nombre", "correo", "telefono", "direccion"].map((field) => (
            <div key={field}>
              <label className="block mb-1 font-medium capitalize dark:text-gray-100">{field}</label>
              <input
                required
                type={field === "telefono" ? "tel" : "text"}
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
              />
            </div>
          ))}

          <button type="submit" disabled={loading} className="w-full bg-primary border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800">
            {loading ? "Guardando..." : editando ? "Actualizar Cliente" : "Guardar Cliente"}
          </button>

          {editando && usuario?.rol === 'admin' && (
            <button
              type="button"
              onClick={() => setConfirmarEliminacion(true)}
              className="w-full bg-red-600 border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-red-700 transition-all dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
            >
              Eliminar Cliente
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
                onClick={handleEliminarCliente}
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
          <h2 className="text-xl font-semibold text-primary dark:text-gray-100">Clientes Registrados</h2>
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
        <div className="border p-3 rounded-md grid sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-background shadow-sm dark:border-gray-700">
          {[
            { label: "Nombre", name: "nombre", type: "text" },
            { label: "Correo", name: "correo", type: "text" },
            { label: "Teléfono", name: "telefono", type: "text" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium mb-1 dark:text-gray-100">{f.label}</label>
              <input
                type={f.type}
                value={filtros[f.name as keyof typeof filtros]}
                onChange={(e) => setFiltros({ ...filtros, [f.name]: e.target.value })}
                className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
              />
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="scrollable overflow-x-auto mt-4">
          <table className="w-full min-w-[600px] border text-xs bg-background shadow-lg rounded-md dark:border-gray-700">
            <thead className="bg-primary text-background dark:bg-black dark:text-gray-100">
              <tr className=" dark:border-gray-700 border-gray-300">
                <th className="border p-3">Nombre</th>
                <th className="border p-3">Correo</th>
                <th className="border p-3">Teléfono</th>
                <th className="border p-3">Dirección</th>
                <th className="border p-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {clientes?.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-primary/10 dark:hover:bg-zinc-800">
                  <td className="border p-3 hover:bg-gray-50 group relative border-gray-300 dark:hover:bg-zinc-800 dark:border-gray-700">
                    <div className="relative">
                      <span className="group-hover:opacity-0 transition-opacity">{cliente.nombre}</span>
                      <button
                        onClick={() => handleEdit(cliente)}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-primary dark:text-gray-400"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{cliente.correo}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{cliente.telefono}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{cliente.direccion}</td>
                  <td className="border p-3 dark:border-gray-700 border-gray-300">{new Date(cliente.fecha).toISOString().split("T")[0]}</td>
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
