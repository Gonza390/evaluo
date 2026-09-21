function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalize(value: string) {
  return clean(value)
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const ADMIN_DETAIL_PATTERN =
  /(?:datos generales? de la asignatura|autor(?:a|ia)? (?:y|del) (?:documento|material)|procedencia del material|asignatura de la cual se presenta|material de estudio(?:\.|$)|derechos? de autor|copyright|realizado a partir de informacion de la catedra)/i;

const ADMIN_LABEL_PATTERN =
  /^(?:presentacion(?: de (?:la )?(?:asignatura|materia|curso|documento|material))?|informacion de autoria(?: y derechos)?|autoria y derechos|datos? de autoria|creditos del documento)$/i;

export function isAdministrativeAcademicContent(input: {
  label: string;
  detail?: string;
  documentTitle?: string;
}) {
  const label = normalize(input.label);
  const detail = normalize(input.detail ?? '');
  const documentTitle = normalize(input.documentTitle ?? '');

  if (!label) return true;
  if (ADMIN_LABEL_PATTERN.test(label)) return true;
  if (ADMIN_DETAIL_PATTERN.test(detail)) return true;

  if (
    documentTitle &&
    label === documentTitle &&
    /(?:asignatura|materia|curso|documento|material)/i.test(detail)
  ) {
    return true;
  }

  if (
    /^presentacion de /i.test(label) &&
    /(?:asignatura|autor|procedencia|material de estudio)/i.test(detail)
  ) {
    return true;
  }

  return false;
}
