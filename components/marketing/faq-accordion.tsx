import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Qué hace Evaluo con mi PDF?',
    answer:
      'Usa el contenido de tu material como punto de partida para organizar qué tenés que estudiar y ayudarte a pasar de la lectura al repaso y la práctica. La idea es que no tengas que cambiar de fuente cada vez que cambiás de forma de estudiar.',
  },
  {
    question: '¿Qué puedo crear desde un PDF?',
    answer:
      'Desde tu material podés trabajar con resúmenes, glosarios, mapas mentales, flashcards y práctica. También podés usar un diagnóstico para ubicar qué temas dominás y cuáles conviene reforzar.',
  },
  {
    question: '¿Las respuestas se basan en mi material?',
    answer:
      'Las herramientas de estudio de un material parten del contenido extraído de ese PDF para mantener la misma fuente durante el recorrido. Como con cualquier herramienta de IA, si un detalle es importante para tu examen, conviene contrastarlo con el documento original.',
  },
  {
    question: '¿Puedo usar apuntes de cualquier universidad o materia?',
    answer:
      'Sí. Para estudiar con tu propio material no necesitás que tu universidad o materia esté previamente cargada en el catálogo. Podés subir el PDF que estés usando para preparar esa materia.',
  },
  {
    question: '¿Cómo me ayuda Evaluo a preparar un examen?',
    answer:
      'Podés empezar entendiendo y organizando el material, después intentar recuperarlo con flashcards o preguntas y usar la práctica para detectar qué puntos todavía necesitás reforzar antes del examen.',
  },
  {
    question: '¿Qué incluye el plan gratuito?',
    answer:
      'Evaluo tiene un plan gratuito para empezar a estudiar y probar funciones iniciales de la plataforma. Premium amplía las herramientas y los límites disponibles según las condiciones vigentes del plan.',
  },
];

export function FaqAccordion() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {FAQ_ITEMS.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 open:border-indigo-200 open:shadow-md open:ring-1 open:ring-indigo-50/50"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-open:text-indigo-600" />
              <span className="text-[14px] font-bold tracking-tight text-slate-800 sm:text-[15px]">
                {item.question}
              </span>
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 transition-all group-open:rotate-180 group-open:bg-indigo-50 group-open:text-indigo-600">
              <ChevronDown className="h-4 w-4" />
            </span>
          </summary>

          <div className="border-t border-slate-50 bg-white p-5 text-xs leading-6 text-slate-500 sm:text-sm">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
