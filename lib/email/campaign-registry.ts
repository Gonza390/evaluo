import 'server-only';

export type ActiveMailCampaign = {
  id: string;
  title: string;
  trigger: string;
  purpose: string;
  cadence: string;
  source: 'Evaluo' | 'Sender';
};

function envEnabled(name: string, fallback = false) {
  const value = process.env[name]?.trim();
  if (!value) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

export function getActiveMailCampaigns(): ActiveMailCampaign[] {
  const campaigns: Array<ActiveMailCampaign & { enabled: boolean }> = [
    {
      id: 'study_return_d1_v1',
      title: 'Retorno D+1 · Próxima acción',
      trigger: '24–48 h sin actividad después de estudiar un PDF.',
      purpose:
        'Traer al estudiante de vuelta con la próxima acción exacta: continuar resumen, empezar/retomar práctica o reforzar.',
      cadence: 'Revisión diaria · máximo un envío por sesión de estudio.',
      source: 'Evaluo',
      enabled: envEnabled('STUDY_RETURN_D1_ENABLED'),
    },
    {
      id: 'study_return_48h_v1',
      title: 'Retorno 48 h',
      trigger: '48–72 h sin actividad después de una sesión de estudio reciente.',
      purpose:
        'Segunda oportunidad de retorno si el usuario no volvió luego de la primera sesión.',
      cadence: 'Revisión diaria · evita competir con otros mails recientes.',
      source: 'Evaluo',
      enabled: envEnabled('STUDY_RETURN_48H_ENABLED'),
    },
    {
      id: 'student_material_ready_v1',
      title: 'PDF listo para estudiar',
      trigger: 'El PDF termina de procesarse y el usuario ya no está activo en Evaluo.',
      purpose: 'Avisar que el material está listo y llevarlo directamente a empezar a estudiar.',
      cadence: 'Reactiva · se evalúa al finalizar el procesamiento.',
      source: 'Evaluo',
      enabled: envEnabled('STUDENT_MATERIAL_READY_EMAIL_ENABLED'),
    },
    {
      id: 'exam_reminders',
      title: 'Recordatorios de examen',
      trigger: 'Faltan 7, 3 o 1 día para una fecha de examen registrada.',
      purpose: 'Hacer que el estudiante retome el material correcto antes de rendir.',
      cadence: 'Revisión diaria.',
      source: 'Evaluo',
      enabled: true,
    },
    {
      id: 'flashcard_review_reminder',
      title: 'Repaso de flashcards',
      trigger: 'Hay un recordatorio de flashcards pendiente y todavía existen tarjetas/temas a reforzar.',
      purpose: 'Recuperar conceptos que el estudiante marcó como no dominados.',
      cadence: 'Revisión diaria sobre recordatorios programados.',
      source: 'Evaluo',
      enabled: true,
    },
    {
      id: 'reactivation_next_subject_30d_v1',
      title: 'Reactivación · Próxima materia',
      trigger: '30–45 días sin actividad después de haber usado un simulador.',
      purpose:
        'Reactivar al usuario cuando probablemente ya cambió de examen y llevarlo a estudiar la próxima materia con un PDF.',
      cadence: 'Revisión diaria · lote controlado.',
      source: 'Evaluo',
      enabled: envEnabled('REACTIVATION_NEXT_SUBJECT_ENABLED'),
    },
    {
      id: 'sender_reactivation_30d_university_20261008',
      title: 'Reactivación +30 días · Universidad',
      trigger: 'Cohorte de usuarios con más de 30 días sin actividad; mensaje personalizado por universidad cuando está disponible.',
      purpose:
        'Recuperar usuarios antiguos presentando el Evaluo actual y llevarlos a subir un nuevo PDF.',
      cadence: 'Secuencia de 3 mails: día 0, +3 días y +7 días.',
      source: 'Sender',
      enabled: true,
    },
  ];

  return campaigns
    .filter((campaign) => campaign.enabled)
    .map(({ enabled: _enabled, ...campaign }) => campaign);
}
