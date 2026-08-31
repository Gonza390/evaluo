import { createHash } from 'node:crypto';

export const STUDENT_MATERIAL_PIPELINE_VERSION = 'canonical-study-v1';

export function normalizeStudentMaterialCacheText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildStudentMaterialContentFingerprint(input: {
  text: string;
  materiaId: string;
  pipelineVersion?: string;
}) {
  const pipelineVersion =
    input.pipelineVersion ?? STUDENT_MATERIAL_PIPELINE_VERSION;
  const normalizedText = normalizeStudentMaterialCacheText(input.text);

  return createHash('sha256')
    .update(pipelineVersion)
    .update('\0')
    .update(input.materiaId)
    .update('\0')
    .update(normalizedText)
    .digest('hex');
}
