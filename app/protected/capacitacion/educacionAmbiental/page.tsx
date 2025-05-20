'use client';

import { useState } from 'react';

const accordionItems = [
  {
    title: 'Prácticas digitales sostenibles',
    content: [
      'Borra archivos y correos innecesarios.',
      'Apaga dispositivos cuando no los uses.',
      'Elige plataformas ligeras y eficientes.',
    ],
  },
  {
    title: 'Reduce el uso de papel',
    content: [
      'Usa documentos digitales y firmas electrónicas.',
      'Evita imprimir innecesariamente.',
      'Pide facturas y tickets digitales.',
    ],
  },
];

export default function CapacitacionPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="font-sans text-primary dark:text-gray-100 bg-background min-h-screen">
      <header className="h-[300px] bg-cover bg-center flex flex-col justify-center items-center text-white text-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1713002603663-373cdf5c30cd?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFpc2FqZSUyMGRlJTIwYXJib2x8ZW58MHx8MHx8fDA%3D)' }}>
        <h1 className="text-4xl font-bold px-4">Digitalización y sostenibilidad ambiental</h1>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-lg mb-10">
          Implementar plataformas digitales puede tener un impacto positivo considerable sobre el medio ambiente. Algunos datos importantes:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              img: 'https://www.deforestacion.net/wp-content/uploads/2016/06/que-es-la-tala-de-arboles.jpg',
              text: '1 tonelada de papel requiere talar entre 17 y 24 árboles.',
            },
            {
              img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoAzirJJMYEHVGn3ilGwGJHHu880c6mK1VGA&s',
              text: 'Se utilizan hasta 26,000 litros de agua para producir 1 tonelada de papel.',
            },
            {
              img: 'https://efeverde.com/wp-content/uploads/2022/01/AAALEMANIA-chimeneas-planta-Boxberg-HUMO.jpg',
              text: 'La digitalización puede reducir un 35% las emisiones de CO₂ en sectores empresariales hacia 2030.',
            },
            {
              img: 'https://www.sistemas-catalunya.com/wp-content/uploads/2021/04/reducir-el-uso-de-papel-en-la-oficina.jpg',
              text: 'Un trabajador de oficina promedio utiliza más de 10,000 hojas de papel al año.',
            },
          ].map((item, i) => (
            <div key={i} className="bg-background rounded-lg shadow-md overflow-hidden text-center border dark:border-gray-700">
              <img src={item.img} alt="" className="w-full h-52 object-cover" />
              <p className="p-4 font-semibold">{item.text}</p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl text-primary dark:text-gray-100 font-bold mb-6">¿Cómo contribuir a la sostenibilidad?</h2>

        <div className="space-y-4 mb-16">
          {accordionItems.map((item, index) => (
            <div key={index} className="bg-background rounded-lg shadow">
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex justify-between items-center border dark:border-gray-700 text-left px-4 py-3 text-lg font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
              >
                {item.title}
                <span className={`transition-transform ${activeIndex === index ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {activeIndex === index && (
                <div className="px-4 pb-4 text-base">
                  <ul className="list-disc pl-5">
                    {item.content.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-background rounded-lg shadow-md flex flex-col md:flex-row items-center gap-6 p-6 border dark:border-gray-700">
          <img
            src="https://info.fundacionjuanxxiii.org/hubfs/la-digitalizacion-de-documentos-y-su-impacto-en-los-informes-esg.jpg"
            alt="Digitalizacion mundo"
            className="w-full md:w-2/5 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="text-xl text-primary font-bold mb-2">Por eso:</h3>
            <p className="text-lg">
              Al usar documentos digitales, plataformas web y almacenamiento en la nube, puedes ayudar a disminuir el impacto ambiental, evitar el desperdicio y contribuir con un planeta más limpio.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
