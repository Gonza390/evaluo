import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';

export const metadata = {
  title: 'Términos de facturación y reembolsos | Evaluo',
  description:
    'Términos de facturación, suscripciones recurrentes, períodos de prueba, política de no reembolsos y contracargos de Evaluo.',
  alternates: {
    canonical: '/facturacion',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  {
    title: '1. Alcance de estos términos',
    body: [
      'Estos términos de facturación ("Términos de Facturación") regulan la contratación, el cobro, la renovación y las disputas de los planes de pago de Evaluo. Se complementan con los Términos y Condiciones y la Política de Privacidad. Al suscribirte a un plan de pago, aceptás estas condiciones en su totalidad.',
    ],
  },
  {
    title: '2. Planes y suscripciones recurrentes',
    body: [
      'Evaluo ofrece planes de suscripción con renovación automática (por ejemplo, mensual o anual). El precio y las características del plan son los publicados en el momento de la contratación.',
      'La suscripción se renueva automáticamente al finalizar cada período, salvo que el Usuario la cancele antes de la fecha de renovación. El cobro de la renovación se procesa a través de la pasarela de pagos (por ejemplo, Mercado Pago) con el medio de pago registrado.',
    ],
  },
  {
    title: '3. Períodos de prueba (free trial)',
    body: [
      'Cuando se ofrezca un período de prueba gratuito, el Usuario podrá acceder al plan durante el tiempo indicado sin cargo, sujeto al registro de un medio de pago si así se establece.',
      'Al finalizar el período de prueba, la suscripción se activará automáticamente y se cobrará el valor vigente del plan, salvo que el Usuario cancele antes de que finalice la prueba.',
      'El Usuario es responsable de cancelar dentro del plazo si no desea continuar. Evaluo recordará la proximidad del vencimiento por los canales habituales, pero la falta de cancelación no exime del cobro conforme a las condiciones aceptadas.',
    ],
  },
  {
    title: '4. Política de no reembolsos',
    body: [
      'Por tratarse de un producto digital de acceso inmediato, Evaluo aplica una política estricta de no reembolsos sobre las suscripciones y los contenidos adquiridos. Una vez efectuado el pago, no se realizan reembolsos por desistimiento, cambio de opinión, falta de uso o insatisfacción con los resultados académicos.',
      'La cancelación de la suscripción no genera reembolso proporcional del período ya abonado. El acceso se mantiene hasta el final del período pagado.',
      'Solo se contempla una excepción cuando la normativa aplicable de protección al consumidor (Ley N° 24.240 y normas complementarias) lo exija de forma imperativa. En tal caso, el reembolso se procesará por el mismo medio de pago utilizado, conforme a los plazos de la pasarela.',
    ],
  },
  {
    title: '5. Contracargos y disputas de pago',
    body: [
      'En caso de que el Usuario inicie un contracargo, mediación o desconocimiento del pago ante su banco, emisor de tarjeta o la pasarela de pagos, deberá previamente contactarse con el soporte de Evaluo para intentar resolver la situación por los canales del servicio.',
      'Ante un contracargo, Evaluo podrá presentar la documentación de respaldo ante la pasarela de pagos (por ejemplo, Mercado Pago), incluyendo el registro de la suscripción, la aceptación de los Términos de Facturación y la evidencia de acceso y uso del servicio. Esta documentación se aporta para defender la validez de la transacción.',
      'El inicio de un contracargo sin causa legítima, o mientras la suscripción se encuentra activa, puede derivar en la suspensión del acceso al plan hasta tanto se resuelva la disputa. Si el contracargo resulta procedente por un error de facturación ajeno al Usuario, se corregirá el cobro sin penalidad.',
    ],
  },
  {
    title: '6. Cambios de precios y de planes',
    body: [
      'Evaluo podrá actualizar precios, planes o características del servicio. Los cambios de precio se comunicarán con anticipación razonable y regirán a partir del próximo ciclo de facturación. Si el Usuario no está de acuerdo con el nuevo precio, podrá cancelar su suscripción antes de la renovación.',
      'Al cambiar de plan, el Usuario acepta las condiciones vigentes del nuevo plan. Las diferencias de precio entre planes se liquidan conforme a lo publicado en el momento del cambio.',
    ],
  },
  {
    title: '7. Impuestos y medios de pago',
    body: [
      'Los precios publicados incluyen los impuestos, tributos y percepciones que correspondan según la legislación vigente. Evaluo no gestiona medios de pago directamente: las transacciones se procesan a través de pasarelas de pago autorizadas (por ejemplo, Mercado Pago), cuyos términos propios también aplican al Usuario.',
      'El Usuario debe contar con un medio de pago válido. Si un cobro es rechazado o no puede procesarse, Evaluo intentará informarlo por los canales del servicio y podrá suspender el acceso hasta regularizar el pago.',
    ],
  },
  {
    title: '8. Contacto',
    body: [
      'Para consultas o reclamos de facturación, disputas o cancelaciones, escribinos a facturacion@evaluo.com.ar. Nuestro equipo atiende las consultas por los canales oficiales del servicio antes de que se inicie una disputa ante terceros.',
    ],
  },
] as const;

export default function FacturacionPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 sm:py-14 lg:px-10 lg:py-20">
          <div className="animate-page-enter">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>

            <div className="mt-8 border-b border-border pb-8">
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-brand">Legal</p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.06em] text-foreground sm:text-5xl">
                Términos de facturación
              </h1>
              <p className="mt-5 max-w-4xl text-[15px] leading-8 text-muted-foreground">
                Última actualización: agosto de 2026. Estos términos regulan las suscripciones
                recurrentes, los períodos de prueba, la política de reembolsos y el tratamiento de
                los contracargos por los servicios de pago de Evaluo.
              </p>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:gap-14">
              <div className="space-y-10">
                {sections.map((section) => (
                  <section key={section.title} className="border-b border-border pb-10">
                    <h2 className="text-2xl font-bold tracking-[-0.04em] text-foreground">
                      {section.title}
                    </h2>
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="mt-4 text-[15px] leading-8 text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </section>
                ))}
              </div>

              <aside className="lg:pt-1">
                <div className="sticky top-8 space-y-8 border-t border-border pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-muted-foreground">
                      Lectura rápida
                    </p>
                    <div className="mt-4 space-y-5 text-[15px] leading-8 text-muted-foreground">
                      <p>
                        Las suscripciones se renuevan automáticamente. Si no querés continuar,
                        cancelá antes de la fecha de renovación.
                      </p>
                      <p>
                        Ante un contracargo, primero contactate con nuestro soporte: la evidencia de
                        aceptación y uso del servicio se presenta ante la pasarela de pagos para
                        defender la transacción.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-muted-foreground">
                      Resumen
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                      <p>Producto digital: sin reembolsos por desistimiento o falta de uso.</p>
                      <p>Cancelación sin reembolso proporcional del período abonado.</p>
                      <p>Disputas resueltas por soporte antes de iniciar contracargos.</p>
                      <p>Cambios de precio comunicados y aplicables al próximo ciclo.</p>
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
