import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, FileText, LockKeyhole, ShieldCheck } from 'lucide-react';
import { FooterHome } from '@/components/footer-home';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';

export const metadata: Metadata = {
  title: 'Política de Uso Aceptable',
  description:
    'Conocé las reglas de uso de Evaluo para cargar PDF y Word, generar contenidos con IA, respetar los derechos de terceros y practicar de forma académicamente responsable.',
  alternates: { canonical: '/politica-de-uso-aceptable' },
  robots: { index: true, follow: true },
};

type PolicySection = {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
};

const sections: PolicySection[] = [
  {
    id: 'alcance',
    title: '1. Alcance y finalidad',
    paragraphs: [
      'Esta Política de Uso Aceptable establece las reglas para utilizar Evaluo, incluyendo la carga y el procesamiento de documentos PDF y Word (DOCX), los resúmenes, glosarios, flashcards, preguntas, simulacros, casos y planes de estudio asistidos por inteligencia artificial.',
      'Evaluo es un servicio de software educativo para estudiar y practicar. No vende exámenes oficiales, trabajos académicos resueltos ni títulos o certificaciones. Esta política complementa los Términos y Condiciones, la Política de Privacidad y la Política de Copyright.',
    ],
  },
  {
    id: 'usos-permitidos',
    title: '2. Usos permitidos',
    items: [
      'Subir apuntes propios y materiales que tengas derecho o autorización para utilizar y procesar.',
      'Crear resúmenes y explicaciones, repasar conceptos y organizar el estudio por temas.',
      'Generar y resolver ejercicios de práctica, tarjetas de memoria y simulacros como preparación personal.',
      'Utilizar las explicaciones y los resultados de Evaluo como material de apoyo, verificando su precisión con tus fuentes y docentes.',
      'Compartir un material únicamente cuando tengas los derechos y permisos necesarios para hacerlo.',
    ],
  },
  {
    id: 'materiales',
    title: '3. Documentos y contenido que podés cargar',
    paragraphs: [
      'Antes de subir un archivo, asegurate de tener un derecho o permiso suficiente para almacenarlo y procesarlo mediante un servicio de terceros. La disponibilidad pública de un documento no significa que esté autorizado para cualquier uso.',
      'No cargues archivos obtenidos ilícitamente, copias no autorizadas de manuales o libros, bancos de preguntas confidenciales, evaluaciones restringidas, materiales protegidos por acuerdos de confidencialidad ni documentos que infrinjan derechos de autor u otros derechos de terceros.',
      'No cargues información personal de otras personas sin una base legítima y los permisos necesarios. Evitá incluir contraseñas, datos bancarios, historias clínicas, documentos de identidad u otra información sensible que no sea necesaria para estudiar.',
    ],
  },
  {
    id: 'ia',
    title: '4. Uso responsable de las funciones de IA',
    items: [
      'No utilices las herramientas para fabricar información, plagiar, suplantar a otra persona o presentar contenido generado como una producción propia cuando la institución lo prohíba.',
      'No utilices Evaluo para responder evaluaciones activas, vulnerar sistemas de examen, obtener preguntas reservadas ni eludir reglas de integridad académica.',
      'No generes ni difundas contenido ilegal, amenazas, acoso, discriminación, fraudes, malware o instrucciones destinadas a causar daño.',
      'No intentes forzar al sistema a revelar instrucciones internas, acceder a datos ajenos, eludir límites de uso ni automatizar solicitudes abusivas.',
      'No presentes como oficiales los ejercicios, resultados, calificaciones o simulacros creados por Evaluo.',
    ],
    paragraphs: [
      'Los sistemas de inteligencia artificial pueden producir errores, omisiones o interpretaciones incorrectas. Verificá los datos importantes, especialmente en materias técnicas, científicas, jurídicas o de salud. La plataforma no sustituye la enseñanza, la evaluación de una institución ni el criterio de un profesional.',
    ],
  },
  {
    id: 'derechos',
    title: '5. Propiedad intelectual, atribución y contenido compartido',
    paragraphs: [
      'Conservás los derechos que correspondan sobre tus materiales. Al cargarlos autorizás el procesamiento necesario para ofrecerte las funcionalidades de Evaluo, conforme a los Términos y la Política de Privacidad. No adquirís derechos sobre documentos, marcas o contenidos de terceros por haberlos subido a la plataforma.',
      'Si decidís compartir un material mediante un enlace u otra función disponible, verificá previamente que contás con autorización para esa difusión y que no contiene información confidencial o personal de terceros. Respetá las condiciones de uso de tu institución y las licencias del contenido.',
      'Si sos titular de derechos y detectás un posible uso no autorizado, podés utilizar el canal y el procedimiento que indicamos en la Política de Copyright.',
    ],
  },
  {
    id: 'seguridad',
    title: '6. Seguridad y uso de la plataforma',
    items: [
      'No accedas a cuentas, materiales o información de otros usuarios sin autorización.',
      'No introduzcas archivos maliciosos ni intentes interrumpir, sobrecargar o vulnerar el servicio.',
      'No eludas las restricciones de los planes, límites de uso, sistemas de autenticación o mecanismos de seguridad.',
      'No utilices bots o integraciones no autorizadas para explotar el servicio de manera abusiva.',
    ],
  },
  {
    id: 'medidas',
    title: '7. Medidas ante incumplimientos',
    paragraphs: [
      'Cuando detectemos un incumplimiento o recibamos un reclamo fundamentado, podremos revisar la situación y, según su gravedad, restringir el acceso a determinados materiales, retirar contenido, suspender funcionalidades o cuentas y adoptar otras medidas proporcionadas conforme a nuestros Términos y la normativa aplicable.',
      'Podremos atender requerimientos legales válidos y solicitudes sobre derechos de autor o privacidad. No garantizamos que todos los contenidos sean revisados antes de su procesamiento o publicación.',
    ],
  },
  {
    id: 'consultas',
    title: '8. Consultas, reportes y actualizaciones',
    paragraphs: [
      'Para consultas relacionadas con el uso del servicio, denuncias de contenido o posibles infracciones, escribinos a legal@evaluo.com.ar. Para solicitudes relacionadas con datos personales, utilizá privacidad@evaluo.com.ar.',
      'Podemos actualizar esta política para reflejar cambios de producto, obligaciones legales y medidas de seguridad. Publicaremos la versión vigente en esta página y comunicaremos los cambios relevantes cuando corresponda.',
    ],
  },
];

