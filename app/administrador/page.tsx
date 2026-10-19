import './admin-theme.css';
import Link from 'next/link';
import { IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';
import {
  obtenerFeedbackExplicacionesAdmin,
  obtenerFeedbackRevisionAdmin,
  obtenerPromptSistema,
  obtenerRankingErroresIA,
} from './shared-actions';
import { obtenerConsumoPdfIAAdministrador } from './ai-cost-data';
import { obtenerUsuariosAdministradorPaginadoCacheado } from './cached-performance-actions';
import { obtenerReferidosAdministrador } from './referrals-actions';
import { ReferralsPanel } from './referrals-panel';
import { obtenerAdquisicionAdministrador, type AcquisitionSourceKey } from './acquisition-actions';
import { AcquisitionPanel } from './acquisition-panel';
import { obtenerProductoDiarioAdministrador } from './product-actions';
import { ProductPanel } from './product-panel';
import { obtenerMailsAdministrador, type MailFilterType } from './mail-actions';
import { obtenerUsoAcademicoAdministrador } from './academic-usage-actions';
import { MailPanel } from './mail-panel';
import {
  AICostPanel,
  AcademicUsagePanel,
  IAPanel,
  UsersPanelV2,
} from './lazy-panels';

type PanelKey =
  | 'producto'
  | 'adquisicion'
  | 'referidos'
  | 'biblioteca'
  | 'usuarios'
  | 'mails'
  | 'ia';

const adminSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--admin-font-sans',
});

const adminSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
  variable: '--admin-font-serif',
});

const PANELS: Array<{ key: PanelKey; label: string }> = [
  { key: 'producto', label: 'Producto' },
  { key: 'adquisicion', label: 'Adquisición' },
  { key: 'referidos', label: 'Referidos' },
  { key: 'biblioteca', label: 'Uso académico' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'mails', label: 'Mails' },
  { key: 'ia', label: 'IA' },
];

const PERIOD_OPTIONS = [
  { value: 1, label: 'Hoy' },
  { value: 7, label: '7 días' },
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
] as const;

