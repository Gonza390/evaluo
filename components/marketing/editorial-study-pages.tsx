import Link from 'next/link';
import { PublicSiteHeader } from '@/components/marketing/public-site-header';
import { FooterHome } from '@/components/footer-home';
import { ArrowRight, UploadCloud } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { PdfFirstLandingUploader } from '@/components/marketing/pdf-first-landing-uploader';
import './editorial-study-pages.css';

const signup = '/login?mode=signup&next=%2Fdashboard%2Fmateriales%3FopenUpload%3D1';

function Header() { return <div className="es-header"><div className="es-shell"><PublicSiteHeader primaryHref={signup} trackingLocation="seo_comparison_header" /></div></div>; }
function Footer() { return <FooterHome />; }
function Action({children = 'Empezar con mi PDF'}:{children?:string}) {
  return <TrackedLink href={signup} eventName="cta_click" payload={{location:'seo_editorial_cta',cta_name:'subir_pdf',destination:signup}} className="es-action from-brand to-brand-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(37,99,235,0.3)]"><UploadCloud className="h-4.5 w-4.5" aria-hidden="true" />{children}<ArrowRight className="h-4 w-4" aria-hidden="true" /></TrackedLink>;
}
function DocumentPreview() {
 return <div className="es-paper-demo" aria-label="Ejemplo ilustrativo de una práctica por tema">
  <div className="es-paper-top"><span>PRÁCTICA / MARKETING I</span><span>01 — 06</span></div>
  <div className="es-paper-rule" />
  <div className="es-paper-topic">Tema 02 · Segmentación</div>
  <p className="es-paper-question">¿Por qué una empresa puede necesitar segmentar su mercado antes de definir una estrategia?</p>
  <div className="es-paper-line"><span className="es-paper-circle">A</span><span>Para distinguir grupos con necesidades diferentes.</span></div>
  <div className="es-paper-line"><span className="es-paper-circle">B</span><span>Para ofrecer siempre el mismo producto a todos.</span></div>
  <div className="es-paper-note"><strong>Después de responder</strong><span>Revisás la explicación y volvés al tema que necesitás reforzar.</span></div>
  <div className="es-paper-bottom">EJEMPLO ILUSTRATIVO · NO ES UNA EVALUACIÓN REAL</div>
 </div>;
}
export function NotebookComparisonPage(){
 const rows = [
  ['Punto de partida','Tus fuentes: documentos, enlaces y otros materiales admitidos.','Tu PDF de estudio, organizado por temas.'],
  ['Comprender el material','Consultas a las fuentes y recursos de estudio.','Resumen, glosario y mapa mental del documento.'],
  ['Practicar','Cuestionarios y tarjetas didácticas con opciones de repaso.','Práctica por tema, resultados y refuerzo de errores.'],
  ['Seguir aprendiendo','Permite revisar cuestionarios y tarjetas.','Te orienta sobre qué temas reforzar y continuar.'],
 ];
 return <div className="es-page"><Header/><main>
  <section className="es-shell es-hero es-hero-compare">
   <div className="es-kicker">GUÍA PARA ELEGIR UNA HERRAMIENTA · 2026</div>
   <h1>NotebookLM o Evaluo.<br/><em>¿Cuál usar para estudiar?</em></h1>
   <p className="es-lede">Las dos herramientas trabajan con material de estudio y permiten practicar. La diferencia está en cómo querés usar ese material: explorar fuentes o seguir un recorrido de preparación por tema.</p>
   <div className="es-hero-links"><Action>Probar Evaluo gratis</Action><a className="es-subtle-link" href="#comparacion">Ver la comparación ↓</a></div>
   <div className="es-disclosure">Comparación editorial realizada por Evaluo. NotebookLM es un producto de Google y no está asociado a Evaluo.</div>
  </section>
  <section id="comparacion" className="es-shell es-section">
   <div className="es-section-head"><span className="es-index">01 / COMPARATIVA</span><h2>Dos formas de trabajar<br/>con tus apuntes.</h2></div>
   <div className="es-table-wrap"><table className="es-compare"><thead><tr><th>Qué necesitás</th><th>NotebookLM</th><th>Evaluo</th></tr></thead><tbody>{rows.map(row=><tr key={row[0]}><th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div>
   <p className="es-small-source">Las funciones de NotebookLM pueden cambiar. Fuente: <a href="https://support.google.com/notebooklm/" target="_blank" rel="noopener noreferrer">ayuda oficial de Google</a>. Comparación de enfoques, no prueba de superioridad.</p>
  </section>
  <section className="es-band"><div className="es-shell es-split">
   <div><span className="es-index">02 / LA DIFERENCIA</span><h2>Entender algo no siempre significa poder responderlo en un examen.</h2><p>Después de leer, necesitás intentar recordar, equivocarte y volver a practicar. Evaluo organiza esa secuencia alrededor de tus temas y te muestra qué conviene reforzar.</p><Action>Estudiar por tema</Action></div>
   <DocumentPreview/>
  </div></section>
  <section className="es-shell es-section es-use-cases"><div className="es-section-head"><span className="es-index">03 / SEGÚN TU OBJETIVO</span><h2>Elegí por el trabajo<br/>que querés hacer.</h2></div>
   <div className="es-two"><article><span>01</span><h3>Explorar y consultar fuentes</h3><p>Si necesitás reunir materiales y hacer preguntas para profundizar un tema, NotebookLM es una opción a considerar.</p><a href="https://notebooklm.google.com/" target="_blank" rel="noopener noreferrer">Conocer NotebookLM ↗</a></article><article><span>02</span><h3>Prepararte tema por tema</h3><p>Si tenés un PDF para rendir y querés practicar, revisar tus errores y continuar desde tus puntos débiles, conocé Evaluo.</p><Link href="/estudiar-pdf-con-ia">Cómo se estudia con Evaluo ↗</Link></article></div>
  </section>
<section className="es-shell es-section es-content-depth" aria-labelledby="comparacion-aprendizaje">
  <div className="es-section-head"><span className="es-index">04 / CÓMO APROVECHARLAS</span><h2 id="comparacion-aprendizaje">Cómo elegir según tu forma de estudiar</h2></div>
  <div className="es-two">
    <article><h3>Cuando tenés varias fuentes para investigar</h3><p>Para comprender un tema que aparece en una clase, un artículo y varias lecturas, reuní las fuentes, compará ideas y verificá qué documento respalda cada afirmación. NotebookLM resulta útil para ese trabajo de consulta y síntesis.</p><p>Antes de utilizar una respuesta para estudiar, contrastá las afirmaciones importantes con las fuentes originales, especialmente nombres, fechas, fórmulas y excepciones.</p></article>
    <article><h3>Cuando tenés un parcial y un PDF de apuntes</h3><p>Dividí el material en temas. Después de repasar cada uno, intentá responder preguntas sin mirar, revisá tus errores y repetí la práctica. Evaluo organiza ese trabajo dentro de un recorrido de preparación.</p><p>Si fallás varias preguntas de un mismo concepto, volver a leer todo el documento suele ser menos específico que reforzar ese apartado.</p></article>
  </div>
  <div className="es-article-block"><h3>Un ejemplo: preparar un parcial de Marketing I</h3><p>Supongamos que el material incluye segmentación, posicionamiento y comportamiento del consumidor. Primero identificás qué significa cada concepto y cómo se relaciona con los demás. Luego probás si podés aplicarlos: ¿qué criterio usarías para segmentar un mercado?, ¿cómo distinguirías segmento y público objetivo?, ¿qué información necesitarías para justificar la decisión?</p><p>Si querés explorar documentos complementarios, una herramienta de consulta de fuentes puede ayudarte. Si necesitás comprobar qué sabés de cada tema, conviene convertir esas preguntas en una práctica y revisar las explicaciones de los errores.</p></div>
  <div className="es-article-block"><h3>¿Se pueden usar NotebookLM y Evaluo juntos?</h3><p>Sí. No son alternativas excluyentes. Podés usar NotebookLM para investigar y comprender varias fuentes y Evaluo para organizar la práctica sobre tus apuntes de examen. La elección depende menos de una lista de funciones y más de qué actividad necesitás completar en ese momento.</p><p>También podés ver cómo <Link href="/funciones/resumir-pdf-con-ia">resumir un PDF para estudiar</Link> o consultar nuestra guía para <Link href="/convertir-pdf-en-preguntas">convertir un PDF en preguntas</Link>.</p></div>
</section>
<section className="es-shell es-section"><div className="es-section-head"><span className="es-index">05 / PREGUNTAS FRECUENTES</span><h2>Preguntas sobre Evaluo y NotebookLM</h2></div><div className="es-faq">
<details><summary>¿NotebookLM también crea cuestionarios y flashcards?</summary><p>Sí. NotebookLM ofrece recursos de estudio, como cuestionarios y tarjetas didácticas. No sería correcto presentarlo solamente como un chat con documentos. Consultá la <a href="https://support.google.com/notebooklm/" target="_blank" rel="noopener noreferrer">documentación oficial</a> porque estas funciones evolucionan.</p></details>
<details><summary>¿Cuál conviene para preparar un examen?</summary><p>Depende del material y de lo que necesitás hacer. Si tu prioridad es comprender y contrastar varias fuentes, NotebookLM puede ser apropiado. Si querés practicar los temas de tus apuntes, revisar resultados y reforzar lo que te cuesta, Evaluo ofrece ese recorrido.</p></details>
<details><summary>¿Evaluo trabaja con mis propios apuntes?</summary><p>Sí. Podés partir de tus PDFs, crear recursos de estudio y practicar sobre los temas del material. Revisá siempre las afirmaciones importantes con el documento original.</p></details>
<details><summary>¿Qué diferencia hay entre resumir y practicar?</summary><p>Un resumen organiza información para comprenderla. Practicar implica intentar recuperarla y aplicarla sin mirar. Ambas actividades pueden complementarse, pero leer un resumen no demuestra por sí solo que estés preparado para responder preguntas.</p></details>
</div></section>
  <section className="es-shell es-close"><span className="es-index">UNA FORMA DE EMPEZAR</span><h2>Tu próximo tema de estudio puede empezar con un PDF.</h2><Action>Subir mis apuntes</Action></section>
 </main><Footer/></div>;
}
const steps=[['01','Delimitá un tema','Elegí un capítulo o apartado concreto. Practicar un documento entero de una vez puede ocultar qué parte todavía te cuesta.'],['02','Comprendé antes de responder','Leé el resumen y contrastá las ideas importantes con el PDF original.'],['03','Intentá recordar sin mirar','Respondé preguntas sobre el tema. Equivocarte te da información sobre qué revisar.'],['04','Revisá el error y volvé','Leé la explicación, reforzá el concepto y repetí la práctica para comprobar si lo entendiste.']];
export function PdfPracticePage(){
 return <div className="es-page"><Header/><main>
  <section className="es-shell es-hero es-hero-practice"><div className="es-practice-intro">
    <span className="es-kicker">GUÍA PRÁCTICA / ESTUDIAR CON IA</span>
    <h1>Tu PDF no tiene que terminar en un resumen.</h1>
    <p className="es-lede">Transformá tus apuntes en preguntas para practicar, detectar qué no entendiste y volver a estudiar lo que realmente te cuesta.</p>
    <div className="es-hero-links"><Action>Crear práctica desde mi PDF</Action><a href="#metodo" className="es-subtle-link">Conocer el método ↓</a></div>
    <p className="es-tiny">Empezá gratis · Sin tarjeta</p>
  </div><DocumentPreview/></section>
  <section id="metodo" className="es-section es-shell"><div className="es-section-head"><span className="es-index">01 / EL MÉTODO</span><h2>De leer a comprobar<br/>qué aprendiste.</h2></div>
   <div className="es-step-list">{steps.map(([n,title,body])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
  </section>
  <section className="es-band"><div className="es-shell es-text-section"><span className="es-index">02 / UN EJEMPLO CONCRETO</span><h2>Supongamos que estás estudiando segmentación de mercados.</h2>
   <p>Leer la definición te ayuda a orientarte. Pero en un examen pueden pedirte que expliques por qué sirve segmentar, qué criterios utilizarías o cómo identificarías un segmento viable.</p>
   <p>Una práctica útil alterna conceptos y aplicación. Si una respuesta sale mal, el próximo paso no es generar otro resumen: es volver al punto específico que todavía no dominás.</p>
   <Link className="es-text-link" href="/estudiar-pdf-con-ia">Ver todas las herramientas de estudio ↗</Link>
  </div></section>
  <section className="es-shell es-section"><div className="es-section-head"><span className="es-index">03 / PREGUNTAS FRECUENTES</span><h2>Antes de empezar.</h2></div>
  <div className="es-faq"><details><summary>¿Las preguntas salen de mi propio PDF?</summary><p>Sí. Evaluo toma tu material como fuente para crear una experiencia de estudio. Revisá siempre los datos importantes contra el documento original: las herramientas de IA pueden cometer errores.</p></details><details><summary>¿Puedo practicar por tema?</summary><p>Sí. El recorrido de Evaluo permite trabajar por tema y decidir qué reforzar después de practicar.</p></details><details><summary>¿Qué preguntas puedo crear a partir de mis apuntes?</summary><p>Podés practicar ideas principales, relaciones entre conceptos y aplicaciones. Conviene combinar formatos y comprobar que cada respuesta esté fundamentada en el material.</p></details><details><summary>¿Qué pasa si el PDF tiene imágenes o tablas?</summary><p>Revisá que los elementos visuales importantes se interpreten correctamente. Una fórmula, una tabla o un esquema mal leído puede afectar el sentido de la pregunta y su explicación.</p></details><details><summary>¿Necesito estudiar primero el resumen?</summary><p>No necesariamente. Si ya conocés el tema, podés empezar por la práctica para detectar qué te falta. Si recién comenzás, el resumen y el glosario pueden ayudarte a orientarte.</p></details></div>
  </section>
<section className="es-shell es-section es-content-depth"><div className="es-section-head"><span className="es-index">04 / TIPOS DE PREGUNTAS</span><h2>Qué preguntas conviene generar desde un PDF</h2></div>
<div className="es-two"><article><h3>Comprensión y relaciones</h3><p>Pedí que expliquen causas, consecuencias y diferencias. Por ejemplo: «¿Cuál es la diferencia entre segmentación demográfica y psicográfica?» o «¿por qué una estrategia podría fallar si se confunden ambos criterios?».</p><p>Este tipo de pregunta comprueba si entendés la idea y no solo si recordás una definición.</p></article><article><h3>Aplicación a situaciones</h3><p>Usá situaciones breves que obliguen a decidir. Por ejemplo: «Una marca de productos deportivos quiere llegar a personas con distintos hábitos de entrenamiento. ¿Qué información necesitaría para definir sus segmentos?».</p><p>Una pregunta de aplicación permite conectar el concepto con un caso nuevo.</p></article></div>
<div className="es-article-block"><h3>Cómo reconocer una buena pregunta de práctica</h3><p>Una pregunta útil debe tener un objetivo claro, basarse en conceptos presentes en el material y permitir revisar la respuesta con una explicación. No todas tienen que ser difíciles: alternar definiciones, relaciones y aplicaciones ayuda a detectar distintos tipos de errores.</p><p>Si un cuestionario repite la misma definición con otras palabras, probablemente necesites más variedad. Si una respuesta depende de información que no está en tu PDF, revisá esa pregunta contra la bibliografía de la materia antes de confiar en ella.</p></div>
</section>
<section className="es-band"><div className="es-shell es-text-section"><span className="es-index">05 / DESPUÉS DE RESPONDER</span><h2>Qué hacer cuando te equivocás</h2><p>Primero identificá si el error fue por no recordar un dato, confundir conceptos o no saber aplicarlos. Después consultá la explicación y el fragmento correspondiente de tus apuntes. Por último, intentá responder otra pregunta del mismo tema sin mirar la respuesta anterior.</p><p>Esto evita que la práctica se convierta en una simple colección de aciertos y errores. El objetivo no es completar muchas preguntas, sino mejorar lo que podés recuperar y explicar por tu cuenta.</p><p>Si el PDF contiene gráficos, fórmulas o tablas, verificá que la conversión del documento conserve los elementos necesarios: una pregunta puede quedar mal planteada si falta contexto visual.</p></div></section>
<section className="es-shell es-section"><div className="es-section-head"><span className="es-index">06 / EMPEZÁ CON TUS APUNTES</span><h2>Elegí un PDF y empezá a estudiar</h2></div><p className="es-long-copy">Podés seleccionar el archivo antes de crear tu cuenta. Evaluo mantiene tus herramientas de estudio conectadas al material para que puedas pasar de leer a practicar por tema.</p><div className="es-upload"><PdfFirstLandingUploader trackingLocation="seo_convertir_pdf_preguntas" sourceKey="convertir-pdf-en-preguntas" /></div><p className="es-small-source">Elegir el archivo no requiere registrarte; se solicita una cuenta cuando decidís crear tu material.</p></section>
  <section className="es-shell es-close"><span className="es-index">EMPEZÁ POR UN TEMA</span><h2>Leé menos en automático.<br/>Practicá con intención.</h2><Action>Crear mi primera práctica</Action></section>
 </main><Footer/></div>;
}