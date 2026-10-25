// Etiquetas de observabilidad. No usar estas rutas para autorizar accesos ni medir uso educativo.
export type BackendFlow = 'seo_public' | 'pdf_private' | 'other';

export function classifyBackendScope(scope: string): BackendFlow {
  if (/^(?:processStudentMaterial[.]|pedagogy[.]|studentMaterial|pdf[.]|flashcard_progress_|studyError)/i.test(scope)) {
    return 'pdf_private';
  }
  if (/^(?:simulador[.]|simulatorTopicMemory[.]|preguntero[.]|materiaBootstrap[.]|actions[.]getPreguntasSimulador)/i.test(scope)) {
    return 'seo_public';
  }
  return 'other';
}

export function classifyBackendPath(path: string): BackendFlow {
  const route = path.split('?')[0];
  if (/^\/(?:pregunteros|simulador|explorar|universidad)(?:\/|$)/.test(route)) {
    return 'seo_public';
  }
  if (/^\/(?:api\/student-materials|api\/internal\/student-material-jobs|dashboard\/materiales)(?:\/|$)/.test(route)) {
    return 'pdf_private';
  }
  return 'other';
}
