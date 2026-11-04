import './admin-theme.css';
import { obtenerTableroGeneral } from './admin-home-actions';
import { AdminHome } from './admin-home';
import Link from 'next/link';
import {
  obtenerFeedbackExplicacionesAdmin,
  obtenerFeedbackRevisionAdmin,
  obtenerPromptSistema,
  obtenerRankingErroresIA,
} from './shared-actions';
import { obtenerConsumoPdfIAAdministrador } from './ai-cost-data';
import { obtenerUltimaComprobacionClaves } from './ai-key-health-actions';
import { AIKeyHealthPanel } from './ai-key-health-panel';
import { obtenerUsuariosRetencion } from './users-retention-actions';
import { UsersRetentionDashboard } from './users-retention-dashboard';
import { obtenerReferidosAdministrador } from './referrals-actions';
import { ReferralsPanel } from './referrals-panel';
import { obtenerDashboardMonetizacion } from './monetization-dashboard-actions';
import { MonetizationDashboard } from './monetization-dashboard';
import { obtenerDashboardAdquisicion } from './acquisition-dashboard-actions';
import { AcquisitionDashboard } from './acquisition-dashboard';
import { obtenerActivacionRecorrido } from './activation-dashboard-actions';
import { ActivationDashboard } from './activation-dashboard';
import { obtenerDashboardComunicaciones } from './communications-dashboard-actions';
import { CommunicationsDashboard } from './communications-dashboard';
import { obtenerAprendizajePracticas } from './learning-dashboard-actions';
import { LearningDashboard } from './learning-dashboard';
import { obtenerDashboardPlanesEstudio } from './study-plans-dashboard-actions';
import { StudyPlansDashboard } from './study-plans-dashboard';
import { obtenerDashboardGestion } from './gestion-dashboard-actions';
import { GestionDashboard } from './gestion-dashboard';
import {
  AICostPanel,
  IAPanel,
} from './lazy-panels';

type PanelKey =
  | 'resumen'
  | 'producto'
  | 'adquisicion'
  | 'referidos'
  | 'monetizacion'
  | 'biblioteca'
  | 'planes'
  | 'usuarios'
  | 'mails'
  | 'ia'
  | 'gestion';

const PANELS: Array<{ key: PanelKey; label: string }> = [
  { key: 'resumen', label: 'Resumen general' },
  { key: 'producto', label: 'Producto' },
  { key: 'adquisicion', label: 'Adquisición' },
  { key: 'referidos', label: 'Referidos' },
  { key: 'monetizacion', label: 'Monetización' },
  { key: 'biblioteca', label: 'Uso académico' },
  { key: 'planes', label: 'Planes de estudio' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'mails', label: 'Comunicaciones' },
  { key: 'ia', label: 'IA' },
  { key: 'gestion', label: 'Gestión' },
];

const PERIOD_OPTIONS = [
  { value: 1, label: 'Hoy' },
  { value: 7, label: '7 días' },
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
] as const;

function ErrorPanel({ message }: { message: string }) {
  return (
    <section className="admin-panel-error">
      <h2>No pudimos cargar este panel</h2>
      <p>{message}</p>
    </section>
  );
}

