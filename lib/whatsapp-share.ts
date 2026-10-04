export type WhatsAppShareVariantId =
  | 'riesgo_preguntero'
  | 'preparacion_real'
  | 'recomendacion_grupo';

export type WhatsAppShareVariant = {
  id: WhatsAppShareVariantId;
  name: string;
  angle: string;
  description: string;
};

export const WHATSAPP_SHARE_VARIANTS: WhatsAppShareVariant[] = [
  {
    id: 'riesgo_preguntero',
    name: '¿Y si cambian las preguntas?',
    angle: 'Riesgo de memorizar',
    description: 'Ataca el miedo a depender de un preguntero fijo.',
  },
  {
    id: 'preparacion_real',
    name: '¿Realmente estás preparado?',
    angle: 'Preparación real',
    description: 'Presenta Evaluo como una forma de medir conocimiento, no memoria.',
  },
  {
    id: 'recomendacion_grupo',
    name: 'Recomendación natural',
    angle: 'Mensaje de grupo',
    description: 'Suena a aporte de un estudiante y no a una publicidad.',
  },
];

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function getParcialText(parcial: number) {
  return Number(parcial) === 3 ? 'el examen integrador' : `el Parcial ${parcial}`;
}

function getCampaignParcial(parcial: number) {
  return Number(parcial) === 3 ? 'integrador' : `p${parcial}`;
}

export function buildWhatsAppCampaignName(materiaNombre: string, parcial: number) {
  const materiaSlug = slugify(materiaNombre) || 'materia';
  return `simulador_${materiaSlug}_${getCampaignParcial(parcial)}`;
}

export function buildWhatsAppTrackedUrl(input: {
  destination: string;
  materiaNombre: string;
  parcial: number;
  variantId: WhatsAppShareVariantId;
  origin?: string;
}) {
  const origin = input.origin || 'https://evaluo.com.ar';
  const destination = input.destination.trim();
  const url = new URL(destination || '/', origin);

  url.searchParams.set('utm_source', 'whatsapp');
  url.searchParams.set('utm_medium', 'community');
  url.searchParams.set('utm_campaign', buildWhatsAppCampaignName(input.materiaNombre, input.parcial));
  url.searchParams.set('utm_content', input.variantId);
  url.searchParams.set('utm_term', slugify(input.materiaNombre) || 'materia');

  return url.toString();
}

export function buildWhatsAppShareCopy(input: {
  materiaNombre: string;
  parcial: number;
  variantId: WhatsAppShareVariantId;
  trackedUrl: string;
}) {
  const materia = input.materiaNombre.trim() || 'esta materia';
  const parcialText = getParcialText(input.parcial);

  switch (input.variantId) {
    case 'riesgo_preguntero':
      return `¿Y si en ${parcialText} de ${materia} no te tocan las mismas preguntas del preguntero? 😅\n\nProbá este simulador con preguntas distintas para ver cómo venís de verdad.\n\n${input.trackedUrl}`;
    case 'preparacion_real':
      return `¿Estás preparando ${parcialText} de ${materia} con un preguntero?\n\nProbá también este simulador con preguntas distintas para comprobar si realmente tenés claros los temas.\n\n${input.trackedUrl}`;
    case 'recomendacion_grupo':
    default:
      return `Para los que rinden ${materia} 👇\n\nLes dejo este simulador para practicar ${parcialText} con preguntas distintas y ver qué temas necesitan reforzar.\n\n${input.trackedUrl}`;
  }
}

export function buildWhatsAppOpenUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
