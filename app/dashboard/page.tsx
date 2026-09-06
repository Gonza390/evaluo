import { redirect } from 'next/navigation';
import { getDashboardBootstrapStream } from '@/lib/data/dashboard-bootstrap';
import { hasCompleteAcademicProfile } from '@/lib/profile-completion';
import { LazyDashboardContent } from '@/components/dashboard/lazy-dashboard-content';
import { ReferralPortalDashboardShortcut } from '@/components/referrals/ReferralPortalDashboardShortcut';

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
    <div
      data-dashboard-page
      className="animate-page-enter min-h-screen bg-white [&_.surface-card]:shadow-none [&_.surface-panel]:shadow-none [&_[data-tour-target-hero]]:rounded-2xl [&_[data-tour-target-hero]]:bg-none [&_[data-tour-target-hero]]:bg-indigo-600 [&_[data-tour-target-hero]]:shadow-none [&_[data-tour-target-hero]_button]:shadow-none [&_[data-tour-target-hero]_img]:opacity-80 [&_[data-tour-target-checklist]]:max-w-none [&_[data-tour-target-checklist]]:rounded-none [&_[data-tour-target-checklist]]:border-x-0 [&_[data-tour-target-checklist]]:border-slate-200 [&_[data-tour-target-checklist]]:bg-slate-50/60 [&_[data-tour-target-checklist]]:shadow-none [&_#materias-favoritas]:rounded-none [&_#materias-favoritas]:border-x-0 [&_#materias-favoritas]:border-t-0 [&_#materias-favoritas]:bg-transparent [&_#materias-favoritas]:shadow-none [&_#materias-favoritas_button]:shadow-none"
    >
      <style>{`
        [data-dashboard-page] button.rounded-xl.border-slate-200.bg-white.text-xs:has(.lucide-circle-help) {
          display: none;
        }
      `}</style>
      <ReferralPortalDashboardShortcut />
      <div className="flex flex-1">
        <LazyDashboardContent initialBootstrap={bootstrap} deferredBootstrap={deferred} />
      </div>
    </div>
  );
}
