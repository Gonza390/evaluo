'use client';

import type { ReactNode } from 'react';
import { CalendarDays, CircleAlert, Home, Settings, Upload } from 'lucide-react';

type Props = {
  children: ReactNode;
  section: 'home' | 'material' | 'errors';
  pending: boolean;
  onHome: () => void;
  onErrors: () => void;
  onUpload: () => void;
};

// Réplica aislada de la navegación de ClientLayout: no carga sesión ni datos reales.
export function FirstPdfPreviewShell({
  children,
  section,
  pending,
  onHome,
  onErrors,
  onUpload,
}: Props) {
  const navClass = (active: boolean) =>
    `flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`;
  return (
    <div className="bg-muted/25 text-foreground min-h-screen">
      <header className="border-border bg-background sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-2 border-b px-5 py-3 sm:px-7">
        <button
          onClick={onHome}
          aria-label="Evaluo · Ir a Mi espacio"
          className="text-primary text-2xl font-black tracking-tight"
        >
          evaluo.
        </button>
        <span className="text-muted-foreground text-xs">
          Preview del recorrido · Cuenta de ejemplo
        </span>
        <button
          onClick={onUpload}
          className="border-border hover:bg-muted hidden min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold md:inline-flex"
        >
          <Upload className="size-4" /> Subir mi PDF
        </button>
      </header>
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="border-border bg-background sticky top-16 hidden h-[calc(100dvh-4rem)] w-56 shrink-0 flex-col border-r p-4 md:flex">
          <nav aria-label="Navegación principal del preview" className="space-y-2">
            <button
              onClick={onHome}
              aria-current={section !== 'errors' ? 'page' : undefined}
              className={navClass(section !== 'errors')}
            >
              <Home className="size-4" /> Mi espacio
            </button>
            <button
              disabled
              title="Fuera de este recorrido de muestra"
              className="text-muted-foreground flex min-h-11 w-full items-center gap-3 px-3 text-left text-sm opacity-50"
            >
              <CalendarDays className="size-4 shrink-0" /> Calendario de exámenes
            </button>
            <button
              onClick={onErrors}
              aria-current={section === 'errors' ? 'page' : undefined}
              className={navClass(section === 'errors')}
            >
              <CircleAlert className="size-4" /> Mis errores{' '}
              {pending && (
                <span className="bg-primary text-primary-foreground ml-auto rounded-full px-2 text-xs">
                  1
                </span>
              )}
            </button>
          </nav>
          <p className="!text-muted-foreground mt-auto !text-xs">
            Estudiante · Material de ejemplo
          </p>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 pb-28 sm:px-7 md:pb-10 lg:px-9">{children}</main>
      </div>
      <nav
        aria-label="Navegación móvil del preview"
        className="border-border bg-background fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <button
          onClick={onHome}
          aria-current={section !== 'errors' ? 'page' : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${section !== 'errors' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Home className="size-5" /> Inicio
        </button>
        <button
          onClick={onErrors}
          aria-current={section === 'errors' ? 'page' : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${section === 'errors' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <CircleAlert className="size-5" /> Mis errores{pending ? ' · 1' : ''}
        </button>
        <button
          disabled
          className="text-muted-foreground flex min-h-16 flex-col items-center justify-center gap-1 text-xs opacity-50"
        >
          <CalendarDays className="size-5" /> Calendario
        </button>
        <button
          disabled
          className="text-muted-foreground flex min-h-16 flex-col items-center justify-center gap-1 text-xs opacity-50"
        >
          <Settings className="size-5" /> Perfil
        </button>
      </nav>
    </div>
  );
}

export function PreviewGuide({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <aside
      aria-label={`Guía del recorrido: ${title}`}
      className="border-primary/25 bg-primary/5 my-5 flex gap-3 rounded-xl border p-4"
    >
      <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
        {number}
      </span>
      <div className="min-w-0">
        <span className="text-primary text-xs font-semibold">RECORRIDO GUIADO · {number} DE 5</span>
        <h2 className="mt-1 text-base font-bold">{title}</h2>
        <div className="text-muted-foreground mt-1 text-sm leading-relaxed">{children}</div>
      </div>
    </aside>
  );
}
