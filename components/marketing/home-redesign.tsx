import Image from 'next/image';
import { HomePdfPickerButton } from './home-pdf-picker-button';
import { HomeRedesignDemo } from './home-redesign-demo';
import { HOME_REDESIGN_FAQS, HOME_REDESIGN_FAQS_EN } from './home-redesign-faqs';
import { TrackedLink } from './tracked-link';
import { HomeUniversityCarousel } from './home-university-carousel';
import { LandingLanguageSelector } from './landing-language-selector';
import type { AppLocale } from '@/lib/i18n/app-locale';
import { HOME_ENGLISH_TEXT } from '@/lib/i18n/home-copy';

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

export function HomeRedesign({ primaryHref, locale = 'es' }: { primaryHref: string; locale?: AppLocale }) {
  const english = locale === 'en';
  const t = (text: string) => english ? HOME_ENGLISH_TEXT[text] ?? text : text;
  const premiumHref = english ? '/en/login?mode=signup&intent=premium' : '/pricing?source=home_planes#elegir-plan';
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
            <a className="logo" href={english ? "/en" : "/"} aria-label={t("Evaluo, inicio")}>
              <Image src="/evaluo-logo-icono.svg" alt="" width={32} height={32} unoptimized />
              Evaluo
            </a>
            <nav className="pill" aria-label="Navegación principal">
              <a href="#como-funciona">{t("Cómo funciona")}</a>
              <a href="#plan-estudio">{t("Plan de estudio")}</a>
              <a href="#planes">{t("Planes")}</a>
            </nav>
            <div className="nav-auth flex items-center gap-2 sm:gap-3">
              <LandingLanguageSelector locale={locale} />
              <a
                className="btn"
                href={english ? "/en/login?mode=login" : "/login?mode=login"}
                style={{ border: '0', background: 'none' }}
              >
                <span className="sm:hidden">{t("Entrar")}</span>
                <span className="hidden sm:inline">{t("Iniciar sesión")}</span>
              </a>{' '}
              <a className="btn g" href={primaryHref}>
                {t("Crear cuenta gratis →")}
              </a>
            </div>
          </div>
          <div className="g2 hero-grid" style={{ padding: '56px 0 96px' }}>
            <div>
              <span
                className="chip hero-eyebrow"
                style={{ color: 'var(--v)', marginBottom: '22px' }}
              >
                {t("✦ Preparación para exámenes")}
              </span>
              <h1>{t("Sabé qué tan preparado estás para tu examen.")}</h1>
              <p style={{ fontSize: '17px', margin: '22px 0 30px', maxWidth: '500px' }}>
                {t("Subí tus apuntes y practicá sobre ellos. Evaluo mide qué dominás, qué te cuesta y cómo usar los días que te quedan.")}
              </p>
              <div className="hero-actions">
                <HomePdfPickerButton locale={locale}
                  className="btn g"
                  location="home_hero"
                  ctaName="subir_mis_apuntes"
                >
                  {t("Subir mis apuntes")} <span aria-hidden="true">→</span>
                </HomePdfPickerButton>
                <a className="btn" href="#demo">
                  {t("▶ Ver cómo funciona")}
                </a>
              </div>
              <div style={{ fontSize: '12px', margin: '14px 0 22px', color: 'var(--s5)' }}>
                {t("Empezá gratis · Sin tarjeta")}
              </div>
              <div
                className="hero-benefits"
                style={{ fontSize: '12px', display: 'flex', gap: '18px', flexWrap: 'wrap' }}
              >
                <span>
                  <i className="ck">✓</i>{t("Con tus propios apuntes")}
                </span>
                <span>
                  <i className="ck">✓</i>{t("Tema por tema")}
                </span>
                <span>
                  <i className="ck">✓</i>{t("Hasta tu fecha de examen")}
                </span>
              </div>
            </div>
            <div className="hero-preview" style={{ position: 'relative', paddingBottom: '40px' }}>
              <div
                className="card"
                style={{ borderTop: '3px solid var(--i)', padding: '22px 24px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <b style={{ color: 'var(--t)' }}>{t("Marketing I · Parcial 1")}</b>
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
                      {t("Nivel de preparación")}
                    </div>
                    <h2 style={{ fontSize: '20px', letterSpacing: '-.03em' }}>
                      {t("Vas bien, pero todavía no estás listo.")}
                    </h2>
                    <div style={{ fontSize: '12px', marginTop: '6px' }}>
                      {t("Examen: lun 26 oct ·")} <b style={{ color: 'var(--t)' }}>{t("quedan 10 días")}</b>
                    </div>
                  </div>
                </div>
                <div className="it" style={{ border: '0', padding: '6px 0' }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}
                  >
                    <b style={{ color: 'var(--t)' }}>{t("Segmentación")}</b>
                    <span style={{ color: 'var(--ok)', fontWeight: '700' }}>{t("Sólido · 85%")}</span>
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
                    <b style={{ color: 'var(--t)' }}>{t("Posicionamiento")}</b>
                    <span style={{ color: '#4338CA', fontWeight: '700' }}>{t("Reforzar · 55%")}</span>
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
                    <b style={{ color: 'var(--t)' }}>{t("Mercado meta")}</b>
                    <span style={{ color: '#B45309', fontWeight: '700' }}>{t("Flojo · 30%")}</span>
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
                  <b>{t("Plan de hoy:")}</b> {t("25 minutos en Mercado meta, directo en tus apuntes.")}
                </div>
              </div>
              <Image
                src="/evi/evi-lupa.svg"
                unoptimized
                alt={t("Evi con una lupa")}
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

      <section id="universidades" className="university-band" aria-label={t("Universidades")}>
        <div className="w">
          <p className="university-band-label">{t("Universidades disponibles para organizar tu estudio")}</p>
          <HomeUniversityCarousel universities={universityLogos} />
        </div>
      </section>

      <section aria-labelledby="herramientas-pdf" className="sec" style={{ padding: '48px 0' }}>
        <div className="w">
          <div className="eb l">{t("Herramientas para estudiar")}</div>
          <h2 id="herramientas-pdf" style={{ fontSize: 'clamp(26px, 4vw, 38px)', maxWidth: '760px' }}>
            {t("¿Qué necesitás hacer con tus apuntes?")}
          </h2>
          <p style={{ fontSize: '15px', maxWidth: '720px', margin: '14px 0 28px' }}>
            {t("Elegí una función para empezar con tu propio PDF: resumir, entender, conectar ideas o preparar un examen con inteligencia artificial.")}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {(english ? [
              { href: '/en/pdf-to-quiz', title: 'PDF to quiz', detail: 'Turn notes into practice questions with AI.' },
              { href: '/en/pdf-to-flashcards', title: 'PDF to flashcards', detail: 'Review concepts with active recall.' },
              { href: '/en/study-pdf-with-ai', title: 'Study a PDF with AI', detail: 'Create summaries and practice topic by topic.' },
              { href: '/en/ai-true-false-questions', title: 'AI true/false questions', detail: 'Test your understanding with focused questions.' },
            ] : [
              { href: '/funciones/resumir-pdf-con-ia', title: t('Resumir PDF con IA'), detail: t('Identificá las ideas y los conceptos importantes.') },
              { href: '/estudiar-pdf-con-ia', title: t('Estudiar un PDF con IA'), detail: t('Uní resumen, flashcards y ejercicios; mapas mentales en Premium.') },
              { href: '/funciones/crear-mapa-mental-desde-pdf', title: t('Crear mapa mental desde PDF'), detail: t('Visualizá las relaciones entre temas y subtemas.') },
              { href: '/ia-para-estudiantes', title: t('IA para estudiantes'), detail: t('Elegí cómo usar IA para preparar parciales y finales.') },
            ]).map((item) => (
              <a key={item.href} href={item.href} className="card" style={{ display: 'block', padding: '22px', textDecoration: 'none' }}>
                <h3 style={{ fontSize: '17px', margin: 0, color: 'var(--t)' }}>{item.title} →</h3>
                <p style={{ fontSize: '13px', margin: '10px 0 0', lineHeight: 1.6 }}>{item.detail}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="producto" className="sec">
        <div className="w">
          <div style={{ maxWidth: '680px' }}>
            <div className="eb l">{t("La diferencia")}</div>
            <h2>{t("Un resumen no te dice si estás listo.")}</h2>
            <p style={{ fontSize: '16px', margin: '18px 0 0' }}>
              {t("Leer lo mismo de forma más corta no cambia lo que sabés. Evaluo mide lo que sabés vos, no lo que dice el material.")}
            </p>
          </div>
          <div className="g2" style={{ marginTop: '40px', alignItems: 'stretch', gap: '24px' }}>
            <div className="card lst" style={{ boxShadow: 'none', background: 'var(--soft)' }}>
              <div className="eb" style={{ color: 'var(--s5)' }}>
                {t("Estudiar con un resumen")}
              </div>
              <div>
                <i className="x">✕</i>{t("Te cuenta qué dice el material")}
              </div>
              <div>
                <i className="x">✕</i>{t("Te da la sensación de haber entendido")}
              </div>
              <div>
                <i className="x">✕</i>{t("No sabés qué te falta")}
              </div>
              <div>
                <i className="x">✕</i>{t("Estudiás todo por igual")}
              </div>
            </div>
            <div className="card lst" style={{ borderColor: '#C7D2FE' }}>
              <div className="eb">{t("Estudiar con Evaluo")}</div>
              <div>
                <i className="ck">✓</i>{t("Mide qué sabés vos, tema por tema")}
              </div>
              <div>
                <i className="ck">✓</i>{t("Te muestra dónde estás parado")}
              </div>
              <div>
                <i className="ck">✓</i>{t("Te lleva a tus apuntes cuando fallás")}
              </div>
              <div>
                <i className="ck">✓</i>{t("Reparte tu tiempo hasta el examen")}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '14px', margin: '28px 0 0' }}>
            <b style={{ color: 'var(--t)' }}>{t("No te damos la respuesta hecha.")}</b> {t("La IA te acompaña; el que aprende sos vos.")}
          </p>
        </div>
      </section>

      <section id="demo" className="dk" style={{ padding: '96px 0' }}>
        <div className="w">
          <div id="como-funciona" className="g2" style={{ alignItems: 'start' }}>
            <div>
              <div className="eb l" style={{ color: '#A5B4FC' }}>
                {t("Demo interactiva")}
              </div>
              <h2>{t("Si te equivocás, volvés a tu material.")}</h2>
              <p style={{ fontSize: '16px', margin: '20px 0 20px' }}>
                {t("Un error no es un número en rojo: es una pista para saber qué repasar.")}
              </p>
              <div className="st">
                <em>01</em>
                <b style={{ display: 'inline' }}>{t("Ponete a prueba")}</b>
                <div style={{ marginLeft: '30px' }}>
                  {t("Respondé una pregunta basada en tus apuntes.")}
                </div>
              </div>
              <div className="st">
                <em>02</em>
                <b style={{ display: 'inline' }}>{t("Descubrí el error")}</b>
                <div style={{ marginLeft: '30px' }}>
                  {t("Entendé qué concepto confundiste y por qué.")}
                </div>
              </div>
              <div className="st">
                <em>03</em>
                <b style={{ display: 'inline' }}>{t("Volvé a tu apunte")}</b>
                <div style={{ marginLeft: '30px' }}>{t("Repasá el punto exacto, no todo el PDF.")}</div>
              </div>
              <div className="st">
                <em>04</em>
                <b style={{ display: 'inline' }}>{t("Comprobá")}</b>
                <div style={{ marginLeft: '30px' }}>
                  {t("Probate de nuevo y mirá cómo sube tu nivel.")}
                </div>
              </div>
              <HomePdfPickerButton locale={locale}
                className="btn demo-upload"
                location="home_real_material_demo"
                ctaName="subir_mis_apuntes"
              >
                {t("Subir mis apuntes")} <span aria-hidden="true">→</span>
              </HomePdfPickerButton>
            </div>
            <div className="demo-preview" style={{ position: 'relative', paddingTop: '60px' }}>
              <Image
                src="/evi/evi-pensando.svg"
                unoptimized
                alt={t("Evi pensando")}
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
              <HomeRedesignDemo locale={locale} />
            </div>
          </div>
        </div>
      </section>

      <section id="plan-estudio" className="sec">
        <div className="w">
          <div className="g2 study-plan-grid">
            <div>
              <span className="chip" style={{ color: 'var(--v)', marginBottom: '18px' }}>
                {t("✦ Plan de estudio")}
              </span>
              <h2>{t("Tu examen tiene fecha. Tu estudio, un plan.")}</h2>
              <p style={{ fontSize: '16px', margin: '18px 0 26px' }}>
                {t("Cargá cuándo rendís. Evaluo reparte los días que te quedan según lo que más te falta y se actualiza cada vez que practicás.")}
              </p>
              <ol className="study-plan-steps">
                {[t("Subí tus apuntes"), t("Practicá y medí"), t("Reforzá lo flojo"), t("Volvé a medir")].map(
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
                {t("Para reforzar, Evaluo genera desde tu material resúmenes, glosario y flashcards; también ofrece mapas mentales en Premium.")}
              </p>
            </div>
            <div
              className="card study-plan-card"
              role="group"
              aria-label={t("Vista previa de un plan de estudio")}
            >
              <div className="eb" style={{ marginBottom: '4px' }}>
                {t("Hasta tu examen · lun 26 oct")}
              </div>
              <h3 style={{ fontSize: '20px', letterSpacing: '-.03em', marginBottom: '10px' }}>
                {t("Qué estudiar cada día")}
              </h3>
              <div className="day">
                <b>{t("Hoy")}</b>
                <span>{t("Mercado meta · 25 min · en tus apuntes")}</span>
              </div>
              <div className="day">
                <b>{t("Sáb 17")}</b>
                <span>{t("Posicionamiento · 20 min · practicar")}</span>
              </div>
              <div className="day">
                <b>{t("Mar 20")}</b>
                <span>{t("Volver a medir los tres temas")}</span>
              </div>
              <div className="day">
                <b>{t("Vie 23")}</b>
                <span>{t("Simulacro corto de todo el parcial")}</span>
              </div>
              <div className="day">
                <b>{t("Dom 25")}</b>
                <span>{t("Repaso final de lo que quedó flojo")}</span>
              </div>
              <div className="study-plan-footer">
                <Image
                  src="/evi/evi-estudiando.svg"
                  unoptimized
                  alt={t("Evi estudiando")}
                  width={80}
                  height={80}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="planes" className="sec home-pricing" style={{ paddingTop: '48px' }}>
        <div className="w">
          <div className="eb l">{t("Planes")}</div>
          <h2 style={{ fontSize: '36px', maxWidth: '640px' }}>
            {t("Empezá gratis. Sumá Premium cuando necesites más.")}
          </h2>
          <div
            className="g2 home-plans"
            style={{ marginTop: '36px', alignItems: 'stretch', gap: '24px' }}
          >
            <div className="card home-plan" style={{ boxShadow: 'none' }}>
              <h3 style={{ fontSize: '22px' }}>{t("Gratis")}</h3>
              <p style={{ fontSize: '14px' }}>
                {t("Empezá a estudiar con tus propios apuntes, sin tarjeta.")}
              </p>
              <p style={{ color: 'var(--t)', fontWeight: '700' }}>{t("$0 · sin tarjeta")}</p>
              <ul className="home-plan-features">
                <li>{t("1 material PDF o Word gratis de por vida")}</li>
                <li>{t("Hasta 100 páginas y 20 MB por archivo")}</li>
                <li>{t("Resumen, glosario, flashcards y práctica básica")}</li>
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
                {t("Empezá gratis")}
              </TrackedLink>
            </div>
            <div className="card home-plan" style={{ borderColor: '#C7D2FE' }}>
              <h3 style={{ fontSize: '22px' }}>Premium</h3>
              <p style={{ fontSize: '14px' }}>
                {t("Más material y herramientas para trabajar lo que te cuesta.")}
              </p>
              <p style={{ color: 'var(--t)', fontWeight: '700' }}>{t("Mensual o por 6 meses")}</p>
              <ul className="home-plan-features">
                <li>{t("Hasta 3 materiales PDF o Word por día")}</li>
                <li>{t("Simuladores completos y más explicaciones")}</li>
                <li>{t("Práctica personalizada según tus errores")}</li>
              </ul>
              <TrackedLink
                className="btn g home-plan-action"
                href={premiumHref}
                eventName="cta_click"
                payload={{
                  location: 'home_premium_plan',
                  cta_name: 'ver_precios_premium',
                  destination: premiumHref,
                }}
              >
                {t("Ver precios de Premium")} <span aria-hidden="true">→</span>
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="sec" style={{ paddingBottom: '72px' }}>
        <div className="w" style={{ maxWidth: '760px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '36px' }}>{t("Preguntas frecuentes")}</h2>
          <p style={{ fontSize: '15px', margin: '12px 0 28px' }}>
            {t("Cómo empezar, practicar con tu PDF y saber qué reforzar.")}
          </p>
          {(english ? HOME_REDESIGN_FAQS_EN : HOME_REDESIGN_FAQS).map((item) => (
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
            alt={t("Evi festejando")}
            style={{ width: '130px', marginInline: 'auto' }}
            width={150}
            height={150}
          />
          <div className="eb" style={{ justifyContent: 'center', color: '#A5B4FC' }}>
            {t("Comenzá hoy mismo")}
          </div>
          <h2 style={{ color: '#fff', maxWidth: '660px', margin: '0 auto', fontSize: '42px' }}>
            {t("Llegá a tu examen sabiendo dónde estás parado.")}
          </h2>
          <p style={{ color: '#CBD5E1', fontSize: '16px', margin: '18px 0 28px' }}>
            {t("Subí tus apuntes y descubrí qué te falta antes del examen.")}
          </p>
          <HomePdfPickerButton locale={locale}
            className="btn g"
            location="home_final_cta"
            ctaName="subir_mis_apuntes"
          >
            {t("Subir mis apuntes")} <span aria-hidden="true">→</span>
          </HomePdfPickerButton>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '14px' }}>
            {t("Empezá gratis · Sin tarjeta · Pagás en pesos con Mercado Pago")}
          </div>
          <div style={{ fontSize: '13px', color: '#A5B4FC', marginTop: '18px' }}>
            {t("Nuestra meta: ayudar a aprobar 10.000 exámenes.")}
          </div>
        </div>
      </div>
    </div>
  );
}
