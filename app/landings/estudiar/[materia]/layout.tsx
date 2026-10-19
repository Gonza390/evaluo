import type { ReactNode } from 'react';

// These SEO landings depend on Supabase data that can be resolved at request time.
// Rendering the segment dynamically avoids static-generation fallbacks producing
// DYNAMIC_SERVER_USAGE while the underlying data loaders keep their own cache.
export const dynamic = 'force-dynamic';

export default function EstudiarMateriaLayout({ children }: { children: ReactNode }) {
  return children;
}
