import { Instagram, Linkedin } from 'lucide-react';

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/evaluo.app/',
  linkedin: 'https://www.linkedin.com/company/evaluo-ar/',
} as const;

export function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-200 bg-white/95">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-3 px-4 py-4 text-center text-sm text-slate-500 sm:min-h-16 sm:flex-row sm:justify-between sm:py-2">
        <p>Evaluo</p>
        <p>Plataforma académica para estudiar mejor</p>
        <div className="flex items-center gap-2" aria-label="Redes sociales de Evaluo">
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Evaluo"
            title="Instagram de Evaluo"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Instagram className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href={SOCIAL_LINKS.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn de Evaluo"
            title="LinkedIn de Evaluo"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Linkedin className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
