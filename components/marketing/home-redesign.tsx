import Image from 'next/image';
import { HomePdfPickerButton } from './home-pdf-picker-button';
import { HomeRedesignDemo } from './home-redesign-demo';
import { HOME_REDESIGN_FAQS } from './home-redesign-faqs';
import { TrackedLink } from './tracked-link';
import { HomeUniversityCarousel } from './home-university-carousel';

const universityLogos = [
  {
    name: 'Universidad Siglo 21',
    src: 'siglo-21-repositorio.png',
    width: 825,
    height: 102,
    href: 'https://21.edu.ar/',
  },
  {
    name: 'Universidad de Buenos Aires (UBA)',
    src: 'uba.svg',
    width: 512,
    height: 512,
    href: 'https://www.uba.ar/',
  },
  {
    name: 'Universidad Nacional de Tres de Febrero (UNTREF)',
    src: 'untref.svg',
    width: 550,
    height: 260,
    href: 'https://untref.edu.ar/',
  },
  {
    name: 'Universidad Católica de Córdoba',
    src: 'ucc.svg',
    width: 300,
    height: 150,
    href: 'https://ucc.edu.ar/',
  },
  {
    name: 'Universidad Tecnológica Nacional (UTN)',
    src: 'utn.png',
    width: 1348,
    height: 611,
    href: 'https://utn.edu.ar/',
  },
  {
    name: 'Universidad Columbia del Paraguay',
    src: 'columbia-circular.png',
    width: 81,
    height: 81,
    href: 'https://www.columbia.edu.py/',
  },
  {
    name: 'Universidad Nacional de Colombia (UNAL)',
    src: 'unal.svg',
    width: 245,
    height: 245,
    href: 'https://unal.edu.co/',
  },
];

