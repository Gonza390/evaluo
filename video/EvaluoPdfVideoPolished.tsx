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
import {EvaluoPdfVideo} from './EvaluoPdfVideo';

const BRAND = '#2563eb';
const BRAND2 = '#6366f1';
const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#dbe4f0';
const BG = '#f7f9ff';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const rr = (frame: number, input: number[], output: number[]) => interpolate(frame, input, output, clamp);

type Tab = 'summary' | 'glossary' | 'cards' | 'exam';

const Brand: React.FC<{large?: boolean}> = ({large = false}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: large ? 18 : 12}}>
    <Img src={staticFile('icon.png')} style={{width: large ? 70 : 46, height: large ? 70 : 46, objectFit: 'contain'}} />
    <div style={{fontSize: large ? 48 : 30, fontWeight: 900, letterSpacing: '-0.055em', color: INK}}>Evaluo</div>
  </div>
);

const TopBrand: React.FC<{tag?: string}> = ({tag}) => (
  <div style={{position: 'absolute', top: 72, left: 62, right: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 80}}>
    <Brand />
    {tag ? <div style={{padding: '11px 18px', borderRadius: 999, border: `1px solid ${LINE}`, background: 'rgba(255,255,255,.88)', color: MUTED, fontSize: 17, fontWeight: 750}}>{tag}</div> : null}
  </div>
);

const BrowserWindow: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{width: 900, borderRadius: 34, overflow: 'hidden', border: `1px solid ${LINE}`, background: '#fff', boxShadow: '0 34px 90px rgba(15,23,42,.14)'}}>
    <div style={{height: 62, display: 'flex', alignItems: 'center', gap: 9, padding: '0 22px', borderBottom: `1px solid ${LINE}`, background: '#f8fafc'}}>
      {[0, 1, 2].map((i) => <div key={i} style={{width: 11, height: 11, borderRadius: 99, background: '#cbd5e1'}} />)}
      <div style={{marginLeft: 10, flex: 1, height: 32, borderRadius: 10, border: `1px solid ${LINE}`, background: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 14, fontSize: 14, color: '#94a3b8'}}>evaluo.com.ar</div>
    </div>
    {children}
  </div>
);

const Mouse: React.FC<{x: number; y: number; click?: number}> = ({x, y, click = 0}) => (
  <div style={{position: 'absolute', left: x, top: y, zIndex: 120, transform: `scale(${1 - click * 0.12})`, transformOrigin: '0 0', filter: 'drop-shadow(0 7px 9px rgba(15,23,42,.28))'}}>
    <div style={{width: 0, height: 0, borderTop: '34px solid #0f172a', borderRight: '20px solid transparent', transform: 'rotate(-27deg)'}} />
    {click > 0 ? <div style={{position: 'absolute', left: -16 - click * 12, top: -16 - click * 12, width: 44 + click * 24, height: 44 + click * 24, borderRadius: 999, border: `3px solid rgba(37,99,235,${0.68 - click * 0.48})`}} /> : null}
  </div>
);

