import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const BRAND = '#2563eb';
const BRAND2 = '#6366f1';
const INK = '#111827';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const STAGE = '#17191c';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const rr = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, clamp);

type Feature = 'summary' | 'glossary' | 'cards' | 'exam';

const meta: Record<Feature, {label: string; subtitle: string}> = {
  summary: {label: 'RESUMEN', subtitle: 'Entendé lo importante'},
  glossary: {label: 'GLOSARIO', subtitle: 'Dominá los conceptos'},
  cards: {label: 'FLASHCARDS', subtitle: 'Recordá activamente'},
  exam: {label: 'EXAMEN', subtitle: 'Comprobá lo que sabés'},
};

const featureStarts: Record<Feature, number> = {
  summary: 0,
  glossary: 140,
  cards: 280,
  exam: 420,
};

const FeatureIcon: React.FC<{feature: Feature; size?: number}> = ({feature, size = 28}) => {
  const s = size;
  if (feature === 'summary') {
    return (
      <div style={{width: s, height: s, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4}}>
        {[1, 0.72, 0.88].map((w, i) => (
          <div key={i} style={{width: `${w * 100}%`, height: 3, borderRadius: 99, background: BRAND}} />
        ))}
      </div>
    );
  }
  if (feature === 'glossary') {
    return (
      <div style={{width: s, height: s, position: 'relative'}}>
        <div style={{position: 'absolute', left: 2, top: 3, width: s * 0.38, height: s * 0.72, border: `3px solid ${BRAND}`, borderRadius: 5}} />
        <div style={{position: 'absolute', right: 2, top: 3, width: s * 0.38, height: s * 0.72, border: `3px solid ${BRAND}`, borderRadius: 5}} />
      </div>
    );
  }
  if (feature === 'cards') {
    return (
      <div style={{width: s, height: s, position: 'relative'}}>
        <div style={{position: 'absolute', left: 1, top: 7, width: s * 0.7, height: s * 0.52, border: `3px solid ${BRAND}`, borderRadius: 5, transform: 'rotate(-8deg)'}} />
        <div style={{position: 'absolute', right: 1, top: 2, width: s * 0.7, height: s * 0.52, border: `3px solid ${BRAND}`, borderRadius: 5, background: '#fff'}} />
      </div>
    );
  }
  return (
    <div style={{width: s, height: s, borderRadius: 999, border: `3px solid ${BRAND}`, position: 'relative'}}>
      <div style={{position: 'absolute', width: s * 0.38, height: s * 0.2, borderLeft: `3px solid ${BRAND}`, borderBottom: `3px solid ${BRAND}`, transform: 'rotate(-45deg)', left: s * 0.28, top: s * 0.28}} />
    </div>
  );
};

const Mouse: React.FC<{x: number; y: number; click?: number}> = ({x, y, click = 0}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      zIndex: 300,
      transform: `scale(${1 - click * 0.1})`,
      transformOrigin: '0 0',
      filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.32))',
    }}
  >
    <div style={{width: 0, height: 0, borderTop: '32px solid #fff', borderRight: '19px solid transparent', transform: 'rotate(-28deg)'}} />
    <div style={{position: 'absolute', left: 3, top: 2, width: 0, height: 0, borderTop: '25px solid #15171a', borderRight: '14px solid transparent', transform: 'rotate(-28deg)'}} />
    {click > 0 ? (
      <div
        style={{
          position: 'absolute',
          left: -15 - click * 12,
          top: -15 - click * 12,
          width: 42 + click * 24,
          height: 42 + click * 24,
          borderRadius: 999,
          border: `3px solid rgba(96,165,250,${0.72 - click * 0.52})`,
        }}
      />
    ) : null}
  </div>
);

const Brand: React.FC = () => (
  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
    <Img src={staticFile('icon.png')} style={{width: 27, height: 27, objectFit: 'contain'}} />
    <div style={{fontSize: 19, fontWeight: 900, color: INK, letterSpacing: '-0.045em'}}>Evaluo</div>
  </div>
);