export function HomeRedesign({ primaryHref }: { primaryHref: string }) {
  return (
    <div className="home-redesign" style={{ width: '100%' }}>
      <div
        style={{
          background:
            'radial-gradient(620px 420px at 85% 15%,rgba(99,102,241,.16),transparent 60%),radial-gradient(520px 420px at 8% 85%,rgba(37,99,235,.08),transparent 60%),linear-gradient(#fff,#F8FAFC)',
        }}
      >
        <div className="w">
          <div className="nav">
            <a className="logo" href="/" aria-label="Evaluo, inicio">
              <Image src="/evaluo-logo-icono.svg" alt="" width={32} height={32} unoptimized />
              Evaluo
            </a>
            <nav className="pill" aria-label="Navegación principal">
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#plan-estudio">Plan de estudio</a>
              <a href="#planes">Planes</a>
            </nav>
            <div className="nav-auth">
              <a
                className="btn"
                href="/login?mode=login"
                style={{ border: '0', background: 'none' }}
              >
                Iniciar sesión
              </a>{' '}
              <a className="btn g" href={primaryHref}>
                Crear cuenta gratis →
              </a>
            </div>
          </div>
          <div className="g2 hero-grid" style={{ padding: '56px 0 96px' }}>
            <div>
              <span
                className="chip hero-eyebrow"
                style={{ color: 'var(--v)', marginBottom: '22px' }}
              >
                ✦ Preparación para exámenes
              </span>
              <h1>Sabé qué tan preparado estás para tu examen.</h1>
              <p style={{ fontSize: '17px', margin: '22px 0 30px', maxWidth: '500px' }}>
                Subí tus apuntes y practicá sobre ellos. Evaluo mide qué dominás, qué te cuesta y
                cómo usar los días que te quedan.
              </p>
              <div className="hero-actions">
                <HomePdfPickerButton
                  className="btn g"
                  location="home_hero"
                  ctaName="subir_mis_apuntes"
                >
                  Subir mis apuntes <span aria-hidden="true">→</span>
                </HomePdfPickerButton>
                <a className="btn" href="#demo">
                  ▶ Ver cómo funciona
                </a>
              </div>
              <div style={{ fontSize: '12px', margin: '14px 0 22px', color: 'var(--s5)' }}>
                Empezá gratis · Sin tarjeta
              </div>
              <div
                className="hero-benefits"
                style={{ fontSize: '12px', display: 'flex', gap: '18px', flexWrap: 'wrap' }}
              >
                <span>
                  <i className="ck">✓</i>Con tus propios apuntes
                </span>
                <span>
                  <i className="ck">✓</i>Tema por tema
                </span>
                <span>
                  <i className="ck">✓</i>Hasta tu fecha de examen
                </span>
              </div>
            </div>
            <div className="hero-preview" style={{ position: 'relative', paddingBottom: '40px' }}>
              <div
                className="card"
                style={{ borderTop: '3px solid var(--i)', padding: '22px 24px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <b style={{ color: 'var(--t)' }}>Marketing I · Parcial 1</b>
                </div>
                <div
                  className="hero-preparation"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '22px',
                    margin: '18px 0 8px',
                  }}
                >
                  <svg width="124" height="124" viewBox="0 0 124 124">
                    <defs>
                      <linearGradient id="rg" x1="0" x2="1">
                        <stop offset="0" stopColor="#2563EB"></stop>
                        <stop offset="1" stopColor="#6366F1"></stop>
                      </linearGradient>
                    </defs>
                    <circle
                      cx="62"
                      cy="62"
                      r="54"
                      fill="none"
                      stroke="#EEF2FF"
                      strokeWidth="12"
                    ></circle>
                    <circle
                      cx="62"
                      cy="62"
                      r="54"
                      fill="none"
                      stroke="url(#rg)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="339"
                      strokeDashoffset="129"
                      transform="rotate(-90 62 62)"
                    ></circle>
                    <text
                      x="62"
                      y="68"
                      textAnchor="middle"
                      fontSize="30"
                      fontWeight="700"
                      fill="#0F1B3D"
                    >
                      62%
                    </text>
                  </svg>
                  <div>
                    <div className="eb" style={{ marginBottom: '6px' }}>
                      Nivel de preparación
                    </div>
                    <h3 style={{ fontSize: '20px', letterSpacing: '-.03em' }}>
                      Vas bien, pero todavía no estás listo.
                    </h3>
                    <div style={{ fontSize: '12px', marginTop: '6px' }}>
                      Examen: lun 26 oct · <b style={{ color: 'var(--t)' }}>quedan 10 días</b>
                    </div>
                  </div>
                </div>
                <div className="it" style={{ border: '0', padding: '6px 0' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}
                  >
                    <b style={{ color: 'var(--t)' }}>Segmentación</b>
                    <span style={{ color: 'var(--ok)', fontWeight: '700' }}>Sólido · 85%</span>
                  </div>
                  <div
                    style={{
                      height: '7px',
                      background: '#EEF2FF',
                      borderRadius: '8px',
                      marginTop: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '85%',
                        height: '100%',
                        borderRadius: '8px',
                        background: 'var(--ok)',
                      }}
                    ></div>
                  </div>
                </div>
                <div className="it" style={{ border: '0', padding: '6px 0' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}
                  >
                    <b style={{ color: 'var(--t)' }}>Posicionamiento</b>
                    <span style={{ color: '#4338CA', fontWeight: '700' }}>Reforzar · 55%</span>
                  </div>
                  <div
                    style={{
                      height: '7px',
                      background: '#EEF2FF',
                      borderRadius: '8px',
                      marginTop: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '55%',
                        height: '100%',
                        borderRadius: '8px',
                        background: 'var(--i)',
                      }}
                    ></div>
                  </div>
                </div>
                <div className="it" style={{ border: '0', padding: '6px 0' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}
                  >
                    <b style={{ color: 'var(--t)' }}>Mercado meta</b>
                    <span style={{ color: '#B45309', fontWeight: '700' }}>Flojo · 30%</span>
                  </div>
                  <div
                    style={{
                      height: '7px',
                      background: '#EEF2FF',
                      borderRadius: '8px',
                      marginTop: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '30%',
                        height: '100%',
                        borderRadius: '8px',
                        background: '#D97706',
                      }}
                    ></div>
                  </div>
                </div>
                <div
                  style={{
                    background: '#EEF2FF',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    marginTop: '14px',
                    color: '#4338CA',
                  }}
                >
                  <b>Plan de hoy:</b> 25 minutos en Mercado meta, directo en tus apuntes.
                </div>
              </div>
              <Image
                src="/evi/evi-lupa.svg"
                unoptimized
                alt="Evi con una lupa"
                style={{
                  position: 'absolute',
                  right: '-24px',
                  bottom: '-30px',
                  width: '150px',
                  height: '150px',
                }}
                width={150}
                height={150}
              />
            </div>
          </div>
        </div>
      </div>

      <section id="universidades" className="university-band" aria-label="Universidades">
        <div className="w">
          <p className="university-band-label">Estudiantes de estas universidades ya usan Evaluo</p>
          <HomeUniversityCarousel universities={universityLogos} />
        </div>
      </section>

      <section id="producto" className="sec">
        <div className="w">
          <div style={{ maxWidth: '680px' }}>
            <div className="eb l">La diferencia</div>
            <h2>Un resumen no te dice si estás listo.</h2>
            <p style={{ fontSize: '16px', margin: '18px 0 0' }}>
              Leer lo mismo de forma más corta no cambia lo que sabés. Evaluo mide lo que sabés vos,
              no lo que dice el material.
            </p>
          </div>
          <div className="g2" style={{ marginTop: '40px', alignItems: 'stretch', gap: '24px' }}>
            <div className="card lst" style={{ boxShadow: 'none', background: 'var(--soft)' }}>
              <div className="eb" style={{ color: 'var(--s5)' }}>
                Estudiar con un resumen
              </div>
              <div>
                <i className="x">✕</i>Te cuenta qué dice el material
              </div>
              <div>
                <i className="x">✕</i>Te da la sensación de haber entendido
              </div>
              <div>
                <i className="x">✕</i>No sabés qué te falta
              </div>
              <div>
                <i className="x">✕</i>Estudiás todo por igual
              </div>
            </div>
            <div className="card lst" style={{ borderColor: '#C7D2FE' }}>
              <div className="eb">Estudiar con Evaluo</div>
              <div>
                <i className="ck">✓</i>Mide qué sabés vos, tema por tema
              </div>
              <div>
                <i className="ck">✓</i>Te muestra dónde estás parado
              </div>
              <div>
                <i className="ck">✓</i>Te lleva a tus apuntes cuando fallás
              </div>
              <div>
                <i className="ck">✓</i>Reparte tu tiempo hasta el examen
              </div>
            </div>
          </div>
          <p style={{ fontSize: '14px', margin: '28px 0 0' }}>
            <b style={{ color: 'var(--t)' }}>No te damos la respuesta hecha.</b> La IA te acompaña;
            el que aprende sos vos.
          </p>
        </div>
      </section>

      <section id="demo" className="dk" style={{ padding: '96px 0' }}>
        <div className="w">
          <div id="como-funciona" className="g2" style={{ alignItems: 'start' }}>
            <div>
              <div className="eb l" style={{ color: '#A5B4FC' }}>
                Demo interactiva
              </div>
              <h2>Si te equivocás, volvés a tu material.</h2>
              <p style={{ fontSize: '16px', margin: '20px 0 20px' }}>
                Un error no es un número en rojo: es una pista para saber qué repasar.
              </p>
              <div className="st">
                <em>01</em>
                <b style={{ display: 'inline' }}>Ponete a prueba</b>
                <div style={{ marginLeft: '30px' }}>
                  Respondé una pregunta basada en tus apuntes.
                </div>
              </div>
              <div className="st">
                <em>02</em>
                <b style={{ display: 'inline' }}>Descubrí el error</b>
                <div style={{ marginLeft: '30px' }}>
                  Entendé qué concepto confundiste y por qué.
                </div>
              </div>
              <div className="st">
                <em>03</em>
                <b style={{ display: 'inline' }}>Volvé a tu apunte</b>
                <div style={{ marginLeft: '30px' }}>Repasá el punto exacto, no todo el PDF.</div>
              </div>
              <div className="st">
                <em>04</em>
                <b style={{ display: 'inline' }}>Comprobá</b>
                <div style={{ marginLeft: '30px' }}>
                  Probate de nuevo y mirá cómo sube tu nivel.
                </div>
              </div>
              <HomePdfPickerButton
                className="btn demo-upload"
                location="home_real_material_demo"
                ctaName="subir_mis_apuntes"
              >
                Subir mis apuntes <span aria-hidden="true">→</span>
              </HomePdfPickerButton>
            </div>
            <div className="demo-preview" style={{ position: 'relative', paddingTop: '60px' }}>
              <Image
                src="/evi/evi-pensando.svg"
                unoptimized
                alt="Evi pensando"
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '-40px',
                  width: '150px',
                  zIndex: '2',
                }}
                width={150}
                height={150}
              />
              <HomeRedesignDemo />
            </div>
          </div>
        </div>
      </section>

      <section id="plan-estudio" className="sec">
        <div className="w">
          <div className="g2 study-plan-grid">
            <div>
              <span className="chip" style={{ color: 'var(--v)', marginBottom: '18px' }}>
                ✦ Plan de estudio
              </span>
              <h2>Tu examen tiene fecha. Tu estudio, un plan.</h2>
              <p style={{ fontSize: '16px', margin: '18px 0 26px' }}>
                Cargá cuándo rendís. Evaluo reparte los días que te quedan según lo que más te falta
                y se actualiza cada vez que practicás.
              </p>
              <ol className="study-plan-steps">
                {['Subí tus apuntes', 'Practicá y medí', 'Reforzá lo flojo', 'Volvé a medir'].map(
                  (step, index) => (
                    <li key={step}>
                      <span className="ic" aria-hidden="true">
                        {index + 1}
                      </span>
                      <h3>{step}</h3>
                    </li>
                  )
                )}
              </ol>
              <p style={{ fontSize: '14px', margin: '20px 0 0' }}>
                Para reforzar, Evaluo genera desde tu material resúmenes, glosario, mapas mentales y
                flashcards.
              </p>
            </div>
            <div
              className="card study-plan-card"
              role="group"
              aria-label="Vista previa de un plan de estudio"
            >
              <div className="eb" style={{ marginBottom: '4px' }}>
                Hasta tu examen · lun 26 oct
              </div>
              <h3 style={{ fontSize: '20px', letterSpacing: '-.03em', marginBottom: '10px' }}>
                Qué estudiar cada día
              </h3>
              <div className="day">
                <b>Hoy</b>
                <span>Mercado meta · 25 min · en tus apuntes</span>
              </div>
              <div className="day">
                <b>Sáb 17</b>
                <span>Posicionamiento · 20 min · practicar</span>
              </div>
              <div className="day">
                <b>Mar 20</b>
                <span>Volver a medir los tres temas</span>
              </div>
              <div className="day">
                <b>Vie 23</b>
                <span>Simulacro corto de todo el parcial</span>
              </div>
              <div className="day">
                <b>Dom 25</b>
                <span>Repaso final de lo que quedó flojo</span>
              </div>
              <div className="study-plan-footer">
                <Image
                  src="/evi/evi-estudiando.svg"
                  unoptimized
                  alt="Evi estudiando"
                  width={80}
                  height={80}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingBottom: '48px' }}>
        <div className="w">
          <div className="eb l">Lo que cuentan</div>
          <h2 style={{ fontSize: '36px', maxWidth: '640px' }}>
            Estudiantes que ya saben dónde están parados.
          </h2>
          <div className="cells">
            <div>
              <p style={{ fontSize: '14px', margin: '0 0 12px' }}>
                “Antes estudiaba releyendo todo el apunte y no sabía si realmente estaba preparado. Con Evaluo pude practicar a partir de mi PDF y ver qué temas necesitaba repasar. Me sirvió para organizar mejor el estudio antes del parcial.”
              </p>
              <b style={{ fontSize: '13px', color: 'var(--t)' }}>
                Estudiante de Derecho · Universidad de Buenos Aires
              </b>
            </div>
            <div>
              <p style={{ fontSize: '14px', margin: '0 0 12px' }}>
                “Practiqué sobre mis apuntes y aproveché mejor el tiempo de repaso.”
              </p>
              <b style={{ fontSize: '13px', color: 'var(--t)' }}>
                Estudiante de Psicología · Universidad Nacional de Tres de Febrero
              </b>
            </div>
            <div>
              <p style={{ fontSize: '14px', margin: '0 0 12px' }}>
                “Con el progreso por tema supe qué volver a estudiar, en vez de releer todo.”
              </p>
              <b style={{ fontSize: '13px', color: 'var(--t)' }}>
                Estudiante de Marketing · Universidad Siglo 21
    <span style={{ display: 'block', marginTop: '8px', fontSize: '11px', color: 'var(--s5)' }}>
      Testimonio de ejemplo
    </span>
              </b>
            </div>
          </div>
        </div>
      </section>

      <section id="planes" className="sec home-pricing" style={{ paddingTop: '48px' }}>
        <div className="w">
          <div className="eb l">Planes</div>
          <h2 style={{ fontSize: '36px', maxWidth: '640px' }}>
            Empezá gratis. Sumá Premium cuando necesites más.
          </h2>
          <div
            className="g2 home-plans"
            style={{ marginTop: '36px', alignItems: 'stretch', gap: '24px' }}
          >
            <div className="card home-plan" style={{ boxShadow: 'none' }}>
              <h3 style={{ fontSize: '22px' }}>Gratis</h3>
              <p style={{ fontSize: '14px' }}>
                Empezá a estudiar con tus propios apuntes, sin tarjeta.
              </p>
              <p style={{ color: 'var(--t)', fontWeight: '700' }}>$0 · sin tarjeta</p>
              <ul className="home-plan-features">
                <li>Hasta 2 PDFs cada 15 días</li>
                <li>Hasta 100 páginas y 20 MB por archivo</li>
                <li>Resumen, glosario, flashcards y práctica básica</li>
              </ul>
              <TrackedLink
                className="btn home-plan-action"
                href={primaryHref}
                eventName="cta_click"
                payload={{
                  location: 'home_free_plan',
                  cta_name: 'empeza_gratis',
                  destination: primaryHref,
                }}
              >
                Empezá gratis
              </TrackedLink>
            </div>
            <div className="card home-plan" style={{ borderColor: '#C7D2FE' }}>
              <h3 style={{ fontSize: '22px' }}>Premium</h3>
              <p style={{ fontSize: '14px' }}>
                Más material y herramientas para trabajar lo que te cuesta.
              </p>
              <p style={{ color: 'var(--t)', fontWeight: '700' }}>Mensual o por 6 meses</p>
              <ul className="home-plan-features">
                <li>Hasta 3 PDFs por día, sin límite de páginas</li>
                <li>Simuladores completos y más explicaciones</li>
                <li>Práctica personalizada según tus errores</li>
              </ul>
              <TrackedLink
                className="btn g home-plan-action"
                href="/pricing?source=home_planes#elegir-plan"
                eventName="cta_click"
                payload={{
                  location: 'home_premium_plan',
                  cta_name: 'ver_precios_premium',
                  destination: '/pricing?source=home_planes#elegir-plan',
                }}
              >
                Ver precios de Premium <span aria-hidden="true">→</span>
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="sec" style={{ paddingBottom: '72px' }}>
        <div className="w" style={{ maxWidth: '760px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px' }}>Preguntas frecuentes</h2>
          <p style={{ fontSize: '15px', margin: '12px 0 28px' }}>
            Cómo empezar, practicar con tu PDF y saber qué reforzar.
          </p>
          {HOME_REDESIGN_FAQS.map((item) => (
            <details className="faq" key={item.question}>
              <summary>
                <span>{item.question}</span>
                <span aria-hidden="true">⌄</span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="w" style={{ paddingBottom: '72px' }}>
        <div
          style={{
            background: 'linear-gradient(#050B2C,#0F1B3D)',
            borderRadius: '28px',
            padding: '56px 24px',
            textAlign: 'center',
          }}
        >
          <Image
            src="/evi/evi-festejando.svg"
            unoptimized
            alt="Evi festejando"
            style={{ width: '130px', marginInline: 'auto' }}
            width={150}
            height={150}
          />
          <div className="eb" style={{ justifyContent: 'center', color: '#A5B4FC' }}>
            Comenzá hoy mismo
          </div>
          <h2 style={{ color: '#fff', maxWidth: '660px', margin: '0 auto', fontSize: '42px' }}>
            Llegá a tu examen sabiendo dónde estás parado.
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '16px', margin: '18px 0 28px' }}>
            Subí tus apuntes y descubrí qué te falta antes del examen.
          </p>
          <HomePdfPickerButton
            className="btn g"
            location="home_final_cta"
            ctaName="subir_mis_apuntes"
          >
            Subir mis apuntes <span aria-hidden="true">→</span>
          </HomePdfPickerButton>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '14px' }}>
            Empezá gratis · Sin tarjeta · Pagás en pesos con Mercado Pago
          </div>
          <div style={{ fontSize: '13px', color: '#A5B4FC', marginTop: '18px' }}>
            Nuestra meta: ayudar a aprobar 10.000 exámenes.
          </div>
        </div>
      </div>
    </div>
  );
}
