import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';

const complaintItems = [
  'Tu nombre completo y una forma válida de contacto.',
  'La identificación de la obra o material que consideras afectado.',
  'La URL exacta dentro de Evaluo donde aparece el contenido reportado.',
  'Una explicación breve de por qué consideras que el contenido infringe tus derechos.',
  'Una declaración de buena fe indicando que el uso reportado no está autorizado por el titular, su representante o la ley.',
  'Una declaración confirmando que la información enviada es correcta.',
];

const counterNoticeItems = [
  'Tu nombre y datos de contacto.',
  'La URL o referencia del material retirado o restringido.',
  'Una explicación breve de por qué consideras que el retiro fue un error.',
  'Una declaración de buena fe sobre la exactitud de tu presentación.',
];

export default function CopyrightPage() {
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
                Copyright
              </h1>
              <p className="mt-5 max-w-4xl text-[15px] leading-8 text-slate-600">
                En Evaluo respetamos los derechos de autor y la propiedad intelectual de terceros. Si
                consideras que un contenido publicado en la plataforma infringe tus derechos, puedes
                reportarlo para que lo revisemos y actuemos de forma razonable.
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:gap-14">
              <div className="space-y-10">
                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Reclamos sobre contenido subido por usuarios
                  </h2>
                  <div className="mt-4 space-y-5 text-[15px] leading-8 text-slate-600">
                    <p>
                      Evaluo busca ofrecer una plataforma con contenido útil, legítimo y razonable para
                      estudiar. Cuando recibimos un reporte de copyright o propiedad intelectual,
                      revisamos el caso y podemos restringir, retirar o dejar en observación el
                      material según corresponda.
                    </p>
                    <p>
                      También podemos tomar medidas adicionales sobre cuentas que reincidan en publicar
                      contenido problemático o que utilicen el sistema de reportes de mala fe.
                    </p>
                  </div>
                </section>

                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Qué debe incluir un reclamo
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Para revisar un caso con contexto suficiente, necesitamos que el reclamo incluya al
                    menos lo siguiente:
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {complaintItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>

                <section className="pb-4">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Contra aviso
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Si consideras que un contenido tuyo fue retirado o restringido por error, puedes
                    presentar una contra notificación para una segunda revisión.
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {counterNoticeItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>
              </div>

              <aside className="lg:pt-1">
                <div className="sticky top-8 space-y-8 border-t border-slate-200 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">
                      Importante
                    </p>
                    <div className="mt-4 space-y-5 text-[15px] leading-8 text-slate-600">
                      <p>
                        Un reclamo incompleto puede retrasar la revisión. Un reporte falso o presentado
                        de mala fe puede dar lugar a restricciones de cuenta o a otras medidas
                        razonables.
                      </p>
                      <p>
                        Si más adelante quieres profesionalizar este bloque legal todavía más, lo ideal es
                        conectar esta página con una vía de contacto formal y con tus términos y política
                        de privacidad para cerrar el circuito legal completo.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-8">
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-400">
                      Estado
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <p>Revisión manual y razonable de cada caso.</p>
                      <p>Posible restricción, retiro o verificación adicional del material.</p>
                      <p>Segunda revisión posible ante contra aviso.</p>
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
