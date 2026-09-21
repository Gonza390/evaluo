import type {
  CanonicalPedagogicalModel,
  StudyDocumentAnalysis,
  StudyGlossaryItem,
  StudentMaterialPedagogicalQualityReport,
  StudentMaterialSummary,
} from '@/lib/student-materials/types';
import type { PedagogicalArtifacts } from '@/lib/student-materials/pedagogy';

const QUALITY_REPORT_VERSION = 1;
const MIN_CONTENT_CHARS_PER_PAGE = 80;

function cleanLine(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function collectModelPages(model: CanonicalPedagogicalModel | null) {
  if (!model) return new Set<number>();

  const pages = new Set<number>();
  const add = (values?: number[]) => {
    for (const page of values ?? []) {
      if (Number.isInteger(page) && page > 0) pages.add(page);
    }
  };

  model.topics.forEach((item) => add(item.pageReferences));
  model.concepts.forEach((item) => add(item.pageReferences));
  model.relationships.forEach((item) => add(item.pageReferences));
  model.classifications.forEach((item) => add(item.pageReferences));
  model.processes.forEach((item) => add(item.pageReferences));
  model.formulas.forEach((item) => add(item.pageReferences));
  model.sourceBindings?.forEach((binding) =>
    binding.references.forEach((reference) => {
      if (reference.pageStart) pages.add(reference.pageStart);
      if (reference.pageEnd) pages.add(reference.pageEnd);
    })
  );

  return pages;
}

function malformedAcademicLabel(value: string) {
  const text = cleanLine(value);
  if (!text) return true;
  if (text.length > 150) return true;
  if (/\|/.test(text)) return true;
  if (/^[#*•|]/u.test(text)) return true;
  if (/^¿|\?$/.test(text)) return true;
  if (text.split(/\s+/).length > 18) return true;
  return false;
}

function countMalformedUnits(model: CanonicalPedagogicalModel | null) {
  if (!model) return 0;

  const labels = [
    ...model.topics.map((item) => item.title),
    ...model.concepts.map((item) => item.term),
    ...model.classifications.map((item) => item.title),
    ...model.processes.map((item) => item.title),
    ...model.formulas.map((item) => item.expression),
  ];

  return labels.filter(malformedAcademicLabel).length;
}

function countAcademicUnits(model: CanonicalPedagogicalModel | null) {
  if (!model) return 0;
  return (
    model.topics.length +
    model.concepts.length +
    model.relationships.length +
    model.classifications.length +
    model.processes.length +
    model.formulas.length
  );
}

export function buildStudentMaterialPedagogicalQualityReport(input: {
  pageCount: number | null;
  pages: string[] | null;
  documentAnalysis: StudyDocumentAnalysis;
  model: CanonicalPedagogicalModel | null;
  summary: StudentMaterialSummary;
  glossary: StudyGlossaryItem[];
  artifacts: PedagogicalArtifacts;
  visionUsed: boolean;
}): StudentMaterialPedagogicalQualityReport {
  const contentPages = (input.pages ?? [])
    .map((text, index) => ({ page: index + 1, chars: cleanLine(text).length }))
    .filter((item) => item.chars >= MIN_CONTENT_CHARS_PER_PAGE)
    .map((item) => item.page);
  const contentPageSet = new Set(contentPages);
  const representedPageSet = collectModelPages(input.model);
  const representedContentPages = contentPages.filter((page) =>
    representedPageSet.has(page)
  );
  const representedPageRatio =
    contentPages.length > 0
      ? representedContentPages.length / contentPages.length
      : input.model
        ? 1
        : 0;

  const academicUnitCount = countAcademicUnits(input.model);
  const malformedAcademicUnits = countMalformedUnits(input.model);
  const malformedRatio =
    academicUnitCount > 0 ? malformedAcademicUnits / academicUnitCount : 0;

  const cleanGlossaryCount = input.glossary.filter(
    (item) => !malformedAcademicLabel(item.term)
  ).length;
  const glossaryCleanRatio =
    input.glossary.length > 0 ? cleanGlossaryCount / input.glossary.length : 0;

  const referencedArtifactCount = [
    ...input.artifacts.flashcards,
    ...input.artifacts.questions,
  ].filter(
    (item) =>
      item.reference.pageStart !== null ||
      cleanLine(item.reference.excerpt).length >= 20
  ).length;
  const artifactCount =
    input.artifacts.flashcards.length + input.artifacts.questions.length;
  const artifactReferenceRatio =
    artifactCount > 0 ? referencedArtifactCount / artifactCount : 0;

  let score = 0;
  score += representedPageRatio * 35;
  score += clamp(academicUnitCount / Math.max(12, contentPages.length * 2), 0, 1) * 20;
  score += artifactReferenceRatio * 15;
  score +=
    input.summary.sections.length >= 2 && input.summary.sections.length <= 10
      ? 15
      : input.summary.sections.length > 0
        ? 7
        : 0;
  score += glossaryCleanRatio * 10;
  score += input.documentAnalysis.requiresOcr && !input.visionUsed ? 0 : 5;
  score = Math.round(clamp(score, 0, 100));

  const issues: string[] = [];
  if (!input.model) issues.push('canonical_model_missing');
  if (representedPageRatio < 0.75) issues.push('canonical_page_coverage_low');
  if (malformedRatio > 0.08) issues.push('malformed_academic_units');
  if (glossaryCleanRatio < 0.95) issues.push('glossary_noise');
  if (artifactReferenceRatio < 0.9) issues.push('artifact_traceability_low');
  if (input.summary.sections.length < 2 || input.summary.sections.length > 10) {
    issues.push('summary_hierarchy_out_of_range');
  }
  if (input.documentAnalysis.requiresOcr && !input.visionUsed) {
    issues.push('visual_recovery_pending');
  }

  const status: StudentMaterialPedagogicalQualityReport['status'] =
    !input.summary.hasContent ||
    artifactCount === 0 ||
    (Boolean(input.model) && representedPageRatio < 0.5)
      ? 'fail'
      : !input.model || issues.length > 0 || score < 80
        ? 'degraded'
        : 'pass';

  const uncoveredContentPages = contentPages.filter(
    (page) => !representedPageSet.has(page)
  );

  return {
    version: QUALITY_REPORT_VERSION,
    status,
    score,
    pageCount: input.pageCount,
    sourcePagesWithContent: contentPageSet.size,
    representedPages: representedContentPages.length,
    representedPageRatio: Math.round(representedPageRatio * 1000) / 1000,
    uncoveredContentPages,
    academicUnitCount,
    malformedAcademicUnits,
    summarySectionCount: input.summary.sections.length,
    glossaryItemCount: input.glossary.length,
    flashcardCount: input.artifacts.flashcards.length,
    questionCount: input.artifacts.questions.length,
    miniExamQuestionCount: input.artifacts.miniExamQuestionIds.length,
    artifactReferenceRatio: Math.round(artifactReferenceRatio * 1000) / 1000,
    issues,
  };
}