const Nav: React.FC<{active: Feature}> = ({active}) => {
  const items: Array<{key: Feature; label: string}> = [
    {key: 'summary', label: 'Resumen'},
    {key: 'glossary', label: 'Glosario'},
    {key: 'cards', label: 'Flashcards'},
    {key: 'exam', label: 'Examen'},
  ];

  return (
    <div style={{width: 152, padding: '18px 14px', background: '#fbfcfe', borderRight: `1px solid ${LINE}`}}>
      <Brand />
      <div style={{marginTop: 24, fontSize: 9, color: '#94a3b8', fontWeight: 900, letterSpacing: '.14em'}}>ESTUDIO</div>
      <div style={{marginTop: 9}}>
        {items.map((item) => {
          const on = item.key === active;
          return (
            <div
              key={item.key}
              style={{
                height: 41,
                padding: '0 10px',
                borderRadius: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                marginBottom: 5,
                background: on ? '#eff6ff' : 'transparent',
                border: on ? '1px solid #dbeafe' : '1px solid transparent',
                color: on ? BRAND : '#64748b',
                fontSize: 11,
                fontWeight: on ? 900 : 750,
              }}
            >
              <FeatureIcon feature={item.key} size={16} />
              {item.label}
            </div>
          );
        })}
      </div>
      <div style={{marginTop: 22, height: 1, background: LINE}} />
      <div style={{marginTop: 14, fontSize: 9, color: '#94a3b8', fontWeight: 900, letterSpacing: '.13em'}}>MATERIAL</div>
      <div style={{marginTop: 10, padding: 10, borderRadius: 11, border: `1px solid ${LINE}`, background: '#fff'}}>
        <div style={{fontSize: 9, fontWeight: 900, color: INK}}>Marketing I.pdf</div>
        <div style={{fontSize: 8, color: MUTED, marginTop: 3}}>Procesado · listo</div>
      </div>
    </div>
  );
};

