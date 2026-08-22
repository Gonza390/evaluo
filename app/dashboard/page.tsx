import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { getDashboardBootstrap } from '@/lib/data/dashboard-bootstrap';
import { hasCompleteAcademicProfile } from '@/lib/profile-completion';

const DashboardContent = dynamic(
  () => import('@/components/dashboard/dashboard-content').then((module) => module.DashboardContent),
  {
    loading: () => (
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface-panel min-h-[320px] animate-pulse bg-white/80" aria-hidden="true" />
        <div className="grid gap-4">
          <div className="surface-panel min-h-[150px] animate-pulse bg-white/80" aria-hidden="true" />
          <div className="surface-panel min-h-[150px] animate-pulse bg-white/80" aria-hidden="true" />
        </div>
      </div>
    ),
  }
);

export default async function DashboardPage() {
  const bootstrap = await getDashboardBootstrap();

  if (bootstrap.status === 'login') {
    redirect('/login?next=%2Fdashboard');
  }

  const hasResolvedAcademicProfile = Boolean(
    bootstrap.academicProfile?.universidadId && bootstrap.academicProfile?.carreraId
  );
  const needsSubjectCompletion =
    bootstrap.status === 'ok' &&
    hasResolvedAcademicProfile &&
    !hasCompleteAcademicProfile({
      universidadId: bootstrap.academicProfile?.universidadId,
      carreraId: bootstrap.academicProfile?.carreraId,
      activeSubjects: bootstrap.state.activeSubjects,
    });

  if (bootstrap.status === 'complete-profile' || needsSubjectCompletion) {
    redirect('/completar-perfil?next=%2Fdashboard');
  }

  return (
    <div className="animate-page-enter from-background/95 min-h-screen bg-gradient-to-br via-white/80 to-emerald-50/20">
      <div className="flex flex-1">
        <DashboardContent initialBootstrap={bootstrap} />
      </div>
    </div>
  );
}
