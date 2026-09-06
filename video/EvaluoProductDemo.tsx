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
const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const r = (frame: number, input: number[], output: number[]) => interpolate(frame, input, output, clamp);

type Feature = 'summary' | 'glossary' | 'cards' | 'exam';

const featureMeta: Record<Feature, {label: string; subtitle: string}> = {
  summary: {label: 'RESUMEN', subtitle: 'Entendé lo importante'},
  glossary: {label: 'GLOSARIO', subtitle: 'Dominá los conceptos'},
  cards: {label: 'FLASHCARDS', subtitle: 'Recordá activamente'},
  exam: {label: 'EXAMEN', subtitle: 'Comprobá lo que sabés'},
};

const Mouse: React.FC<{x: number; y: number; click?: number}> = ({x, y, click = 0}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      zIndex: 200,
      transform: `scale(${1 - click * 0.12})`,
      transformOrigin: '0 0',
      filter: 'drop-shadow(0 8px 12px rgba(0,0,0,.35))',
    }}
  >
    <div
      style={{
        width: 0,
        height: 0,
        borderTop: '30px solid #ffffff',
        borderRight: '18px solid transparent',
        transform: 'rotate(-28deg)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 3,
        top: 1,
        width: 0,
        height: 0,
        borderTop: '24px solid #111827',
        borderRight: '14px solid transparent',
        transform: 'rotate(-28deg)',
      }}
    />
    {click > 0 ? (
      <div
        style={{
          position: 'absolute',
          left: -15 - click * 11,
          top: -15 - click * 11,
          width: 42 + click * 22,
          height: 42 + click * 22,
          borderRadius: 999,
          border: `3px solid rgba(96,165,250,${0.7 - click * 0.5})`,
        }}
      />
    ) : null}
  </div>
);

const Brand: React.FC = () => (
  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
    <Img src={staticFile('icon.png')} style={{width: 34, height: 34, objectFit: 'contain'}} />
    <div style={{fontSize: 24, fontWeight: 900, color: INK, letterSpacing: '-0.04em'}}>Evaluo</div>
  </div>
);

const BrowserChrome: React.FC = () => (
  <div
    style={{
      height: 52,
      background: '#f8fafc',
      borderBottom: `1px solid ${LINE}`,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 18px',
    }}
  >
    {[0, 1, 2].map((i) => (
      <div key={i} style={{width: 10, height: 10, borderRadius: 99, background: '#cbd5e1'}} />
    ))}
    <div
      style={{
        marginLeft: 10,
        flex: 1,
        height: 30,
        borderRadius: 9,
        border: `1px solid ${LINE}`,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 12,
        color: '#94a3b8',
        fontSize: 12,
      }}
    >
      evaluo.com.ar
    </div>
  </div>
);

