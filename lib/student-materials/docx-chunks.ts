import { createHash } from 'node:crypto';
import {
  buildTraceableSummaryChunks,
  type TraceableStudentMaterialChunk,
} from '@/lib/student-materials/text';

/**
 * A diferencia de un PDF, Word no tiene páginas físicas estables.
 * No permitir que un chunk cruce silenciosamente dos apartados: de lo
 * contrario, una pregunta de Unidad 2 podría citar Unidad 1.
 */
export function buildDocxTraceableSummaryChunks(
  sourceText: string,
  orderedHeadings: string[],
): TraceableStudentMaterialChunk[] {
  const blocks = sourceText.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  if (!orderedHeadings.length) return buildTraceableSummaryChunks(null, sourceText);

  const groups: Array<{ heading: string | null; paragraphs: string[] }> = [];
  let nextHeadingIndex = 0;
  let current = { heading: null as string | null, paragraphs: [] as string[] };

  for (const block of blocks) {
    const nextHeading = orderedHeadings[nextHeadingIndex];
    if (nextHeading && block === nextHeading) {
      if (current.paragraphs.length) groups.push(current);
      current = { heading: nextHeading, paragraphs: [block] };
      nextHeadingIndex += 1;
    } else {
      current.paragraphs.push(block);
    }
  }
  if (current.paragraphs.length) groups.push(current);

  const rows = groups.flatMap((group) => {
    const sectionText = group.paragraphs.join('\n\n');
    const chunks = buildTraceableSummaryChunks(null, sectionText);
    if (chunks.length) {
      return chunks.map((chunk) => ({ ...chunk, sectionTitle: group.heading }));
    }
    // Un apartado breve sigue siendo fuente. No descartarlo por el límite
    // mínimo general de caracteres de los chunks del procesador PDF.
    return sectionText.trim()
      ? [{
          chunkIndex: 0,
          text: sectionText,
          pageStart: null,
          pageEnd: null,
          sectionTitle: group.heading,
          contentHash: createHash('sha256').update(sectionText).digest('hex'),
        }]
      : [];
  });
  return rows.map((chunk, chunkIndex) => ({ ...chunk, chunkIndex }));
}
