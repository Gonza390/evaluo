/**
 * Only changes Evaluo-authored question templates. Source excerpts, technical
 * terms, correct answers, options and grading IDs are never translated.
 * Document-specific prose remains in the original language until generated
 * with the selected study locale by the validated AI route.
 */
export function localizeAcademicPrompt(template: string, locale: 'es' | 'en'): string {
  if (locale !== 'en') return template;
  const rules: Array<[RegExp, (...parts: string[]) => string]> = [
    [/^¿Qué significa “(.+)”\?$/u, term => `What does “${term}” mean?`],
    [/^¿Cómo explicarías “(.+)” con tus palabras\?$/u, term => `How would you explain “${term}” in your own words?`],
    [/^¿Qué describe “(.+)”\?$/u, term => `What does “${term}” describe?`],
    [/^¿Qué caracteriza mejor a “(.+)”\?$/u, term => `What best characterizes “${term}”?`],
    [/^¿Cuál de estas opciones define “(.+)”\?$/u, term => `Which option defines “${term}”?`],
    [/^¿Qué característica permite reconocer “(.+)”\?$/u, term => `What feature identifies “${term}”?`],
    [/^¿Qué característica define “(.+)”\?$/u, term => `What feature defines “${term}”?`],
    [/^¿Cómo se describe “(.+)”\?$/u, term => `How is “${term}” described?`],
    [/^¿Cuáles son las categorías de “(.+)”\?$/u, name => `What are the categories of “${name}”?`],
    [/^¿Cuáles son los pasos de “(.+)”\?$/u, name => `What are the steps of “${name}”?`],
    [/^¿Qué representa o para qué se usa “(.+)”\?$/u, name => `What does “${name}” represent or what is it used for?`],
    [/^¿Cómo se relacionan “(.+)” y “(.+)”\?$/u, (a,b) => `How are “${a}” and “${b}” related?`],
    [/^¿Cómo influye “(.+)” en “(.+)”\?$/u, (a,b) => `How does “${a}” influence “${b}”?`],
    [/^¿Qué relación existe entre “(.+)” y “(.+)”\?$/u, (a,b) => `What is the relationship between “${a}” and “${b}”?`],
    [/^¿De qué manera se vinculan “(.+)” y “(.+)”\?$/u, (a,b) => `How are “${a}” and “${b}” connected?`],
    [/^¿Cuál es el vínculo entre “(.+)” y “(.+)”\?$/u, (a,b) => `What connects “${a}” and “${b}”?`],
    [/^¿Qué efecto de “(.+)” sobre “(.+)” se describe\?$/u, (a,b) => `What effect of “${a}” on “${b}” is described?`],
    [/^¿Qué consecuencia sobre “(.+)” se atribuye a “(.+)”\?$/u, (b,a) => `What consequence for “${b}” is attributed to “${a}”?`],
    [/^¿Qué categoría de “(.+)” corresponde al criterio “(.+)”\?$/u, (a,b) => `Which category of “${a}” matches the criterion “${b}”?`],
    [/^En el tema “(.+)”, ¿qué nombre recibe la categoría caracterizada por “(.+)”\?$/u, (a,b) => `In “${a}”, which category is characterized by “${b}”?`],
    [/^¿A qué proceso corresponde esta secuencia de acciones: (.+)\?$/u, steps => `Which process matches these steps: ${steps}?`],
    [/^Observá estos pasos: (.+)\. ¿Qué proceso representan\?$/u, steps => `Look at these steps: ${steps}. Which process do they represent?`],
    [/^¿A qué expresión o magnitud corresponde esta descripción: “(.+)”\?$/u, desc => `Which expression or quantity matches “${desc}”?`],
    [/^¿Cuál es la idea central de “(.+)”\? Explicala con tus palabras\.$/u, topic => `What is the central idea of “${topic}”? Explain it in your own words.`],
    [/^¿Cómo explicarías “(.+)” a otro estudiante\?$/u, topic => `How would you explain “${topic}” to another student?`],
  ];
  for (const [pattern, translate] of rules) {
    const match = pattern.exec(template);
    if (match) return translate(...match.slice(1));
  }
  return template;
}
