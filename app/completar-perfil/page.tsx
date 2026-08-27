'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProfileCompletionModal } from '@/components/profile-completion-modal';
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

function ProfileSetupSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className={`w-full ${compact ? 'max-w-xl' : 'max-w-2xl'} border-y border-slate-200 py-8`}>
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-5 h-8 w-2/3 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-7 h-px bg-slate-200" />
        <p className="mt-6 text-sm font-semibold text-slate-700">
          Estamos preparando tu experiencia académica
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Validamos tu sesión y revisamos tu universidad, carrera y materias activas.
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
        if (active) {
          setRequiresCompletion(true);
        }
      } finally {
        if (active) {
          setIsCheckingProfile(false);
        }
      }
    }

    void checkProfile();

    return () => {
      active = false;
    };
  }, [loading, nextPath, router, user]);

  if (!user || loading || isCheckingProfile) {
    return <ProfileSetupSkeleton />;
  }

  if (!requiresCompletion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <ProfileCompletionModal
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
    <Suspense fallback={<ProfileSetupSkeleton compact={true} />}>
      <CompletarPerfilContent />
    </Suspense>
  );
}
