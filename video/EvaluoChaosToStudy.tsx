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
const LINE = '#dbe4f0';
const STAGE = '#17191d';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const r = (frame: number, input: number[], output: number[]) => interpolate(frame, input, output, clamp);

type Feature = 'summary' | 'cards' | 'exam' | 'glossary';

const featureLabels: Record<Feature, string> = {
  summary: 'Resumen',
  cards: 'Flashcards',
  exam: 'Examen',
  glossary: 'Glosario',
};

const Brand: React.FC<{light?: boolean}> = ({light = false}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 11}}>
    <Img src={staticFile('icon.png')} style={{width: 38, height: 38, objectFit: 'contain'}} />
    <div style={{fontSize: 25, fontWeight: 950, letterSpacing: '-0.05em', color: light ? '#fff' : INK}}>Evaluo</div>
  </div>
);

const Mouse: React.FC<{x: number; y: number; click?: number; opacity?: number}> = ({x, y, click = 0, opacity = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      zIndex: 300,
      opacity,
      transform: `scale(${1 - click * 0.12})`,
      transformOrigin: '0 0',
      filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.4))',
    }}
  >
    <div style={{width: 0, height: 0, borderTop: '34px solid #fff', borderRight: '20px solid transparent', transform: 'rotate(-28deg)'}} />
    <div style={{position: 'absolute', left: 3, top: 2, width: 0, height: 0, borderTop: '27px solid #111827', borderRight: '16px solid transparent', transform: 'rotate(-28deg)'}} />
    {click > 0 ? (
      <div
        style={{
          position: 'absolute',
          left: -17 - click * 12,
          top: -17 - click * 12,
          width: 46 + click * 24,
          height: 46 + click * 24,
          borderRadius: 999,
          border: `3px solid rgba(96,165,250,${0.75 - click * 0.55})`,
        }}
      />
    ) : null}
  </div>
);

