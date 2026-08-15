import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';

const collectedDataItems = [
  'Datos de registro básicos, como nombre, correo electrónico y credenciales de acceso.',
      'Información académica que completás dentro de la plataforma, como universidad, carrera y materias de interés.',
  'Actividad dentro de Evaluo, incluyendo uso del dashboard, simuladores, recursos abiertos y progreso de estudio.',
  'Datos técnicos necesarios para operar la web, como navegador, dispositivo, dirección IP aproximada y eventos de sesión.',
];

const usageItems = [
      'Personalizar tu experiencia según la carrera, la materia y el uso que hacés de la plataforma.',
  'Permitir que retomes simuladores, materiales y avances sin empezar desde cero.',
  'Mejorar el funcionamiento del producto, detectar errores y analizar qué secciones necesitan ajustes.',
  'Comunicarnos contigo sobre acceso, seguridad, cambios relevantes o mejoras del servicio.',
];

const rightsItems = [
  'Solicitar acceso a los datos personales que tratamos sobre ti.',
  'Pedir la corrección de información desactualizada o inexacta.',
  'Solicitar la eliminación de tu cuenta o de determinados datos, cuando corresponda.',
  'Pedir más información sobre cómo tratamos tus datos o cómo ejercer tus derechos.',
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
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-indigo-600">Legal</p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Política de privacidad
              </h1>
              <p className="mt-5 max-w-4xl text-[15px] leading-8 text-slate-600">
                En Evaluo tratamos la información personal con un criterio de necesidad, cuidado y
                mejora continua del producto. Esta política resume qué datos usamos, para qué los
                usamos y qué opciones tenés sobre tu información dentro de la plataforma.
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:gap-14">
              <div className="space-y-10">
                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Qué datos podemos recopilar
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Recopilamos únicamente la información necesaria para que la cuenta funcione,
                    puedas estudiar dentro de la plataforma y podamos mejorar la experiencia general.
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
                    La información se utiliza principalmente para operar Evaluo, adaptar el contenido
                    al contexto académico del usuario y medir qué partes del sistema necesitan mejoras.
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {usageItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>

                <section className="pb-4">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Tus derechos y controles
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Si necesitas revisar, corregir o eliminar información asociada a tu cuenta,
                    podés solicitarlo. También podés escribirnos si querés entender mejor qué datos
                    usamos y por qué.
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {rightsItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>
              </div>

              <aside className="lg:pt-1">
                <div className="sticky top-8 space-y-8 border-t border-slate-200 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-500">
                      En la práctica
                    </p>
                    <div className="mt-4 space-y-5 text-[15px] leading-8 text-slate-600">
                      <p>
                        Evaluo está pensada para guardar progreso, mejorar simuladores y ordenar
                        materiales. Eso implica tratar cierta información del usuario, pero siempre con
                        foco en funcionamiento, personalización y mejora del servicio.
                      </p>
                      <p>
                        Si más adelante querés formalizar este bloque con lenguaje legal más exhaustivo,
                        lo ideal es revisarlo junto con tus términos, flujos de consentimiento y canales
                        de contacto oficiales.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-8">
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-500">
                      Resumen
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <p>Recopilación acotada a la operación de la cuenta y el producto.</p>
                      <p>Uso orientado a personalización, progreso, analítica y soporte.</p>
                      <p>Posibilidad de solicitar revisión, corrección o eliminación de datos.</p>
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
