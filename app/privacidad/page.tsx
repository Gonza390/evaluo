import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';

export const metadata = {
  title: 'Política de privacidad | Evaluo',
  description:
    'Política de privacidad de Evaluo: qué datos recopilamos, cómo los usamos, cómo protegemos tu información y cuáles son tus derechos conforme a la Ley 25.326 de Protección de Datos Personales.',
  alternates: {
    canonical: '/privacidad',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const collectedDataItems = [
  'Datos de registro básicos, como nombre, correo electrónico y credenciales de acceso.',
  'Información académica que completás dentro de la plataforma, como universidad, carrera, materias de interés y perfil de estudio.',
  'Actividad dentro de Evaluo, incluyendo uso del dashboard, simuladores, recursos abiertos, respuestas registradas, favoritos y progreso de estudio.',
  'Actividad de enlaces compartidos, incluyendo quién comparte cuando tiene una cuenta, qué materia y parcial comparte, y cuántas visitas, prácticas o registros se originan desde ese enlace.',
  'Datos técnicos necesarios para operar la web, como navegador, dispositivo, dirección IP aproximada, idioma y eventos de sesión.',
  'Datos de pago procesados por terceros (por ejemplo, Mercado Pago), como estado de la suscripción y referencia de la transacción. Evaluo no almacena datos de tarjetas de crédito ni claves de pago.',
];

const usageItems = [
  'Personalizar tu experiencia según la carrera, la materia y el uso que hacés de la plataforma.',
  'Permitir que retomes simuladores, materiales y avances sin empezar desde cero.',
  'Mejorar el funcionamiento del producto, detectar errores y analizar qué secciones necesitan ajustes.',
  'Entrenar y ajustar nuestros algoritmos, incluidos los modelos de inteligencia artificial, de forma anónima y agregada, sin que los datos personales permitan identificar a un usuario en particular.',
  'Comunicarnos contigo sobre acceso, seguridad, cambios relevantes, facturación o mejoras del servicio.',
];

const rightsItems = [
  'Acceso: conocer qué datos personales tuyos se encuentran en nuestra base.',
  'Rectificación: corregir información inexacta, desactualizada o incompleta.',
  'Supresión: solicitar la eliminación de datos que ya no sean necesarios o cuyo tratamiento no esté justificado.',
  'Actualización: mantener tus datos vigentes y coherentes con el uso del servicio.',
  'Confidencialidad: exigir el tratamiento seguro de tu información conforme a la ley.',
];

const sharingItems = [
  'Proveedores tecnológicos que operan la infraestructura de la plataforma (hosting, base de datos y servicios en la nube).',
  'Proveedores de analítica (por ejemplo, Google Analytics 4) que nos ayudan a comprender el uso agregado del sitio.',
  'Proveedores de inteligencia artificial (por ejemplo, Gemini y Groq) que procesan el contenido académico que nos compartís para generar explicaciones, resúmenes y preguntas. Este procesamiento está orientado a prestar el servicio y a mejorar la calidad de las respuestas.',
  'Procesadores de pago (por ejemplo, Mercado Pago) que gestionan los cobros de las suscripciones. Solo compartimos con ellos la información mínima necesaria para completar la transacción.',
  'Autoridades competentes, cuando exista una obligación legal de revelar información o un requerimiento válido de una autoridad judicial o administrativa.',
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f7f9fc_100%)] text-slate-900">
      <main>
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 sm:py-14 lg:px-10 lg:py-20">
          <div className="animate-page-enter">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>

            <div className="mt-8 border-b border-slate-200 pb-8">
              <p className="text-xs font-bold tracking-[0.26em] text-indigo-600 uppercase">Legal</p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Política de privacidad
              </h1>
              <p className="mt-5 max-w-4xl text-[15px] leading-8 text-slate-600">
                Última actualización: agosto de 2026. En Evaluo tratamos la información personal con
                un criterio de necesidad, confidencialidad y respeto por tus derechos, de acuerdo
                con la Ley N° 25.326 de Protección de los Datos Personales de la República Argentina
                y sus normas complementarias.
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:gap-14">
              <div className="space-y-10">
                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Qué datos recopilamos
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Recopilamos únicamente la información necesaria para que la cuenta funcione,
                    puedas estudiar dentro de la plataforma y podamos mejorar la experiencia
                    general.
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {collectedDataItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>

                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Cómo usamos esa información
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    La información se utiliza principalmente para operar Evaluo, adaptar el
                    contenido al contexto académico del usuario, medir qué partes del sistema
                    necesitan mejoras y entrenar nuestros modelos de forma anónima.
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {usageItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>

                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Uso de datos para entrenar algoritmos
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Para mejorar la calidad de nuestros modelos de inteligencia artificial y de
                    nuestras herramientas de estudio, podemos analizar la información en forma
                    agregada y anonimizada. La anonimización se realiza de modo que los datos ya no
                    permitan identificar a un usuario en particular, ni directa ni indirectamente.
                  </p>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Los datos anonimizados pueden utilizarse para ajustar el comportamiento de la
                    plataforma, evaluar la precisión de las explicaciones y mejorar el rendimiento
                    de los simuladores, sin que ello implique tratar información personal
                    identificable.
                  </p>
                </section>

                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Compartir información con terceros
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    No vendemos tu información personal a terceros. Solo compartimos datos con
                    proveedores que nos ayudan a operar y mejorar el servicio, bajo acuerdos que
                    respetan la confidencialidad y la normativa de protección de datos vigente:
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {sharingItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>

                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Seguridad y retención
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Adoptamos medidas técnicas y organizativas razonables para proteger la
                    información personal contra el acceso no autorizado, la pérdida, la alteración o
                    la difusión indebida. La información se conserva únicamente durante el tiempo
                    necesario para cumplir las finalidades descritas en esta política y para dar
                    cumplimiento a obligaciones legales o contables.
                  </p>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Los datos de pago son procesados por la pasarela de pagos correspondiente (por
                    ejemplo, Mercado Pago) y no se almacenan en los servidores de Evaluo.
                  </p>
                </section>

                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Tus derechos y controles
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Conforme a la Ley N° 25.326, tenés derecho a solicitar información,
                    rectificación, supresión, actualización o confidencialidad de tus datos
                    personales. Podés ejercer estos derechos escribiéndonos a
                    privacidad@evaluo.com.ar.
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {rightsItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    También podés eliminar tu cuenta o ajustar tus preferencias desde la
                    configuración de la plataforma. Ante la denegación de un derecho, podés
                    presentar una denuncia ante la Agencia de Acceso a la Información Pública
                    (AAIP), autoridad de aplicación de la Ley N° 25.326.
                  </p>
                </section>

                <section className="pb-4">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Menores y cambios en esta política
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Evaluo está orientada a estudiantes universitarios y personas mayores de edad.
                    No recopilamos deliberadamente información personal de menores de edad sin la
                    intervención de un padre, madre o tutor.
                  </p>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Podemos actualizar esta política para reflejar cambios en el producto, la
                    normativa o el tratamiento de datos. Publicaremos la versión vigente en esta
                    página, con su fecha de actualización. Si los cambios fueran relevantes, te lo
                    comunicaremos por los canales habituales.
                  </p>
                </section>
              </div>

              <aside className="lg:pt-1">
                <div className="sticky top-8 space-y-8 border-t border-slate-200 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
                  <div>
                    <p className="text-xs font-bold tracking-[0.26em] text-slate-500 uppercase">
                      En la práctica
                    </p>
                    <div className="mt-4 space-y-5 text-[15px] leading-8 text-slate-600">
                      <p>
                        Evaluo trata la información personal con un enfoque de necesidad y mejora
                        continua: guardamos progreso, ordenamos materiales y ajustamos simuladores,
                        siempre con foco en el servicio.
                      </p>
                      <p>
                        Los datos que ayudan a entrenar nuestros algoritmos se usan de forma anónima
                        y agregada, sin identificar a usuarios puntuales.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-8">
                    <p className="text-xs font-bold tracking-[0.26em] text-slate-500 uppercase">
                      Resumen
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <p>Recopilación acotada a la operación de la cuenta y el producto.</p>
                      <p>Uso orientado a personalización, progreso, analítica y soporte.</p>
                      <p>Entrenamiento de algoritmos solo con datos anonimizados y agregados.</p>
                      <p>
                        Derechos de acceso, rectificación, supresión, actualización y
                        confidencialidad.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
      <FooterHome />
    </div>
  );
}
