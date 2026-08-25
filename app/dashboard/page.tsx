import { redirect } from 'next/navigation';
import { getDashboardBootstrapStream } from '@/lib/data/dashboard-bootstrap';
import { hasCompleteAcademicProfile } from '@/lib/profile-completion';
import { LazyDashboardContent } from '@/components/dashboard/lazy-dashboard-content';

export default async function DashboardPage() {
  const { initial: bootstrap, deferred } = await getDashboardBootstrapStream();

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
        <LazyDashboardContent initialBootstrap={bootstrap} deferredBootstrap={deferred} />
      </div>
    </div>
  );
}
