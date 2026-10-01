// Ejemplos preparados para el preview; no son respuestas generadas por IA.
type LearningExample = {
  simple: string;
  example: string;
  question: string;
  options: string[];
  correct: number;
  feedback: string;
};

export const previewLearning: Record<string, LearningExample> = {
  finalismo: {
    simple:
      'Para el finalismo, una persona actúa buscando algo. Importa el objetivo que dirige su conducta, además de lo que provoca físicamente.',
    example:
      'Una persona elige un camino para llegar a una biblioteca. Anticipa dónde quiere llegar y organiza sus pasos para lograrlo: su conducta está dirigida a un fin. Este ejemplo aplica la idea del fragmento de tus apuntes.',
    question:
      'Lucía quiere llegar a una biblioteca antes de que cierre. Compara dos caminos y elige el más corto. ¿Por qué esta conducta puede entenderse como una acción dirigida a un fin?',
    options: [
      'Porque anticipa lo que quiere lograr y organiza su conducta para alcanzarlo.',
      'Porque caminar produce un desplazamiento físico, independientemente de lo que busca.',
      'Porque llegar a la biblioteca es un resultado que no depende de sus decisiones.',
    ],
    correct: 0,
    feedback:
      'La clave es que el objetivo dirige conscientemente la conducta, como explica el pasaje del PDF.',
  },
  culpabilidad: {
    simple:
      'La culpabilidad pregunta si podemos reprocharle personalmente lo que hizo: si podía exigírsele actuar de otra manera.',
    example:
      'Para analizar una conducta, preguntamos si a esa persona podía exigírsele comportarse de otra manera. Esa pregunta expresa el juicio de reproche que describen tus apuntes; conocer el resultado por sí solo no alcanza.',
    question:
      'En una actividad, se afirma: «Martín causó el resultado; por eso ya podemos reprochárselo personalmente». Según tus apuntes, ¿por qué esa conclusión necesita un análisis adicional?',
    options: [
      'Porque para formular el reproche basta con precisar mejor cuál fue el resultado.',
      'Porque la descripción del hecho determina por sí sola si corresponde el reproche.',
      'Porque causar el resultado no basta: debe analizarse si podía exigírsele actuar de otra manera.',
    ],
    correct: 2,
    feedback: 'La exigibilidad de otra conducta es parte del juicio de reproche personal del PDF.',
  },
  transporte: {
    simple:
      'En el transporte pasivo, las sustancias se mueven a favor de su gradiente y no usan ATP directamente.',
    example:
      'Si una sustancia atraviesa la membrana desde donde está más concentrada hacia donde está menos concentrada, sin utilizar ATP directamente, el movimiento corresponde al transporte pasivo descrito en el PDF.',
    question:
      'En un experimento, una sustancia atraviesa la membrana desde donde está más concentrada hacia donde está menos concentrada, sin gasto directo de ATP. ¿Por qué este movimiento corresponde al mecanismo que repasaste?',
    options: [
      'Porque mueve la sustancia contra su gradiente utilizando energía.',
      'Porque ocurre a favor del gradiente y no requiere gasto directo de ATP.',
      'Porque cualquier movimiento a través de la membrana consume ATP directamente.',
    ],
    correct: 1,
    feedback:
      'Moverse a favor del gradiente sin gasto directo de ATP coincide con la definición de transporte pasivo de tus apuntes.',
  },
};
