import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';

const useItems = [
  'Crear una cuenta con información razonablemente correcta y mantener seguras tus credenciales.',
  'Usar la plataforma para fines académicos, de estudio y práctica personal dentro de un marco legítimo.',
  'No subir contenido ilegal, engañoso, ofensivo o que infrinja derechos de terceros.',
  'No intentar vulnerar el funcionamiento técnico, la seguridad o la disponibilidad del servicio.',
];

const contentItems = [
  'Restringir, moderar o eliminar contenido que resulte problemático, incompleto o incompatible con la plataforma.',
  'Actualizar funciones, materiales, simuladores, experiencia visual o estructura del producto cuando sea necesario.',
  'Suspender temporal o definitivamente cuentas que hagan un uso abusivo, riesgoso o fraudulento del sistema.',
];

const responsibilityItems = [
  'Evaluo busca ofrecer materiales y simuladores útiles, pero no garantiza resultados académicos específicos.',
  'El usuario sigue siendo responsable de cómo estudia, qué material utiliza y cómo interpreta los contenidos.',
  'Algunas funciones pueden depender de integraciones, disponibilidad técnica o contenido todavía en preparación.',
];

export default function TermsPage() {
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
              <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Términos y condiciones
              </h1>
              <p className="mt-5 max-w-4xl text-[15px] leading-8 text-slate-600">
                Estos términos describen las condiciones generales de uso de Evaluo. Al registrarte,
                acceder o utilizar la plataforma, aceptas usar el servicio de forma razonable, respetuosa
                y compatible con su propósito académico.
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:gap-14">
              <div className="space-y-10">
                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                    Uso esperado de la plataforma
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Evaluo está pensada para estudiar, practicar y organizar materiales. Esperamos un uso
                    compatible con ese objetivo y con el respeto básico hacia otros usuarios y hacia el sistema.
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {useItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>

                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                    Contenido, acceso y funcionamiento
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Podemos actualizar la plataforma, reorganizar materiales, ajustar simuladores o aplicar
                    medidas de moderación cuando sea necesario para cuidar la calidad del producto.
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {contentItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>

                <section className="pb-4">
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                    Alcance y responsabilidad
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Evaluo busca ser una herramienta útil de acompañamiento académico, pero no reemplaza
                    criterios personales de estudio, revisión docente ni decisiones individuales del usuario.
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {responsibilityItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>
              </div>

              <aside className="lg:pt-1">
                <div className="sticky top-8 space-y-8 border-t border-slate-200 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">
                      Lectura rápida
                    </p>
                    <div className="mt-4 space-y-5 text-[15px] leading-8 text-slate-600">
                      <p>
                        El acceso a Evaluo implica aceptar reglas básicas de uso, cuidado del contenido,
                        respeto por el sistema y colaboración razonable con la dinámica del producto.
                      </p>
                      <p>
                        Si más adelante quieres una versión más formal y exhaustiva, conviene revisar este
                        texto junto con política de privacidad, copyright, medios de pago y soporte.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-8">
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">
                      Resumen
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <p>Uso académico, razonable y legítimo de la plataforma.</p>
                      <p>Posibilidad de ajustar, moderar o restringir contenido y cuentas cuando corresponda.</p>
                      <p>Herramienta de apoyo al estudio, no garantía automática de resultados.</p>
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
