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
    <div className="animate-page-enter min-h-screen bg-white [&_.surface-card]:shadow-none [&_.surface-panel]:shadow-none [&_[data-tour-target-hero]]:shadow-none">
      <div className="flex flex-1">
        <LazyDashboardContent initialBootstrap={bootstrap} deferredBootstrap={deferred} />
      </div>
    </div>
  );
}