function PanelNavigation({
  activePanel,
  activePeriod,
  productDate,
}: {
  activePanel: PanelKey;
  activePeriod: number;
  productDate: string;
}) {
  return (
    <nav className="admin-nav" aria-label="Secciones del administrador">
      {PANELS.map((panel) => {
        const active = panel.key === activePanel;
        return (
          <Link
            key={panel.key}
            href={`/administrador?panel=${panel.key}&period=${activePeriod}&productDate=${encodeURIComponent(productDate)}`}
            prefetch={false}
            className={`admin-nav-link${active ? ' is-active' : ''}`}
          >
            {panel.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default async function AdministradorPage({
  searchParams,
}: {
  searchParams?: Promise<{
    panel?: string;
    period?: string;
    usersPage?: string;
    source?: string;
    mailType?: string;
    mailPeriod?: string;
    productDate?: string;
    unlam?: string;
    date?: string;
    from?: string;
    to?: string;
    usersSearch?: string;
    usersPlan?: string;
    usersMaterials?: string;
    usersCountry?: string;
    usersUniversity?: string;
    userId?: string;
    academicPeriod?: string;
    academicFrom?: string;
    academicTo?: string;
    academicUniversity?: string;
    academicCareer?: string;
    academicSubject?: string;
    academicPlan?: string;
    planPeriod?: string;
    planFrom?: string;
    planTo?: string;
    planUniversity?: string;
    planCareer?: string;
    planSubject?: string;
    planDuration?: string;
    planState?: string;
    moneyPeriod?: string;
    moneyFrom?: string;
    moneyTo?: string;
    moneyUniversity?: string;
    moneyCareer?: string;
    moneyCountry?: string;
    moneyProvider?: string;
    moneyState?: string;
    commPeriod?: string;
    commFrom?: string;
    commTo?: string;
    commType?: string;
    commTemplate?: string;
    commStatus?: string;
    commCampaign?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const requestedPanel = params.panel;
  const activePanel = PANELS.find((panel) => panel.key === requestedPanel)?.key ?? 'resumen';
  const requestedPeriod = Number(params.period ?? 7);
  const activePeriod = PERIOD_OPTIONS.find((option) => option.value === requestedPeriod)?.value ?? 7;
  const usersPage = Math.max(1, Number(params.usersPage ?? 1) || 1);
  const requestedProductDate = String(params.productDate ?? '').trim();

  const needsOverview = activePanel === 'resumen';
  const needsProduct = activePanel === 'producto';
  const needsAcquisition = activePanel === 'adquisicion';
  const needsReferrals = activePanel === 'referidos';
  const needsMonetizacion = activePanel === 'monetizacion';
  const needsBiblioteca = activePanel === 'biblioteca';
  const needsPlanes = activePanel === 'planes';
  const needsUsers = activePanel === 'usuarios';
  const needsMails = activePanel === 'mails';
  const needsIA = activePanel === 'ia';
  const needsGestion = activePanel === 'gestion';

  const [
    overviewResult,
    productResult,
    acquisitionResult,
    referralResult,
    monetizationResult,
    academicUsageResult,
    plansResult,
    usersResult,
    mailResult,
    gestionResult,
    iaPromptResult,
    iaRankingResult,
    iaFeedbackStatsResult,
    iaFeedbackReviewResult,
    iaCostResult,
    aiKeyHealthResult,
  ] = await Promise.all([
    needsOverview ? obtenerTableroGeneral(params.date) : Promise.resolve(null),
    needsProduct ? obtenerActivacionRecorrido() : Promise.resolve(null),
    needsAcquisition ? obtenerDashboardAdquisicion() : Promise.resolve(null),
    needsReferrals ? obtenerReferidosAdministrador() : Promise.resolve(null),
    needsMonetizacion ? obtenerDashboardMonetizacion(params) : Promise.resolve(null),
    needsBiblioteca ? obtenerAprendizajePracticas(params) : Promise.resolve(null),
    needsPlanes ? obtenerDashboardPlanesEstudio(params) : Promise.resolve(null),
    needsUsers ? obtenerUsuariosRetencion({
      period: activePeriod, from:params.from ?? null, to:params.to ?? null, page:usersPage,
      search:params.usersSearch ?? '', plan:params.usersPlan ?? 'all',
      materials:params.usersMaterials ?? 'all', country:params.usersCountry ?? 'all',
      university:params.usersUniversity ?? 'all', selectedUserId:params.userId ?? null,
    }) : Promise.resolve(null),
    needsMails ? obtenerDashboardComunicaciones(params) : Promise.resolve(null),
    needsGestion ? obtenerDashboardGestion() : Promise.resolve(null),
    needsIA ? obtenerPromptSistema() : Promise.resolve(null),
    needsIA ? obtenerRankingErroresIA(30) : Promise.resolve(null),
    needsIA ? obtenerFeedbackExplicacionesAdmin() : Promise.resolve(null),
    needsIA ? obtenerFeedbackRevisionAdmin(40) : Promise.resolve(null),
    needsIA ? obtenerConsumoPdfIAAdministrador() : Promise.resolve(null),
    needsIA ? obtenerUltimaComprobacionClaves() : Promise.resolve(null),
  ]);

  let panelContent: React.ReactNode;

  if (activePanel === 'producto') {
    panelContent = productResult
      ? <ActivationDashboard data={productResult} />
      : <ErrorPanel message="No pudimos cargar Activación y recorrido." />;
  } else if (activePanel === 'adquisicion') {
    panelContent = acquisitionResult
      ? <AcquisitionDashboard data={acquisitionResult} />
      : <ErrorPanel message="No pudimos cargar Adquisición y SEO." />;
  } else if (activePanel === 'monetizacion') {
    panelContent = monetizationResult
      ? <MonetizationDashboard snapshot={monetizationResult.snapshot}
          filters={monetizationResult.filters} today={monetizationResult.today}
          earliest={monetizationResult.earliest} />
      : <ErrorPanel message="No pudimos cargar Monetización." />;
  } else if (activePanel === 'gestion') {
    panelContent = gestionResult
      ? <GestionDashboard snapshot={gestionResult.snapshot} actor={gestionResult.actor}
          limits={gestionResult.limits} />
      : <ErrorPanel message="No pudimos cargar Gestión." />;
  } else if (activePanel === 'referidos') {
    panelContent =
      referralResult?.success && referralResult.data ? (
        <ReferralsPanel data={referralResult.data} />
      ) : (
        <ErrorPanel message={referralResult?.message ?? 'No pudimos cargar Referidos.'} />
      );
  } else if (activePanel === 'biblioteca') {
    panelContent = academicUsageResult
      ? <LearningDashboard data={academicUsageResult.data} filters={academicUsageResult.filters}
          earliest={academicUsageResult.earliest} today={academicUsageResult.today} />
      : <ErrorPanel message="No pudimos cargar Aprendizaje y prácticas." />;
  } else if (activePanel === 'planes') {
    panelContent = plansResult
      ? <StudyPlansDashboard snapshot={plansResult.snapshot} filters={plansResult.filters}
          today={plansResult.today} earliest={plansResult.earliest} />
      : <ErrorPanel message="No pudimos cargar Planes de estudio." />;
  } else if (activePanel === 'usuarios') {
    panelContent = usersResult
      ? <UsersRetentionDashboard
          stats={usersResult.stats} segments={usersResult.segments} list={usersResult.list}
          detail={usersResult.detail} filters={usersResult.filters} today={usersResult.today} minDay={usersResult.minDay}
        />
      : <ErrorPanel message="No se pudieron cargar los usuarios." />;
  } else if (activePanel === 'mails') {
    panelContent = mailResult
      ? <CommunicationsDashboard snapshot={mailResult.snapshot} filters={mailResult.filters}
          today={mailResult.today} earliest={mailResult.earliest} />
      : <ErrorPanel message="No pudimos cargar Comunicaciones." />;
  } else if (
    iaPromptResult?.success &&
    iaRankingResult?.success &&
    iaFeedbackStatsResult?.success &&
    iaFeedbackReviewResult?.success
  ) {
    panelContent = (
      <>
        <AIKeyHealthPanel initialReport={aiKeyHealthResult?.report ?? null} />
        <AICostPanel
          stats={iaCostResult?.success ? (iaCostResult.stats ?? null) : null}
          error={iaCostResult?.success ? null : iaCostResult?.message}
        />
        <IAPanel
          initialPrompt={iaPromptResult.data ?? ''}
          initialRankingRows={iaRankingResult.rows ?? []}
          initialFeedbackStats={
            (
              iaFeedbackStatsResult as {
                stats?: {
                  total: number;
                  positive: number;
                  negative: number;
                  generatedCount: number;
                };
              }
            ).stats ?? null
          }
          initialFeedbackReviewRows={iaFeedbackReviewResult.rows ?? []}
        />
      </>
    );
  } else {
    panelContent = (
      <ErrorPanel
        message={
          iaPromptResult?.message ??
          iaRankingResult?.message ??
          iaFeedbackReviewResult?.message ??
          'No pudimos cargar IA.'
        }
      />
    );
  }

  if (needsOverview && overviewResult) {
    return <AdminHome data={overviewResult.snapshot} minDay={overviewResult.minDay} />;
  }
  if (needsProduct && productResult) {
    return <ActivationDashboard data={productResult} />;
  }
  if (needsAcquisition && acquisitionResult) {
    return <AcquisitionDashboard data={acquisitionResult} />;
  }
  if (needsBiblioteca && academicUsageResult) {
    return <LearningDashboard data={academicUsageResult.data} filters={academicUsageResult.filters}
      earliest={academicUsageResult.earliest} today={academicUsageResult.today} />;
  }
  if (needsMonetizacion && monetizationResult) {
    return <MonetizationDashboard snapshot={monetizationResult.snapshot}
      filters={monetizationResult.filters} today={monetizationResult.today}
      earliest={monetizationResult.earliest} />;
  }
  if (needsPlanes && plansResult) {
    return <StudyPlansDashboard snapshot={plansResult.snapshot} filters={plansResult.filters}
      today={plansResult.today} earliest={plansResult.earliest} />;
  }
  if (needsGestion && gestionResult) {
    return <GestionDashboard snapshot={gestionResult.snapshot} actor={gestionResult.actor}
      limits={gestionResult.limits} />;
  }
  if (needsMails && mailResult) {
    return <CommunicationsDashboard snapshot={mailResult.snapshot} filters={mailResult.filters}
      today={mailResult.today} earliest={mailResult.earliest} />;
  }
  if (needsUsers && usersResult) {
    return <UsersRetentionDashboard
      stats={usersResult.stats} segments={usersResult.segments} list={usersResult.list}
      detail={usersResult.detail} filters={usersResult.filters} today={usersResult.today} minDay={usersResult.minDay}
    />;
  }

  return (
    <main className="admin-shell" style={{ '--admin-font-sans': 'Arial, Helvetica, sans-serif', '--admin-font-serif': 'Georgia, serif' } as React.CSSProperties}>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-inner">
            <div className="admin-brand">Evaluo</div>
            <PanelNavigation
              activePanel={activePanel}
              activePeriod={activePeriod}
              productDate={requestedProductDate}
            />
            <div className="admin-sidebar-links">
              <Link href="/administrador/feedback" prefetch={false}>Feedback</Link>
              <Link href="/administrador/solicitudes" prefetch={false}>Solicitudes</Link>
            </div>
          </div>
        </aside>

        <section className="admin-main">
          <div className="admin-main-inner">{panelContent}</div>
        </section>
      </div>
    </main>
  );
}
