'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

const SessionIdleGuard = dynamic(() => import('@/components/SessionIdleGuard'), {
  ssr: false,
});

const ContextualPdfNudge = dynamic(
  () =>
    import('@/components/pdf-activation/contextual-pdf-nudge').then(
      (module) => module.ContextualPdfNudge
    ),
  { ssr: false }
);

function isLightweightPublicRoute(pathname: string) {
  if (pathname === '/') return true;

  const exactRoutes = new Set([
    '/ia-para-estudiantes',
    '/estudiar-pdf-con-ia',
    '/funciones',
    '/pregunteros',
    '/resumenes',
    '/materias',
    '/pricing',
    '/copyright',
    '/terminos',
    '/privacidad',
    '/facturacion',
  ]);

  if (exactRoutes.has(pathname)) return true;

  return (
    pathname.startsWith('/funciones/') ||
    pathname.startsWith('/pregunteros/') ||
    pathname.startsWith('/resumenes/') ||
    pathname.startsWith('/universidad/')
  );
}

export function GlobalClientRuntime() {
  const pathname = usePathname();
  const shouldRunSessionGuard = !isLightweightPublicRoute(pathname);
  const shouldShowPdfNudge =
    pathname === '/dashboard' || pathname.startsWith('/explorar/materia/');

  return (
    <>
      {shouldRunSessionGuard ? <SessionIdleGuard /> : null}
      {shouldShowPdfNudge ? <ContextualPdfNudge /> : null}
    </>
  );
}