const ACQUISITION_SOURCE_KEYS: AcquisitionSourceKey[] = [
  'google',
  'whatsapp',
  'instagram',
  'linkedin',
  'reddit',
];

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
  }>;
}) {
  const params = (await searchParams) ?? {};
  const requestedPanel = params.panel;
  const activePanel = PANELS.find((panel) => panel.key === requestedPanel)?.key ?? 'producto';
  const requestedPeriod = Number(params.period ?? 7);
  const activePeriod = PERIOD_OPTIONS.find((option) => option.value === requestedPeriod)?.value ?? 7;
  const usersPage = Math.max(1, Number(params.usersPage ?? 1) || 1);
  const requestedProductDate = String(params.productDate ?? '').trim();
  const requestedSource = String(params.source ?? '').trim().toLowerCase();
  const requestedMailType = String(params.mailType ?? 'all').trim().toLowerCase();
  const activeMailType: MailFilterType =
    requestedMailType === 'exam' || requestedMailType === 'ready' || requestedMailType === 'campaign'
      ? requestedMailType
      : 'all';
  const activeMailPeriod: 7 | 30 = Number(params.mailPeriod ?? 7) === 30 ? 30 : 7;
  const selectedAcquisitionSource = ACQUISITION_SOURCE_KEYS.includes(
    requestedSource as AcquisitionSourceKey
  )
    ? (requestedSource as AcquisitionSourceKey)
    : null;

  const needsProduct = activePanel === 'producto';
  const needsAcquisition = activePanel === 'adquisicion';
  const needsReferrals = activePanel === 'referidos';
  const needsBiblioteca = activePanel === 'biblioteca';
  const needsUsers = activePanel === 'usuarios';
  const needsMails = activePanel === 'mails';
  const needsIA = activePanel === 'ia';

  const [
    productResult,
    acquisitionResult,
    referralResult,
    academicUsageResult,
    usersResult,
    mailResult,
    iaPromptResult,
    iaRankingResult,
    iaFeedbackStatsResult,
    iaFeedbackReviewResult,
    iaCostResult,
  ] = await Promise.all([
    needsProduct
      ? obtenerProductoDiarioAdministrador(requestedProductDate)
      : Promise.resolve(null),
    needsAcquisition
      ? obtenerAdquisicionAdministrador(activePeriod, selectedAcquisitionSource)
      : Promise.resolve(null),
    needsReferrals ? obtenerReferidosAdministrador() : Promise.resolve(null),
    needsBiblioteca ? obtenerUsoAcademicoAdministrador() : Promise.resolve(null),
    needsUsers ? obtenerUsuariosAdministradorPaginadoCacheado(usersPage, 25) : Promise.resolve(null),
    needsMails
      ? obtenerMailsAdministrador({ type: activeMailType, days: activeMailPeriod })
      : Promise.resolve(null),
    needsIA ? obtenerPromptSistema() : Promise.resolve(null),
    needsIA ? obtenerRankingErroresIA(30) : Promise.resolve(null),
    needsIA ? obtenerFeedbackExplicacionesAdmin() : Promise.resolve(null),
    needsIA ? obtenerFeedbackRevisionAdmin(40) : Promise.resolve(null),
    needsIA ? obtenerConsumoPdfIAAdministrador() : Promise.resolve(null),
  ]);

  let panelContent: React.ReactNode;

  if (activePanel === 'producto') {
    panelContent =
      productResult?.success && productResult.stats ? (
        <ProductPanel stats={productResult.stats} />
      ) : (
        <ErrorPanel message={productResult?.message ?? 'No pudimos cargar Producto.'} />
      );
  } else if (activePanel === 'adquisicion') {
    panelContent =
      acquisitionResult?.success && acquisitionResult.stats ? (
        <AcquisitionPanel
          stats={acquisitionResult.stats}
          activePeriod={activePeriod}
          selectedSource={selectedAcquisitionSource}
        />
      ) : (
        <ErrorPanel message={acquisitionResult?.message ?? 'No pudimos cargar Adquisición.'} />
      );
  } else if (activePanel === 'referidos') {
    panelContent =
      referralResult?.success && referralResult.data ? (
        <ReferralsPanel data={referralResult.data} />
      ) : (
        <ErrorPanel message={referralResult?.message ?? 'No pudimos cargar Referidos.'} />
      );
  } else if (activePanel === 'biblioteca') {
    panelContent =
      academicUsageResult?.success && academicUsageResult.stats ? (
        <AcademicUsagePanel stats={academicUsageResult.stats} />
      ) : (
        <ErrorPanel
          message={academicUsageResult?.message ?? 'No pudimos cargar Uso académico.'}
        />
      );
  } else if (activePanel === 'usuarios') {
    if (!usersResult?.success || !usersResult.stats || !usersResult.rows) {
      panelContent = <ErrorPanel message={usersResult?.message ?? 'No pudimos cargar Usuarios.'} />;
    } else {
      panelContent = (
        <UsersPanelV2
          stats={usersResult.stats}
          rows={usersResult.rows}
          page={usersResult.page ?? usersPage}
          totalPages={usersResult.totalPages ?? 1}
        />
      );
    }
  } else if (activePanel === 'mails') {
    if (mailResult?.success) {
      panelContent = (
        <MailPanel
          data={mailResult.data}
          activeType={activeMailType}
          activePeriod={activeMailPeriod}
        />
      );
    } else {
      panelContent = (
        <ErrorPanel
          message={
            mailResult && !mailResult.success ? mailResult.message : 'No pudimos cargar Mails.'
          }
        />
      );
    }
  } else if (
    iaPromptResult?.success &&
    iaRankingResult?.success &&
    iaFeedbackStatsResult?.success &&
    iaFeedbackReviewResult?.success
  ) {
    panelContent = (
      <>
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

  return (
    <main className={`admin-shell ${adminSans.variable} ${adminSerif.variable}`}>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-inner">
            <div className="admin-brand">Evaluo</div>
            <PanelNavigation
              activePanel={activePanel}
              activePeriod={activePeriod}
              productDate={productResult?.success && productResult.stats
                ? productResult.stats.dateKey
                : requestedProductDate}
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
