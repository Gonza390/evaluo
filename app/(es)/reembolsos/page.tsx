import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';

export const metadata = {
  title: 'Política de reembolsos | Evaluo',
  description: 'Información sobre reembolsos en Evaluo para compras en Argentina e internacionales.',
  alternates: { canonical: '/reembolsos' },
  robots: { index: false, follow: true },
};

const sections = [
  { title: 'Solicitud de reembolso', paragraphs: [
    'Si tenés dudas sobre un cobro o querés solicitar una devolución, escribí a facturacion@evaluo.com.ar indicando la fecha, el plan adquirido y una referencia del comprobante. No envíes el número completo de tu tarjeta.',
    'Cada solicitud se evalúa según las condiciones informadas al contratar, el proveedor identificado en el comprobante y los derechos obligatorios del consumidor.',
  ] },
  { title: 'Compras en Argentina: Mercado Pago', paragraphs: [
    'Los pagos disponibles en Argentina se procesan actualmente mediante Mercado Pago. Evaluo puede ayudarte a revisar errores de cobro, cancelaciones y solicitudes de devolución, conforme a las reglas del proveedor y las leyes aplicables.',
  ] },
  { title: 'Compras internacionales: Creem', paragraphs: [
    'Cuando el checkout internacional esté habilitado, las compras fuera de Argentina se procesarán mediante Creem (Armitage Labs OÜ), que actúa como vendedor registrado (Merchant of Record). El importe final, incluidos los impuestos aplicables, se mostrará antes del pago.',
    'Cuando Creem figure en el comprobante como vendedor registrado, se aplicarán también sus términos para compradores y su procedimiento para procesar devoluciones. El soporte de Evaluo puede orientarte hacia los canales correspondientes.',
  ] },
  { title: 'Cómo solicitar una devolución con Creem', paragraphs: [
    'Si compraste a través de Creem, contactá primero a facturacion@evaluo.com.ar indicando la fecha, el producto y una referencia del recibo. Evaluo evaluará la solicitud y, cuando corresponda, gestionará la devolución a través de Creem. Para asuntos no resueltos también podés usar el portal de clientes o soporte de Creem.',
    'Las compras efectuadas con Creem están sujetas a los términos para compradores de https://www.creem.io/buyer-terms y a los derechos irrenunciables del consumidor. Creem procesa las devoluciones aprobadas.',
    'En la Unión Europea, el Espacio Económico Europeo y el Reino Unido pueden corresponder derechos de desistimiento, generalmente durante los primeros 14 días, con excepciones aplicables a productos y servicios digitales cuando el usuario haya consentido su uso inmediato. El alcance concreto se determina por las condiciones informadas al comprar y la legislación aplicable.',
    'Cancelar una renovación no genera automáticamente un reembolso del período pagado; la solicitud de devolución se tramita por el canal del vendedor indicado en el comprobante.',
  ] },
  { title: 'Cancelación y plazos', paragraphs: [
    'Cancelar una suscripción evita futuras renovaciones según las condiciones mostradas al contratar, pero no implica automáticamente un reembolso del período ya cobrado. Los planes de duración fija finalizan en la fecha indicada.',
    'Una devolución aprobada se procesa a través del proveedor de pago y puede demorar según el medio utilizado. Nada de esta política limita derechos irrenunciables del consumidor, incluidos derechos de desistimiento cuando correspondan.',
  ] },
] as const;

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-14 lg:py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Volver</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.26em] text-brand">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Política de reembolsos</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">Última actualización: noviembre de 2026. Complementa los <Link href="/facturacion" className="font-semibold text-blue-700 underline">términos de facturación</Link>.</p>
        <div className="mt-10 space-y-10">
          {sections.map(section => <section key={section.title} className="border-b border-border pb-8">
            <h2 className="text-xl font-bold">{section.title}</h2>
            {section.paragraphs.map(paragraph => <p key={paragraph} className="mt-3 text-[15px] leading-8 text-muted-foreground">{paragraph}</p>)}
          </section>)}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">Contacto: <a href="mailto:facturacion@evaluo.com.ar" className="font-semibold text-blue-700 underline">facturacion@evaluo.com.ar</a></p>
      </main>
      <FooterHome />
    </div>
  );
}
