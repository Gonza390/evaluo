/** Convenciones compartidas del espacio de estudio de un PDF. */
export const pdfStudyQuestionActionsClassName =
  'border-border bg-card mt-4 flex justify-end border-t py-3 md:pt-5 md:pb-0 [&>button]:min-h-11 [&>button]:w-full md:[&>button]:w-auto';

// Pestañas como texto libre con subrayado: sin borde ni fondo; la activa se subraya.
export const pdfStudyTabClassName =
  'text-muted-foreground hover:text-foreground relative h-11 flex-none shrink-0 gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 text-[14px] font-medium shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none';

export const pdfStudyControlsClassName =
  '[&_[data-slot=button]]:rounded-lg [&_[data-slot=button]]:text-[13px] [&_[data-slot=button]]:shadow-none';

export const pdfStudyPrimaryButton =
  'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2';

export const pdfStudySecondaryButton =
  'border-border bg-card text-foreground hover:bg-muted focus-visible:outline-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2';