const Header: React.FC<{active: Feature}> = ({active}) => (
  <div style={{height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', borderBottom: `1px solid ${LINE}`, background: '#fff'}}>
    <div>
      <div style={{fontSize: 9, color: '#94a3b8', fontWeight: 800}}>Marketing I</div>
      <div style={{fontSize: 12, color: INK, fontWeight: 900, marginTop: 2}}>{meta[active].label[0] + meta[active].label.slice(1).toLowerCase()}</div>
    </div>
    <div style={{display: 'flex', gap: 7}}>
      <div style={{padding: '6px 9px', borderRadius: 9, background: '#f8fafc', border: `1px solid ${LINE}`, fontSize: 8, color: MUTED}}>PDF</div>
      <div style={{padding: '6px 10px', borderRadius: 9, background: INK, color: '#fff', fontSize: 8, fontWeight: 850}}>Estudiar</div>
    </div>
  </div>
);

const SummaryView: React.FC = () => (
  <div style={{padding: '22px 27px'}}>
    <div style={{fontSize: 9, color: BRAND, fontWeight: 900, letterSpacing: '.12em'}}>RESUMEN</div>
    <div style={{fontSize: 21, fontWeight: 950, color: INK, marginTop: 6}}>Qué tenés que saber para el parcial</div>
    <div style={{marginTop: 16, padding: 15, borderRadius: 13, background: '#f8faff', border: '1px solid #dbeafe', fontSize: 11, lineHeight: 1.45, color: '#475569'}}>
      Evaluo ordena el PDF y convierte el contenido en una guía clara para empezar a estudiar.
    </div>
    <div style={{marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9}}>
      {[
        ['Segmentación', 'Agrupá públicos con necesidades similares.'],
        ['Posicionamiento', 'Definí el lugar que querés ocupar.'],
        ['Propuesta de valor', 'Explicá por qué elegir tu oferta.'],
        ['Público objetivo', 'Identificá a quién le hablás.'],
      ].map(([title, body], i) => (
        <div key={title} style={{minHeight: 78, borderRadius: 12, border: `1px solid ${LINE}`, padding: 12, background: '#fff'}}>
          <div style={{width: 22, height: 22, borderRadius: 7, background: i === 0 ? BRAND : '#eff6ff', color: i === 0 ? '#fff' : BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900}}>{i + 1}</div>
          <div style={{fontSize: 10, fontWeight: 900, color: INK, marginTop: 8}}>{title}</div>
          <div style={{fontSize: 8, lineHeight: 1.4, color: MUTED, marginTop: 3}}>{body}</div>
        </div>
      ))}
    </div>
  </div>
);

const GlossaryView: React.FC = () => (
  <div style={{padding: '22px 27px'}}>
    <div style={{fontSize: 9, color: BRAND, fontWeight: 900, letterSpacing: '.12em'}}>GLOSARIO</div>
    <div style={{fontSize: 21, fontWeight: 950, color: INK, marginTop: 6}}>Conceptos del mismo material</div>
    <div style={{marginTop: 17, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
      {[
        ['Segmentación', 'Agrupar consumidores según características o necesidades comunes.'],
        ['Posicionamiento', 'Lugar que una marca busca ocupar en la mente del público.'],
        ['Propuesta de valor', 'Beneficio diferencial que justifica elegir una oferta.'],
        ['Público objetivo', 'Grupo específico al que se dirige una estrategia.'],
      ].map(([term, def]) => (
        <div key={term} style={{minHeight: 105, borderRadius: 13, border: `1px solid ${LINE}`, padding: 13, background: '#fff'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <div style={{width: 26, height: 26, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><FeatureIcon feature="glossary" size={14} /></div>
            <div style={{fontSize: 11, fontWeight: 900, color: INK}}>{term}</div>
          </div>
          <div style={{fontSize: 8.5, lineHeight: 1.45, color: MUTED, marginTop: 9}}>{def}</div>
        </div>
      ))}
    </div>
  </div>
);

const FlashcardsView: React.FC<{local: number}> = ({local}) => {
  const flip = rr(local, [70, 100], [0, 180]);
  const face: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 18,
    backfaceVisibility: 'hidden',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };

  return (
    <div style={{padding: '22px 27px'}}>
      <div style={{fontSize: 9, color: BRAND, fontWeight: 900, letterSpacing: '.12em'}}>FLASHCARDS</div>
      <div style={{fontSize: 21, fontWeight: 950, color: INK, marginTop: 6}}>Pasá de leer a recordar</div>
      <div style={{height: 265, marginTop: 18, perspective: 1200, position: 'relative'}}>
        <div style={{position: 'absolute', inset: '0 45px', transformStyle: 'preserve-3d', transform: `rotateY(${flip}deg)`}}>
          <div style={{...face, background: '#fff', border: '1px solid #cfe0ff', boxShadow: '0 15px 34px rgba(37,99,235,.10)'}}>
            <div style={{fontSize: 9, color: BRAND, fontWeight: 900, letterSpacing: '.12em'}}>PREGUNTA</div>
            <div style={{fontSize: 21, lineHeight: 1.18, color: INK, fontWeight: 950}}>¿Qué diferencia hay entre segmentación y posicionamiento?</div>
            <div style={{fontSize: 9, color: MUTED}}>Click para revelar</div>
          </div>
          <div style={{...face, transform: 'rotateY(180deg)', background: `linear-gradient(145deg,${BRAND},${BRAND2})`, color: '#fff', boxShadow: '0 17px 38px rgba(37,99,235,.22)'}}>
            <div style={{fontSize: 9, fontWeight: 900, opacity: .76, letterSpacing: '.12em'}}>RESPUESTA</div>
            <div style={{fontSize: 17, lineHeight: 1.32, fontWeight: 850}}>La segmentación define grupos de público; el posicionamiento define el lugar que la marca quiere ocupar frente a ellos.</div>
            <div style={{fontSize: 9, opacity: .78}}>Generada desde el mismo PDF</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExamView: React.FC<{local: number}> = ({local}) => {
  const selected = local >= 88;
  return (
    <div style={{padding: '22px 27px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <div>
          <div style={{fontSize: 9, color: BRAND, fontWeight: 900, letterSpacing: '.12em'}}>EXAMEN</div>
          <div style={{fontSize: 21, fontWeight: 950, color: INK, marginTop: 6}}>Comprobá si realmente lo entendiste</div>
        </div>
        <div style={{fontSize: 9, color: MUTED}}>1 de 5</div>
      </div>
      <div style={{marginTop: 16, padding: 14, borderRadius: 12, border: `1px solid ${LINE}`, background: '#f8fafc', fontSize: 13, fontWeight: 900, color: INK}}>¿Cuál describe mejor una propuesta de valor?</div>
      {[
        'Una lista de segmentos de mercado',
        'El beneficio diferencial por el que elegir una oferta',
        'El precio promedio del mercado',
      ].map((option, i) => {
        const correct = i === 1;
        const on = selected && correct;
        return (
          <div key={option} style={{marginTop: 8, minHeight: 43, borderRadius: 11, border: `2px solid ${on ? '#86efac' : LINE}`, background: on ? '#f0fdf4' : '#fff', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 11px'}}>
            <div style={{width: 19, height: 19, borderRadius: 999, border: `2px solid ${on ? '#22c55e' : '#cbd5e1'}`, background: on ? '#22c55e' : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900}}>{on ? '✓' : ''}</div>
            <div style={{fontSize: 10, fontWeight: 750, color: INK}}>{option}</div>
          </div>
        );
      })}
      <div style={{opacity: selected ? 1 : 0, marginTop: 8, borderRadius: 10, background: INK, color: '#fff', padding: '9px 11px', fontSize: 9, fontWeight: 800}}>Correcto · reforzá solo lo que todavía te cuesta.</div>
    </div>
  );
};

const AppScreen: React.FC<{feature: Feature; local: number}> = ({feature, local}) => {
  const contentIn = spring({frame: local, fps: 30, config: {damping: 18, stiffness: 125}});
  return (
    <div style={{width: 760, height: 430, borderRadius: 10, overflow: 'hidden', background: '#fff', border: '1px solid #303237', boxShadow: '0 24px 70px rgba(0,0,0,.42)'}}>
      <div style={{height: 28, display: 'flex', alignItems: 'center', gap: 6, padding: '0 11px', background: '#f8fafc', borderBottom: `1px solid ${LINE}`}}>
        {[0, 1, 2].map((i) => <div key={i} style={{width: 6, height: 6, borderRadius: 99, background: '#cbd5e1'}} />)}
        <div style={{marginLeft: 7, flex: 1, height: 17, borderRadius: 6, background: '#fff', border: `1px solid ${LINE}`, color: '#94a3b8', fontSize: 7, display: 'flex', alignItems: 'center', paddingLeft: 7}}>evaluo.com.ar</div>
      </div>
      <div style={{display: 'flex', height: 402}}>
        <Nav active={feature} />
        <div style={{flex: 1}}>
          <Header active={feature} />
          <div style={{opacity: contentIn, transform: `translateY(${(1 - contentIn) * 10}px)`}}>
            {feature === 'summary' ? <SummaryView /> : null}
            {feature === 'glossary' ? <GlossaryView /> : null}
            {feature === 'cards' ? <FlashcardsView local={local} /> : null}
            {feature === 'exam' ? <ExamView local={local} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const FloatingBadge: React.FC<{feature: Feature; local: number}> = ({feature, local}) => {
  const pop = spring({frame: local, fps: 30, config: {damping: 14, stiffness: 115}});
  return (
    <div style={{position: 'absolute', left: '50%', top: 34, zIndex: 100, transform: `translateX(-50%) translateY(${(1 - pop) * -18}px) scale(${0.88 + pop * 0.12})`, opacity: pop}}>
      <div style={{height: 72, minWidth: 225, padding: '0 22px', borderRadius: 17, background: '#fff', display: 'flex', alignItems: 'center', gap: 13, border: `1px solid ${LINE}`, boxShadow: '0 18px 44px rgba(0,0,0,.28)'}}>
        <div style={{width: 42, height: 42, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <FeatureIcon feature={feature} size={22} />
        </div>
        <div>
          <div style={{fontSize: 16, fontWeight: 950, color: INK, letterSpacing: '.02em'}}>{meta[feature].label}</div>
          <div style={{fontSize: 10, color: MUTED, marginTop: 2}}>{meta[feature].subtitle}</div>
        </div>
      </div>
    </div>
  );
};

const ShowcaseStage: React.FC<{feature: Feature; local: number}> = ({feature, local}) => {
  const enter = spring({frame: local, fps: 30, config: {damping: 18, stiffness: 95}});
  const drift = Math.sin(local / 42) * 4;
  const camera = {
    summary: {x: -10, y: 7, scale: 0.92, ry: -2.4, rx: 1.2},
    glossary: {x: 13, y: -3, scale: 0.95, ry: 2.2, rx: 1.0},
    cards: {x: -4, y: -7, scale: 0.98, ry: -1.2, rx: 1.6},
    exam: {x: 10, y: 5, scale: 0.96, ry: 1.8, rx: 1.1},
  }[feature];

  return (
    <div style={{position: 'absolute', left: 190, right: 190, top: 264, height: 610, borderRadius: 24, overflow: 'hidden', background: STAGE, boxShadow: '0 34px 70px rgba(15,23,42,.18)'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 8, background: '#303338', transform: 'translateY(-50%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 'calc(50% + 9px)', height: 1, background: 'rgba(255,255,255,.04)'}} />
      <div style={{position: 'absolute', width: 680, height: 680, borderRadius: 999, left: 430, top: -50, background: 'radial-gradient(circle,rgba(37,99,235,.15),rgba(37,99,235,0) 66%)', filter: 'blur(18px)'}} />
      <div style={{position: 'absolute', left: '50%', top: '56%', perspective: 1700, transform: 'translate(-50%,-50%)'}}>
        <div
          style={{
            width: 820,
            height: 488,
            borderRadius: 18,
            padding: 21,
            background: '#25282c',
            boxShadow: '0 34px 86px rgba(0,0,0,.52)',
            transformStyle: 'preserve-3d',
            transform: `translate(${camera.x + drift}px, ${camera.y}px) scale(${(0.82 + enter * 0.18) * camera.scale}) rotateX(${camera.rx}deg) rotateY(${camera.ry}deg)`,
          }}
        >
          <AppScreen feature={feature} local={local} />
        </div>
      </div>
      <FloatingBadge feature={feature} local={local} />
    </div>
  );
};

const Final: React.FC<{frame: number}> = ({frame}) => {
  const p = spring({frame: Math.max(0, frame - 545), fps: 30, config: {damping: 16, stiffness: 105}});
  return (
    <AbsoluteFill style={{opacity: rr(frame, [535, 565], [0, 1]), background: '#fff', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14, transform: `scale(${0.84 + p * 0.16})`}}>
        <Img src={staticFile('icon.png')} style={{width: 60, height: 60, objectFit: 'contain'}} />
        <div style={{fontSize: 45, fontWeight: 950, letterSpacing: '-0.055em', color: INK}}>Evaluo</div>
      </div>
      <div style={{fontSize: 58, lineHeight: 1.02, fontWeight: 950, letterSpacing: '-0.06em', color: INK, textAlign: 'center', marginTop: 28}}>Un PDF. Todo tu estudio.</div>
      <div style={{fontSize: 18, color: MUTED, marginTop: 16}}>Resumen · Glosario · Flashcards · Examen</div>
    </AbsoluteFill>
  );
};

export const EvaluoProductDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const feature: Feature = frame < 140 ? 'summary' : frame < 280 ? 'glossary' : frame < 420 ? 'cards' : 'exam';
  const local = frame - featureStarts[feature];
  const finalOpacity = rr(frame, [532, 562], [0, 1]);

  const mouseX = feature === 'summary'
    ? rr(local, [18, 90], [1450, 1060])
    : feature === 'glossary'
      ? rr(local, [10, 42, 96], [700, 620, 1030])
      : feature === 'cards'
        ? rr(local, [8, 38, 82], [710, 620, 1090])
        : rr(local, [8, 38, 88], [710, 620, 1120]);

  const mouseY = feature === 'summary'
    ? rr(local, [18, 90], [720, 555])
    : feature === 'glossary'
      ? rr(local, [10, 42, 96], [520, 566, 585])
      : feature === 'cards'
        ? rr(local, [8, 38, 82], [555, 606, 620])
        : rr(local, [8, 38, 88], [590, 646, 666]);

  const click = feature === 'summary'
    ? rr(local, [84, 91, 101], [0, 1, 0])
    : feature === 'glossary'
      ? Math.max(rr(local, [34, 41, 51], [0, 1, 0]), rr(local, [90, 97, 107], [0, 1, 0]))
      : feature === 'cards'
        ? Math.max(rr(local, [31, 38, 48], [0, 1, 0]), rr(local, [74, 82, 92], [0, 1, 0]))
        : Math.max(rr(local, [31, 38, 48], [0, 1, 0]), rr(local, [80, 88, 98], [0, 1, 0]));

  const pillIn = spring({frame, fps, config: {damping: 16, stiffness: 105}});

  return (
    <AbsoluteFill style={{background: '#fff', fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 78, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: 1 - finalOpacity}}>
        <div style={{padding: '12px 20px', borderRadius: 999, background: '#eff6ff', color: BRAND, fontSize: 12, fontWeight: 900, letterSpacing: '.08em', transform: `translateY(${(1 - pillIn) * 14}px)`}}>CÓMO FUNCIONA</div>
      </div>
      <div style={{position: 'absolute', top: 132, left: 0, right: 0, textAlign: 'center', opacity: 1 - finalOpacity}}>
        <div style={{fontSize: 34, color: INK, fontWeight: 950, letterSpacing: '-0.045em'}}>Del PDF a estudiar de verdad.</div>
        <div style={{fontSize: 15, color: MUTED, marginTop: 8}}>Una sola plataforma. Todo conectado.</div>
      </div>

      <div style={{opacity: 1 - finalOpacity}}>
        <ShowcaseStage feature={feature} local={local} />
        <Mouse x={mouseX} y={mouseY} click={click} />
      </div>

      <Final frame={frame} />
    </AbsoluteFill>
  );
};
