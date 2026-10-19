// Contenido original, preparado para el demo. No se genera ni evalúa con IA.
export const samplePdf = {
  title: 'Cómo interpretar una investigación',
  url: '/demo/interpretar-una-investigacion.pdf',
  summary:
    'Que dos cosas ocurran juntas no demuestra que una cause la otra. Para evaluar una explicación, buscá otras causas posibles y compará grupos en condiciones similares.',
  fragments: [
    'Una correlación es una asociación: dos variables cambian juntas. Por sí sola no demuestra causalidad. Puede existir una tercera variable que influya en ambas. Por ejemplo, en días de calor aumentan tanto la venta de helados como el uso de ventiladores; el calor puede explicar ambos aumentos.',
    'Para investigar una relación causal conviene comparar grupos en condiciones similares y considerar otras explicaciones. La asignación al azar de una intervención ayuda a reducir diferencias previas entre grupos, aunque un resultado siempre debe interpretarse dentro de las condiciones del estudio.',
  ],
};

export const demoQuestions = [
  {
    topic: 'Correlación y causalidad',
    question:
      'En una encuesta, quienes estudian con música obtienen mejores notas. ¿Qué podés concluir con esos datos?',
    options: [
      'La música causa mejores notas.',
      'Hay una asociación, pero no alcanza para afirmar una causa.',
      'La música mejora las notas de todos los estudiantes.',
    ],
    correct: 1,
    page: 1,
    explanation:
      'La encuesta muestra que dos cosas aparecen juntas: estudiar con música y obtener mejores notas. No nos dice si la música produjo esa diferencia. Quienes escuchan música también podrían estudiar más horas. Ese otro factor podría explicar las notas. Por eso hablamos de asociación, sin afirmar una causa.',
    simple:
      'Que A y B aparezcan juntos no demuestra que A produzca B. Acá falta saber si los grupos también difieren en sus horas de estudio.',
    example:
      'En el PDF, aumentan la venta de helados y el uso de ventiladores al mismo tiempo. Comprar helados no provoca el uso de ventiladores: el calor puede explicar las dos cosas.',
  },
  {
    question:
      'Querés investigar si una técnica de estudio ayuda a recordar. ¿Qué comparación aporta mejor evidencia?',
    topic: 'Comparación de grupos',
    options: [
      'Comparar dos grupos asignados al azar, con el mismo tiempo de estudio.',
      'Comparar a quienes eligen la técnica con quienes no estudian.',
      'Preguntar solo a quienes dicen que la técnica les funciona.',
    ],
    correct: 0,
    page: 2,
    explanation:
      'Si un grupo estudia y el otro no, cambian dos cosas: la técnica y el tiempo de estudio. No podemos separar sus efectos. Comparar grupos con el mismo tiempo y asignar la técnica al azar ayuda a reducir diferencias previas. Aporta mejor evidencia, aunque no vuelve infalible el estudio.',
    simple:
      'Para comparar una técnica, mantené parecido lo demás. Si solo un grupo estudia, no sabés si la diferencia viene de la técnica o de haber estudiado.',
    example:
      'Podés dar el mismo texto y veinte minutos a dos grupos. A uno le asignás la técnica y al otro una lectura habitual. Después les hacés la misma prueba. Es una aplicación del criterio de comparar condiciones similares del PDF.',
  },
  {
    question:
      'En los días de calor se venden más helados y se usan más ventiladores. ¿Qué papel puede tener el calor?',
    topic: 'Tercera variable',
    options: [
      'Demuestra que los helados causan el uso de ventiladores.',
      'Puede ser una tercera variable que explique ambos aumentos.',
      'No hace falta considerarlo porque no es ninguna de las dos variables observadas.',
    ],
    correct: 1,
    page: 1,
    explanation:
      'El calor puede influir tanto en la compra de helados como en el uso de ventiladores. Es una tercera variable: ofrece otra explicación para que ambas cosas aumenten juntas. La asociación observada no basta para afirmar que una produce la otra.',
    simple:
      'El calor puede aumentar las dos cosas. Que ocurran juntas no significa que los helados provoquen el uso de ventiladores.',
    example:
      'Una biblioteca observa mejores notas entre quienes reservan salas. Si esas personas también estudian más horas, las horas de estudio podrían explicar la diferencia. Es otra aplicación de la tercera variable del PDF.',
  },
];

export const transferQuestion = {
  question:
    'Una biblioteca observa que quienes reservan una sala sacan mejores notas. Esas personas también estudian más horas. ¿Cuál es la interpretación más cuidadosa?',
  options: [
    'Reservar una sala garantiza mejores notas.',
    'Las horas de estudio podrían explicar la diferencia; la reserva por sí sola no demuestra una causa.',
    'Las salas no pueden influir nunca en el aprendizaje.',
  ],
  correct: 1,
};

export const comparisonTransferQuestion = {
  question:
    'Querés evaluar si hacer mapas conceptuales ayuda a recordar un texto. ¿Qué diseño permite comparar mejor la técnica?',
  options: [
    'Dar dos horas al grupo de mapas y diez minutos al de lectura.',
    'Asignar al azar mapas o lectura, con el mismo texto, tiempo y prueba final.',
    'Consultar solo a quienes ya usan mapas y tienen buenas notas.',
  ],
  correct: 1,
};
