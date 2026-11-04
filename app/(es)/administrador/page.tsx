import { obtenerTableroGeneral } from './admin-home-actions';
import { AdminHome } from './admin-home';
import { obtenerUsuariosRetencion } from './users-retention-actions';
import { UsersRetentionDashboard } from './users-retention-dashboard';
import { obtenerDashboardMonetizacion } from './monetization-dashboard-actions';
import { MonetizationDashboard } from './monetization-dashboard';
import { obtenerDashboardAdquisicion } from './acquisition-dashboard-actions';
import { PackedAcquisitionDashboard } from './packed-acquisition-dashboard';
import { obtenerActivacionRecorrido } from './activation-dashboard-actions';
import { PackedActivationDashboard } from './packed-activation-dashboard';
import { obtenerDashboardComunicaciones } from './communications-dashboard-actions';
import { CommunicationsDashboard } from './communications-dashboard';
import { obtenerAprendizajePracticas } from './learning-dashboard-actions';
import { LearningDashboard } from './learning-dashboard';
import { obtenerDashboardPlanesEstudio } from './study-plans-dashboard-actions';
import { StudyPlansDashboard } from './study-plans-dashboard';
import { obtenerDashboardGestion } from './gestion-dashboard-actions';
import { GestionDashboard } from './gestion-dashboard';
import { obtenerDashboardSistemaIA } from './system-ai-dashboard-actions';
import { SystemAiDashboard } from './system-ai-dashboard';

// The redesigned administrator consists of exactly the ten supplied HTML panels.
// Legacy referrals, prompt tools and the old sidebar are deliberately not routed here.
const panelKeys = [
  'resumen', 'usuarios', 'adquisicion', 'producto', 'biblioteca',
  'planes', 'monetizacion', 'mails', 'ia', 'gestion',
] as const;
type PanelKey = (typeof panelKeys)[number];

export default async function AdministradorPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const activePanel: PanelKey = panelKeys.includes(params.panel as PanelKey)
    ? (params.panel as PanelKey) : 'resumen';
  switch (activePanel) {
    case 'resumen': {
      const result = await obtenerTableroGeneral(params.date);
      return <AdminHome data={result.snapshot} minDay={result.minDay} />;
    }
    case 'usuarios': {
      const period = Number(params.period ?? 7);
      const result = await obtenerUsuariosRetencion({
        period: [1, 7, 14, 30].includes(period) ? period : 7,
        from: params.from ?? null, to: params.to ?? null,
        page: Math.max(1, Number(params.usersPage ?? 1) || 1),
        search: params.usersSearch ?? '', plan: params.usersPlan ?? 'all',
        materials: params.usersMaterials ?? 'all',
        country: params.usersCountry ?? 'all',
        university: params.usersUniversity ?? 'all',
        selectedUserId: params.userId ?? null,
      });
      return <UsersRetentionDashboard
        stats={result.stats} segments={result.segments} list={result.list}
        detail={result.detail} filters={result.filters}
        today={result.today} minDay={result.minDay}
      />;
    }
    case 'adquisicion': {
      const snapshot = await obtenerDashboardAdquisicion();
      return <PackedAcquisitionDashboard data={snapshot} />;
    }
    case 'producto': {
      const snapshot = await obtenerActivacionRecorrido();
      return <PackedActivationDashboard data={snapshot} />;
    }
    case 'biblioteca': {
      const result = await obtenerAprendizajePracticas(params);
      return <LearningDashboard data={result.data} filters={result.filters}
        earliest={result.earliest} today={result.today} />;
    }
    case 'planes': {
      const result = await obtenerDashboardPlanesEstudio(params);
      return <StudyPlansDashboard snapshot={result.snapshot} filters={result.filters}
        today={result.today} earliest={result.earliest} />;
    }
    case 'monetizacion': {
      const result = await obtenerDashboardMonetizacion(params);
      return <MonetizationDashboard snapshot={result.snapshot} filters={result.filters}
        today={result.today} earliest={result.earliest} />;
    }
    case 'mails': {
      const result = await obtenerDashboardComunicaciones(params);
      return <CommunicationsDashboard snapshot={result.snapshot} filters={result.filters}
        today={result.today} earliest={result.earliest} />;
    }
    case 'ia': {
      const result = await obtenerDashboardSistemaIA(params);
      return <SystemAiDashboard data={result.snapshot} days={result.days} />;
    }
    case 'gestion': {
      const result = await obtenerDashboardGestion();
      return <GestionDashboard snapshot={result.snapshot}
        actor={result.actor} limits={result.limits} />;
    }
  }
}
