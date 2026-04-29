export interface Resumen {
  id: string;
  title: string;
  author_name: string | null;
  file_url: string | null;
  module_id: string | number | null;
  score: number | null;
  created_at: string | null;
  pages?: number | null;
}

export interface RecursoResumenRow {
  id: string;
  nombre: string;
  url_archivo: string | null;
  creado_at: string | null;
  etiqueta: string | null;
  paginas: number | null;
}

export interface Unidad {
  id: number;
  nombre: string;
  descripcion: string;
  resumenesCount: number;
}

export interface RecursoArchivo {
  id: string;
  nombre: string;
  tipo: string | null;
  url_archivo: string | null;
  creado_at: string | null;
  materia_id: string | null;
}

export interface PreviewDocument {
  title: string;
  url: string;
}

export const unidades: Unidad[] = [
  { id: 1, nombre: 'Modulo 1', descripcion: 'Conceptos base y mapa general de la materia.', resumenesCount: 3 },
  { id: 2, nombre: 'Modulo 2', descripcion: 'Desarrollo teorico y criterios de resolucion.', resumenesCount: 2 },
  { id: 3, nombre: 'Modulo 3', descripcion: 'Aplicaciones practicas y casos tipicos.', resumenesCount: 4 },
  { id: 4, nombre: 'Modulo 4', descripcion: 'Integracion y ejercitacion de examen.', resumenesCount: 2 },
];

export function getResumenRating(score: number | null | undefined) {
  const normalized = Math.max(0, Math.min(5, Math.round((score ?? 0) / 20)));
  return Array.from({ length: 5 }, (_, index) => index < normalized);
}

export function isLongMateriaTitle(nombre: string) {
  return nombre.trim().length > 28;
}

export function normalizeLabel(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getModuleNumber(value: string) {
  const normalized = normalizeLabel(value);
  const match = normalized.match(/modulo\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

export function buildResumenKey(resumen: Resumen) {
  const fileKey = resumen.file_url?.trim().toLowerCase();
  if (fileKey) {
    return fileKey;
  }

  return `${normalizeLabel(resumen.title)}::${String(resumen.module_id ?? '')}`;
}

export function scoreResumenCompleteness(resumen: Resumen) {
  let score = 0;

  if (resumen.pages) score += 2;
  if (resumen.author_name && resumen.author_name !== 'Biblioteca Evaluo') score += 2;
  if (resumen.score && resumen.score > 0) score += 1;
  if (resumen.created_at) score += 1;

  return score;
}

export function normalizeMateriaName(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getMateriaHeroImage(nombre: string) {
  const normalized = normalizeMateriaName(nombre);

  const exactImages: Record<string, string> = {
    matematica: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80',
    estadistica: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    economia: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
    contabilidad: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80',
    administracion: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    marketing: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    psicologia: 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=1200&q=80',
    sociologia: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    filosofia: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80',
    historia: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80',
    ingles: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    informatica: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
  };

  if (exactImages[normalized]) {
    return exactImages[normalized];
  }

  const keywordImages: Array<[string, string]> = [
    ['matemat', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80'],
    ['calculo', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80'],
    ['algebra', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80'],
    ['estad', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'],
    ['econom', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80'],
    ['contab', 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80'],
    ['admin', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80'],
    ['marketing', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'],
    ['derecho', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'],
    ['jurid', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'],
    ['penal', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'],
    ['constitucional', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'],
    ['civil', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'],
    ['program', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80'],
    ['informat', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80'],
    ['sistemas', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80'],
    ['ingenier', 'https://images.unsplash.com/photo-1581092921461-eab10380f636?auto=format&fit=crop&w=1200&q=80'],
    ['fisica', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80'],
    ['quimica', 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=1200&q=80'],
    ['biologia', 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80'],
    ['medicina', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80'],
    ['anatom', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80'],
    ['psicolog', 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=1200&q=80'],
    ['sociolog', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'],
    ['filosof', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80'],
    ['historia', 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80'],
    ['ingles', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80'],
    ['idioma', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80'],
    ['investig', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'],
    ['metodolog', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'],
  ];

  const matchedImage = keywordImages.find(([keyword]) => normalized.includes(keyword));
  if (matchedImage) {
    return matchedImage[1];
  }

  return 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80';
}

export function getMateriaContextErrorMessage() {
  return 'No pudimos cargar todos los datos de la materia. Igual podés seguir estudiando mientras terminamos de recuperar la información.';
}

export function getResumenesErrorMessage() {
  return 'No pudimos cargar los resúmenes ahora mismo. Probá de nuevo en unos segundos.';
}

export function getRecursosErrorMessage() {
  return 'No pudimos cargar los pregunteros por ahora. Intentá nuevamente en unos segundos.';
}
