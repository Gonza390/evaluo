import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const page = source('app/(es)/administrador/page.tsx');
const layout = source('app/(es)/administrador/layout.tsx');
const loading = source('app/(es)/administrador/loading.tsx');

for (const name of [
  'AdminHome','UsersRetentionDashboard','PackedAcquisitionDashboard',
  'PackedActivationDashboard','LearningDashboard','StudyPlansDashboard',
  'MonetizationDashboard','CommunicationsDashboard','SystemAiDashboard','GestionDashboard',
]) assert.ok(page.includes('<' + name), 'Missing redesigned panel ' + name);

for (const legacy of [
  'ia-herramientas','ReferralsPanel','IAPanel','AICostPanel','admin-sidebar',
  'PanelNavigation','admin-theme.css','unlam-funnel-panel',
]) assert.ok(!page.includes(legacy), 'Legacy administrator must not render ' + legacy);
assert.ok(!layout.includes('fixed right-5 bottom-5'), 'Old admin floating actions must be removed');
assert.ok(loading.includes('className="ehome"'), 'Loading must match redesigned black UI');

for (const path of [
  'app/(es)/administrador/admin-home.tsx',
  'app/(es)/administrador/users-retention-dashboard.tsx',
  'app/(es)/administrador/acquisition-dashboard.tsx',
  'app/(es)/administrador/activation-dashboard.tsx',
  'app/(es)/administrador/learning-dashboard.tsx',
  'app/(es)/administrador/study-plans-dashboard.tsx',
  'app/(es)/administrador/monetization-dashboard.tsx',
  'app/(es)/administrador/communications-dashboard.tsx',
  'app/(es)/administrador/system-ai-dashboard.tsx',
  'app/(es)/administrador/gestion-dashboard.tsx',
]) {
 const ui = source(path);
 assert.ok(ui.includes('className="ehome'), 'Redesigned HTML shell missing in ' + path);
 assert.ok(ui.includes('eh-tabs'), 'Original ten-tab header missing in ' + path);
}
console.log('Admin redesign: 10-only panels, no legacy shell and consistent loading passed.');
