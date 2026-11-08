import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Linkedin } from 'lucide-react';

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/evaluo.app/',
  linkedin: 'https://www.linkedin.com/company/evaluo-ar/',
} as const;

export function FooterHome({
  variant = 'full',
  locale = 'es',
  register,
}: {
  variant?: 'full' | 'compact';
  locale?: 'es' | 'en';
  /** 'neutral' = tuteo para las páginas /es/ (fuera de Argentina). */
  register?: 'neutral';
}) {
  if (locale === 'en') return <EnglishHomeFooter />;
  if (variant === 'compact') {
    return (
      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-between gap-4 px-4 py-5 text-center text-cuerpo text-slate-600 sm:flex-row sm:px-8 sm:text-left lg:px-10">
          <div>
            <Link
              href="/"
              aria-label="Ir al inicio de Evaluo"
              className="inline-flex items-center gap-2 font-semibold text-slate-950 transition hover:text-blue-700"
            >
              <Image src="/evaluo-logo-icono.svg" alt="" width={28} height={28} className="h-7 w-7" />
              Evaluo
            </Link>
            <p className="mt-1 text-chico text-slate-500">Tu plataforma de estudio</p>
          </div>
          <div className="flex items-center gap-2" aria-label="Redes sociales de Evaluo">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Evaluo"
              title="Instagram de Evaluo"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-slate-950"
            >
              <Instagram className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn de Evaluo"
              title="LinkedIn de Evaluo"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-slate-950"
            >
              <Linkedin className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-[#050B2C] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:gap-10">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-titulo-sm font-semibold tracking-titulo"
            >
              <Image src="/evaluo-logo-icono.svg" alt="" width={32} height={32} className="h-8 w-8" />
              <span>Evaluo</span>
            </Link>
            <p className="mt-2 max-w-xs text-chico text-white/70">
              Te ayudamos a aprobar, te impulsamos a crecer.
            </p>
            <p className="mt-2 max-w-sm text-etiqueta leading-5 text-white/55">
              Desde tus apuntes o PDFs {register === 'neutral' ? 'puedes' : 'podés'} crear resúmenes, mapas mentales, glosarios, flashcards
              y práctica para estudiar el mismo material de distintas formas.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de Evaluo"
                title="Instagram de Evaluo"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn de Evaluo"
                title="LinkedIn de Evaluo"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <Linkedin className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="flex w-full max-w-sm flex-col self-center text-left md:max-w-none md:self-start">
            <p className="text-chico font-semibold tracking-etiqueta text-white/60 uppercase">
              Navegación
            </p>
            <nav
              aria-label="Navegación del sitio"
              tabIndex={0}
              className="focus-visible:outline-primary mt-3 flex max-h-56 flex-col gap-1 overflow-y-auto overscroll-y-contain rounded-sm pr-4 [scrollbar-color:var(--muted-foreground)_transparent] [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-4 [&>a]:flex [&>a]:min-h-11 [&>a]:shrink-0 [&>a]:items-center"
            >
              <Link href="/#producto" className="text-chico text-white/80 transition hover:text-white">
                Producto
              </Link>
              <Link href="/comparar/evaluo-vs-notebooklm" className="text-chico text-white/80 transition hover:text-white">
                Evaluo vs. NotebookLM
              </Link>
              <Link href="/comparar/evaluo-vs-chatgpt" className="text-chico text-white/80 transition hover:text-white">
                Evaluo vs. ChatGPT
              </Link>
              <Link href="/comparar/evaluo-vs-quizlet" className="text-chico text-white/80 transition hover:text-white">
                Evaluo vs. Quizlet
              </Link>
              <Link
                href="/ia-para-estudiantes"
                className="text-chico text-white/80 transition hover:text-white"
              >
                IA para estudiar
              </Link>
              <Link
                href="/estudiar-pdf-con-ia"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Estudiar PDF con IA
              </Link>

              <Link
                href="/es/guias"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Guías de estudio universitario
              </Link>
              <Link href="/examenes" className="text-chico text-white/80 transition hover:text-white">
                Exámenes de práctica
              </Link>
              <Link href="/planes-de-estudio" className="text-chico text-white/80 transition hover:text-white">
                Planes de estudio
              </Link>
              <Link href="/herramientas" className="text-chico text-white/80 transition hover:text-white">
                Herramientas gratuitas
              </Link>
              <Link href="/recursos" className="text-chico text-white/80 transition hover:text-white">
                Plantillas para estudiar
              </Link>
              <Link href="/funciones" className="text-chico text-white/80 transition hover:text-white">
                Funciones de Evaluo
              </Link>
              <Link href="/comparar" className="text-chico text-white/80 transition hover:text-white">
                Comparativas
              </Link>
              <Link href="/docs" className="text-chico text-white/80 transition hover:text-white">
                Cómo usar Evaluo
              </Link>
              <Link href="/sobre-evaluo" className="text-chico text-white/80 transition hover:text-white">
                Sobre Evaluo
              </Link>
              <Link href="/blog" className="text-chico text-white/80 transition hover:text-white">
                Blog de estudio
              </Link>
              <Link href="/en/blog" lang="en" className="text-chico text-white/80 transition hover:text-white">
                Study blog in English
              </Link>
              <Link
                href="/es/estudiar-pdf-con-ia"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Estudiar con PDF en otros países
              </Link>
              <Link href="/en" lang="en" className="text-chico text-white/80 transition hover:text-white">
                English study guides
              </Link>
              <Link
                href="/funciones/resumir-pdf-con-ia"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Resumir PDF con IA
              </Link>
              <Link href="/convertir-pdf-en-preguntas" className="text-chico text-white/80 transition hover:text-white">
                Generar preguntas desde PDF
              </Link>
              <Link href="/funciones/simulacro-examen-con-ia" className="text-chico text-white/80 transition hover:text-white">
                Simulacros de examen con IA
              </Link>
              <Link href="/funciones/practicar-por-tema" className="text-chico text-white/80 transition hover:text-white">
                Practicar por tema con IA
              </Link>
              <Link
                href="/funciones/crear-flashcards-desde-pdf"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Crear flashcards desde PDF
              </Link>
              <Link
                href="/funciones/crear-mapa-mental-desde-pdf"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Mapas mentales con IA
              </Link>
              <Link
                href="/uba-xxi/parciales"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Parciales UBA XXI: exámenes y práctica
              </Link>
              <Link
                href="/como-estudiar-ingreso-unlam"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Cómo estudiar para el Ingreso UNLaM 2027
              </Link>
              <Link
                href="/blog/tecnicas-de-estudio-efectivas"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Técnicas de estudio efectivas
              </Link>
              <Link
                href="/#como-funciona"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Cómo funciona
              </Link>
              <Link href="/#faq" className="text-chico text-white/80 transition hover:text-white">
                Preguntas frecuentes
              </Link>
              <Link
                href="/login?mode=signup"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Crear cuenta gratis
              </Link>
            </nav>
          </div>

          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <p className="text-chico font-semibold tracking-etiqueta text-white/60 uppercase">
              Legal
            </p>
            <nav className="mt-3 flex flex-col gap-2">
              <Link href="/terminos" className="text-chico text-white/80 transition hover:text-white">
                Términos y condiciones
              </Link>
              <Link
                href="/privacidad"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Política de privacidad
              </Link>
              <Link href="/politica-de-uso-aceptable" className="text-chico text-white/80 transition hover:text-white">
                Política de uso aceptable
              </Link>
              <Link href="/copyright" className="text-chico text-white/80 transition hover:text-white">
                Copyright
              </Link>
              <Link
                href="/facturacion"
                className="text-chico text-white/80 transition hover:text-white"
              >
                Facturación
              </Link>
              <Link href="/reembolsos" className="text-chico text-white/80 transition hover:text-white">
                Política de reembolsos
              </Link>
            </nav>
            <div className="mt-5 max-w-xs text-center text-chico leading-5 text-white/75 md:text-left">
              <p className="font-semibold text-white">Soporte de Evaluo</p>
              <a href="mailto:facturacion@evaluo.com.ar" className="mt-1 inline-block break-all underline underline-offset-2 hover:text-white">
                facturacion@evaluo.com.ar
              </a>
              <p className="mt-1 text-white/60">Consultas sobre el servicio, pagos y suscripciones.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-center md:text-left">
          <p className="text-chico text-white/60">
            Copyright <span suppressHydrationWarning>{new Date().getFullYear()}</span> Evaluo. Todos
            los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Same dark brand footer; English navigation only links to English content. */
function EnglishHomeFooter() {
  return (
    <footer className="bg-[#050B2C] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:gap-10">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <Link href="/en" className="inline-flex items-center gap-2 text-titulo-sm font-semibold tracking-titulo">
              <Image src="/evaluo-logo-icono.svg" alt="" width={32} height={32} />
              <span>Evaluo</span>
            </Link>
            <p className="mt-2 max-w-xs text-chico text-white/70">Study smarter with your own notes.</p>
            <p className="mt-2 max-w-sm text-etiqueta leading-5 text-white/55">
              Turn PDF or Word documents into topic summaries, flashcards, glossaries and practice questions.
            </p>
            <div className="mt-4 flex gap-3">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Evaluo on Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </a>
              <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Evaluo on LinkedIn"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                <Linkedin className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-chico text-white/80">
            <p className="mb-2 text-chico font-semibold uppercase tracking-etiqueta text-white/60">Explore</p>
            <Link href="/en">Home</Link>
            <Link href="/en/how-it-works">How it works</Link>
            <Link href="/en/features">Features</Link>
            <Link href="/en/ai-test-prep">AI test prep</Link>
            <Link href="/en/pdf-to-flashcards">AI flashcard generator</Link>
            <Link href="/en/ai-pdf-summarizer">AI PDF summarizer</Link>
            <Link href="/en/compare">Compare study tools</Link>
            <Link href="/en/resources">English study guides</Link>
            <Link href="/en/blog">Study blog</Link>
            <Link href="/en/login?mode=signup">Create a free account</Link>
            <Link href="/">Español</Link>
          </div>
          <div className="flex flex-col gap-2 text-chico text-white/80">
            <p className="mb-2 text-chico font-semibold uppercase tracking-etiqueta text-white/60">Legal</p>
            <Link href="/en/terms">Terms of service</Link>
            <Link href="/en/privacy">Privacy policy</Link>
            <Link href="/en/refunds">Refund policy</Link>
            <Link href="/en/billing">Billing terms</Link>
            <Link href="/en/copyright">Copyright policy</Link>
            <Link href="/en/acceptable-use">Acceptable use</Link>
            <p className="mt-3 text-chico text-white/65">Support and billing inquiries</p>
            <a className="break-all underline underline-offset-2" href="mailto:facturacion@evaluo.com.ar">facturacion@evaluo.com.ar</a>
          </div>
        </div>
        <p className="mt-6 border-t border-white/10 pt-4 text-center text-chico text-white/55 md:text-left">
          © Evaluo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
