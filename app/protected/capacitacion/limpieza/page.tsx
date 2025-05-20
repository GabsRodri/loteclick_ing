// app/liberar-espacio/page.tsx

"use client";
import { useState } from "react";

const tipsData = [
  {
    id: "content1",
    title: "Limpiar caché en el navegador del computador",
    steps: [
      "Ve a la configuración de tu navegador.",
      "Abre la sección 'Privacidad y seguridad'.",
      "Selecciona 'Borrar datos de navegación'.",
      "Marca 'Imágenes y archivos en caché'.",
      "Haz clic en 'Borrar datos'.",
      "Recarga la plataforma para aplicar los cambios.",
    ],
    image: "https://www.easyteam.org/wp-content/uploads/2021/04/cache.png",
  },
  {
    id: "content2",
    title: "Limpiar caché en el navegador del celular",
    steps: [
      "Abre el navegador en tu celular.",
      "Selecciona la opción de Historial.",
      "Presiona 'Borrar datos de navegación'.",
      "Elige qué datos deseas borrar.",
      "Confirma en 'Borrar datos'.",
    ],
    image: "https://serman.com/blog-recuperacion-datos/wp-content/uploads/2021/12/ram-android-1.jpg",
  },
];

export default function LiberarEspacioPage() {
  const [openTips, setOpenTips] = useState<{ [key: string]: boolean }>({});

  const toggleTip = (id: string) => {
    setOpenTips((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
     <div className="grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 mt-5 px-4">
    <div className="font-poppins text-primary dark:text-gray-100 text-[18px]">
      <header className="bg-background p-4 font-semibold text-2xl text-center border-b-2 border-gray-200 dark:border-gray-700">
        Guía Liberar Espacio
      </header>

      <section
        className="h-[300px] bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://cdn0.ecologiaverde.com/es/posts/9/6/1/el_caracol_es_un_molusco_4169_600.jpg')",
        }}
      >
        <div className="bg-black bg-opacity-50 text-white text-2xl md:text-3xl font-semibold text-center p-6 border-4 border-white w-[70%] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-xl">
          ¿Tu dispositivo está lento?
        </div>
      </section>

      <section className="text-center py-8 px-4 text-2xl font-bold">
        ¿Por qué mi dispositivo se vuelve lento?
      </section>

      <section className="flex flex-wrap justify-center gap-8 px-4 pb-8">
        {[
          {
            img: "https://co-media.hptiendaenlinea.com/magefan_blog/Que_es_la_memoria_cache_en_mi_computador.jpg",
            title: "Caché acumulada",
            desc: "El navegador guarda archivos temporales para acelerar cargas... pero si se acumulan, ocupan espacio y ralentizan el sistema.",
          },
          {
            img: "https://intecssa.com/wp-content/uploads/2023/04/¿Que-se-protege-en-seguridad-informatica.jpg",
            title: "Datos locales antiguos",
            desc: "Almacenar configuraciones o historial sin limpiar puede afectar el rendimiento y ocupar memoria.",
          },
          {
            img: "https://mujeres360.org/wp-content/uploads/2021/09/programacion-M360.jpg",
            title: "Procesos en segundo plano",
            desc: "Páginas pesadas o efectos visuales saturan el procesador y la memoria RAM en dispositivos limitados.",
          },
        ].map((r, i) => (
          <div key={i} className="w-[320px] text-center border rounded-md dark:border-gray-700">
            <img
              src={r.img}
              alt={r.title}
              className="w-full h-[200px] object-cover rounded-lg shadow-md"
            />
            <h4 className="text-xl font-semibold mt-4">{r.title}</h4>
            <p className="text-base">{r.desc}</p>
          </div>
        ))}
      </section>

      <section className="text-center py-8 px-4 text-2xl font-bold">
        Libera tu espacio local y mejora el rendimiento:
      </section>

      <section className="px-4 pb-12 space-y-6">
        {tipsData.map((tip) => (
          <div
            key={tip.id}
            className="flex flex-col md:flex-row border dark:border-gray-700 items-center bg-background p-6 rounded-lg shadow-md"
          >
            <img
              src={tip.image}
              alt={tip.title}
              className="w-[120px] h-[120px] object-cover rounded-md mb-4 md:mb-0 md:mr-6"
            />
            <div className="flex-1">
              <h4
                className="text-lg font-semibold cursor-pointer flex justify-between items-center"
                onClick={() => toggleTip(tip.id)}
              >
                {tip.title}
                <span className="text-xl">
                  {openTips[tip.id] ? "⬆️" : "⬇️"}
                </span>
              </h4>
              {openTips[tip.id] && (
                <div className="mt-4 text-base">
                  <ol className="list-decimal pl-5">
                    {tip.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
        </div>
  );
}
