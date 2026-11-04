import type { CanonicalPedagogicalModel } from './types';
import type { PedagogicalChunk, PedagogicalReference, StudyQuestion } from './pedagogy';

/**
 * Cost-free worked calculations. Only generate a task when a formula in the
 * canonical model is corroborated by a real page of the uploaded document.
 * Numerical operands are new practice examples; the governing rule is sourced.
 */
export function buildVerifiedMathPractice(
  model: CanonicalPedagogicalModel,
  chunks: PedagogicalChunk[],
): StudyQuestion[] {
  const results: StudyQuestion[] = [];
  const normalize = (value: string) => value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const referenceFor = (
    formula: CanonicalPedagogicalModel['formulas'][number],
    pattern: RegExp,
  ): PedagogicalReference | null => {
    const source = chunks.find(chunk =>
      formula.pageReferences?.includes(chunk.pageStart ?? -1) &&
      pattern.test(normalize(chunk.text)) && chunk.text.trim().length >= 60
    );
    if (!source) return null;
    return {
      pageStart: source.pageStart,
      pageEnd: source.pageEnd,
      sectionTitle: source.sectionTitle,
      excerpt: source.text.trim().slice(0, 220),
    };
  };
  const numericOptions = (correct: number) =>
    [correct, correct + 2, correct - 3, correct + 5].map(String);
  const determinant = model.formulas.find(formula =>
    /determinante/i.test(formula.expression + ' ' + formula.description) &&
    /(?:2x2|2\s*[×x]\s*2|ad\s*[-−]\s*bc)/i.test(formula.expression + ' ' + formula.description)
  );
  if (determinant) {
    const reference = referenceFor(determinant, /determinante|ad\s*[-−]\s*bc/);
    if (reference) {
      const matrices = [
        [3, 2, 1, 4],
        [1, -2, 3, 2],
        [2, 5, 4, 1],
      ];
      matrices.forEach(([a, b, c, d], index) => {
        const correct = a! * d! - b! * c!;
        results.push({
          id: `worked-det-${index}`, type: 'multiple_choice',
          level: 'aplicar', kind: 'formula', topic: 'Determinante de una matriz 2×2',
          prompt: `Calculá el determinante de la matriz A = [[${a}, ${b}], [${c}, ${d}]]. ¿Cuál es el resultado?`,
          options: numericOptions(correct), answer: String(correct),
          explanation: `En una matriz 2×2 se usa ad − bc. Por eso, det(A) = (${a} × ${d}) − (${b} × ${c}) = ${correct}.`,
          reference,
        });
      });
    }
  }
  const multiplication = model.formulas.find(formula =>
    /cij\s*=|c_?ij\s*=|producto de matrices|multiplicaci[oó]n de matrices/i
      .test(formula.expression + ' ' + formula.description) &&
    /suma|sum|producto|multiplicaci[oó]n/i.test(formula.description)
  );
  if (multiplication) {
    const reference = referenceFor(multiplication, /producto|multiplicaci[oó]n|matrices/);
    if (reference) {
      const examples = [
        {a:[2,1,0,3],b:[1,4,5,2],row:0,col:0},
        {a:[3,2,1,4],b:[2,1,3,5],row:1,col:1},
        {a:[1,2,2,3],b:[4,1,2,5],row:0,col:1},
      ];
      examples.forEach(({a,b,row,col},index) => {
        const i=row*2, j=col;
        const first=a[i]!*b[j]!, second=a[i+1]!*b[j+2]!;
        const correct=first+second;
        results.push({
          id:`worked-product-${index}`,type:'multiple_choice',level:'aplicar',
          kind:'formula',topic:'Multiplicación de matrices 2×2',
          prompt:`Multiplicá A = [[${a[0]}, ${a[1]}], [${a[2]}, ${a[3]}]] por B = [[${b[0]}, ${b[1]}], [${b[2]}, ${b[3]}]]. ¿Cuánto vale la entrada C${row+1}${col+1} de C = AB?`,
          options:numericOptions(correct),answer:String(correct),
          explanation:`La entrada C${row+1}${col+1} es el producto de la fila ${row+1} de A por la columna ${col+1} de B: ${a[i]} × ${b[j]} + ${a[i+1]} × ${b[j+2]} = ${first} + ${second} = ${correct}.`,
          reference,
        });
      });
    }
  }
  return results;
}
