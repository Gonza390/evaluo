'use server';

import { requireAdminAccess } from '@/lib/auth';
import {
  getLatestAIKeyHealthReport,
  runAIKeyHealthCheck,
  type AIKeyHealthReport,
} from '@/lib/ai/key-health';

type HealthActionResult = {
  success: boolean;
  report: AIKeyHealthReport | null;
  message?: string;
};

export async function obtenerUltimaComprobacionClaves(): Promise<HealthActionResult> {
  try {
    await requireAdminAccess();
    return { success: true, report: await getLatestAIKeyHealthReport() };
  } catch {
    return { success: false, report: null, message: 'No pudimos consultar el estado de las claves.' };
  }
}

export async function comprobarClavesIAAhora(): Promise<HealthActionResult> {
  try {
    await requireAdminAccess();
    const latest = await getLatestAIKeyHealthReport();
    if (latest && Date.now() - Date.parse(latest.checkedAt) < 120_000) {
      return { success: true, report: latest, message: 'Comprobación reciente: esperá dos minutos para repetirla.' };
    }
    return { success: true, report: await runAIKeyHealthCheck() };
  } catch {
    return { success: false, report: null, message: 'No pudimos ejecutar la comprobación de las claves.' };
  }
}
