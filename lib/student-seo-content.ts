export type PublicQuestion = {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

export type PublicExam = {
  slug: string; title: string; description: string; intro: string;
  questions: PublicQuestion[]; nextHref: string;
};
export const PUBLIC_EXAMS: PublicExam[] = [
  {
    slug:'psicologia-aprendizaje',title:'Mini examen de Psicología: aprendizaje',description:'Cinco preguntas originales para practicar conceptos de aprendizaje y revisar errores con explicaciones.',
    intro:'Esta práctica de ejemplo tiene cinco preguntas introductorias. No es un parcial oficial de ninguna universidad: sirve para mostrar cómo detectar confusiones conceptuales antes de estudiar tu propio material.',
    nextHref:'/es/guias/como-estudiar-psicologia',
    questions:[
      {prompt:'En el condicionamiento clásico, ¿qué es una respuesta condicionada?',choices:['Una reacción aprendida ante un estímulo previamente neutro','Toda conducta voluntaria que recibe una recompensa','Una reacción que ocurre solo durante el sueño'],correctIndex:0,explanation:'La respuesta condicionada se aprende mediante una asociación entre estímulos. No equivale a una conducta reforzada por sus consecuencias.'},
      {prompt:'¿Cuál es un ejemplo de refuerzo positivo en un contexto educativo?',choices:['Quitar una tarea molesta después de estudiar','Recibir reconocimiento después de resolver una actividad correctamente','Ignorar por completo la conducta'],correctIndex:1,explanation:'Refuerzo positivo significa añadir una consecuencia que aumenta la probabilidad de la conducta; no significa simplemente algo agradable.'},
      {prompt:'¿Qué describe mejor la extinción en condicionamiento clásico?',choices:['La desaparición inmediata e irreversible de toda memoria','La disminución de una respuesta condicionada cuando el estímulo condicionado aparece repetidamente sin el incondicionado','El aumento inevitable de una respuesta por repetición'],correctIndex:1,explanation:'La respuesta puede disminuir si se presenta el estímulo condicionado sin el incondicionado; eso no implica borrar necesariamente todo aprendizaje.'},
      {prompt:'¿Qué diferencia central existe entre reconocer y recordar?',choices:['Reconocer exige producir información sin señales','Recordar y reconocer son idénticos','Recordar exige recuperar información; reconocer implica identificarla entre señales u opciones'],correctIndex:2,explanation:'La tarea de reconocimiento proporciona pistas que pueden facilitar la respuesta. Poder reconocer una definición no garantiza poder explicarla.'},
      {prompt:'¿Qué práctica comprueba mejor la comprensión de un concepto?',choices:['Responder una aplicación nueva y justificar la respuesta','Releer la definición varias veces sin intentar recordarla','Copiar una respuesta modelo sin analizarla'],correctIndex:0,explanation:'Aplicar y justificar permite descubrir si se comprende el mecanismo o si solo resulta familiar la definición.'}
    ]
  },
  {
    slug:'economia-basica',title:'Mini examen de Economía: oferta y demanda',description:'Cinco preguntas originales con explicaciones sobre curvas, equilibrio y costo de oportunidad.',
    intro:'Usá estas preguntas para comprobar que podés razonar con un modelo básico de mercado. Son ejemplos creados por Evaluo, no preguntas extraídas de una cátedra.',
    nextHref:'/es/guias/como-estudiar-economia',
    questions:[
      {prompt:'Si solo sube el precio de un bien, ¿qué suele cambiar en su curva de demanda?',choices:['Toda la curva se desplaza a la derecha','La cantidad demandada se mueve sobre la misma curva','La demanda desaparece'],correctIndex:1,explanation:'El precio del propio bien determina un movimiento a lo largo de la demanda, manteniendo los demás factores constantes.'},
      {prompt:'¿Qué suele ocurrir con la oferta si aumentan los costos de producción y los demás factores no cambian?',choices:['Se desplaza a la izquierda','Se desplaza necesariamente a la derecha','No puede cambiar'],correctIndex:0,explanation:'A cada precio, producir puede ser menos rentable; por eso la curva de oferta suele desplazarse hacia la izquierda.'},
      {prompt:'¿Qué es el costo de oportunidad?',choices:['Solo el dinero que pagaste','La alternativa de mayor valor a la que renunciás al elegir','La suma de todas las opciones posibles'],correctIndex:1,explanation:'El costo de oportunidad es el valor de la mejor alternativa sacrificada, que no siempre es monetario.'},
      {prompt:'¿Qué significa equilibrio en un modelo simple de oferta y demanda?',choices:['Que todos los consumidores obtienen todo lo que desean sin límites','Que el precio nunca más cambia','Que cantidad ofrecida y demandada coinciden a un precio dado'],correctIndex:2,explanation:'El equilibrio del modelo representa la coincidencia de cantidades ofrecida y demandada; no asegura que no existan cambios futuros.'},
      {prompt:'Si aumenta la demanda y la oferta permanece fija en el modelo usual, ¿cuál es el resultado esperado?',choices:['Aumentan precio y cantidad de equilibrio','Bajan precio y cantidad necesariamente','La cantidad queda siempre en cero'],correctIndex:0,explanation:'Con las curvas convencionales, un desplazamiento de la demanda hacia la derecha eleva el precio y la cantidad de equilibrio, sujeto a los supuestos del modelo.'}
    ]
  }
];

export type PublicPlan = {slug:string;title:string;description:string;days:number;intro:string;steps:{label:string;goal:string;activity:string}[]};
export const PUBLIC_PLANS:PublicPlan[]=[
  {slug:'estudiar-en-3-dias',title:'Plan de estudio de 3 días antes del examen',description:'Cómo organizar tres días de estudio sin depender solo de releer: diagnóstico, práctica y repaso.',days:3,
    intro:'Este plan supone que ya tenés algo de material trabajado. Si empezás de cero o el temario es muy extenso, tres días pueden ser insuficientes: priorizá lo esencial y descansá.',
    steps:[
      {label:'Día 1',goal:'Diagnóstico y prioridades',activity:'Revisá el programa, identificá temas clave y respondé preguntas de prueba sin consultar apuntes. Separá lo que dominás, lo dudoso y lo que no entendés.'},
      {label:'Día 2',goal:'Practicar y corregir',activity:'Resolvé ejercicios y preguntas intercaladas. Para cada error, buscá la explicación en tu fuente y probá una pregunta diferente del mismo concepto.'},
      {label:'Día 3',goal:'Simular y repasar',activity:'Hacé una práctica cronometrada de los temas más importantes, repasá solo los errores y prepará el material necesario para rendir. Evitá estudiar sin descanso toda la noche.'}
    ]},
  {slug:'estudiar-en-7-dias',title:'Plan de estudio de 7 días para un parcial',description:'Programa semanal con lectura activa, recuperación, simulacro y refuerzo de errores.',days:7,
    intro:'Usá esta semana como una guía flexible. Ajustá la profundidad de cada bloque a tu materia, horario disponible y exigencias del examen.',
    steps:[
      {label:'Día 1',goal:'Organizar el temario',activity:'Listá los temas y detectá los objetivos del examen. Hacé preguntas de diagnóstico para decidir dónde invertir más tiempo.'},
      {label:'Día 2',goal:'Comprender bloques prioritarios',activity:'Trabajá los dos temas más importantes, explicá sus conceptos sin mirar y resolvé un ejemplo guiado de cada uno.'},
      {label:'Día 3',goal:'Aplicar conocimientos',activity:'Resolvé ejercicios variados, mezclando temas previos para evitar memorizar un solo formato.'},
      {label:'Día 4',goal:'Repasar de forma espaciada',activity:'Intentá recuperar los conceptos de días anteriores sin releer primero. Corregí dudas con la bibliografía.'},
      {label:'Día 5',goal:'Segundo bloque y errores',activity:'Terminá el contenido pendiente y registrá los errores recurrentes con su causa: concepto, procedimiento o interpretación.'},
      {label:'Día 6',goal:'Simulacro',activity:'Hacé una práctica con tiempo aproximado al examen y analizá cada respuesta, no solo la nota.'},
      {label:'Día 7',goal:'Refuerzo y descanso',activity:'Revisá errores importantes, practicá un pequeño bloque mixto y organizá el descanso previo.'}
    ]},
  {slug:'estudiar-en-14-dias',title:'Plan de estudio de 14 días para un final',description:'Dos semanas para preparar un examen final con diagnóstico, estudio por temas y simulacros.',days:14,
    intro:'Dos semanas permiten distribuir mejor el esfuerzo, pero no garantizan preparación suficiente: dependen de cuánto material tenés y del nivel que ya alcanzaste.',
    steps:[
      {label:'Días 1–2',goal:'Diagnóstico y mapa de temas',activity:'Desglosá el programa, identificá contenidos centrales y hacé una primera autoevaluación.'},
      {label:'Días 3–5',goal:'Primer bloque de contenidos',activity:'Estudiá temas difíciles con ejemplos y pequeñas preguntas de recuperación al final de cada sesión.'},
      {label:'Días 6–7',goal:'Primer repaso acumulativo',activity:'Mezclá preguntas de todos los temas vistos y corregí errores conceptuales.'},
      {label:'Días 8–10',goal:'Segundo bloque de contenidos',activity:'Completá temas pendientes y conectá contenidos que suelen aparecer juntos en el examen.'},
      {label:'Días 11–12',goal:'Simulacros y refuerzo',activity:'Practicá con tiempo, revisá las razones de cada error y repetí con preguntas diferentes.'},
      {label:'Días 13–14',goal:'Repaso final',activity:'Recuperá lo esencial, reforzá los puntos débiles y cuidá los descansos antes de rendir.'}
    ]}
];

export type PublicDoc={slug:string;title:string;description:string;steps:{title:string;text:string}[]};
export const PUBLIC_DOCS:PublicDoc[]=[
 {slug:'primeros-pasos',title:'Primeros pasos con Evaluo',description:'Cómo empezar a estudiar con un PDF o documento Word en Evaluo y qué ocurre después de seleccionar el archivo.',steps:[
 {title:'Elegí tu material',text:'Desde la página de inicio podés seleccionar un PDF. Para procesarlo se solicita iniciar sesión o crear una cuenta. El documento debe contener contenido legible y que tengas permiso para usar.'},
 {title:'Esperá la preparación',text:'Evaluo analiza el material para ayudarte a estudiar por temas. La calidad depende de lo legible y estructurado que esté el documento; tablas o imágenes pueden requerir comprobación manual.'},
 {title:'Estudiá y comprobá',text:'Leé los resúmenes disponibles, usá preguntas de práctica y revisá las explicaciones. Verificá siempre conceptos técnicos importantes contra el material original.'},
 {title:'Volvé a tus temas',text:'Usá las herramientas de práctica para revisar errores y recuperar información en otra sesión. Los resultados de práctica no equivalen a una calificación oficial.'}
 ]},
 {slug:'practicar-por-temas',title:'Cómo practicar por temas y revisar errores',description:'Guía del flujo para estudiar un tema, responder preguntas y utilizar los resultados para reforzar lo que cuesta.',steps:[
 {title:'Seleccioná un documento',text:'Ingresá a tu espacio de estudio y abrí el material que quieras trabajar.'},
 {title:'Elegí un tema',text:'Desde el resumen o el recorrido de estudio, avanzá con un tema concreto para practicar lo que acabás de leer.'},
 {title:'Respondé y revisá',text:'Contestá sin mirar primero y analizá las explicaciones, especialmente cuando te confundas entre opciones similares.'},
 {title:'Reforzá lo que costó',text:'Volvé al apartado relevante y probá una pregunta diferente. La revisión de errores es más útil que memorizar solo la opción correcta.'}
 ]}
];

export type SeoHub = {
  path:string; kicker:string;title:string;description:string;
  intro:string; benefitTitle:string;benefit:string;
  cards:{title:string;description:string;href:string;label?:string}[];
  steps:{title:string;detail:string}[];
};
export const SEO_HUBS:Record<string,SeoHub>={
 examenes:{
  path:'/examenes',kicker:'Práctica gratuita',title:'Mini exámenes para comprobar qué sabés',
  description:'Preguntas gratuitas de práctica con resultados y explicaciones. No son parciales ni exámenes oficiales.',
  intro:'Una práctica corta puede ayudarte a descubrir un error conceptual antes de rendir. Estos ejercicios son originales, introductorios y no están asociados a ninguna universidad.',
  benefitTitle:'¿Por qué practicar en vez de releer?',benefit:'Recordar una respuesta sin consultar la fuente y corregir los errores ayuda a reconocer qué conceptos todavía necesitás trabajar.',
  cards:PUBLIC_EXAMS.map(t=>({title:t.title,description:t.description,href:'/examenes/'+t.slug,label:'5 preguntas con explicaciones'})),
  steps:[{title:'Elegí la materia',detail:'Entrá al mini examen del tema que querés repasar.'},{title:'Respondé sin mirar',detail:'Intentá resolver todas las preguntas antes de corregir.'},{title:'Estudiá tus errores',detail:'Leé por qué era correcta cada alternativa y seguí practicando con tus apuntes.'}]
 },
 'planes-de-estudio':{
  path:'/planes-de-estudio',kicker:'Organización de estudio',title:'Planes concretos para preparar tu próximo examen',
  description:'Planes de 3, 7 y 14 días con actividades de comprensión, práctica y repaso.',
  intro:'No necesitás un calendario perfecto: necesitás decidir qué estudiar hoy, cuándo recuperar lo aprendido y cómo corregir lo que cuesta. Elegí un plan según el tiempo disponible.',
  benefitTitle:'El calendario se adapta a vos',benefit:'Los planes son ejemplos, no promesas de aprobar. Si tenés un programa extenso o estás empezando de cero, ajustá el ritmo y la profundidad.',
  cards:PUBLIC_PLANS.map(t=>({title:t.title,description:t.description,href:'/planes-de-estudio/'+t.slug,label:t.days+' días'})),
  steps:[{title:'Revisá tu temario',detail:'Anotá los temas y cuánto sabés de cada uno.'},{title:'Distribuí sesiones',detail:'Reservá bloques cortos para lectura activa y preguntas.'},{title:'Reforzá',detail:'Usá la revisión de errores para decidir el próximo tema.'}]
 },
 herramientas:{
  path:'/herramientas',kicker:'Utilidades gratuitas',title:'Herramientas simples para organizar el estudio',
  description:'Calculadora de carga de estudio y accesos a herramientas para practicar con tus propios apuntes.',
  intro:'Antes de empezar, conviene saber cuánto tiempo tenés y qué temas necesitás cubrir. Probá una calculadora sencilla para distribuir el trabajo y después llevá el material a Evaluo.',
  benefitTitle:'Una estimación, no una predicción',benefit:'La calculadora reparte temas y tiempo de forma orientativa. No tiene acceso al programa de tu materia ni conoce la dificultad de cada unidad.',
  cards:[{title:'Calculadora de carga de estudio',description:'Repartí temas entre días disponibles y estimá minutos de estudio por tema.',href:'/herramientas/calculadora-de-estudio'},
  {title:'Convertir PDF en preguntas',description:'Generá preguntas desde el material que necesitás estudiar.',href:'/convertir-pdf-en-preguntas'},
  {title:'Planificación por días',description:'Elegí un plan de tres, siete o catorce días.',href:'/planes-de-estudio'}],
  steps:[{title:'Organizá',detail:'Definí cuántos temas tenés y los días disponibles.'},{title:'Estudiá',detail:'Dedicá sesiones a comprender y resolver ejercicios.'},{title:'Comprobá',detail:'Ajustá según los errores, no solamente según el tiempo transcurrido.'}]
 },
 recursos:{
  path:'/recursos',kicker:'Recursos descargables y plantillas',title:'Plantillas de estudio para usar hoy',
  description:'Plantilla de registro de errores y enlaces a guías y planes de estudio gratuitos.',
  intro:'Las mejores plantillas no requieren completar veinte campos: deben ayudarte a descubrir qué falló y cuál será la próxima acción. Empezá con un registro de errores breve y reutilizable.',
  benefitTitle:'Usá el material con criterio',benefit:'Una plantilla sirve para organizar, pero la comprensión se comprueba resolviendo preguntas y aplicando las ideas, no solamente llenando casilleros.',
  cards:[
  {title:'Verificar preguntas generadas por IA',description:'Protocolo original de siete criterios, ejemplo corregido y fuentes verificables.',href:'/recursos/verificar-preguntas-ia'},
  {title:'Método de estudio activo con PDF',description:'Sesión práctica completa con recuperación, corrección y repaso distribuido.',href:'/recursos/metodo-estudio-pdf-practica-activa'},
  {title:'Registro de errores para estudiar',description:'Modelo imprimible con las preguntas clave para mejorar después de un examen.',href:'/recursos/registro-de-errores'},
  {title:'Plan semanal de repaso',description:'Una propuesta de siete días para alternar temas y prácticas.',href:'/planes-de-estudio/estudiar-en-7-dias'},
  {title:'Guías de estudio',description:'Métodos por materia con ejercicios y recomendaciones.',href:'/es/guias'}],
  steps:[{title:'Anotá el error',detail:'Qué preguntaba el ejercicio y por qué fallaste.'},{title:'Escribí la corrección',detail:'Anotá el concepto con tus propias palabras.'},{title:'Reintentá',detail:'Respondé una variación sin consultar la solución.'}]
 },
 docs:{
  path:'/docs',kicker:'Centro de ayuda',title:'Aprendé a utilizar Evaluo paso a paso',
  description:'Tutoriales de primeros pasos, estudio por temas y práctica con tus propios documentos.',
  intro:'Si estás usando Evaluo por primera vez, estos recorridos explican cómo comenzar con un documento y cómo pasar de la lectura al repaso.',
  benefitTitle:'Material de ayuda',benefit:'La interfaz puede cambiar cuando incorporamos mejoras. Si ves una opción diferente, seguí el recorrido equivalente dentro de tu espacio de estudio.',
  cards:PUBLIC_DOCS.map(t=>({title:t.title,description:t.description,href:'/docs/'+t.slug,label:'Guía de uso'})),
  steps:[{title:'Seleccioná tu material',detail:'Empezá con un PDF legible que tengas derecho a usar.'},{title:'Estudiá por temas',detail:'Tomá un concepto por vez y usá el resumen o explicación.'},{title:'Practicá',detail:'Respondé preguntas y reforzá los errores.'}]
 },
 funciones:{
  path:'/funciones',kicker:'Funciones de Evaluo',title:'Una manera de estudiar tus apuntes, varias formas de practicar',
  description:'Resumí PDFs, creá flashcards y simulacros; los mapas mentales están en Premium.',
  intro:'No necesitás elegir una herramienta para toda la materia. Empezá por entender un tema y usá preguntas, tarjetas o un simulacro según lo que necesites comprobar.',
  benefitTitle:'Herramientas conectadas con el estudio',benefit:'El contenido generado por IA puede contener errores: contrastá explicaciones, fórmulas y datos técnicos con el material original.',
  cards:[
  {title:'Resumir PDF con IA',description:'Organizá las ideas principales de un documento.',href:'/funciones/resumir-pdf-con-ia'},
  {title:'Flashcards desde PDF',description:'Repasá conceptos mediante tarjetas.',href:'/funciones/crear-flashcards-desde-pdf'},
  {title:'Mapa mental desde PDF',description:'Visualizá relaciones entre conceptos.',href:'/funciones/crear-mapa-mental-desde-pdf'},
  {title:'Simulacro de examen',description:'Practicá con preguntas y revisá los resultados.',href:'/funciones/simulacro-examen-con-ia'},
  {title:'Practicar por tema',description:'Comprobá lo aprendido después de estudiar un tema.',href:'/funciones/practicar-por-tema'},
  {title:'Convertir PDF en preguntas',description:'Transformá apuntes en ejercicios de práctica.',href:'/convertir-pdf-en-preguntas'},
  {title:'Verdadero o falso con IA',description:'Comprobá afirmaciones con explicaciones y repasá conceptos de tus apuntes.',href:'/funciones/verdadero-falso-con-ia'},
  {title:'Unir conceptos con IA',description:'Relacioná términos y definiciones para detectar confusiones.',href:'/funciones/unir-conceptos-con-ia'}],
  steps:[{title:'Seleccioná un documento',detail:'Usá el material de tu clase.'},{title:'Elegí cómo estudiar',detail:'Alterná lectura, tarjetas y preguntas según el tipo de contenido.'},{title:'Reforzá errores',detail:'Volvé a los temas difíciles y comprobá tu progreso.'}]
 },
 comparar:{
  path:'/comparar',kicker:'Comparativas educativas',title:'Qué herramienta conviene para cada forma de estudiar',
  description:'Compará Evaluo con ChatGPT, NotebookLM y Quizlet según tus necesidades y el tipo de material.',
  intro:'No existe una única herramienta ideal para todo. Revisá qué ofrece cada alternativa, cuándo puede resultar útil y qué limitaciones deberías considerar.',
  benefitTitle:'Comparativas basadas en usos concretos',benefit:'Las prestaciones de terceros cambian. Consultá sus sitios oficiales para confirmar precios, disponibilidad y límites actuales.',
  cards:[
  {title:'Las mejores IA para estudiar en 2026',description:'Ocho herramientas comparadas: para qué sirve cada una, sus límites y cuáles son gratis.',href:'/es/mejores-ia-para-estudiar'},
  {title:'Evaluo vs ChatGPT',description:'Estudio conversacional frente a un recorrido de práctica por temas.',href:'/comparar/evaluo-vs-chatgpt'},
  {title:'Evaluo vs NotebookLM',description:'Investigación con fuentes frente a práctica a partir de material de estudio.',href:'/comparar/evaluo-vs-notebooklm'},
  {title:'Evaluo vs Quizlet',description:'Tarjetas y herramientas de repaso comparadas con el flujo de Evaluo.',href:'/comparar/evaluo-vs-quizlet'}],
  steps:[{title:'Elegí tu objetivo',detail:'¿Necesitás comprender, sintetizar o responder preguntas?'},{title:'Compará el flujo',detail:'Analizá qué trabajo requiere cada herramienta.'},{title:'Probá con un material',detail:'Comprobá cuál se adapta a tu forma de estudiar.'}]
 }
};
