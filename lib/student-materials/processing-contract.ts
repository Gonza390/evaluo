export const CANONICAL_PEDAGOGICAL_MODEL_VERSION = 3;
export const CANONICAL_SOURCE_PIPELINE_VERSION = 1;

export function buildCanonicalSourcePipelineVersion(input: {
  visualAnalysisEnabled: boolean;
}) {
  return [
    `canonical-model-v${CANONICAL_PEDAGOGICAL_MODEL_VERSION}`,
    `source-v${CANONICAL_SOURCE_PIPELINE_VERSION}`,
    input.visualAnalysisEnabled ? 'visual-on' : 'visual-off',
  ].join(':');
}
