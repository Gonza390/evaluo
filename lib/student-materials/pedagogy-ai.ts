import type {
  CanonicalPedagogicalModel,
  GenerateSummaryInput,
} from '@/lib/student-materials/types';
import { requestGeminiJson } from '@/lib/ai/providers';
import { recordAiUsage } from '@/lib/student-materials/ai-usage';
import { buildSummaryChunks } from '@/lib/student-materials/text';
import { logError } from '@/lib/observability';

const PEDAGOGICAL_MAP_PROMPT = (text: string) => `
Analizá el siguiente fragmento de un material de estudio y extraé:
1. Temas principales (title, description, relevance: alta/media).
2. Conceptos clave (term, detail, kind: definicion/clasificacion/autor/ejemplo/idea_clave).
3. Relaciones entre conceptos (source, target, description).
4. Clasificaciones o taxonomías (title, items).
5. Procesos o algoritmos (title, steps).
6. Fórmulas o ecuaciones (expression, description).
7. Afirmaciones importantes para examen.
8. Posibles confusiones o errores comunes.

Fragmento:
"""
${text}
"""

Responde SOLO con JSON válido:
{
  "topics": [],
  "concepts": [],
  "relationships": [],
  "classifications": [],
  "processes": [],
  "formulas": [],
  "examRelevantClaims": [],
  "confusions": []
}
`;

const PEDAGOGICAL_REDUCE_PROMPT = (data: string) => `
Consolidá los siguientes extractos parciales de un documento en un único modelo pedagógico canónico. 
Eliminá duplicados, unificá conceptos similares y asegurá la coherencia jerárquica.

Extractos:
"""
${data}
"""

Responde SOLO con JSON válido siguiendo el tipo StudyDocumentModel:
{
  "title": "Título del material",
  "overview": "Resumen ejecutivo",
  "topics": [],
  "concepts": [],
  "relationships": [],
  "classifications": [],
  "processes": [],
  "formulas": [],
  "authorsOrTheories": [],
  "examples": [],
  "examRelevantClaims": [],
  "confusions": []
}
`;

export async function generatePedagogicalModel(
  input: GenerateSummaryInput
): Promise<CanonicalPedagogicalModel | null> {
  const chunks = buildSummaryChunks(input.text).slice(0, 25);
  if (chunks.length === 0) return null;

  const partials: Array<Record<string, unknown>> = [];
  
  const batchSize = 3;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (chunk) => {
        try {
          const result = await requestGeminiJson({
            prompt: PEDAGOGICAL_MAP_PROMPT(chunk),
            temperature: 0.1,
            maxOutputTokens: 2000,
          });
          if (result) {
            await recordAiUsage({
              materialId: input.materialId,
              userId: input.userId,
              provider: 'gemini',
              model: result.model,
              operation: 'summary_map' as any,
              usage: result.usage,
            });
            return JSON.parse(result.content) as Record<string, unknown>;
          }
        } catch (e) {
          logError('pedagogy.generateModel.map', e);
        }
        return null;
      })
    );
    for (const res of results) {
      if (res) partials.push(res);
    }
  }

  if (partials.length === 0) return null;

  try {
    const digest = JSON.stringify(partials).slice(0, 30000);
    const result = await requestGeminiJson({
      prompt: PEDAGOGICAL_REDUCE_PROMPT(digest),
      temperature: 0.1,
      maxOutputTokens: 4000,
    });

    if (result) {
      await recordAiUsage({
        materialId: input.materialId,
        userId: input.userId,
        provider: 'gemini',
        model: result.model,
        operation: 'summary_reduce' as any,
        usage: result.usage,
      });
      const model = JSON.parse(result.content) as CanonicalPedagogicalModel;
      model.chunkCount = chunks.length;
      return model;
    }
  } catch (e) {
    logError('pedagogy.generateModel.reduce', e);
  }

  return null;
}
