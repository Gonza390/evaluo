/**
 * Small, auditable set of original practice scenarios. Fictional companies/
 * decisions are illustrative, not alleged events from the uploaded notes.
 *
 * Each scenario is permitted ONLY when the source classification explicitly
 * defines the relevant alternatives. This avoids prompting the model again,
 * and avoids inventing cross-domain case facts from thin evidence.
 */
type LabelledCategory = { name: string; evidence: string };
export type SourceBackedScenario = {
  scenario: string; question: string; answer: string; explanation: string;
};
const norm = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

function category(
  categories: LabelledCategory[], label: string,
): LabelledCategory | null {
  const matches=categories.filter(c=>norm(c.name)===label);
  return matches.length===1?matches[0]!:null;
}
function hasAll(text:string,fragments:string[]) {
  const n=norm(text);
  return fragments.every(f=>n.includes(f));
}

function ansoff(categories: LabelledCategory[]): SourceBackedScenario[] {
  const penetration=category(categories,'penetracion de mercado');
  const market=category(categories,'desarrollo de mercados') ??
    category(categories,'desarrollo de mercado');
  const product=category(categories,'desarrollo de productos') ??
    category(categories,'desarrollo de producto');
  const diversify=category(categories,'diversificacion');
  if(!penetration||!market||!product||!diversify||categories.length!==4)return[];
  // A source with just category names is not sufficient. A wrong or truncated
  // matrix must never yield a confidently graded question.
  if(!hasAll(penetration.evidence,['product','exist','mercado','actual']) ||
     !hasAll(market.evidence,['product','exist','nuevo','mercado']) ||
     !hasAll(product.evidence,['nuevo','product','mercado','actual']) ||
     !hasAll(diversify.evidence,['nuevo','product','nuevo','mercado'])) return[];
  const question='¿Qué estrategia de crecimiento describe mejor esta decisión?';
  return [
    {
      scenario:'Una librería que ya vende cuadernos a estudiantes de su ciudad organiza nuevas promociones para vender más de esos mismos cuadernos a compradores del mismo lugar, sin modificar su oferta ni ingresar a otras regiones.',
      question,answer:penetration.name,
      explanation:'Es penetración de mercado porque mantiene los productos existentes y el mercado actual. A diferencia del desarrollo de mercados, no entra en una región nueva.',
    },
    {
      scenario:'Una empresa que vende un programa de gestión en su provincia decide ofrecer exactamente ese mismo programa en otro país, donde hasta ahora no tenía clientes. No modifica el producto; solo amplía el territorio comercial.',
      question,answer:market.name,
      explanation:'Es desarrollo de mercados porque conserva el producto y comienza a venderlo en un mercado nuevo. En la penetración de mercado, tanto la oferta como el mercado son los existentes.',
    },
    {
      scenario:'Una academia que ya ofrece cursos a estudiantes de una ciudad incorpora una aplicación interactiva nueva y la comercializa entre esos mismos estudiantes. No cambia el mercado al que se dirige, pero sí amplía su oferta.',
      question,answer:product.name,
      explanation:'Es desarrollo de productos porque introduce una oferta nueva en un mercado donde ya participa. No es diversificación, que requeriría además ingresar a un mercado nuevo.',
    },
    {
      scenario:'Una compañía que hasta ahora comercializa artículos escolares en su región decide comenzar a vender alimentos preparados en un país en el que todavía no opera. Cambia tanto lo que ofrece como el mercado al que ingresa.',
      question,answer:diversify.name,
      explanation:'Es diversificación porque incorpora un producto nuevo y se dirige a un mercado nuevo. El desarrollo de productos mantendría el mercado actual.',
    },
  ];
}
function feministPerspectives(categories: LabelledCategory[]): SourceBackedScenario[] {
  const empirical=category(categories,'empirismo feminista');
  const post=category(categories,'postmodernismo feminista') ??
    category(categories,'posmodernismo feminista');
  if(!empirical||!post||categories.length!==2)return[];
  if(!hasAll(empirical.evidence,['evidencia','logica','valores','comunidad']) ||
    !hasAll(post.evidence,['teorias','relatos','poder','parciales']))return[];
  const question='¿Con qué perspectiva sobre la ciencia se relaciona mejor este enfoque?';
  return [
    {
      scenario:'En un equipo de investigación, las personas discuten sus interpretaciones usando datos, argumentos lógicos y valores que hacen explícitos. Antes de elegir una explicación, escuchan posiciones distintas dentro de una comunidad plural.',
      question,answer:empirical.name,
      explanation:'Corresponde al empirismo feminista: combina evidencia, razonamiento lógico y valores explícitos dentro de una comunidad plural. No reduce la elección de teorías a relatos determinados por relaciones de poder.',
    },
    {
      scenario:'Un grupo analiza cómo las teorías científicas también se construyen desde perspectivas parciales y en contextos de poder. Sostiene que no basta evaluar los datos sin atender a quién produce esos relatos y desde qué posición.',
      question,answer:post.name,
      explanation:'Corresponde al postmodernismo feminista: destaca los relatos, las relaciones de poder y las posiciones parciales de quienes producen conocimiento. El empirismo feminista prioriza evidencia, lógica y valores explícitos.',
    },
  ];
}
/** Do not infer a scenario from a list of unlabeled categories or definitions. */
export function constructSourceBackedScenarios(
  title:string,categories:LabelledCategory[],
): SourceBackedScenario[] {
  const n=norm(title);
  if(n.includes('ansoff'))return ansoff(categories);
  if(n.includes('perspectivas feministas sobre la ciencia'))
    return feministPerspectives(categories);
  return[];
}
