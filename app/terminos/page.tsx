import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';

export const metadata = {
  title: 'Términos y condiciones | Evaluo',
  description:
    'Términos y condiciones de uso de Evaluo: condiciones del servicio, contenido de usuarios, uso responsable de la IA, propiedad intelectual y limitación de responsabilidad.',
  alternates: {
    canonical: '/terminos',
  },
  robots: {
    index: false,
    follow: true,
  },
};

type LegalSection = {
  title: string;
  body: string[];
  items?: string[];
  clauses?: { heading: string; text: string }[];
};

const sections: LegalSection[] = [
  {
    title: '1. Aceptación de los términos',
    body: [
      'Al acceder, navegar, registrarte o utilizar la plataforma Evaluo ("la Plataforma", "Evaluo"), aceptás estos Términos y Condiciones ("Términos") en su totalidad, junto con la Política de Privacidad y la Política de Copyright. Si no estás de acuerdo con alguna parte de estos documentos, no deberías utilizar el servicio.',
      'Estos Términos constituyen un acuerdo legal entre vos ("el Usuario") y Evaluo. El uso de la Plataforma con fines de estudio, práctica y organización académica implica la aceptación plena e incondicional de estas condiciones.',
    ],
  },
  {
    title: '2. Uso esperado de la plataforma',
    body: [
      'Evaluo es una herramienta de acompañamiento académico: te permite descubrir carreras y materias, organizar materiales de estudio, practicar con simuladores, llevar un registro de progreso y recibir explicaciones asistidas por inteligencia artificial.',
      'El Usuario se compromete a:',
    ],
    items: [
      'Crear una cuenta con información razonablemente correcta y mantener seguras sus credenciales de acceso.',
      'Usar la plataforma exclusivamente con fines académicos, de estudio y práctica personal, dentro de un marco legítimo y conforme a derecho.',
      'No subir, publicar ni compartir contenido ilegal, engañoso, ofensivo, discriminatorio o que infrinja derechos de terceros.',
      'No intentar vulnerar el funcionamiento técnico, la seguridad, la disponibilidad ni la integridad del servicio.',
      'No extraer, replicar ni explotar comercialmente los contenidos de la Plataforma sin autorización.',
    ],
  },
  {
    title: '3. Contenido de usuarios y puerto seguro (UGC)',
    body: [
      'La Plataforma puede permitir a los Usuarios subir, cargar o compartir materiales propios, como apuntes, resúmenes, guías o documentos PDF ("Contenido del Usuario" o "UGC"). El Contenido del Usuario es publicado bajo la responsabilidad exclusiva de quien lo sube.',
      'Al cargar contenido, el Usuario declara y garantiza bajo su exclusiva responsabilidad que:',
    ],
    items: [
      'Es el titular de los derechos sobre ese material, o que cuenta con la autorización, licencia o permiso correspondiente del titular de los derechos para subirlo y compartirlo en la Plataforma.',
      'El material no infringe derechos de autor, derechos de propiedad intelectual, marcas, secretos comerciales, derechos de privacidad o de publicidad de terceros.',
      'El material fue obtenido por medios lícitos y no contiene información confidencial protegida por la ley.',
    ],
    clauses: [
      {
        heading: 'Cláusula de puerto seguro',
        text: 'Evaluo actúa como un servicio neutral de alojamiento y distribución de contenido. Evaluo no revisa, aprueba ni adopta el Contenido del Usuario como propio, y no asume ninguna responsabilidad por el contenido subido por los Usuarios. El Usuario es el único y exclusivo responsable de garantizar que posee los derechos de autor y demás derechos necesarios sobre todo material que suba a la Plataforma, eximiendo expresamente a Evaluo de toda responsabilidad por infracciones de copyright, propiedad intelectual o normativa aplicable derivadas de dicho contenido.',
      },
      {
        heading: 'Licencia de uso del contenido cargado',
        text: 'Al cargar contenido, el Usuario otorga a Evaluo una licencia limitada, no exclusiva, libre de regalías y revocable, para alojar, almacenar, procesar, mostrar y utilizar dicho contenido exclusivamente con el fin de operar, mejorar y prestar los servicios de la Plataforma. Esta licencia no transfiere la titularidad del material al Usuario a Evaluo.',
      },
      {
        heading: 'Moderación y retiro',
        text: 'Evaluo se reserva el derecho de restringir, moderar, retirar o eliminar contenido que resulte problemático, incompleto, incompatible con la plataforma o que sea objeto de un reclamo válido de propiedad intelectual. La eliminación no otorga derecho a compensación alguna. En caso de recibir una notificación de infracción válida, Evaluo podrá retirar el material y tomar medidas sobre la cuenta, tal como se describe en la Política de Copyright.',
      },
    ],
  },
  {
    title: '4. Exención de responsabilidad de la inteligencia artificial',
    body: [
      'Evaluo utiliza modelos de inteligencia artificial ("IA") para generar explicaciones, resúmenes, preguntas y asistencia al estudio. Los modelos de lenguaje pueden equivocarse, presentar información incompleta o "alucinar" respuestas incorrectas. El contenido generado por IA no constituye asesoramiento académico, docente, legal ni profesional, y no debe ser tratado como una fuente autoritativa.',
      'En consecuencia:',
    ],
    items: [
      'La IA de Evaluo es una herramienta de apoyo al estudio, no infalible ni determinante.',
      'El Usuario es responsable de verificar la información generada contra sus propios materiales, apuntes, la bibliografía oficial y el criterio de sus docentes.',
      'Evaluo no garantiza la exactitud, completitud, pertinencia ni actualidad del contenido generado por IA.',
      'Evaluo no se hace responsable si un estudiante reprueba, desaprueba o no obtiene el resultado esperado en un examen universitario o evaluación, aun cuando base su preparación en las respuestas o explicaciones de la Plataforma.',
      'Las decisiones de estudio, la preparación y el resultado académico final son responsabilidad exclusiva del Usuario.',
    ],
  },
  {
    title: '5. Contenido, acceso y funcionamiento',
    body: [
      'Podemos actualizar la Plataforma, reorganizar materiales, ajustar simuladores, incorporar nuevas funciones o modificar la experiencia visual y estructural del producto cuando sea necesario, en el marco de la mejora continua del servicio.',
      'Evaluo no garantiza que el servicio esté disponible de forma ininterrumpida, libre de errores ni exento de interrupciones técnicas. Algunas funciones pueden depender de integraciones, disponibilidad técnica o contenido todavía en preparación.',
    ],
  },
  {
    title: '6. Propiedad intelectual de la plataforma',
    body: [
      'Todos los derechos de propiedad intelectual sobre la Plataforma, su diseño, código, marcas, logotipos, textos propios, bases de datos, estructura y funcionalidades pertenecen a Evaluo o a sus licenciantes. Nada en estos Términos otorga al Usuario derechos de propiedad sobre la Plataforma o sus contenidos.',
      'El Usuario no podrá reproducir, distribuir, modificar, descompilar, realizar ingeniería inversa, sublicenciar ni explotar comercialmente la Plataforma ni sus contenidos, salvo autorización expresa y por escrito.',
    ],
  },
  {
    title: '7. Limitación de responsabilidad',
    body: [
      'En la máxima medida permitida por la ley aplicable, Evaluo no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, ni por lucro cesante, pérdida de datos, de oportunidades o de resultados académicos, derivados del uso o la imposibilidad de uso de la Plataforma.',
      'La responsabilidad total de Evaluo por cualquier reclamo vinculado al servicio no superará, en ningún caso, el monto que el Usuario haya pagado por el servicio en los doce (12) meses anteriores al hecho que dio origen al reclamo.',
      'Estas limitaciones no excluyen la responsabilidad en la que Evaluo no puede limitar válidamente conforme a la normativa de consumo aplicable.',
    ],
  },
  {
    title: '8. Indemnización',
    body: [
      'El Usuario acepta mantener indemne y en paz y a salvo a Evaluo, sus directivos, empleados, agentes y colaboradores frente a cualquier reclamo, demanda, perjuicio, costo o gasto (incluidos honorarios de abogados) que surja de:',
    ],
    items: [
      'El uso del contenido que el Usuario haya subido a la Plataforma.',
      'La infracción de derechos de propiedad intelectual, copyright o normativa aplicable vinculada a dicho contenido.',
      'El uso indebido o no autorizado de la Plataforma por parte del Usuario.',
      'La violación de estos Términos o de la legislación vigente.',
    ],
  },
  {
    title: '9. Suspensión y terminación',
    body: [
      'Evaluo podrá suspender temporal o definitivamente cuentas que realicen un uso abusivo, riesgoso o fraudulento del sistema, o que infrinjan estos Términos, la Política de Privacidad o la normativa aplicable.',
      'El Usuario puede cerrar su cuenta en cualquier momento. Los derechos y obligaciones que por su naturaleza deban subsistir luego de la terminación (propiedad intelectual, indemnización, limitaciones de responsabilidad) continuarán vigentes.',
    ],
  },
  {
    title: '10. Modificaciones de estos términos',
    body: [
      'Podemos modificar estos Términos cuando sea necesario para reflejar cambios en el producto, la normativa o el funcionamiento del servicio. Las modificaciones se publicarán en esta página con su fecha de entrada en vigencia. El uso continuado de la Plataforma después de la publicación de cambios constituye aceptación de los nuevos términos.',
    ],
  },
  {
    title: '11. Legislación aplicable y jurisdicción',
    body: [
      'Estos Términos se rigen por las leyes de la República Argentina. Sin perjuicio de los derechos que otorga la normativa de protección al consumidor vigente, las partes se someten a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires para toda controversia derivada del presente acuerdo.',
      'Si estás en la Argentina, tenés derechos en los términos de la Ley N° 24.240 y normas complementarias.',
    ],
  },
  {
    title: '12. Contacto',
    body: [
      'Si tenés dudas, consultas o reclamos sobre estos Términos, podés escribirnos a: legal@evaluo.com.ar.',
    ],
  },
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
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
                Términos y condiciones
              </h1>
              <p className="mt-5 max-w-4xl text-[15px] leading-8 text-slate-600">
                Última actualización: agosto de 2026. Estos términos regulan el uso de la plataforma
                Evaluo, las responsabilidades del contenido cargado por los usuarios, el alcance de
                las herramientas de inteligencia artificial y las condiciones generales del servicio.
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:gap-14">
              <div className="space-y-10">
                {sections.map((section) => (
                  <section key={section.title} className="border-b border-slate-200 pb-10">
                    <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
                      {section.title}
                    </h2>
                    {section.body?.map((paragraph) => (
                      <p key={paragraph} className="mt-4 text-[15px] leading-8 text-slate-600">
                        {paragraph}
                      </p>
                    ))}
                    {section.items ? (
                      <ol className="mt-5 space-y-4 pl-6 text-[15px] leading-8 text-slate-600 marker:font-semibold marker:text-slate-900">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ol>
                    ) : null}
                    {section.clauses?.map((clause) => (
                      <div key={clause.heading} className="mt-6">
                        <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-950">
                          {clause.heading}
                        </h3>
                        <p className="mt-2 text-[15px] leading-8 text-slate-600">{clause.text}</p>
                      </div>
                    ))}
                  </section>
                ))}
              </div>

              <aside className="lg:pt-1">
                <div className="sticky top-8 space-y-8 border-t border-slate-200 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-500">
                      Lectura rápida
                    </p>
                    <div className="mt-4 space-y-5 text-[15px] leading-8 text-slate-600">
                      <p>
                        Evaluo es una herramienta de apoyo al estudio. El contenido académico es
                        responsabilidad de quien lo comparte, y las respuestas de la IA no reemplazan
                        el estudio personal ni garantizan resultados.
                      </p>
                      <p>
                        Ante cualquier duda sobre estos términos, podés escribirnos a{' '}
                        <a
                          href="mailto:legal@evaluo.com.ar"
                          className="font-semibold text-indigo-600 hover:underline"
                        >
                          legal@evaluo.com.ar
                        </a>
                        .
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-8">
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-500">
                      Resumen
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <p>Uso académico, razonable y legítimo de la plataforma.</p>
                      <p>El usuario es responsable del contenido que sube y de sus derechos.</p>
                      <p>La IA es una herramienta de apoyo, no infalible ni vinculante.</p>
                      <p>Posibilidad de moderar contenido y suspender cuentas cuando corresponda.</p>
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
