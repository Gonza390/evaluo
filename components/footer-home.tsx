'use client';

import Link from 'next/link';
import { Instagram, Youtube } from 'lucide-react';

export function FooterHome() {
  return (
    <footer className="bg-[#050B2C] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:gap-10">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <Link href="/" className="text-xl font-black tracking-tight">
              Evaluo
            </Link>
            <p className="mt-2 max-w-xs text-xs text-white/60">
              Te ayudamos a aprobar, te impulsamos a crecer.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Navegacion
            </h4>
            <nav className="mt-3 flex flex-col gap-2">
              <a href="#como-funciona" className="text-xs text-white/70 transition hover:text-white">
                Cómo funciona
              </a>
              <a href="#beneficios" className="text-xs text-white/70 transition hover:text-white">
                Beneficios
              </a>
              <a href="#cta" className="text-xs text-white/70 transition hover:text-white">
                Empezar
              </a>
            </nav>
          </div>

          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Legal
            </h4>
            <nav className="mt-3 flex flex-col gap-2">
              <a href="/terminos" className="text-xs text-white/70 transition hover:text-white">
                Términos y condiciones
              </a>
              <a href="/privacidad" className="text-xs text-white/70 transition hover:text-white">
                Politica de privacidad
              </a>
              <a href="/copyright" className="text-xs text-white/70 transition hover:text-white">
                Copyright
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-center md:text-left">
          <p className="text-[10px] text-white/40">
            Copyright <span suppressHydrationWarning>{new Date().getFullYear()}</span> Evaluo. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
