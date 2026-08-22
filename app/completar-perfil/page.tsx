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
      <div
        className={`w-full ${compact ? 'max-w-3xl' : 'max-w-6xl'} rounded-[32px] border border-white/80 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]`}
      >
        <div className="h-4 w-32 animate-pulse rounded-full bg-white" />
        <div className="mt-4 h-10 w-3/4 animate-pulse rounded-2xl bg-white" />
        <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-white" />
        <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-white" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="h-32 animate-pulse rounded-[28px] bg-white" />
          <div className="h-32 animate-pulse rounded-[28px] bg-white" />
        </div>
        <p className="mt-6 text-sm font-semibold text-slate-700">
          Estamos preparando tu experiencia académica
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Validamos tu sesión y revisamos tu universidad, carrera y materias activas.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Si este paso tarda demasiado, recarga la página e intenta nuevamente.
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
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.10),transparent_22%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)]" />
      <div className="absolute left-[6%] top-[10%] h-44 w-44 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute bottom-[8%] right-[8%] h-56 w-56 rounded-full bg-sky-200/35 blur-3xl" />

      <div className="relative z-0 mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8">
        <div className="grid w-full gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="rounded-[32px] border border-white/70 bg-white/72 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              <div className="h-5 w-24 rounded-full bg-white" />
              <div className="mt-4 h-10 w-3/4 rounded-2xl bg-white" />
              <div className="mt-3 h-4 w-full rounded-full bg-white" />
              <div className="mt-2 h-4 w-5/6 rounded-full bg-white" />
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="h-24 rounded-3xl bg-white" />
                <div className="h-24 rounded-3xl bg-white" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-28 rounded-[28px] border border-white/70 bg-white/68 shadow-[0_18px_44px_rgba(15,23,42,0.06)]" />
              <div className="h-28 rounded-[28px] border border-white/70 bg-white/64 shadow-[0_18px_44px_rgba(15,23,42,0.06)]" />
              <div className="h-28 rounded-[28px] border border-white/70 bg-white/60 shadow-[0_18px_44px_rgba(15,23,42,0.06)]" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-48 rounded-[32px] border border-white/70 bg-white/72 shadow-[0_20px_50px_rgba(15,23,42,0.08)]" />
            <div className="h-56 rounded-[32px] border border-white/70 bg-white/68 shadow-[0_20px_50px_rgba(15,23,42,0.08)]" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_0%,transparent_32%,transparent_72%,rgba(255,255,255,0.06)_100%)]" />

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
