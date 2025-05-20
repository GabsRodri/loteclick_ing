'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from "next/navigation";
import jsPDF from 'jspdf'

export default function CapacitacionPage() {
    const [email, setEmail] = useState('')
    const [rol, setRol] = useState('')
    const [showPdf, setShowPdf] = useState(false)
    const [pdfSrc, setPdfSrc] = useState('')
    const router = useRouter();

    useEffect(() => {
        const getUserData = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            const { data: existingUser } = await supabase
                .from('usuarios')
                .select('correo, rol')
                .eq('id', user?.id)
                .single()

            setEmail(existingUser?.correo || 'usuario@example.com')
            setRol(existingUser?.rol || 'empleado')
        }

        getUserData()
    }, [])

    const handleShowPDF = async () => {

        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const margin = 20;
        const lineHeight = 7;
        let pageCount = 6;

        const addFooter = (pageNumber: number) => {
            const pageHeight = doc.internal.pageSize.height;
            const date = new Date().toLocaleDateString();

            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`LoteClick - Capacitación | ${date}`, margin, pageHeight - 10);
            doc.text(`Página ${pageNumber}`, 105, pageHeight - 10, { align: "center" });
        };

        // Página 1 - Portada
        doc.setFont("helvetica", "bold").setFontSize(20);
        doc.text("LoteClick - Manual de Capacitación", 105, margin, { align: "center" });
        doc.setFont("helvetica", "normal").setFontSize(14).setTextColor(0);
        doc.text(
            "Bienvenido al manual de capacitación oficial del sistema LoteClick. Este documento tiene como objetivo proporcionar a los usuarios una comprensión completa del uso, operación y alcance del sistema desarrollado para la gestión y trazabilidad de proyectos de construcción.",
            margin, margin + 15, { maxWidth: 170 }
        );
        doc.text("Contenido del manual:", margin, margin + 45);
        const contenido = [
            "1. Acceso y autenticación",
            "2. Gestión de roles y permisos",
            "3. Auditoría y trazabilidad",
            "4. Acceso remoto y disponibilidad",
            "5. Capacitación digital y soporte",
            "6. Certificación y contacto"
        ];
        contenido.forEach((item, i) => {
            doc.text(`- ${item}`, margin + 10, margin + 55 + i * lineHeight);
        });
        addFooter(1);

        // Módulos 1 al 5 (como antes)...
        const modulos = [
            {
                titulo: "Módulo 1: Acceso y autenticación",
                texto: `El sistema LoteClick permite a los usuarios registrarse, iniciar sesión y recuperar su contraseña de manera segura. 
    La autenticación está basada en Supabase Auth, que proporciona mecanismos de seguridad robustos y modernos.
    
    Durante el proceso de registro, se valida automáticamente el correo electrónico y se asigna un rol predeterminado. 
    Además, la recuperación de contraseña se realiza mediante un enlace enviado por correo, lo que garantiza confidencialidad 
    y facilidad de uso. El acceso al sistema está protegido mediante políticas de Row-Level Security (RLS), impidiendo que un 
    usuario acceda a información fuera de su alcance.`
            },
            {
                titulo: "Módulo 2: Gestión de roles y permisos",
                texto: `LoteClick está estructurado en tres roles principales: admin, supervisor y empleado. 
    Cada rol tiene un conjunto de permisos específicos, definidos desde Supabase, y gestionados con funciones y RLS para 
    asegurar la segmentación del acceso.
    
    - El rol admin puede gestionar usuarios, ver todos los lotes, revisar auditorías y configurar parámetros del sistema.
    - El rol supervisor tiene acceso a la información de los lotes asignados y puede supervisar la actividad de los empleados.
    - El rol empleado solo puede registrar información y consultar datos asociados a sus responsabilidades.
    
    Estos permisos están codificados en funciones que se ejecutan al registrarse o iniciar sesión, lo que garantiza un control automático.`
            },
            {
                titulo: "Módulo 3: Auditoría y trazabilidad",
                texto: `La plataforma registra cada acción relevante en una tabla de auditoría, incluyendo el usuario, la acción, la fecha y la tabla afectada. 
    Esto permite reconstruir cualquier operación crítica, facilitando la supervisión y transparencia en los proyectos.
    
    Este sistema de trazabilidad se implementa mediante triggers (disparadores) automáticos en Supabase, sin afectar el rendimiento general. 
    Gracias a esto, cualquier cambio realizado por un empleado o supervisor queda registrado, evitando manipulaciones malintencionadas 
    y promoviendo la responsabilidad entre los usuarios.`
            },
            {
                titulo: "Módulo 4: Acceso remoto y disponibilidad",
                texto: `LoteClick es un sistema completamente en la nube. Tanto el frontend como el backend están desplegados en plataformas modernas como 
    Vercel y Railway, garantizando disponibilidad 24/7 y acceso desde cualquier lugar con conexión a internet.
    
    Esto permite a los usuarios trabajar desde campo, oficina o incluso dispositivos móviles sin necesidad de instalaciones adicionales. 
    Además, el sistema está optimizado para un rendimiento eficiente y bajo consumo de datos.`
            },
            {
                titulo: "Módulo 5: Capacitación digital y soporte",
                texto: `El sistema incluye herramientas de capacitación interna como este documento, así como documentación accesible en línea para nuevos empleados. 
    Se recomienda que todo el personal revise este manual antes de operar LoteClick.
    
    En caso de dudas o incidencias, el equipo de soporte puede ser contactado a través del canal oficial del proyecto. También se programan 
    capacitaciones periódicas que refuerzan el uso correcto del sistema, asegurando una operación eficiente y segura.`
            }
        ];

        modulos.forEach((modulo, index) => {
            doc.addPage();
            doc.setFont("helvetica", "bold").setFontSize(18);
            doc.text(modulo.titulo, margin, margin);
            doc.setFont("helvetica", "normal").setFontSize(14);
            doc.text(modulo.texto, margin, margin + 10, { maxWidth: 170 });
            addFooter(index + 2);
        });

        // Página final - Certificación y contacto
        doc.addPage();
        pageCount++;
        doc.setFont("helvetica", "bold").setFontSize(18);
        doc.text("Certificado de Finalización", 105, margin + 10, { align: "center" });

        doc.setFont("helvetica", "normal").setFontSize(14);
        doc.text(`
      Por medio del presente documento, se certifica que ${email} ha completado satisfactoriamente la capacitación básica para el uso del sistema LoteClick.
    
    Esta capacitación incluye conceptos fundamentales de autenticación, segmentación de roles, trazabilidad, acceso remoto y buenas prácticas en el uso de la plataforma digital.
    
    Fecha de emisión: ${new Date().toLocaleDateString()}
      `.trim(), margin, margin + 30, { maxWidth: 170 });

        // Información de contacto
        doc.setFont("helvetica", "bold").setFontSize(16);
        doc.text("Contacto", margin, 230);

        doc.setFont("helvetica", "normal").setFontSize(14);
        doc.text("Soporte técnico: soporte@loteClick.com", margin, 240);
        doc.text("Sitio web oficial: www.loteClick.com", margin, 247);
        doc.text("Teléfono: +57 300 123 4567", margin, 254);

        doc.setFontSize(12).setTextColor(120);
        doc.text("Gracias por formar parte del ecosistema LoteClick. Seguimos construyendo juntos.", 105, 270, { align: "center" });

        addFooter(pageCount);

        // Mostrar el PDF
        const blob = doc.output("blob");
        const url = URL.createObjectURL(blob);
        setPdfSrc(url);
        setShowPdf(true);
    };

    return (
        <div className="max-w-screen-xl mx-auto px-6 py-10">
            <div className="grid md:grid-cols-5 gap-8">

                {/* Columna izquierda: Texto, PDF, Imágenes, Mensaje */}
                <div className="md:col-span-3 flex flex-col gap-3">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Centro de Capacitación</h1>
                    <p className="text-gray-700 text-base mb-2 dark:text-gray-400">
                        Hola <span className="font-medium">{email}</span>, aquí encontrarás recursos para aprender a usar <strong>LoteClick</strong>.
                    </p>

                    {/* Sección PDF */}
                    <h2 className="text-xl font-semibold text-gray-800 mt-3 dark:text-gray-100">Guía en PDF</h2>
                    <div className="flex items-center justify-start mb-2">                      
                        <p className="text-gray-700 text-base mr-4 dark:text-gray-400">Capacitación general para LoteClick, dar click en el botón.</p>
                        <button
                            onClick={handleShowPDF}
                            className="flex items-center gap-1 px-6 py-1.5 bg-primary text-primary-foreground border border-primary-foreground dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                        >
                            Ver PDF
                        </button>
                    </div>

                    {/* Sección Ecológico */}
                    <h2 className="text-xl font-semibold text-gray-800 mt-3 dark:text-gray-100">Guía Ecológica</h2>
                    <div className="mt-6 flex items-center justify-start mb-2">                      
                        <button
                            onClick={() => router.push("/protected/capacitacion/educacionAmbiental")}
                            className="flex items-center mr-20 ml-20 gap-1 px-6 py-1.5 bg-primary text-primary-foreground border border-primary-foreground dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                        >
                            Educación Ambiental
                        </button>
                        <button
                            onClick={() => router.push("/protected/capacitacion/limpieza")}
                            className="flex items-center gap-1 px-6 py-1.5 bg-primary text-primary-foreground border border-primary-foreground dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                        >
                            Tutorial Limpieza
                        </button>
                    </div>

                    {/* Sección Imágenes */}
                    <div>
                        <h2 className="mt-8 text-xl font-semibold text-gray-800 mb-6 dark:text-gray-100 dark:border-gray-700">Guías visuales</h2>
                            <img src="/guia.png" className="w-full rounded-lg shadow border" />
                    </div>                 
                </div>

                {/* Columna derecha: Videos */}
                <div className="md:col-span-2 flex flex-col gap-5">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Videos explicativos</h2>
                    <iframe
                        src="https://www.youtube.com/embed/CMAkQM6VQZ0"
                        className="w-full h-64 rounded-lg shadow-md"
                        allowFullScreen
                    />
                    <iframe
                        src="https://www.youtube.com/embed/jW5KN4Kvpw0"
                        className="w-full h-64 rounded-lg shadow-md"
                        allowFullScreen
                    />
                    {/* Mensaje final */}
            <div className="bg-blue-300 border border-blue-500 text-blue-950 px-6 py-4 rounded-lg mt-6 dark:bg-blue-950 dark:border-blue-600 dark:text-blue-100">
                        {rol === "admin" ? (
                            <p className="font-medium">
                                ⚠️ Recuerda revisar también la capacitación para supervisores y empleados.
                            </p>
                        ) : (
                            <p className="font-medium">✅ ¡Gracias por revisar la capacitación!</p>
                        )}
                    </div>
                </div>              
            </div>

            

            {/* Ventana PDF flotante */}
            {showPdf && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center px-6 py-3 bg-background border-b">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Capacitación</h2>
                            <button
                                onClick={() => setShowPdf(false)}
                                className="text-sm text-primary-foreground bg-primary border border-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full transition dark:bg-black dark:text-gray-100 dark:border-gray-700 dark:hover:bg-zinc-800"
                            >
                                ✖ Cerrar
                            </button>
                        </div>
                        <iframe
                            src={pdfSrc}
                            className="w-full h-[80vh] border-none"
                            title="PDF Capacitación"
                        />
                    </div>
                </div>
            )}
        </div>
    );




}