const Sidebar: React.FC<{active: Feature}> = ({active}) => {
  const items: Array<[Feature, string]> = [
    ['summary', 'Resumen'],
    ['glossary', 'Glosario'],
    ['cards', 'Flashcards'],
    ['exam', 'Examen'],
  ];
  return (
    <div style={{width: 180, padding: 18, borderRight: `1px solid ${LINE}`, background: '#fbfdff'}}>
      <Brand />
      <div style={{fontSize: 10, fontWeight: 900, letterSpacing: '.14em', color: '#94a3b8', marginTop: 28, marginBottom: 10}}>
        ESTUDIO
      </div>
      {items.map(([key, label]) => {
        const on = key === active;
        return (
          <div
            key={key}
            style={{
              height: 48,
              borderRadius: 13,
              padding: '0 13px',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: on ? BRAND : '#64748b',
              background: on ? '#eff6ff' : 'transparent',
              border: on ? '1px solid #dbeafe' : '1px solid transparent',
              fontSize: 14,
              fontWeight: on ? 900 : 750,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                border: `2px solid ${on ? BRAND : '#cbd5e1'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              {key === 'summary' ? '≡' : key === 'glossary' ? 'D' : key === 'cards' ? '↻' : '✓'}
            </div>
            {label}
          </div>
        );
      })}
    </div>
  );
};

const SummaryView: React.FC = () => (
  <div style={{padding: '28px 34px'}}>
    <div style={{fontSize: 11, color: BRAND, fontWeight: 900, letterSpacing: '.13em'}}>RESUMEN</div>
    <div style={{fontSize: 25, fontWeight: 950, color: INK, marginTop: 7}}>Marketing I · guía para el parcial</div>
    <div
      style={{
        marginTop: 20,
        padding: 18,
        borderRadius: 16,
        border: '1px solid #dbeafe',
        background: 'linear-gradient(135deg,#f8fbff,#f5f3ff)',
        color: '#475569',
        fontSize: 14,
        lineHeight: 1.45,
      }}
    >
      El material explica cómo segmentar un mercado, construir posicionamiento y definir una propuesta de valor clara.
    </div>
    <div style={{marginTop: 22, fontSize: 15, fontWeight: 900, color: INK}}>Puntos clave</div>
    {[
      ['Segmentación', 'Agrupá consumidores con necesidades similares.'],
      ['Posicionamiento', 'Definí el lugar que querés ocupar frente a alternativas.'],
      ['Propuesta de valor', 'Explicá por qué deberían elegir tu oferta.'],
    ].map(([title, body], i) => (
      <div
        key={title}
        style={{
          marginTop: 10,
          minHeight: 66,
          borderRadius: 14,
          border: `1px solid ${LINE}`,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
        }}
      >
        <div style={{width: 28, height: 28, borderRadius: 9, background: BRAND, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900}}>
          {i + 1}
        </div>
        <div>
          <div style={{fontSize: 14, fontWeight: 900, color: INK}}>{title}</div>
          <div style={{fontSize: 11, color: MUTED, marginTop: 3}}>{body}</div>
        </div>
      </div>
    ))}
  </div>
);

const GlossaryView: React.FC = () => (
  <div style={{padding: '28px 34px'}}>
    <div style={{fontSize: 11, color: BRAND, fontWeight: 900, letterSpacing: '.13em'}}>GLOSARIO</div>
    <div style={{fontSize: 25, fontWeight: 950, color: INK, marginTop: 7}}>Conceptos del mismo material</div>
    <div style={{marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
      {[
        ['Segmentación', 'Agrupar consumidores según características o necesidades comunes.'],
        ['Posicionamiento', 'Lugar que una marca busca ocupar en la mente del público.'],
        ['Propuesta de valor', 'Beneficio diferencial que justifica elegir una oferta.'],
        ['Público objetivo', 'Grupo de personas al que se dirige una estrategia.'],
      ].map(([term, def]) => (
        <div key={term} style={{minHeight: 118, borderRadius: 16, border: `1px solid ${LINE}`, padding: 16, background: '#fff'}}>
          <div style={{fontSize: 15, fontWeight: 900, color: INK}}>{term}</div>
          <div style={{fontSize: 11, lineHeight: 1.45, color: MUTED, marginTop: 8}}>{def}</div>
        </div>
      ))}
    </div>
  </div>
);

const CardsView: React.FC<{frame: number}> = ({frame}) => {
  const flip = r(frame, [330, 360], [0, 180]);
  return (
    <div style={{padding: '28px 34px'}}>
      <div style={{fontSize: 11, color: BRAND, fontWeight: 900, letterSpacing: '.13em'}}>FLASHCARDS</div>
      <div style={{fontSize: 25, fontWeight: 950, color: INK, marginTop: 7}}>Repasá sin volver a leer todo</div>
      <div style={{height: 330, marginTop: 24, perspective: 1200, position: 'relative'}}>
        <div style={{position: 'absolute', inset: '0 34px', transformStyle: 'preserve-3d', transform: `rotateY(${flip}deg)`}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: 22, border: '1px solid #cfe0ff', background: 'linear-gradient(145deg,#fff,#f8fbff)', boxShadow: '0 18px 40px rgba(37,99,235,.12)', padding: 28, backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div style={{fontSize: 11, fontWeight: 900, color: BRAND, letterSpacing: '.13em'}}>PREGUNTA</div>
            <div style={{fontSize: 27, lineHeight: 1.2, fontWeight: 950, color: INK}}>¿Qué diferencia hay entre segmentación y posicionamiento?</div>
            <div style={{fontSize: 12, color: MUTED}}>Click para revelar</div>
          </div>
          <div style={{position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(145deg,${BRAND},${BRAND2})`, color: '#fff', padding: 28, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 46px rgba(37,99,235,.25)'}}>
            <div style={{fontSize: 11, fontWeight: 900, opacity: .75, letterSpacing: '.13em'}}>RESPUESTA</div>
            <div style={{fontSize: 23, lineHeight: 1.3, fontWeight: 850}}>La segmentación define grupos de público; el posicionamiento define el lugar que la marca quiere ocupar frente a ellos.</div>
            <div style={{fontSize: 12, opacity: .8}}>Generada desde el mismo PDF</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExamView: React.FC<{frame: number}> = ({frame}) => {
  const selected = frame >= 475;
  return (
    <div style={{padding: '28px 34px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <div style={{fontSize: 11, color: BRAND, fontWeight: 900, letterSpacing: '.13em'}}>EXAMEN</div>
          <div style={{fontSize: 25, fontWeight: 950, color: INK, marginTop: 7}}>Comprobá si realmente lo entendiste</div>
        </div>
        <div style={{fontSize: 12, color: MUTED}}>Pregunta 1 de 5</div>
      </div>
      <div style={{marginTop: 20, padding: 18, borderRadius: 16, background: '#f8fafc', border: `1px solid ${LINE}`, fontSize: 17, fontWeight: 900, color: INK}}>
        ¿Cuál describe mejor una propuesta de valor?
      </div>
      {[
        'Una lista de segmentos de mercado',
        'El beneficio diferencial por el que elegir una oferta',
        'El precio promedio del mercado',
      ].map((option, index) => {
        const correct = index === 1;
        const on = selected && correct;
        return (
          <div key={option} style={{marginTop: 11, minHeight: 58, borderRadius: 14, border: `2px solid ${on ? '#86efac' : LINE}`, background: on ? '#f0fdf4' : '#fff', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px'}}>
            <div style={{width: 24, height: 24, borderRadius: 99, border: `2px solid ${on ? '#22c55e' : '#cbd5e1'}`, background: on ? '#22c55e' : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900}}>
              {on ? '✓' : ''}
            </div>
            <div style={{fontSize: 13, fontWeight: 750, color: INK}}>{option}</div>
          </div>
        );
      })}
      <div style={{marginTop: 13, opacity: selected ? 1 : 0, padding: '13px 16px', borderRadius: 14, background: INK, color: '#fff', fontSize: 12, fontWeight: 800}}>
        Correcto · detectá qué dominás y qué necesitás reforzar.
      </div>
    </div>
  );
};

const ProductScreen: React.FC<{active: Feature; frame: number}> = ({active, frame}) => (
  <div style={{width: 960, height: 560, borderRadius: 22, overflow: 'hidden', background: '#fff', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 40px 90px rgba(0,0,0,.45)'}}>
    <BrowserChrome />
    <div style={{display: 'flex', height: 508}}>
      <Sidebar active={active} />
      <div style={{flex: 1, overflow: 'hidden'}}>
        {active === 'summary' ? <SummaryView /> : null}
        {active === 'glossary' ? <GlossaryView /> : null}
        {active === 'cards' ? <CardsView frame={frame} /> : null}
        {active === 'exam' ? <ExamView frame={frame} /> : null}
      </div>
    </div>
  </div>
);

const FloatingBadge: React.FC<{feature: Feature; frame: number}> = ({feature, frame}) => {
  const pop = spring({frame: Math.max(0, frame - 22), fps: 30, config: {damping: 14, stiffness: 115}});
  return (
    <div style={{position: 'absolute', left: '50%', top: 92, transform: `translateX(-50%) translateY(${(1 - pop) * -24}px) scale(${0.88 + pop * 0.12})`, zIndex: 120}}>
      <div style={{minWidth: 210, height: 76, padding: '0 24px', borderRadius: 20, background: '#fff', color: INK, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 18px 50px rgba(0,0,0,.28)', border: `1px solid ${LINE}`}}>
        <div style={{width: 42, height: 42, borderRadius: 13, background: '#eff6ff', color: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 950}}>
          {feature === 'summary' ? '≡' : feature === 'glossary' ? 'D' : feature === 'cards' ? '↻' : '✓'}
        </div>
        <div>
          <div style={{fontSize: 16, fontWeight: 950, letterSpacing: '.04em'}}>{featureMeta[feature].label}</div>
          <div style={{fontSize: 11, color: MUTED, marginTop: 2}}>{featureMeta[feature].subtitle}</div>
        </div>
      </div>
    </div>
  );
};

const Stage: React.FC<{active: Feature; frame: number}> = ({active, frame}) => {
  const intro = spring({frame, fps: 30, config: {damping: 16, stiffness: 95}});
  const cameraX = active === 'summary' ? 0 : active === 'glossary' ? -36 : active === 'cards' ? 28 : -18;
  const cameraY = active === 'summary' ? 0 : active === 'glossary' ? 8 : active === 'cards' ? -14 : 10;
  const cameraScale = active === 'summary' ? 0.88 : active === 'glossary' ? 0.94 : active === 'cards' ? 1.02 : 0.97;
  const tilt = active === 'summary' ? -1.4 : active === 'glossary' ? 1.3 : active === 'cards' ? -0.7 : 0.9;

  return (
    <div style={{position: 'absolute', left: 112, right: 112, top: 118, bottom: 104, borderRadius: 34, overflow: 'hidden', background: '#15171a', boxShadow: '0 38px 80px rgba(15,23,42,.18)'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 8, background: '#2a2d31', transform: 'translateY(-50%)'}} />
      <div style={{position: 'absolute', width: 760, height: 760, borderRadius: 999, left: 570, top: 70, background: 'radial-gradient(circle,rgba(37,99,235,.17),rgba(37,99,235,0) 65%)', filter: 'blur(12px)'}} />
      <div style={{position: 'absolute', left: '50%', top: '54%', perspective: 1800, transform: 'translate(-50%,-50%)'}}>
        <div
          style={{
            transform: `translate(${cameraX}px, ${cameraY}px) scale(${(0.78 + intro * 0.22) * cameraScale}) rotateX(2deg) rotateY(${tilt}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          <ProductScreen active={active} frame={frame} />
        </div>
      </div>
      <FloatingBadge feature={active} frame={frame} />
    </div>
  );
};

export const EvaluoProductDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const active: Feature = frame < 150 ? 'summary' : frame < 285 ? 'glossary' : frame < 410 ? 'cards' : 'exam';

  const mouseX =
    frame < 140
      ? r(frame, [40, 110], [1380, 430])
      : frame < 280
        ? r(frame, [150, 220], [420, 430])
        : frame < 405
          ? r(frame, [285, 350], [430, 1060])
          : r(frame, [420, 480], [430, 1040]);
  const mouseY =
    frame < 140
      ? r(frame, [40, 110], [780, 380])
      : frame < 280
        ? r(frame, [150, 220], [380, 430])
        : frame < 405
          ? r(frame, [285, 350], [430, 610])
          : r(frame, [420, 480], [430, 620]);

  const click = Math.max(
    r(frame, [105, 112, 122], [0, 1, 0]),
    r(frame, [214, 221, 231], [0, 1, 0]),
    r(frame, [345, 352, 362], [0, 1, 0]),
    r(frame, [472, 479, 489], [0, 1, 0]),
  );

  const titleIn = spring({frame, fps, config: {damping: 16, stiffness: 105}});
  const final = r(frame, [520, 555, 600], [0, 1, 1]);

  return (
    <AbsoluteFill style={{background: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 32, left: 0, right: 0, textAlign: 'center', opacity: 1 - final}}>
        <div style={{fontSize: 13, fontWeight: 850, color: MUTED, letterSpacing: '.14em'}}>EVALUO EN ACCIÓN</div>
        <div style={{fontSize: 42, fontWeight: 950, letterSpacing: '-0.055em', color: INK, marginTop: 8, transform: `translateY(${(1 - titleIn) * 18}px)`}}>
          Del PDF a estudiar de verdad.
        </div>
      </div>

      <div style={{opacity: 1 - final}}>
        <Stage active={active} frame={frame} />
        <Mouse x={mouseX} y={mouseY} click={click} />
      </div>

      <AbsoluteFill style={{opacity: final, alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 50% 45%,rgba(37,99,235,.12),#fff 52%)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <Img src={staticFile('icon.png')} style={{width: 72, height: 72, objectFit: 'contain'}} />
          <div style={{fontSize: 52, fontWeight: 950, letterSpacing: '-0.055em', color: INK}}>Evaluo</div>
        </div>
        <div style={{fontSize: 64, lineHeight: 1.02, fontWeight: 950, letterSpacing: '-0.065em', color: INK, textAlign: 'center', marginTop: 34}}>
          Un PDF.
          <br />
          Todo tu estudio.
        </div>
        <div style={{display: 'flex', gap: 12, marginTop: 32}}>
          {['Resumen', 'Glosario', 'Flashcards', 'Examen'].map((label) => (
            <div key={label} style={{padding: '12px 18px', borderRadius: 999, background: '#eff6ff', color: BRAND, fontSize: 15, fontWeight: 900}}>
              {label}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
