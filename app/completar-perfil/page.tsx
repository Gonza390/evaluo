'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProfileCompletionPrivateCatalog } from '@/components/profile-completion-private-catalog';
import { Spinner } from '@/components/ui/spinner';
import { useUser } from '@/hooks/useUser';
import { logError } from '@/lib/observability';
import { hasCompleteAcademicProfile } from '@/lib/profile-completion';
import { DEMO_MIGRATION_FLAG_KEY } from '@/lib/simulator-persistence';
import { supabase } from '@/lib/supabase-client';

function sanitizeNextPath(value: string | null) {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)
  ) {
    return '/dashboard';
  }

  return value;
}

function ProfileSetupLoading({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className={`w-full ${compact ? 'max-w-xl' : 'max-w-2xl'} border-y border-slate-200 py-10 text-center`}>
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <Spinner size="sm" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-800">Preparando tu experiencia académica</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
          Revisamos tu universidad, carrera y materias para llevarte al siguiente paso.
        </p>
      </div>
    </div>
  );
}

function CompletarPerfilContent() {
  const { user, loading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get('next'));
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [requiresCompletion, setRequiresCompletion] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [loading, nextPath, router, user]);

  useEffect(() => {
    let active = true;

    async function checkProfile() {
      if (loading) return;

      if (!user) {
        if (active) {
          setIsCheckingProfile(false);
          setRequiresCompletion(false);
        }
        return;
      }

      if (nextPath.startsWith('/dashboard/materiales/nuevo')) {
        if (active) {
          setRequiresCompletion(false);
          setIsCheckingProfile(false);
          router.replace(nextPath);
        }
        return;
      }

      setIsCheckingProfile(true);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('universidad_id, carrera_id, active_subjects')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        if (
          hasCompleteAcademicProfile({
            universidadId: data?.universidad_id,
            carreraId: data?.carrera_id,
            activeSubjects: data?.active_subjects,
          })
        ) {
          setRequiresCompletion(false);
          router.replace(nextPath);
          return;
        }

        setRequiresCompletion(true);
      } catch (error) {
        logError('completarPerfil.checkProfile', error, { userId: user.id, nextPath });
        if (active) setRequiresCompletion(true);
      } finally {
        if (active) setIsCheckingProfile(false);
      }
    }

    void checkProfile();
    return () => {
      active = false;
    };
  }, [loading, nextPath, router, user]);

  if (!user || loading || isCheckingProfile) {
    return <ProfileSetupLoading />;
  }

  if (!requiresCompletion) return null;

  return (
    <div className="min-h-screen bg-white">
      <ProfileCompletionPrivateCatalog
        userId={user.id}
        isOpen={true}
        allowSkip={false}
        onComplete={() => {
          const cameFromDemo =
            typeof window !== 'undefined' &&
            window.localStorage.getItem(DEMO_MIGRATION_FLAG_KEY) === '1';
          const completionDestination = nextPath === '/dashboard' ? '/empezar' : nextPath;
          router.replace(cameFromDemo ? '/dashboard' : completionDestination);
          router.refresh();
        }}
      />
    </div>
  );
}

export default function CompletarPerfilPage() {
  return (
    <Suspense fallback={<ProfileSetupLoading compact={true} />}>
      <CompletarPerfilContent />
    </Suspense>
  );
}