export default function AcceptableUsePolicyPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#0F1B3D]">
      <div className="border-b border-[#E7EBF4] bg-white">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-10">
          <PublicSiteHeader trackingLocation="acceptable_use_header" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-6 sm:py-14 lg:px-10 lg:py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#42506A] transition hover:text-[#456DBD]">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
        <header className="mt-8 rounded-[28px] border border-[#E7EBF4] bg-white px-6 py-9 sm:px-10 sm:py-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF2FF] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#5D70C4]">
            <ShieldCheck className="h-4 w-4" /> Uso responsable de Evaluo
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-[-0.055em] sm:text-5xl">
            Política de Uso Aceptable
          </h1>
          <p className="mt-5 max-w-3xl text-[15px] leading-8 text-[#42506A]">
            Reglas claras para estudiar con tus documentos y utilizar las herramientas de IA de forma segura,
            respetuosa de los derechos de terceros y coherente con la integridad académica.
          </p>
          <p className="mt-4 text-xs text-[#7F8AA3]">Última actualización: 6 de noviembre de 2026</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: FileText, title: 'Tus materiales', text: 'Subí archivos que podés utilizar legalmente.' },
              { icon: ShieldCheck, title: 'Tu aprendizaje', text: 'Usá la IA como apoyo y verificá lo generado.' },
              { icon: LockKeyhole, title: 'Privacidad y seguridad', text: 'No compartas datos ajenos ni contenido restringido.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#E7EBF4] bg-[#F5F7FB] p-4">
                <item.icon className="h-5 w-5 text-[#5D70C4]" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-bold">{item.title}</h2>
                <p className="mt-1 text-xs leading-6 text-[#42506A]">{item.text}</p>
              </div>
            ))}
          </div>
        </header>
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-12">
          <article className="space-y-6">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 rounded-[24px] border border-[#E7EBF4] bg-white p-6 sm:p-8">
                <h2 className="text-xl font-bold tracking-[-0.03em] sm:text-2xl">{section.title}</h2>
                {section.paragraphs?.map((text) => (
                  <p key={text} className="mt-4 text-[15px] leading-8 text-[#42506A]">{text}</p>
                ))}
                {section.items ? (
                  <ul className="mt-5 list-disc space-y-3 pl-5 text-[15px] leading-7 text-[#42506A] marker:text-[#5D70C4]">
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}
            <div className="rounded-2xl border border-[#E7EBF4] bg-[#EEF2FF] p-6 text-sm leading-7 text-[#42506A]">
              Esta política se complementa con los{' '}
              <Link href="/terminos" className="font-semibold text-[#456DBD] underline underline-offset-4">Términos y Condiciones</Link>, la{' '}
              <Link href="/privacidad" className="font-semibold text-[#456DBD] underline underline-offset-4">Política de Privacidad</Link> y la{' '}
              <Link href="/copyright" className="font-semibold text-[#456DBD] underline underline-offset-4">Política de Copyright</Link>.
            </div>
          </article>
          <aside className="hidden lg:block">
            <nav aria-label="Contenido de esta política" className="sticky top-8 rounded-[20px] border border-[#E7EBF4] bg-white p-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#7F8AA3]">En esta página</h2>
              <ol className="mt-4 space-y-3">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="text-sm leading-6 text-[#42506A] transition hover:text-[#456DBD]">{section.title.replace(/^\d+\. /, '')}</a>
                  </li>
                ))}
              </ol>
              <Link href="/terminos" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#456DBD]">
                Ver términos <ArrowUpRight className="h-4 w-4" />
              </Link>
            </nav>
          </aside>
        </div>
      </main>
      <FooterHome />
    </div>
  );
}
