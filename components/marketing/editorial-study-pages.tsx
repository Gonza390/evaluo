import Link from 'next/link';
import Image from 'next/image';
import './editorial-study-pages.css';

const signup = '/login?mode=signup&next=%2Fdashboard%2Fmateriales%3FopenUpload%3D1';

function Header() {
  return <header className="es-header"><div className="es-shell es-header-inner">
    <Link href="/" className="es-brand"><Image src="/evaluo-logo-icono.svg" alt="" width={27} height={27} />Evaluo</Link>
    <nav aria-label="Navegación"><Link href="/estudiar-pdf-con-ia">Cómo funciona</Link><Link href="/pricing">Precios</Link><Link href="/login?mode=login">Ingresar</Link></nav>
  </div></header>;
}
function Footer() {
  return <footer className="es-footer"><div className="es-shell"><Link href="/">Evaluo</Link><span>Estudiá con tus propios apuntes.</span><Link href="/pricing">Ver planes</Link></div></footer>;
}
function Action({children = 'Empezar con mi PDF'}:{children?:string}) {
  return <Link className="es-action" href={signup}>{children}<span aria-hidden="true">↗</span></Link>;
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
  <div className="es-faq"><details><summary>¿Las preguntas salen de mi propio PDF?</summary><p>Sí. Evaluo toma tu material como fuente para crear una experiencia de estudio. Revisá siempre los datos importantes contra el documento original: las herramientas de IA pueden cometer errores.</p></details><details><summary>¿Puedo practicar por tema?</summary><p>Sí. El recorrido de Evaluo permite trabajar por tema y decidir qué reforzar después de practicar.</p></details><details><summary>¿Necesito estudiar primero el resumen?</summary><p>No necesariamente. Si ya conocés el tema, podés empezar por la práctica para detectar qué te falta. Si recién comenzás, el resumen y el glosario pueden ayudarte a orientarte.</p></details></div>
  </section>
  <section className="es-shell es-close"><span className="es-index">EMPEZÁ POR UN TEMA</span><h2>Leé menos en automático.<br/>Practicá con intención.</h2><Action>Crear mi primera práctica</Action></section>
 </main><Footer/></div>;
}