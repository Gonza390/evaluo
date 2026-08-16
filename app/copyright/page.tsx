import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';

export const metadata = {
  title: 'Política de copyright | Evaluo',
  description:
    'Política de copyright y propiedad intelectual de Evaluo: responsabilidad de los usuarios, puerto seguro para contenido subido y procedimiento de reclamos.',
  alternates: {
    canonical: '/copyright',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const complaintItems = [
  'Tu nombre completo y una forma válida de contacto.',
  'La identificación de la obra o material que considerás afectado.',
  'La URL exacta dentro de Evaluo donde aparece el contenido reportado.',
  'Una explicación breve de por qué considerás que el contenido infringe tus derechos.',
  'Una declaración de buena fe indicando que el uso reportado no está autorizado por el titular, su representante o la ley.',
  'Una declaración confirmando que la información enviada es correcta y que sos el titular de los derechos o que estás autorizado a actuar en su nombre.',
];

const counterNoticeItems = [
  'Tu nombre y datos de contacto.',
  'La URL o referencia del material retirado o restringido.',
  'Una explicación breve de por qué considerás que el retiro fue un error.',
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
                Última actualización: agosto de 2026. En Evaluo respetamos los derechos de autor y la
                propiedad intelectual de terceros. Esta política describe cómo tratamos el contenido
                subido por los usuarios, cómo reportar una infracción y cómo se procesan los reclamos.
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:gap-14">
              <div className="space-y-10">
                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Responsabilidad del contenido subido por usuarios
                  </h2>
                  <div className="mt-4 space-y-5 text-[15px] leading-8 text-slate-600">
                    <p>
                      Los apuntes, resúmenes, guías y documentos PDF que se comparten en la
                      plataforma son cargados por los propios usuarios. Cada usuario declara y
                      garantiza tener los derechos necesarios sobre el material que sube, de acuerdo
                      con los Términos y Condiciones.
                    </p>
                    <p>
                      Evaluo es un servicio neutral de alojamiento: no adopta el contenido del
                      usuario como propio y no se hace responsable por infracciones de copyright
                      cometidas por quienes publican material sin autorización. El usuario es el
                      único responsable por el contenido que publica y por sus consecuencias legales.
                    </p>
                  </div>
                </section>

                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Reclamos sobre contenido
                  </h2>
                  <div className="mt-4 space-y-5 text-[15px] leading-8 text-slate-600">
                    <p>
                      Si considerás que un contenido publicado en Evaluo infringe tus derechos de
                      autor o de propiedad intelectual, podés reportarlo. Al recibir una
                      notificación válida, Evaluo revisará el caso y podrá restringir, retirar o
                      dejar en observación el material según corresponda.
                    </p>
                    <p>
                      También podemos tomar medidas adicionales sobre cuentas que reincidan en
                      publicar contenido problemático o que utilicen el sistema de reportes de mala fe.
                    </p>
                  </div>
                </section>

                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Qué debe incluir un reclamo
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Para revisar un caso con contexto suficiente, necesitamos que el reclamo incluya
                    al menos lo siguiente:
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {complaintItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Los reclamos se envían a: copyright@evaluo.com.ar.
                  </p>
                </section>

                <section className="border-b border-slate-200 pb-10">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Contra aviso
                  </h2>
                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    Si considerás que un contenido tuyo fue retirado o restringido por error, podés
                    presentar una contra notificación para una segunda revisión. Esta contra
                    notificación debe incluir:
                  </p>
                  <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                    {counterNoticeItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </section>

                <section className="pb-4">
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    Política de reincidencia
                  </h2>
                  <div className="mt-4 space-y-5 text-[15px] leading-8 text-slate-600">
                    <p>
                      Evaluo puede suspender cuentas que incurran en infracciones reiteradas de
                      derechos de autor o que presenten reclamos manifiestamente falsos. La decisión
                      se adopta de forma razonable, evaluando cada caso con el contexto disponible.
                    </p>
                    <p>
                      Ante un reclamo presentado de buena fe, Evaluo actúa con diligencia para
                      resolver la controversia entre las partes y, cuando corresponde, restaurar el
                      contenido si el reclamo resultara infundado.
                    </p>
                  </div>
                </section>
              </div>

              <aside className="lg:pt-1">
                <div className="sticky top-8 space-y-8 border-t border-slate-200 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-500">
                      Importante
                    </p>
                    <div className="mt-4 space-y-5 text-[15px] leading-8 text-slate-600">
                      <p>
                        Un reclamo incompleto puede retrasar la revisión. Un reporte falso o
                        presentado de mala fe puede dar lugar a restricciones de cuenta o a otras
                        medidas razonables.
                      </p>
                      <p>
                        El contenido académico que subís es tu responsabilidad: asegurate de contar
                        con los derechos necesarios antes de publicarlo.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-8">
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-500">
                      Estado
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <p>Revisión razonable de cada caso presentado.</p>
                      <p>Posible restricción, retiro o verificación adicional del material.</p>
                      <p>Segunda revisión posible ante contra aviso.</p>
                      <p>Medidas ante reincidencia o reportes de mala fe.</p>
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
