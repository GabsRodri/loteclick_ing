"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import jsPDF from "jspdf";

export default function LotesEmpleado() {
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


    const [lotes, setLotes] = useState<any[]>([]);
    const [proyectos, setProyectos] = useState<any[]>([]);
    const [proyectosFiltro, setProyectosFiltro] = useState<any[]>([]);
    const [form, setForm] = useState({
        proyecto_id: "",
        dimension: "",
        precio: "",
        disponibilidad: "",
        ubicacion: "",
    });

    const [filtros, setFiltros] = useState({
        proyecto_id: "",
        disponibilidad: "",
        ubicacion: "",
        precio_min: "",
        precio_max: "",
    });

    const [loading, setLoading] = useState(false);
    const [editando, setEditando] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
    const [registroSeleccionado, setRegistroSeleccionado] = useState<any>(null);
    const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
    const [loteAEliminar, setLoteAEliminar] = useState<any>(null);

    const fetchLotes = async () => {
        setSyncing(true);

        const desde = (pagina - 1) * porPagina;
        const hasta = desde + porPagina - 1;

        let query = supabase
            .from("lotes")
            .select("*, proyectos(nombre)", { count: "exact" }) // 👈 esto es clave
            .eq("eliminado", false);

        if (filtros.proyecto_id) query = query.eq("proyecto_id", filtros.proyecto_id);
        if (filtros.disponibilidad) query = query.eq("disponibilidad", filtros.disponibilidad);
        if (filtros.ubicacion) query = query.ilike("ubicacion", `%${filtros.ubicacion}%`);
        if (filtros.precio_min) query = query.gte("precio", parseFloat(filtros.precio_min));
        if (filtros.precio_max) query = query.lte("precio", parseFloat(filtros.precio_max));

        const { data, error, count } = await query.range(desde, hasta);

        if (!error) {
            setLotes(data || []);
            if (count !== null) setTotalPaginas(Math.ceil(count / porPagina));
        } else {
            console.error("Error al obtener lotes:", error.message);
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

        const payload = { ...form, dimension: parseFloat(form.dimension), precio: parseFloat(form.precio) };

        let error;
        if (editando) {
            ({ error } = await supabase.from("lotes").update(payload).eq("id", registroSeleccionado.id));
        } else {
            ({ error } = await supabase.from("lotes").insert(payload));
        }

        if (error) {
            setMensaje({ tipo: "error", texto: "Error al guardar el lote." });
        } else {
            setMensaje({ tipo: "success", texto: editando ? "Lote actualizado." : "Lote registrado." });
            setForm({ proyecto_id: "", dimension: "", precio: "", disponibilidad: "", ubicacion: "" });
            setEditando(false);
            fetchLotes();
        }

        setLoading(false);
    };

    const handleEdit = (registro: any) => {
        setRegistroSeleccionado(registro);
        setForm({
            proyecto_id: registro.proyecto_id,
            dimension: registro.dimension,
            precio: registro.precio,
            disponibilidad: registro.disponibilidad,
            ubicacion: registro.ubicacion,
        });
        setEditando(true);
        setLoteAEliminar(registro);
    };

    const handleEliminarLote = async () => {
        if (!loteAEliminar || !loteAEliminar.id) {
            setMensaje({ tipo: "error", texto: "No se ha seleccionado un lote para eliminar." });
            return;
        }

        setLoading(true);

        const { error } = await supabase
            .from("lotes")
            .update({ eliminado: true })
            .eq("id", loteAEliminar.id);

        if (error) {
            setMensaje({ tipo: "error", texto: "Error al eliminar el lote." });
        } else {
            setMensaje({ tipo: "success", texto: "Lote eliminado correctamente." });
            setConfirmarEliminacion(false);
            fetchLotes();
            fetchProyectos();
            setEditando(false);
            setRegistroSeleccionado(null);
            setForm({ proyecto_id: "", dimension: "", precio: "", disponibilidad: "", ubicacion: "" });
        }

        setLoading(false);
    };

    const generarReporte = () => {
        const doc = new jsPDF();
        doc.text("Reporte de Lotes", 10, 15);
        doc.setFontSize(8);

        const headers = ["Proyecto", "Dimensión", "Precio", "Disponibilidad", "Ubicación"];
        const posicionesX = [10, 50, 90, 130, 170];
        const startY = 25;

        headers.forEach((h, i) => doc.text(h, posicionesX[i], startY));
        doc.line(10, startY + 2, 200, startY + 2);

        let currentY = startY + 6;

        lotes.forEach((r) => {
            const nombreProyecto = r.proyectos?.nombre || r.proyecto_id;
            doc.text(nombreProyecto, posicionesX[0], currentY);
            doc.text(`${r.dimension} m²`, posicionesX[1], currentY);
            doc.text(`$${r.precio}`, posicionesX[2], currentY);
            doc.text(r.disponibilidad, posicionesX[3], currentY);
            doc.text(r.ubicacion, posicionesX[4], currentY);
            currentY += 6;
        });

        doc.save("reporte_lotes.pdf");
    };

    useEffect(() => {
        fetchLotes();
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
                <h2 className="text-xl font-semibold text-primary dark:text-gray-100">{editando ? "Editar Lote" : "Registrar Lote"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {[{ name: "proyecto_id", label: "Proyecto", type: "select", options: proyectos, labelField: "nombre" },
                    { name: "dimension", label: "Dimensión (m²)", type: "number" },
                    { name: "precio", label: "Precio", type: "number" },
                    { name: "disponibilidad", label: "Disponibilidad", type: "select", options: ["Disponible", "Reservado", "Vendido"] },
                    { name: "ubicacion", label: "Ubicación", type: "text" }].map((field) => (
                        <div key={field.name}>
                            <label className="block mb-1 font-medium capitalize dark:text-gray-100">{field.label}</label>
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
                                    required
                                    value={form[field.name as keyof typeof form] as string}
                                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                                    min={field.type === "number" ? 0 : undefined} // 👈 evitar negativos
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
                        {loading ? "Guardando..." : editando ? "Actualizar Lote" : "Registrar Lote"}
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
                                onClick={handleEliminarLote}
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
                    <h2 className="text-xl font-semibold text-primary dark:text-gray-100">Lotes Registrados</h2>
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
                    {[{ label: "Proyecto", name: "proyecto_id", type: "select", options: proyectosFiltro },
                    { label: "Disponibilidad", name: "disponibilidad", type: "select", options: ["Disponible", "Reservado", "Vendido"] },
                    { label: "Ubicación", name: "ubicacion", type: "text" },
                    { label: "Precio mínimo", name: "precio_min", type: "number" },
                    { label: "Precio máximo", name: "precio_max", type: "number" }].map((f) => (
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
                                <th className="border p-3">Dimensión</th>
                                <th className="border p-3">Precio</th>
                                <th className="border p-3">Disponibilidad</th>
                                <th className="border p-3">Ubicación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lotes.map((lote) => (
                                <tr key={lote.id} className="hover:bg-primary/10 dark:hover:bg-zinc-800">
                                    <td className="border p-3 hover:bg-gray-50 group relative border-gray-300 dark:hover:bg-zinc-800 dark:border-gray-700">
                                        <div className="relative">
                                            <span className="group-hover:opacity-0 transition-opacity">
                                                {lote.proyectos?.nombre || "Sin nombre"}
                                            </span>
                                            <button
                                                onClick={() => handleEdit(lote)}
                                                className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-primary dark:text-gray-400"
                                            >
                                                Editar
                                            </button>
                                        </div>
                                    </td>
                                    <td className="border p-3 dark:border-gray-700 border-gray-300">{lote.dimension} m²</td>
                                    <td className="border p-3 dark:border-gray-700 border-gray-300">${lote.precio}</td>
                                    <td className="border p-3 dark:border-gray-700 border-gray-300">{lote.disponibilidad}</td>
                                    <td className="border p-3 dark:border-gray-700 border-gray-300">{lote.ubicacion}</td>
                                </tr>
                            ))}
                            {lotes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                        No hay lotes registrados.
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