const Icon: React.FC<{type: Tab; active: boolean}> = ({type, active}) => {
  const color = active ? BRAND : '#94a3b8';
  if (type === 'summary') return <div style={{width: 18, height: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>{[18, 14, 16].map((w, i) => <div key={i} style={{width: w, height: 2, borderRadius: 99, background: color}} />)}</div>;
  if (type === 'glossary') return <div style={{width: 18, height: 18, position: 'relative'}}><div style={{position: 'absolute', left: 1, top: 2, width: 6, height: 14, border: `2px solid ${color}`, borderRadius: 4}} /><div style={{position: 'absolute', right: 1, top: 2, width: 6, height: 14, border: `2px solid ${color}`, borderRadius: 4}} /></div>;
  if (type === 'cards') return <div style={{width: 19, height: 18, position: 'relative'}}><div style={{position: 'absolute', left: 0, top: 4, width: 14, height: 11, border: `2px solid ${color}`, borderRadius: 4, transform: 'rotate(-7deg)'}} /><div style={{position: 'absolute', right: 0, top: 1, width: 14, height: 11, border: `2px solid ${color}`, borderRadius: 4, background: '#fff'}} /></div>;
  return <div style={{width: 18, height: 18, borderRadius: 99, border: `2px solid ${color}`, position: 'relative'}}><div style={{position: 'absolute', width: 7, height: 4, borderLeft: `2px solid ${color}`, borderBottom: `2px solid ${color}`, transform: 'rotate(-45deg)', left: 4, top: 4}} /></div>;
};

const nav: Array<{key: Tab; label: string}> = [
  {key: 'summary', label: 'Resumen'},
  {key: 'glossary', label: 'Glosario'},
  {key: 'cards', label: 'Flashcards'},
  {key: 'exam', label: 'Examen'},
];

const Sidebar: React.FC<{active: Tab}> = ({active}) => (
  <div style={{width: 220, borderRight: `1px solid ${LINE}`, background: '#f8fafc', padding: '24px 18px'}}>
    <div style={{fontSize: 11, fontWeight: 900, color: '#94a3b8', letterSpacing: '.14em', padding: '0 12px 12px'}}>ESTUDIO</div>
    {nav.map((item) => {
      const on = item.key === active;
      return <div key={item.key} style={{height: 58, borderRadius: 15, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', marginBottom: 7, background: on ? '#eef4ff' : 'transparent', color: on ? BRAND : '#64748b', fontWeight: on ? 900 : 750, fontSize: 17, border: on ? '1px solid #dbeafe' : '1px solid transparent'}}><Icon type={item.key} active={on} />{item.label}</div>;
    })}
  </div>
);

const Summary: React.FC<{frame: number}> = ({frame}) => {
  const rows = [
    ['Segmentación de mercado', 'Dividir el mercado en grupos con necesidades y comportamientos similares.'],
    ['Posicionamiento', 'Definir qué lugar busca ocupar una marca frente a sus alternativas.'],
    ['Propuesta de valor', 'Explicar por qué una persona debería elegir una oferta sobre otra.'],
  ];
  return <div style={{padding: 34}}>
    <div style={{fontSize: 14, color: BRAND, fontWeight: 900, letterSpacing: '.13em'}}>RESUMEN</div>
    <div style={{fontSize: 31, fontWeight: 950, color: INK, marginTop: 8}}>Qué tenés que saber para el parcial</div>
    <div style={{marginTop: 25, padding: 22, borderRadius: 20, background: 'linear-gradient(135deg,#f8fbff,#f5f3ff)', border: '1px solid #dbeafe', fontSize: 18, lineHeight: 1.5, color: '#475569'}}>Evaluo ordena el contenido del PDF y te deja una guía clara para empezar a estudiar.</div>
    <div style={{marginTop: 24, display: 'flex', flexDirection: 'column', gap: 13}}>
      {rows.map(([title, body], index) => {const show = rr(frame, [326 + index * 8, 350 + index * 8], [0, 1]); return <div key={title} style={{minHeight: 100, borderRadius: 18, border: `1px solid ${LINE}`, background: '#fff', padding: '17px 19px', opacity: show, transform: `translateY(${(1 - show) * 18}px)`}}><div style={{fontSize: 17, fontWeight: 900, color: INK}}>{title}</div><div style={{fontSize: 14, lineHeight: 1.45, color: MUTED, marginTop: 6}}>{body}</div></div>;})}
    </div>
  </div>;
};

const Glossary: React.FC<{frame: number}> = ({frame}) => {
  const terms = [
    ['Segmentación', 'Proceso de agrupar consumidores con características o necesidades similares.'],
    ['Posicionamiento', 'Lugar que una marca busca ocupar en la mente del público objetivo.'],
    ['Propuesta de valor', 'Beneficio diferencial que explica por qué elegir una oferta.'],
  ];
  return <div style={{padding: 34}}>
    <div style={{fontSize: 14, color: BRAND, fontWeight: 900, letterSpacing: '.13em'}}>GLOSARIO</div>
    <div style={{fontSize: 31, fontWeight: 950, color: INK, marginTop: 8}}>Definiciones del mismo material</div>
    <div style={{marginTop: 26, display: 'flex', flexDirection: 'column', gap: 14}}>
      {terms.map(([term, definition], index) => {const show = rr(frame, [405 + index * 8, 430 + index * 8], [0, 1]); return <div key={term} style={{minHeight: 130, borderRadius: 20, border: `1px solid ${LINE}`, background: '#fff', padding: 21, opacity: show, transform: `translateX(${(1 - show) * 22}px)`}}><div style={{display: 'flex', alignItems: 'center', gap: 13}}><div style={{width: 42, height: 42, borderRadius: 13, background: '#eff6ff', position: 'relative', flexShrink: 0}}><div style={{position: 'absolute', left: 10, top: 9, width: 8, height: 24, border: `2px solid ${BRAND}`, borderRadius: 4}} /><div style={{position: 'absolute', right: 10, top: 9, width: 8, height: 24, border: `2px solid ${BRAND}`, borderRadius: 4}} /></div><div style={{fontSize: 20, fontWeight: 900, color: INK}}>{term}</div></div><div style={{fontSize: 15, lineHeight: 1.45, color: MUTED, marginTop: 11}}>{definition}</div></div>;})}
    </div>
  </div>;
};

const Flashcards: React.FC<{frame: number}> = ({frame}) => {
  const flip = rr(frame, [540, 568], [0, 180]);
  return <div style={{padding: 34}}>
    <div style={{fontSize: 14, color: BRAND, fontWeight: 900, letterSpacing: '.13em'}}>FLASHCARDS</div>
    <div style={{fontSize: 31, fontWeight: 950, color: INK, marginTop: 8}}>Pasá de leer a recordar</div>
    <div style={{height: 450, marginTop: 34, perspective: 1200, position: 'relative'}}>
      <div style={{position: 'absolute', inset: '0 26px', transformStyle: 'preserve-3d', transform: `rotateY(${flip}deg)`}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 26, border: `1px solid ${LINE}`, background: '#fff', boxShadow: '0 18px 46px rgba(15,23,42,.09)', backfaceVisibility: 'hidden', padding: 38, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}><div style={{fontSize: 15, color: BRAND, fontWeight: 900}}>PREGUNTA</div><div style={{fontSize: 30, lineHeight: 1.18, fontWeight: 950, color: INK}}>¿Qué diferencia hay entre segmentación y posicionamiento?</div><div style={{fontSize: 15, color: MUTED}}>Click para ver la respuesta</div></div>
        <div style={{position: 'absolute', inset: 0, borderRadius: 26, border: `1px solid ${LINE}`, background: 'linear-gradient(145deg,#eff6ff,#f5f3ff)', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', padding: 38, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}><div style={{fontSize: 15, color: BRAND2, fontWeight: 900}}>RESPUESTA</div><div style={{fontSize: 26, lineHeight: 1.35, fontWeight: 850, color: INK}}>La segmentación define grupos de público; el posicionamiento define el lugar que la marca quiere ocupar frente a ellos.</div><div style={{fontSize: 15, color: MUTED}}>Generada desde el mismo PDF</div></div>
      </div>
    </div>
  </div>;
};

const Exam: React.FC<{frame: number}> = ({frame}) => {
  const selected = frame >= 700;
  const options = ['Una lista de segmentos de mercado', 'El beneficio diferencial por el que elegir una oferta', 'El precio promedio del mercado'];
  return <div style={{padding: 34}}>
    <div style={{fontSize: 14, color: BRAND, fontWeight: 900, letterSpacing: '.13em'}}>EXAMEN</div>
    <div style={{fontSize: 31, fontWeight: 950, color: INK, marginTop: 8}}>Comprobá si realmente lo entendiste</div>
    <div style={{marginTop: 26, padding: 24, borderRadius: 20, background: '#f8fafc', border: `1px solid ${LINE}`}}><div style={{fontSize: 15, fontWeight: 900, color: BRAND}}>Pregunta 1 de 5</div><div style={{fontSize: 21, lineHeight: 1.35, fontWeight: 900, color: INK, marginTop: 12}}>¿Cuál describe mejor una propuesta de valor?</div></div>
    <div style={{marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12}}>{options.map((option, index) => {const correct = index === 1; const on = selected && correct; return <div key={option} style={{minHeight: 76, borderRadius: 17, border: `2px solid ${on ? '#86efac' : LINE}`, background: on ? '#f0fdf4' : '#fff', padding: '17px 19px', display: 'flex', alignItems: 'center', gap: 13}}><div style={{width: 26, height: 26, borderRadius: 99, border: `2px solid ${on ? '#22c55e' : '#cbd5e1'}`, background: on ? '#22c55e' : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900}}>{on ? '✓' : ''}</div><div style={{fontSize: 16, lineHeight: 1.4, color: INK, fontWeight: 750}}>{option}</div></div>;})}</div>
    <div style={{marginTop: 18, opacity: selected ? 1 : 0, padding: '16px 18px', borderRadius: 16, background: '#ecfdf5', color: '#166534', fontSize: 15, fontWeight: 800}}>Correcto. Evaluo te muestra qué dominás y qué necesitás reforzar.</div>
  </div>;
};

const WorkspaceOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = rr(frame, [310, 330, 770, 795], [0, 1, 1, 0]);
  const active: Tab = frame < 395 ? 'summary' : frame < 510 ? 'glossary' : frame < 630 ? 'cards' : 'exam';
  const summaryO = rr(frame, [320, 335, 380, 397], [0, 1, 1, 0]);
  const glossaryO = rr(frame, [384, 402, 494, 512], [0, 1, 1, 0]);
  const cardsO = rr(frame, [498, 516, 614, 632], [0, 1, 1, 0]);
  const examO = rr(frame, [618, 638, 770, 790], [0, 1, 1, 0]);
  let x = 690; let y = 1020; let click = 0;
  if (frame < 380) {x = rr(frame, [330, 378], [690, 200]); y = rr(frame, [330, 378], [1010, 634]);}
  else if (frame < 405) {x = 200; y = 634; click = rr(frame, [388, 394, 401], [0, 1, 0]);}
  else if (frame < 495) {x = rr(frame, [405, 493], [200, 200]); y = rr(frame, [405, 493], [634, 699]);}
  else if (frame < 520) {x = 200; y = 699; click = rr(frame, [500, 506, 513], [0, 1, 0]);}
  else if (frame < 570) {x = rr(frame, [520, 552], [200, 650]); y = rr(frame, [520, 552], [699, 1040]); click = rr(frame, [546, 552, 560], [0, 1, 0]);}
  else if (frame < 625) {x = rr(frame, [570, 620], [650, 200]); y = rr(frame, [570, 620], [1040, 764]);}
  else if (frame < 645) {x = 200; y = 764; click = rr(frame, [630, 636, 643], [0, 1, 0]);}
  else {x = rr(frame, [645, 700], [200, 590]); y = rr(frame, [645, 700], [764, 990]); click = rr(frame, [694, 700, 708], [0, 1, 0]);}
  const camera = rr(frame, [310, 340, 770, 795], [0.96, 1, 1, 0.97]);

  return <AbsoluteFill style={{opacity, background: BG}}>
    <TopBrand tag="Del PDF al estudio, sin cambiar de lugar" />
    <div style={{position: 'absolute', top: 205, left: 52, right: 52, textAlign: 'center'}}><div style={{fontSize: 67, lineHeight: 1, fontWeight: 950, letterSpacing: '-0.062em', color: INK}}>Un recorrido. Cuatro herramientas.</div><div style={{fontSize: 27, color: MUTED, marginTop: 15}}>Resumen → Glosario → Flashcards → Examen</div></div>
    <div style={{position: 'absolute', top: 430, left: 90, right: 90, display: 'flex', justifyContent: 'center', transform: `scale(${camera})`}}>
      <BrowserWindow><div style={{height: 1120, display: 'flex', position: 'relative'}}><Sidebar active={active} /><div style={{flex: 1, position: 'relative', overflow: 'hidden'}}><div style={{position: 'absolute', inset: 0, opacity: summaryO}}><Summary frame={frame} /></div><div style={{position: 'absolute', inset: 0, opacity: glossaryO}}><Glossary frame={frame} /></div><div style={{position: 'absolute', inset: 0, opacity: cardsO}}><Flashcards frame={frame} /></div><div style={{position: 'absolute', inset: 0, opacity: examO}}><Exam frame={frame} /></div></div></div></BrowserWindow>
    </div>
    <Mouse x={x} y={y} click={click} />
  </AbsoluteFill>;
};

const FinalOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = rr(frame, [775, 810], [0, 1]);
  const p = spring({frame: Math.max(0, frame - 790), fps, config: {damping: 14, stiffness: 105}});
  return <AbsoluteFill style={{opacity, background: 'radial-gradient(circle at 50% 42%,rgba(37,99,235,.18),rgba(248,250,255,.8) 34%,#f8faff 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{textAlign: 'center', transform: `translateY(${(1 - p) * 42}px) scale(${0.94 + p * 0.06})`}}><div style={{display: 'flex', justifyContent: 'center'}}><Brand large /></div><div style={{fontSize: 82, lineHeight: 0.98, fontWeight: 950, letterSpacing: '-0.072em', color: INK, marginTop: 46}}>Un PDF.<br />Todo tu estudio.</div><div style={{display: 'flex', justifyContent: 'center', gap: 12, marginTop: 36, flexWrap: 'wrap', width: 820}}>{['Resumen', 'Glosario', 'Flashcards', 'Examen'].map((item, index) => {const show = rr(frame, [810 + index * 8, 835 + index * 8], [0, 1]); return <div key={item} style={{padding: '13px 19px', borderRadius: 999, border: `1px solid ${LINE}`, background: '#fff', color: index % 2 === 0 ? BRAND : BRAND2, fontSize: 19, fontWeight: 900, opacity: show}}>{item}</div>;})}</div><div style={{fontSize: 30, color: MUTED, marginTop: 42}}>Subí tu próximo PDF en evaluo.com.ar</div></div>
  </AbsoluteFill>;
};

export const EvaluoPdfVideoPolished: React.FC = () => (
  <AbsoluteFill style={{fontFamily: 'Inter, Arial, sans-serif', background: BG, overflow: 'hidden'}}>
    <EvaluoPdfVideo />
    <WorkspaceOverlay />
    <FinalOverlay />
  </AbsoluteFill>
);
