"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import jsPDF from "jspdf";

export default function EntregablesEmpleado() {
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

    const [entregables, setEntregables] = useState<any[]>([]);
    const [proyectos, setProyectos] = useState<any[]>([]);
    const [proyectosFiltro, setProyectosFiltro] = useState<any[]>([]);
    const [form, setForm] = useState({
        proyecto_id: "",
        nombre: "",
        descripcion: "",
        fecha_entrega: "",
        estado: "",
    });

    const [filtros, setFiltros] = useState({
        proyecto_id: "",
        estado: "",
        fecha_entrega: "",
        nombre: "",
    });

    const [loading, setLoading] = useState(false);
    const [editando, setEditando] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
    const [registroSeleccionado, setRegistroSeleccionado] = useState<any>(null);
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
    const [entregableAEliminar, setEntregableAEliminar] = useState<any>(null);

    const fetchEntregables = async () => {
        setSyncing(true);

        const desde = (pagina - 1) * porPagina;
        const hasta = desde + porPagina - 1;

        let query = supabase
            .from("entregables")
            .select("*, proyectos(nombre)", { count: "exact" })
            .eq("eliminado", false);

        if (filtros.proyecto_id) query = query.eq("proyecto_id", filtros.proyecto_id);
        if (filtros.estado) query = query.eq("estado", filtros.estado);
        if (filtros.fecha_entrega) query = query.eq("fecha_entrega", filtros.fecha_entrega);
        if (filtros.nombre) query = query.ilike("nombre", `%${filtros.nombre}%`);

        const { data, error, count } = await query.range(desde, hasta);

        if (!error) {
            setEntregables(data || []);
            if (count !== null) setTotalPaginas(Math.ceil(count / porPagina));
        } else {
            console.error("Error al obtener entregables:", error.message);
        }

        setSyncing(false);
    };


    const fetchProyectos = async () => {
        const { data, error } = await supabase.from("proyectos").select("id, nombre").eq("eliminado", false);
        if (!error) setProyectos(data || []);

        const { data: dataF, error: errorF } = await supabase.from("proyectos").select("id, nombre");
        if (!errorF) setProyectosFiltro(dataF || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let error;
        if (editando) {
            ({ error } = await supabase.from("entregables").update(form).eq("id", registroSeleccionado.id));
        } else {
            ({ error } = await supabase.from("entregables").insert(form));
        }

        if (error) {
            setMensaje({ tipo: "error", texto: "Error al guardar el entregable." });
        } else {
            setMensaje({ tipo: "success", texto: editando ? "Entregable actualizado." : "Entregable registrado." });
            setForm({ proyecto_id: "", nombre: "", descripcion: "", fecha_entrega: "", estado: "" });
            setEditando(false);
            fetchEntregables();
        }

        setLoading(false);
    };

    const handleEdit = (registro: any) => {
        setRegistroSeleccionado(registro);
        setForm({
            proyecto_id: registro.proyecto_id,
            nombre: registro.nombre,
            descripcion: registro.descripcion,
            fecha_entrega: registro.fecha_entrega,
            estado: registro.estado,
        });
        setEditando(true);
        setEntregableAEliminar(registro);
    };

    const handleEliminarEntregable = async () => {
        if (!entregableAEliminar || !entregableAEliminar.id) {
            setMensaje({ tipo: "error", texto: "No se ha seleccionado un entregable para eliminar." });
            return;
        }

        setLoading(true);

        const { error } = await supabase
            .from("entregables")
            .update({ eliminado: true })
            .eq("id", entregableAEliminar.id);

        if (error) {
            setMensaje({ tipo: "error", texto: "Error al eliminar el entregable." });
        } else {
            setMensaje({ tipo: "success", texto: "Entregable eliminada correctamente." });
            setConfirmarEliminacion(false);
            fetchEntregables();
            fetchProyectos();
            setEditando(false);
            setRegistroSeleccionado(null);
            setForm({ proyecto_id: "", nombre: "", descripcion: "", fecha_entrega: "", estado: "" });
        }

        setLoading(false);
    };

    const generarReporte = () => {
        const doc = new jsPDF();
        doc.text("Reporte de Entregables", 10, 15);
        doc.setFontSize(8);

        const headers = ["Proyecto", "Nombre", "Descripción", "Fecha", "Estado"];
        const posicionesX = [10, 35, 60, 150, 170];
        const startY = 25;

        headers.forEach((h, i) => doc.text(h, posicionesX[i], startY));
        doc.line(10, startY + 2, 200, startY + 2);

        let currentY = startY + 6;
        entregables.forEach((r) => {
            const nombreProyecto = r.proyectos?.nombre || r.proyecto_id;
            doc.text(nombreProyecto, posicionesX[0], currentY);
            doc.text(r.nombre, posicionesX[1], currentY);

            // Ajustar la descripción en múltiples líneas
            const descripcion = r.descripcion || "-";
            const descripcionMaxWidth = 80; // Máximo ancho para la descripción
            const descripcionLines = doc.splitTextToSize(descripcion, descripcionMaxWidth);

            // Escribir cada línea de la descripción
            descripcionLines.forEach((line: string, idx: number) => {
                doc.text(line, posicionesX[2], currentY + (idx * 6)); // Ajustar la posición Y por cada línea
            });

            doc.text(r.fecha_entrega, posicionesX[3], currentY);
            doc.text(r.estado, posicionesX[4], currentY);
            currentY += 6 * descripcionLines.length;
        });

        doc.save("reporte_entregables.pdf");
    };

    useEffect(() => {
        fetchEntregables();
        fetchProyectos();
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
                <h2 className="text-xl font-semibold text-primary dark:text-gray-100">{editando ? "Editar Entregable" : "Registrar Entregable"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {[{ name: "proyecto_id", label: "Proyecto", type: "select", options: proyectos, labelField: "nombre" },
                    { name: "nombre", label: "Nombre", type: "text" },
                    { name: "descripcion", label: "Descripción", type: "text" },
                    { name: "fecha_entrega", label: "Fecha de Entrega", type: "date" },
                    { name: "estado", label: "Estado", type: "select", options: ["Pendiente", "En proceso", "Entregado"] }].map((field) => (
                        <div key={field.name}>
                            <label className="block mb-1 font-medium capitalize dark:text-gray-100">{field.label}</label>
                            {field.name === "descripcion" ? (
                                <textarea
                                    required
                                    value={form.descripcion}
                                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                    className="resizable scrollable w-full border p-2 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                                />
                            ) : field.type === "select" ? (
                                <select
                                    required
                                    value={form[field.name as keyof typeof form]}
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
                                    value={form[field.name as keyof typeof form]}
                                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                                    className="w-full border p-2 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                                />
                            )}
                        </div>
                    ))}
                    <button type="submit" disabled={loading} className="w-full bg-primary border border-primary-foreground text-background px-4 py-2 rounded-md hover:bg-primary/90 transition-all dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800">
                        {loading ? "Guardando..." : editando ? "Actualizar" : "Registrar"}
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
                                onClick={handleEliminarEntregable}
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
                    <h2 className="text-xl font-semibold text-primary dark:text-gray-100">Entregables Registrados</h2>
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
                    {[{ label: "Proyecto", name: "proyecto_id", type: "select", options: proyectosFiltro },
                    { label: "Nombre", name: "nombre", type: "text" },
                    { label: "Estado", name: "estado", type: "select", options: ["Pendiente", "En proceso", "Entregado"] },
                    { label: "Fecha de Entrega", name: "fecha_entrega", type: "date" }].map((f) => (
                        <div key={f.name}>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-100">{f.label}</label>
                            {f.type === "select" ? (
                                <select
                                    value={filtros[f.name as keyof typeof filtros]}
                                    onChange={(e) => setFiltros({ ...filtros, [f.name]: e.target.value })}
                                    className="w-full border p-1 rounded-md bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:focus:ring-zinc-800"
                                >
                                    <option value="">Selecciona</option>
                                    {f.options?.map((option: any) => (
                                        <option key={option.id || option} value={option.id || option}>
                                            {option.nombre || option}
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
                                <th className="border p-3">Proyecto</th>
                                <th className="border p-3">Nombre</th>
                                <th className="border p-3">Descripción</th>
                                <th className="border p-3">Fecha de Entrega</th>
                                <th className="border p-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entregables.map((e) => (
                                <tr key={e.id} className="hover:bg-primary/10 dark:hover:bg-zinc-800">
                                    <td className="border p-3 hover:bg-gray-50 group relative border-gray-300 dark:hover:bg-zinc-800 dark:border-gray-700">
                                        <div className="relative">
                                            <span className="group-hover:opacity-0 transition-opacity">
                                                {e.proyectos?.nombre || e.proyecto_id}
                                            </span>
                                            <button
                                                onClick={() => handleEdit(e)}
                                                className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-primary dark:text-gray-400"
                                            >
                                                Editar
                                            </button>
                                        </div>
                                    </td>
                                    <td className="border p-3 dark:border-gray-700 border-gray-300">{e.nombre}</td>
                                    <td className="border p-3 max-w-[200px] dark:border-gray-700 border-gray-300">
                                        <div className="scrollable max-h-[40px] overflow-y-auto whitespace-normal text-sm">
                                            {e.descripcion}
                                        </div>
                                    </td>
                                    <td className="border p-3 dark:border-gray-700 border-gray-300">{e.fecha_entrega}</td>
                                    <td className="border p-3 dark:border-gray-700 border-gray-300">{e.estado}</td>
                                </tr>
                            ))}
                            {entregables.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                        No hay entregables registrados.
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