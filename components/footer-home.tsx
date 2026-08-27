import Link from 'next/link';
import { Instagram, Linkedin } from 'lucide-react';

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/evaluo.app/',
  linkedin: 'https://www.linkedin.com/company/evaluo-ar/',
} as const;

export function FooterHome() {
  return (
    <footer className="bg-[#050B2C] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:gap-10">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Evaluo
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
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white/60">
              Navegación
            </h4>
            <nav className="mt-3 flex flex-col gap-2">
              <a href="#producto" className="text-xs text-white/80 transition hover:text-white">
                Producto
              </a>
              <a href="#como-funciona" className="text-xs text-white/80 transition hover:text-white">
                Cómo funciona
              </a>
              <a href="#faq" className="text-xs text-white/80 transition hover:text-white">
                Preguntas frecuentes
              </a>
              <Link href="/login?mode=signup" className="text-xs text-white/80 transition hover:text-white">
                Empezar
              </Link>
            </nav>
          </div>

          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h4 className="text-[12px] font-semibold uppercase tracking-wider text-white/60">
              Legal
            </h4>
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
