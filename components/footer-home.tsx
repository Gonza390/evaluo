import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Linkedin } from 'lucide-react';

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/evaluo.app/',
  linkedin: 'https://www.linkedin.com/company/evaluo-ar/',
} as const;

export function FooterHome({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-between gap-4 px-4 py-5 text-center text-sm text-slate-600 sm:flex-row sm:px-8 sm:text-left lg:px-10">
          <div>
            <Link
              href="/"
              aria-label="Ir al inicio de Evaluo"
              className="inline-flex items-center gap-2 font-bold text-slate-950 transition hover:text-indigo-700"
            >
              <Image src="/icon.png" alt="" width={28} height={28} className="h-7 w-7" />
              Evaluo
            </Link>
            <p className="mt-1 text-xs text-slate-500">Tu plataforma de estudio</p>
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
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight">
              <Image src="/icon.png" alt="" width={32} height={32} className="h-8 w-8" />
              <span>Evaluo</span>
            </Link>
            <p className="mt-2 max-w-xs text-xs text-white/70">
              Te ayudamos a aprobar, te impulsamos a crecer.
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

          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-white/60">
              Navegación
            </p>
            <nav className="mt-3 flex flex-col gap-2">
              <Link href="/#producto" className="text-xs text-white/80 transition hover:text-white">
                Producto
              </Link>
              <Link href="/ia-para-estudiantes" className="text-xs text-white/80 transition hover:text-white">
                IA para estudiar
              </Link>
              <Link href="/#como-funciona" className="text-xs text-white/80 transition hover:text-white">
                Cómo funciona
              </Link>
              <Link href="/#faq" className="text-xs text-white/80 transition hover:text-white">
                Preguntas frecuentes
              </Link>
              <Link href="/login?mode=signup" className="text-xs text-white/80 transition hover:text-white">
                Crear cuenta gratis
              </Link>
            </nav>
          </div>

          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-white/60">
              Legal
            </p>
            <nav className="mt-3 flex flex-col gap-2">
              <Link href="/terminos" className="text-xs text-white/80 transition hover:text-white">
                Términos y condiciones
              </Link>
              <Link href="/privacidad" className="text-xs text-white/80 transition hover:text-white">
                Política de privacidad
              </Link>
              <Link href="/copyright" className="text-xs text-white/80 transition hover:text-white">
                Copyright
              </Link>
              <Link href="/facturacion" className="text-xs text-white/80 transition hover:text-white">
                Facturación
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-center md:text-left">
          <p className="text-[12px] text-white/60">
            Evaluo no es una institución educativa ni está afiliada, patrocinada o aprobada por ninguna universidad. Los materiales son de estudio y las marcas mencionadas pertenecen a sus respectivos titulares.
          </p>
          <p className="mt-2 text-[12px] text-white/60">
            Copyright <span suppressHydrationWarning>{new Date().getFullYear()}</span> Evaluo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
