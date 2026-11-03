'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { obtenerProductoDiarioAdministrador } from './product-actions';
import { obtenerUsoAcademicoAdministrador } from './academic-usage-actions';
import { obtenerAdquisicionAdministrador, type AcquisitionSourceKey } from './acquisition-actions';
import { obtenerEmbudoUnlamAdministrador } from './unlam-funnel-actions';
import { obtenerMailsAdministrador, type MailFilterType } from './mail-actions';
import { obtenerConsumoPdfIAAdministrador } from './ai-cost-data';

// The security check must run on every request, including a cache hit.
// Cache only aggregate results and never cache mutating actions.
const cachedProduct = nextCache(
  async (date?: string | null) => obtenerProductoDiarioAdministrador(date),
  ['admin-product-panel-v1'],
  { revalidate: 300 }
);
const cachedAcademic = nextCache(
  async () => obtenerUsoAcademicoAdministrador(),
  ['admin-academic-panel-v1'],
  { revalidate: 900 }
);
const cachedAcquisition = nextCache(
  async (days: number, source: AcquisitionSourceKey | null) =>
    obtenerAdquisicionAdministrador(days, source),
  ['admin-acquisition-panel-v1'],
  { revalidate: 900 }
);
const cachedUnlam = nextCache(
  async (days: number) => obtenerEmbudoUnlamAdministrador(days),
  ['admin-unlam-panel-v1'],
  { revalidate: 1800 }
);
const cachedMails = nextCache(
  async (type: MailFilterType, days: 7 | 30) => obtenerMailsAdministrador({ type, days }),
  ['admin-mails-panel-v1'],
  { revalidate: 300 }
);
const cachedAiCosts = nextCache(
  async () => obtenerConsumoPdfIAAdministrador(),
  ['admin-ai-costs-panel-v1'],
  { revalidate: 900 }
);

export async function getCachedAdminProduct(date?: string | null) {
  await requireAdminAccess();
  return cachedProduct(date);
}
export async function getCachedAdminAcademic() {
  await requireAdminAccess();
  return cachedAcademic();
}
export async function getCachedAdminAcquisition(days: number, source: AcquisitionSourceKey | null) {
  await requireAdminAccess();
  return cachedAcquisition(days, source);
}
export async function getCachedAdminUnlam(days: number) {
  await requireAdminAccess();
  return cachedUnlam(days);
}
export async function getCachedAdminMails(type: MailFilterType, days: 7 | 30) {
  await requireAdminAccess();
  return cachedMails(type, days);
}
export async function getCachedAdminAiCosts() {
  await requireAdminAccess();
  return cachedAiCosts();
}