const BrowserChrome: React.FC = () => (
  <div style={{height: 54, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', borderBottom: `1px solid ${LINE}`, background: '#f8fafc'}}>
    {[0, 1, 2].map((i) => <div key={i} style={{width: 10, height: 10, borderRadius: 99, background: '#cbd5e1'}} />)}
    <div style={{marginLeft: 8, height: 31, flex: 1, borderRadius: 9, background: '#fff', border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', paddingLeft: 13, fontSize: 12, color: '#94a3b8'}}>
      evaluo.com.ar
    </div>
  </div>
);

const tinyLines = [92, 74, 86, 63, 80, 70];

const MaterialCard: React.FC<{
  frame: number;
  index: number;
  x: number;
  y: number;
  rotate: number;
  type: 'PDF' | 'IMG' | 'NOTA';
  title: string;
  accent: string;
}> = ({frame, index, x, y, rotate, type, title, accent}) => {
  const enter = spring({frame: Math.max(0, frame - index * 5), fps: 30, config: {damping: 16, stiffness: 120}});
  const move = r(frame, [95 + index * 2, 195 + index * 2], [0, 1]);
  const targetX = 1235 + index * 3;
  const targetY = 515 + index * 2;
  const tx = (targetX - x) * move;
  const ty = (targetY - y) * move;
  const scale = r(move, [0, 1], [1, 0.23]);
  const opacity = r(frame, [0, 24, 202, 225], [0, 1, 1, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 248,
        height: 156,
        borderRadius: 18,
        background: '#fff',
        border: '1px solid rgba(255,255,255,.15)',
        boxShadow: '0 22px 48px rgba(0,0,0,.28)',
        padding: 18,
        opacity: opacity * enter,
        transform: `translate(${tx}px, ${ty}px) rotate(${rotate * (1 - move)}deg) scale(${scale * (0.9 + enter * 0.1)})`,
        transformOrigin: 'center',
        zIndex: 20 + index,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{padding: '5px 8px', borderRadius: 7, background: `${accent}18`, color: accent, fontSize: 11, fontWeight: 950}}>{type}</div>
        <div style={{fontSize: 10, color: '#94a3b8'}}>material</div>
      </div>
      <div style={{fontSize: 17, fontWeight: 900, color: INK, marginTop: 12}}>{title}</div>
      <div style={{marginTop: 14}}>
        {tinyLines.slice(0, 4).map((w, i) => <div key={i} style={{width: `${w}%`, height: 6, borderRadius: 99, background: i === 0 ? '#cbd5e1' : '#e5e7eb', marginBottom: 8}} />)}
      </div>
    </div>
  );
};

const ChaosSide: React.FC<{frame: number}> = ({frame}) => {
  const materials = [
    [118, 235, -7, 'PDF', 'Unidad 1 - teoría', '#ef4444'],
    [425, 182, 5, 'IMG', 'Foto de la pizarra', '#0ea5e9'],
    [190, 445, 8, 'NOTA', 'Apuntes de clase', '#8b5cf6'],
    [500, 408, -5, 'PDF', 'Resumen viejo', '#ef4444'],
    [92, 650, 4, 'IMG', 'Captura del campus', '#0ea5e9'],
    [390, 645, -8, 'PDF', 'Guía para el parcial', '#ef4444'],
  ] as const;
  const titleOpacity = r(frame, [0, 18, 125, 170], [0, 1, 1, 0]);
  return (
    <>
      <div style={{position: 'absolute', left: 98, top: 105, opacity: titleOpacity}}>
        <div style={{fontSize: 12, letterSpacing: '.16em', fontWeight: 900, color: '#8f98a5'}}>ANTES</div>
        <div style={{fontSize: 34, lineHeight: 1.05, fontWeight: 950, letterSpacing: '-0.05em', color: '#fff', marginTop: 8}}>Todo por separado.</div>
        <div style={{fontSize: 16, color: '#9299a5', marginTop: 9}}>PDFs, fotos, apuntes, capturas.</div>
      </div>
      {materials.map(([x, y, rot, type, title, accent], index) => (
        <MaterialCard key={title} frame={frame} index={index} x={x} y={y} rotate={rot} type={type} title={title} accent={accent} />
      ))}
    </>
  );
};

const UploadPanel: React.FC<{frame: number}> = ({frame}) => {
  const morph = r(frame, [205, 285], [0, 1]);
  const left = r(morph, [0, 1], [1040, 210]);
  const top = r(morph, [0, 1], [225, 145]);
  const width = r(morph, [0, 1], [700, 1500]);
  const height = r(morph, [0, 1], [560, 780]);
  const radius = r(morph, [0, 1], [28, 22]);
  const uploadOpacity = r(frame, [0, 30, 205, 238], [0, 1, 1, 0]);
  const processOpacity = r(frame, [220, 245, 320, 350], [0, 1, 1, 0]);
  const appOpacity = r(frame, [325, 355], [0, 1]);
  const progress = r(frame, [245, 320], [0.08, 1]);

  const active: Feature = frame < 475 ? 'summary' : frame < 605 ? 'cards' : frame < 735 ? 'exam' : 'glossary';

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        borderRadius: radius,
        background: '#fff',
        border: '1px solid rgba(255,255,255,.16)',
        boxShadow: '0 42px 100px rgba(0,0,0,.42)',
        overflow: 'hidden',
        zIndex: 120,
      }}
    >
      <div style={{position: 'absolute', inset: 0, opacity: uploadOpacity}}>
        <div style={{height: 74, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: `1px solid ${LINE}`}}>
          <Brand />
          <div style={{fontSize: 12, color: MUTED, fontWeight: 800}}>Nuevo material</div>
        </div>
        <div style={{padding: 40}}>
          <div style={{fontSize: 30, fontWeight: 950, letterSpacing: '-0.04em', color: INK}}>Subí tu PDF</div>
          <div style={{fontSize: 15, color: MUTED, marginTop: 8}}>Evaluo hace el resto.</div>
          <div
            style={{
              height: 310,
              marginTop: 28,
              borderRadius: 24,
              border: `2px dashed ${BRAND}`,
              background: 'linear-gradient(180deg,#fbfdff,#f3f7ff)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{width: 74, height: 74, borderRadius: 22, background: `linear-gradient(145deg,${BRAND},${BRAND2})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, boxShadow: '0 16px 35px rgba(37,99,235,.25)'}}>↑</div>
            <div style={{fontSize: 21, fontWeight: 900, color: INK, marginTop: 18}}>Arrastrá tu material acá</div>
            <div style={{fontSize: 13, color: MUTED, marginTop: 6}}>PDF listo para procesar</div>
          </div>
        </div>
      </div>

      <div style={{position: 'absolute', inset: 0, opacity: processOpacity, background: '#fff'}}>
        <div style={{height: 74, display: 'flex', alignItems: 'center', padding: '0 28px', borderBottom: `1px solid ${LINE}`}}><Brand /></div>
        <div style={{position: 'absolute', left: '50%', top: '51%', transform: 'translate(-50%,-50%)', width: '72%', textAlign: 'center'}}>
          <div style={{fontSize: 13, fontWeight: 900, letterSpacing: '.14em', color: BRAND}}>PROCESANDO MATERIAL</div>
          <div style={{fontSize: 42, fontWeight: 950, letterSpacing: '-0.055em', color: INK, marginTop: 12}}>Armando tu estudio.</div>
          <div style={{fontSize: 16, color: MUTED, marginTop: 10}}>Detectando conceptos, relaciones y puntos clave.</div>
          <div style={{height: 12, borderRadius: 99, background: '#dbeafe', overflow: 'hidden', margin: '38px auto 0', width: '78%'}}>
            <div style={{height: '100%', width: `${progress * 100}%`, borderRadius: 99, background: `linear-gradient(90deg,${BRAND},${BRAND2})`}} />
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 32}}>
            {['Resumen', 'Flashcards', 'Examen', 'Glosario'].map((label, index) => {
              const show = r(progress, [index * 0.17, Math.min(1, index * 0.17 + 0.42)], [0, 1]);
              return (
                <div key={label} style={{height: 68, borderRadius: 16, border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: show, transform: `translateY(${(1 - show) * 12}px)`, fontSize: 14, fontWeight: 850, color: INK}}>
                  <div style={{width: 25, height: 25, borderRadius: 9, background: '#eff6ff', color: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950}}>✓</div>
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{position: 'absolute', inset: 0, opacity: appOpacity, background: '#fff'}}>
        <BrowserChrome />
        <div style={{display: 'flex', height: 'calc(100% - 54px)'}}>
          <FeatureSidebar active={active} />
          <div style={{position: 'relative', flex: 1, overflow: 'hidden', background: '#fff'}}>
            <SummaryView frame={frame} />
            <FlashcardsView frame={frame} />
            <ExamView frame={frame} />
            <GlossaryView frame={frame} />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureSidebar: React.FC<{active: Feature}> = ({active}) => {
  const items: Array<[Feature, string]> = [
    ['summary', 'Resumen'],
    ['cards', 'Flashcards'],
    ['exam', 'Examen'],
    ['glossary', 'Glosario'],
  ];
  return (
    <div style={{width: 235, padding: '24px 18px', background: '#f8fafc', borderRight: `1px solid ${LINE}`}}>
      <Brand />
      <div style={{fontSize: 10, color: '#94a3b8', fontWeight: 900, letterSpacing: '.15em', margin: '28px 12px 10px'}}>ESTUDIO</div>
      {items.map(([key, label]) => {
        const on = key === active;
        return (
          <div key={key} style={{height: 56, borderRadius: 15, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 7, background: on ? '#eef4ff' : 'transparent', border: on ? '1px solid #dbeafe' : '1px solid transparent', color: on ? BRAND : '#64748b', fontSize: 15, fontWeight: on ? 900 : 750}}>
            <div style={{width: 25, height: 25, borderRadius: 8, border: `2px solid ${on ? BRAND : '#cbd5e1'}`, position: 'relative'}}>
              <div style={{position: 'absolute', left: 5, right: 5, top: 7, height: 2, borderRadius: 99, background: on ? BRAND : '#cbd5e1'}} />
              <div style={{position: 'absolute', left: 5, right: key === 'cards' ? 8 : 5, top: 13, height: 2, borderRadius: 99, background: on ? BRAND : '#cbd5e1'}} />
            </div>
            {label}
          </div>
        );
      })}
    </div>
  );
};

const ViewHeader: React.FC<{label: string; title: string; text: string}> = ({label, title, text}) => (
  <>
    <div style={{fontSize: 11, color: BRAND, fontWeight: 950, letterSpacing: '.14em'}}>{label.toUpperCase()}</div>
    <div style={{fontSize: 31, color: INK, fontWeight: 950, letterSpacing: '-0.045em', marginTop: 8}}>{title}</div>
    <div style={{fontSize: 14, color: MUTED, marginTop: 7}}>{text}</div>
  </>
);

const SummaryView: React.FC<{frame: number}> = ({frame}) => {
  const opacity = r(frame, [330, 355, 455, 485], [0, 1, 1, 0]);
  const rows = [
    ['Segmentación de mercado', 'Cómo dividir un mercado y detectar grupos relevantes.'],
    ['Posicionamiento', 'Qué lugar busca ocupar una marca frente a sus alternativas.'],
    ['Propuesta de valor', 'Por qué una persona debería elegir una oferta.'],
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity, padding: '42px 54px'}}>
      <ViewHeader label="Resumen" title="Primero, entendé lo importante." text="Evaluo ordena el PDF y te deja una guía clara para empezar." />
      <div style={{marginTop: 28, padding: 22, borderRadius: 20, background: 'linear-gradient(135deg,#f8fbff,#f5f3ff)', border: '1px solid #dbeafe', color: '#475569', fontSize: 16, lineHeight: 1.5}}>
        Marketing I explica cómo identificar públicos, construir posicionamiento y definir una propuesta de valor clara.
      </div>
      <div style={{marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 15}}>
        {rows.map(([title, body], index) => {
          const show = r(frame, [360 + index * 9, 390 + index * 9], [0, 1]);
          return <div key={title} style={{minHeight: 150, borderRadius: 20, border: `1px solid ${LINE}`, background: '#fff', padding: 20, opacity: show, transform: `translateY(${(1 - show) * 20}px)`}}><div style={{width: 34, height: 34, borderRadius: 11, background: BRAND, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900}}>{index + 1}</div><div style={{fontSize: 17, fontWeight: 900, color: INK, marginTop: 16}}>{title}</div><div style={{fontSize: 13, lineHeight: 1.45, color: MUTED, marginTop: 8}}>{body}</div></div>;
        })}
      </div>
    </div>
  );
};

const FlashcardsView: React.FC<{frame: number}> = ({frame}) => {
  const opacity = r(frame, [460, 485, 585, 615], [0, 1, 1, 0]);
  const flip = r(frame, [525, 558], [0, 180]);
  return (
    <div style={{position: 'absolute', inset: 0, opacity, padding: '42px 54px'}}>
      <ViewHeader label="Flashcards" title="Después, pasá de leer a recordar." text="Preguntas creadas desde el mismo material." />
      <div style={{height: 390, marginTop: 34, perspective: 1500, position: 'relative'}}>
        <div style={{position: 'absolute', left: '50%', top: 0, width: 760, height: 350, transform: `translateX(-50%) rotateY(${flip}deg)`, transformStyle: 'preserve-3d'}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: 28, border: '1px solid #cfe0ff', background: 'linear-gradient(145deg,#fff,#f8fbff)', boxShadow: '0 22px 55px rgba(37,99,235,.12)', padding: 34, backfaceVisibility: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div style={{fontSize: 12, color: BRAND, fontWeight: 950, letterSpacing: '.14em'}}>PREGUNTA</div>
            <div style={{fontSize: 32, lineHeight: 1.18, color: INK, fontWeight: 950}}>¿Qué diferencia hay entre segmentación y posicionamiento?</div>
            <div style={{fontSize: 13, color: MUTED}}>Click para revelar la respuesta</div>
          </div>
          <div style={{position: 'absolute', inset: 0, borderRadius: 28, background: `linear-gradient(145deg,${BRAND},${BRAND2})`, color: '#fff', padding: 34, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 24px 62px rgba(37,99,235,.25)'}}>
            <div style={{fontSize: 12, fontWeight: 950, opacity: .75, letterSpacing: '.14em'}}>RESPUESTA</div>
            <div style={{fontSize: 27, lineHeight: 1.3, fontWeight: 850}}>La segmentación define grupos de público; el posicionamiento define el lugar que la marca quiere ocupar frente a ellos.</div>
            <div style={{fontSize: 13, opacity: .8}}>Generada desde tu PDF.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExamView: React.FC<{frame: number}> = ({frame}) => {
  const opacity = r(frame, [590, 615, 715, 745], [0, 1, 1, 0]);
  const selected = r(frame, [675, 695], [0, 1]);
  const options = [
    'Una lista de segmentos de mercado',
    'El beneficio diferencial por el que elegir una oferta',
    'El precio promedio del mercado',
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity, padding: '42px 54px'}}>
      <ViewHeader label="Examen" title="Comprobá si realmente lo entendiste." text="Respondé y detectá qué tenés que reforzar." />
      <div style={{marginTop: 30, padding: 22, borderRadius: 20, background: '#f8fafc', border: `1px solid ${LINE}`}}>
        <div style={{fontSize: 12, color: BRAND, fontWeight: 900}}>Pregunta 1 de 5</div>
        <div style={{fontSize: 22, color: INK, fontWeight: 900, marginTop: 10}}>¿Cuál describe mejor una propuesta de valor?</div>
      </div>
      <div style={{marginTop: 17, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 13}}>
        {options.map((option, index) => {
          const on = index === 1 && selected > 0.45;
          return <div key={option} style={{minHeight: 118, borderRadius: 18, border: `2px solid ${on ? '#86efac' : LINE}`, background: on ? '#f0fdf4' : '#fff', padding: 18, display: 'flex', gap: 12, alignItems: 'flex-start'}}><div style={{width: 27, height: 27, borderRadius: 99, flexShrink: 0, border: `2px solid ${on ? '#22c55e' : '#cbd5e1'}`, background: on ? '#22c55e' : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 950}}>{on ? '✓' : ''}</div><div style={{fontSize: 14, lineHeight: 1.42, color: INK, fontWeight: 750}}>{option}</div></div>;
        })}
      </div>
      <div style={{marginTop: 16, opacity: selected, padding: '15px 18px', borderRadius: 16, background: INK, color: '#fff', fontSize: 14, fontWeight: 800}}>Correcto · ya sabés qué dominás y qué necesitás reforzar.</div>
    </div>
  );
};

const GlossaryView: React.FC<{frame: number}> = ({frame}) => {
  const opacity = r(frame, [720, 745, 825, 855], [0, 1, 1, 0]);
  const terms = [
    ['Segmentación', 'Agrupar consumidores según características o necesidades comunes.'],
    ['Posicionamiento', 'Lugar que una marca busca ocupar en la mente del público.'],
    ['Propuesta de valor', 'Beneficio diferencial que justifica elegir una oferta.'],
    ['Público objetivo', 'Grupo de personas al que se dirige una estrategia.'],
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity, padding: '42px 54px'}}>
      <ViewHeader label="Glosario" title="Y dominá los conceptos clave." text="Definiciones claras extraídas del mismo material." />
      <div style={{marginTop: 30, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15}}>
        {terms.map(([term, definition], index) => {
          const show = r(frame, [755 + index * 7, 780 + index * 7], [0, 1]);
          return <div key={term} style={{minHeight: 126, borderRadius: 19, border: `1px solid ${LINE}`, background: '#fff', padding: 20, opacity: show, transform: `translateY(${(1 - show) * 15}px)`}}><div style={{fontSize: 17, fontWeight: 900, color: INK}}>{term}</div><div style={{fontSize: 13, lineHeight: 1.45, color: MUTED, marginTop: 8}}>{definition}</div></div>;
        })}
      </div>
    </div>
  );
};

const MergedPdf: React.FC<{frame: number}> = ({frame}) => {
  const opacity = r(frame, [160, 185, 208, 235], [0, 1, 1, 0]);
  const x = r(frame, [165, 220], [870, 1240]);
  const y = r(frame, [165, 220], [470, 470]);
  const scale = r(frame, [165, 220], [1, 0.58]);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 300, height: 390, borderRadius: 24, background: '#fff', border: `1px solid ${LINE}`, boxShadow: '0 28px 65px rgba(0,0,0,.32)', padding: 26, opacity, transform: `translate(-50%,-50%) scale(${scale})`, zIndex: 160}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><div style={{padding: '6px 9px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 950}}>PDF</div><div style={{fontSize: 11, color: '#94a3b8'}}>todo junto</div></div>
      <div style={{fontSize: 21, fontWeight: 900, color: INK, marginTop: 20}}>Material para el parcial</div>
      <div style={{marginTop: 26}}>{tinyLines.concat([82, 64, 90]).map((w, i) => <div key={i} style={{width: `${w}%`, height: i === 0 ? 10 : 7, borderRadius: 99, background: i === 0 ? '#cbd5e1' : '#e5e7eb', marginBottom: 12}} />)}</div>
    </div>
  );
};

const FinalScene: React.FC<{frame: number}> = ({frame}) => {
  const opacity = r(frame, [835, 865], [0, 1]);
  const pop = spring({frame: Math.max(0, frame - 850), fps: 30, config: {damping: 15, stiffness: 105}});
  return (
    <AbsoluteFill style={{opacity, alignItems: 'center', justifyContent: 'center', background: STAGE, zIndex: 500}}>
      <div style={{position: 'absolute', width: 900, height: 900, borderRadius: 999, background: 'radial-gradient(circle,rgba(37,99,235,.22),rgba(37,99,235,0) 66%)', filter: 'blur(8px)'}} />
      <div style={{position: 'relative', textAlign: 'center', transform: `scale(${0.92 + pop * 0.08})`, opacity: pop}}>
        <div style={{display: 'flex', justifyContent: 'center'}}><Brand light /></div>
        <div style={{fontSize: 70, lineHeight: .98, fontWeight: 950, letterSpacing: '-0.065em', color: '#fff', marginTop: 28}}>Un PDF.<br />Todo tu estudio.</div>
        <div style={{fontSize: 20, color: '#9ca3af', marginTop: 22}}>Del caos a estudiar de verdad.</div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 12, marginTop: 34}}>
          {['Resumen', 'Flashcards', 'Examen', 'Glosario'].map((label) => <div key={label} style={{padding: '12px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.07)', color: '#fff', fontSize: 14, fontWeight: 850}}>{label}</div>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const EvaluoChaosToStudy: React.FC = () => {
  const frame = useCurrentFrame();
  useVideoConfig();

  const split = r(frame, [0, 20, 190, 235], [0, 1, 1, 0]);
  const stageIntro = spring({frame, fps: 30, config: {damping: 18, stiffness: 95}});

  const mouseX = frame < 260 ? r(frame, [100, 175], [1570, 1370]) : frame < 510 ? r(frame, [430, 485], [1120, 350]) : frame < 640 ? r(frame, [560, 610], [1030, 350]) : r(frame, [665, 740], [1120, 350]);
  const mouseY = frame < 260 ? r(frame, [100, 175], [800, 560]) : frame < 510 ? r(frame, [430, 485], [650, 440]) : frame < 640 ? r(frame, [560, 610], [650, 500]) : r(frame, [665, 740], [650, 560]);
  const click = Math.max(
    r(frame, [170, 178, 188], [0, 1, 0]),
    r(frame, [480, 488, 498], [0, 1, 0]),
    r(frame, [605, 613, 623], [0, 1, 0]),
    r(frame, [690, 698, 708], [0, 1, 0]),
    r(frame, [735, 743, 753], [0, 1, 0]),
  );
  const mouseOpacity = r(frame, [80, 105, 805, 835], [0, 1, 1, 0]);

  return (
    <AbsoluteFill style={{background: '#f2f0ed', fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 28, left: 70, right: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <Brand />
        <div style={{fontSize: 12, fontWeight: 850, letterSpacing: '.14em', color: '#747b86'}}>DEL CAOS AL ESTUDIO</div>
      </div>

      <div style={{position: 'absolute', left: 72, right: 72, top: 88, bottom: 48, borderRadius: 34, overflow: 'hidden', background: STAGE, boxShadow: '0 34px 78px rgba(15,23,42,.18)', transform: `scale(${0.985 + stageIntro * 0.015})`, opacity: stageIntro}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: '52%', height: 6, background: '#2b2e33', opacity: .7}} />
        <div style={{position: 'absolute', width: 900, height: 900, borderRadius: 999, right: -180, top: -50, background: 'radial-gradient(circle,rgba(37,99,235,.14),rgba(37,99,235,0) 67%)', filter: 'blur(10px)'}} />
        <div style={{opacity: split}}><ChaosSide frame={frame} /></div>
        <div style={{position: 'absolute', right: 98, top: 105, opacity: r(frame, [0, 20, 180, 220], [0, 1, 1, 0]), zIndex: 90}}>
          <div style={{fontSize: 12, letterSpacing: '.16em', fontWeight: 900, color: '#8f98a5'}}>EVALUO</div>
          <div style={{fontSize: 34, lineHeight: 1.05, fontWeight: 950, letterSpacing: '-0.05em', color: '#fff', marginTop: 8}}>Un solo punto de entrada.</div>
          <div style={{fontSize: 16, color: '#9299a5', marginTop: 9}}>Subí el material y empezá.</div>
        </div>
        <MergedPdf frame={frame} />
        <UploadPanel frame={frame} />
        <Mouse x={mouseX} y={mouseY} click={click} opacity={mouseOpacity} />
        <FinalScene frame={frame} />
      </div>
    </AbsoluteFill>
  );
};
