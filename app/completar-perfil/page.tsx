'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AcademicProfileSimpleForm } from '@/components/profile-academic-simple';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase-client';

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') ||
      /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    return '/dashboard';
  }
  return value;
}

function AcademicProfilePageContent() {
  const { user, loading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?next=' + encodeURIComponent('/completar-perfil?next=' + encodeURIComponent(nextPath)));
    }
  }, [loading, nextPath, router, user]);

  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    void supabase.from('profiles')
      .select('universidad_id, carrera_id')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data?.universidad_id && data?.carrera_id) {
          router.replace(nextPath);
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        if (active) setChecking(false);
      });
    return () => { active = false; };
  }, [loading, nextPath, router, user]);

  if (loading || !user || checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4">
        <p className="text-sm text-slate-500">Preparando tus datos académicos…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50/40 px-4 py-10">
      <AcademicProfileSimpleForm nextPath={nextPath} />
    </main>
  );
}

export default function CompletarPerfilPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white" />}>
      <AcademicProfilePageContent />
    </Suspense>
  );
}
