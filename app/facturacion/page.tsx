import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';

export const metadata = {
  title: 'Términos de facturación y reembolsos | Evaluo',
  description:
    'Términos de facturación, suscripciones recurrentes, compras por período fijo, política de reembolsos y contracargos de Evaluo.',
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
      'Estos términos de facturación ("Términos de Facturación") regulan la contratación, el cobro, la renovación y las disputas de los planes de pago de Evaluo. Se complementan con los Términos y Condiciones y la Política de Privacidad. Al contratar un plan de pago, aceptás estas condiciones en su totalidad.',
    ],
  },
  {
    title: '2. Modalidades de pago',
    body: [
      'Evaluo puede ofrecer suscripciones con renovación automática, como el plan Premium mensual, y también accesos por un período fijo abonados mediante un pago único, como una oferta de seis meses. El precio, la duración y las características aplicables son los publicados en el momento de la contratación.',
      'Las suscripciones recurrentes se renuevan automáticamente al finalizar cada período, salvo que el Usuario las cancele antes de la fecha de renovación. El cobro se procesa a través de la pasarela de pagos (por ejemplo, Mercado Pago) con el medio de pago registrado.',
      'Los accesos por período fijo no se renuevan automáticamente. Una vez aprobado el pago, el acceso permanece habilitado hasta la fecha de vencimiento informada al Usuario, salvo que el pago sea posteriormente anulado, reembolsado o desconocido conforme a la normativa y a las reglas de la pasarela de pagos.',
    ],
  },
  {
    title: '3. Períodos de prueba (free trial)',
    body: [
      'Cuando se ofrezca un período de prueba gratuito, el Usuario podrá acceder al plan durante el tiempo indicado sin cargo, sujeto al registro de un medio de pago si así se establece.',
      'Si la prueba está asociada a una suscripción recurrente, al finalizar el período de prueba la suscripción podrá activarse automáticamente y cobrarse el valor vigente del plan, salvo que el Usuario cancele antes de que finalice la prueba, de acuerdo con las condiciones informadas al contratar.',
      'El Usuario es responsable de revisar las condiciones y fechas informadas para cada prueba o promoción antes de confirmar la contratación.',
    ],
  },
  {
    title: '4. Política de reembolsos',
    body: [
      'Por tratarse de un producto digital de acceso inmediato, los pagos realizados por planes de Evaluo no generan automáticamente un reembolso por falta de uso, cambio de opinión o resultados académicos distintos de los esperados.',
      'La cancelación de una suscripción recurrente no genera por sí sola un reembolso proporcional del período ya abonado. En las compras por período fijo, el acceso se mantiene hasta la fecha de vencimiento correspondiente mientras el pago permanezca válido.',
      'En todos los casos se respetarán los derechos y excepciones que resulten obligatorios conforme a la normativa aplicable de protección al consumidor. Cuando corresponda un reembolso, se procesará por el medio disponible de acuerdo con las reglas y plazos de la pasarela de pagos.',
    ],
  },
  {
    title: '5. Contracargos y disputas de pago',
    body: [
      'En caso de que el Usuario inicie un contracargo, mediación o desconocimiento del pago ante su banco, emisor de tarjeta o la pasarela de pagos, recomendamos previamente contactarse con el soporte de Evaluo para intentar resolver la situación por los canales del servicio.',
      'Ante una disputa, Evaluo podrá presentar ante la pasarela de pagos la documentación disponible sobre la contratación, la aceptación de estos Términos de Facturación y el acceso al servicio, en la medida permitida por la normativa aplicable.',
      'Si un pago es anulado, reembolsado o desconocido, el acceso asociado podrá suspenderse o finalizar de acuerdo con el estado definitivo informado por la pasarela de pagos. Si existe un error de facturación atribuible al servicio, se corregirá el cobro conforme corresponda.',
    ],
  },
  {
    title: '6. Cambios de precios y de planes',
    body: [
      'Evaluo podrá actualizar precios, planes o características del servicio. En las suscripciones recurrentes, los cambios de precio que correspondan se comunicarán con anticipación razonable y regirán a partir de un ciclo futuro. Si el Usuario no está de acuerdo, podrá cancelar antes de la renovación.',
      'Una compra por período fijo mantiene el precio y la duración confirmados para ese período. Cualquier compra posterior se regirá por las condiciones vigentes en ese momento.',
    ],
  },
  {
    title: '7. Impuestos y medios de pago',
    body: [
      'Los precios publicados incluyen los impuestos, tributos y percepciones que correspondan según la legislación vigente, salvo que se informe expresamente lo contrario. Evaluo no gestiona medios de pago directamente: las transacciones se procesan a través de pasarelas de pago autorizadas (por ejemplo, Mercado Pago), cuyos términos propios también pueden aplicar al Usuario.',
      'En las suscripciones recurrentes, si un cobro no puede procesarse, Evaluo podrá informar la situación por los canales del servicio y suspender el acceso hasta que el pago se regularice.',
    ],
  },
  {
    title: '8. Contacto',
    body: [
      'Para consultas o reclamos de facturación, disputas o cancelaciones, escribinos a facturacion@evaluo.com.ar. Nuestro equipo atiende las consultas por los canales oficiales del servicio.',
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
                recurrentes, las compras por período fijo, los períodos de prueba, los reembolsos y
                el tratamiento de disputas de pago de Evaluo.
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
                        El plan mensual se renueva automáticamente hasta que lo canceles. Las
                        compras por período fijo terminan en la fecha informada y no se renuevan
                        automáticamente.
                      </p>
                      <p>
                        Si tenés un problema con un cobro, podés contactarnos para revisar el caso
                        antes de iniciar una disputa ante la pasarela de pagos.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <p className="text-xs font-bold uppercase tracking-[0.26em] text-muted-foreground">
                      Resumen
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                      <p>Premium mensual: renovación automática hasta la cancelación.</p>
                      <p>Planes por período fijo: un pago, acceso hasta el vencimiento informado.</p>
                      <p>Los derechos obligatorios del consumidor se respetan en todos los casos.</p>
                      <p>Los cambios futuros de precio no modifican períodos fijos ya comprados.</p>
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
