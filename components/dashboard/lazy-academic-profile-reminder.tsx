'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { AcademicProfileReminder } from '@/components/dashboard/academic-profile-reminder';

// El formulario académico opcional no forma parte del JavaScript inicial de Mi espacio.
// Sólo se descarga cuando el servidor detecta que faltan datos tras un PDF listo.
const AcademicProfileReminderLazy = dynamic(
  () => import('@/components/dashboard/academic-profile-reminder').then(
    (module) => module.AcademicProfileReminder
  ),
  { ssr: false }
);

export function LazyAcademicProfileReminder(props: ComponentProps<typeof AcademicProfileReminder>) {
  return <AcademicProfileReminderLazy {...props} />;
}
