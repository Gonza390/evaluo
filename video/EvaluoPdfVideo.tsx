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
const BG = '#f8faff';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const range = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, clamp);

const sceneOpacity = (frame: number, start: number, inEnd: number, outStart: number, end: number) =>
  range(frame, [start, inEnd, outStart, end], [0, 1, 1, 0]);

const Brand: React.FC<{large?: boolean}> = ({large = false}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: large ? 18 : 12}}>
    <Img
      src={staticFile('icon.png')}
      style={{
        width: large ? 68 : 46,
        height: large ? 68 : 46,
        objectFit: 'contain',
      }}
    />
    <div
      style={{
        color: INK,
        fontWeight: 900,
        fontSize: large ? 46 : 30,
        letterSpacing: '-0.055em',
      }}
    >
      Evaluo
    </div>
  </div>
);

const Ambient: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 45) * 42;
  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 1000,
          borderRadius: 999,
          left: -470 + drift,
          top: -480,
          background: 'radial-gradient(circle, rgba(37,99,235,.18), rgba(37,99,235,0) 67%)',
          filter: 'blur(18px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 930,
          height: 930,
          borderRadius: 999,
          right: -440 - drift,
          bottom: -430,
          background: 'radial-gradient(circle, rgba(99,102,241,.16), rgba(99,102,241,0) 68%)',
          filter: 'blur(24px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.22,
          backgroundImage:
            'linear-gradient(rgba(15,23,42,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.035) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          transform: `translateY(${(frame * 0.18) % 64}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const TopBrand: React.FC<{tag?: string}> = ({tag}) => (
  <div
    style={{
      position: 'absolute',
      top: 72,
      left: 62,
      right: 62,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}
  >
    <Brand />
    {tag ? (
      <div
        style={{
          padding: '11px 17px',
          borderRadius: 999,
          background: 'rgba(255,255,255,.82)',
          border: `1px solid ${LINE}`,
          color: MUTED,
          fontSize: 17,
          fontWeight: 750,
          backdropFilter: 'blur(12px)',
        }}
      >
        {tag}
      </div>
    ) : null}
  </div>
);

const AppWindow: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    style={{
      width: 900,
      borderRadius: 34,
      overflow: 'hidden',
      background: 'rgba(255,255,255,.97)',
      border: `1px solid ${LINE}`,
      boxShadow: '0 34px 90px rgba(15,23,42,.14)',
      ...style,
    }}
  >
    <div
      style={{
        height: 62,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '0 22px',
        borderBottom: `1px solid ${LINE}`,
        background: '#f8fafc',
      }}
    >
      <div style={{width: 11, height: 11, borderRadius: 99, background: '#cbd5e1'}} />
      <div style={{width: 11, height: 11, borderRadius: 99, background: '#cbd5e1'}} />
      <div style={{width: 11, height: 11, borderRadius: 99, background: '#cbd5e1'}} />
      <div
        style={{
          marginLeft: 10,
          flex: 1,
          height: 32,
          borderRadius: 10,
          background: '#fff',
          border: `1px solid ${LINE}`,
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 14,
          fontSize: 14,
        }}
      >
        evaluo.com.ar
      </div>
    </div>
    {children}
  </div>
);

const Pdf: React.FC<{title?: string; scale?: number}> = ({title = 'Apuntes-del-parcial.pdf', scale = 1}) => (
  <div
    style={{
      width: 390,
      height: 540,
      borderRadius: 28,
      background: '#fff',
      border: `1px solid ${LINE}`,
      boxShadow: '0 26px 64px rgba(15,23,42,.14)',
      padding: 32,
      transform: `scale(${scale})`,
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <div
        style={{
          padding: '7px 10px',
          borderRadius: 9,
          background: '#fef2f2',
          color: '#dc2626',
          fontWeight: 900,
          fontSize: 15,
        }}
      >
        PDF
      </div>
      <div style={{color: '#94a3b8', fontSize: 14}}>material</div>
    </div>
    <div style={{marginTop: 24, color: INK, fontSize: 25, fontWeight: 850}}>{title}</div>
    <div style={{marginTop: 32}}>
      {[92, 70, 86, 96, 65, 84, 73, 91, 58, 80, 68].map((width, index) => (
        <div
          key={`${width}-${index}`}
          style={{
            width: `${width}%`,
            height: index === 0 ? 14 : 9,
            marginBottom: index === 0 ? 23 : 15,
            borderRadius: 99,
            background: index === 0 ? '#cbd5e1' : '#e5e7eb',
          }}
        />
      ))}
    </div>
  </div>
);

const Cursor: React.FC<{x: number; y: number; pulse?: number}> = ({x, y, pulse = 0}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      zIndex: 70,
      transform: `scale(${1 - pulse * 0.12})`,
      filter: 'drop-shadow(0 7px 8px rgba(15,23,42,.28))',
    }}
  >
    <div
      style={{
        width: 0,
        height: 0,
        borderTop: '31px solid #111827',
        borderRight: '18px solid transparent',
        transform: 'rotate(-26deg)',
      }}
    />
    {pulse > 0 ? (
      <div
        style={{
          position: 'absolute',
          left: -15 - pulse * 12,
          top: -15 - pulse * 12,
          width: 42 + pulse * 24,
          height: 42 + pulse * 24,
          borderRadius: 99,
          border: `3px solid rgba(37,99,235,${0.65 - pulse * 0.45})`,
        }}
      />
    ) : null}
  </div>
);

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = sceneOpacity(frame, 0, 10, 88, 125);
  const intro = spring({frame, fps, config: {damping: 15, stiffness: 110}});
  const spread = range(frame, [5, 70], [0, 1]);
  const exit = range(frame, [82, 128], [0, 1]);

  return (
    <AbsoluteFill style={{opacity}}>
      <TopBrand tag="Tu PDF puede hacer mucho más" />
      <div
        style={{
          position: 'absolute',
          top: 245,
          left: 60,
          right: 60,
          textAlign: 'center',
          transform: `translateY(${(1 - intro) * 45}px)`,
        }}
      >
        <div style={{fontSize: 82, lineHeight: 0.98, fontWeight: 950, letterSpacing: '-0.07em', color: INK}}>
          Tenés el PDF.
          <br />
          Falta estudiarlo.
        </div>
        <div style={{marginTop: 25, color: MUTED, fontSize: 30}}>Evaluo convierte el material en acciones concretas.</div>
      </div>

      <div style={{position: 'absolute', top: 710, left: 0, right: 0, height: 830}}>
        {[4, 3, 2, 1, 0].map((index) => {
          const x = (index - 2) * 46 * spread;
          const y = index * 17 * spread - exit * 300;
          const rot = (index - 2) * 3.2 * spread;
          const scale = 0.86 + index * 0.026 - exit * 0.15;
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: '50%',
                transform: `translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${rot}deg) scale(${scale})`,
                transformOrigin: 'center top',
              }}
            >
              <Pdf />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const UploadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = sceneOpacity(frame, 88, 115, 224, 266);
  const t = Math.max(0, frame - 88);
  const enter = spring({frame: t, fps, config: {damping: 16, stiffness: 105}});
  const drop = range(t, [20, 72], [0, 1]);
  const processing = range(t, [82, 150], [0, 1]);
  const click = range(t, [66, 73, 83], [0, 1, 0]);

  return (
    <AbsoluteFill style={{opacity}}>
      <TopBrand tag="1 PDF → 4 herramientas de estudio" />
      <div style={{position: 'absolute', top: 215, left: 60, right: 60, textAlign: 'center'}}>
        <div style={{fontSize: 70, fontWeight: 950, letterSpacing: '-0.065em', color: INK}}>Subilo una vez.</div>
        <div style={{fontSize: 30, color: MUTED, marginTop: 14}}>Evaluo procesa el contenido y prepara tu estudio.</div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 500,
          left: 90,
          right: 90,
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${0.92 + enter * 0.08})`,
        }}
      >
        <AppWindow>
          <div style={{height: 960, padding: 46, position: 'relative'}}>
            <div style={{fontSize: 26, fontWeight: 850, color: INK}}>Nuevo material</div>
            <div
              style={{
                marginTop: 28,
                height: 690,
                borderRadius: 30,
                border: `2px dashed ${processing > 0.1 ? '#a5b4fc' : BRAND}`,
                background: 'linear-gradient(180deg,#fafcff,#f3f7ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg,transparent,rgba(37,99,235,.09),transparent)',
                  transform: `translateX(${range(t, [82, 150], [-900, 900])}px)`,
                }}
              />

              <div style={{opacity: 1 - processing, textAlign: 'center'}}>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    margin: '0 auto',
                    borderRadius: 27,
                    background: `linear-gradient(145deg,${BRAND},${BRAND2})`,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 47,
                    fontWeight: 900,
                    boxShadow: '0 20px 46px rgba(37,99,235,.26)',
                  }}
                >
                  ↑
                </div>
                <div style={{fontSize: 31, fontWeight: 900, color: INK, marginTop: 25}}>Arrastrá tu PDF</div>
                <div style={{fontSize: 20, color: MUTED, marginTop: 10}}>y dejá que Evaluo prepare el resto</div>
              </div>

              <div style={{position: 'absolute', left: 72, right: 72, top: 150, opacity: processing}}>
                <div style={{textAlign: 'center', color: MUTED, fontSize: 21}}>Analizando material...</div>
                <div style={{textAlign: 'center', color: INK, fontSize: 40, fontWeight: 950, marginTop: 10}}>
                  Armando tu estudio
                </div>
                <div style={{height: 13, borderRadius: 99, background: '#dbeafe', overflow: 'hidden', marginTop: 42}}>
                  <div
                    style={{
                      height: '100%',
                      width: `${processing * 100}%`,
                      borderRadius: 99,
                      background: `linear-gradient(90deg,${BRAND},${BRAND2})`,
                    }}
                  />
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 38}}>
                  {['Resumen', 'Glosario', 'Flashcards', 'Examen'].map((label, index) => {
                    const show = range(processing, [index * 0.16, Math.min(1, index * 0.16 + 0.42)], [0, 1]);
                    return (
                      <div
                        key={label}
                        style={{
                          height: 82,
                          borderRadius: 20,
                          border: `1px solid ${LINE}`,
                          background: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 13,
                          padding: '0 19px',
                          opacity: show,
                          transform: `translateY(${(1 - show) * 20}px)`,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: '#eff6ff',
                            color: BRAND,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 19,
                            fontWeight: 900,
                          }}
                        >
                          ✓
                        </div>
                        <div style={{fontSize: 21, fontWeight: 850, color: INK}}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </AppWindow>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 330,
          top: 1100,
          opacity: 1 - processing,
          transform: `translate(${range(drop, [0, 1], [-250, 105])}px, ${range(drop, [0, 1], [230, -190])}px) scale(${range(
            drop,
            [0, 1],
            [0.66, 0.4],
          )}) rotate(${range(drop, [0, 1], [-8, 0])}deg)`,
        }}
      >
        <Pdf />
      </div>
      <Cursor x={range(t, [18, 72], [760, 520])} y={range(t, [18, 72], [1320, 900])} pulse={click} />
    </AbsoluteFill>
  );
};

const HubScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = sceneOpacity(frame, 220, 246, 330, 370);
  const t = Math.max(0, frame - 220);
  const center = spring({frame: t, fps, config: {damping: 15, stiffness: 112}});
  const cards = [
    ['Resumen', '≡', 115, 770],
    ['Glosario', 'Aa', 595, 770],
    ['Flashcards', '↻', 115, 1155],
    ['Examen', '✓', 595, 1155],
  ] as const;

  return (
    <AbsoluteFill style={{opacity}}>
      <TopBrand tag="Todo sale del mismo PDF" />
      <div style={{position: 'absolute', top: 215, left: 55, right: 55, textAlign: 'center'}}>
        <div style={{fontSize: 70, fontWeight: 950, letterSpacing: '-0.065em', color: INK}}>Un archivo. Todo tu estudio.</div>
        <div style={{fontSize: 29, color: MUTED, marginTop: 17}}>Pasá de entender a practicar sin empezar de cero.</div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 1015,
          width: 215,
          height: 215,
          borderRadius: 52,
          transform: `translate(-50%,-50%) scale(${0.74 + center * 0.26})`,
          background: '#fff',
          border: `1px solid ${LINE}`,
          boxShadow: '0 30px 78px rgba(37,99,235,.23)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <Img src={staticFile('icon.png')} style={{width: 128, height: 128, objectFit: 'contain'}} />
      </div>

      {cards.map(([label, icon, x, y], index) => {
        const show = spring({frame: Math.max(0, t - 15 - index * 8), fps, config: {damping: 16, stiffness: 120}});
        return (
          <div
            key={label}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 370,
              height: 190,
              borderRadius: 30,
              background: '#fff',
              border: `1px solid ${LINE}`,
              boxShadow: '0 22px 54px rgba(15,23,42,.09)',
              padding: 28,
              opacity: show,
              transform: `translateY(${(1 - show) * 50}px) scale(${0.9 + show * 0.1})`,
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                background: '#eff6ff',
                color: BRAND,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 25,
              }}
            >
              {icon}
            </div>
            <div style={{fontSize: 29, color: INK, fontWeight: 900, marginTop: 18}}>{label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const FeatureFrame: React.FC<{
  opacity: number;
  label: string;
  title: string;
  children: React.ReactNode;
  zoom?: number;
}> = ({opacity, label, title, children, zoom = 1}) => (
  <AbsoluteFill style={{opacity}}>
    <TopBrand tag={label} />
    <div style={{position: 'absolute', top: 210, left: 56, right: 56, textAlign: 'center'}}>
      <div style={{fontSize: 69, lineHeight: 1, fontWeight: 950, letterSpacing: '-0.065em', color: INK}}>{title}</div>
    </div>
    <div
      style={{
        position: 'absolute',
        top: 420,
        left: 80,
        right: 80,
        display: 'flex',
        justifyContent: 'center',
        transform: `scale(${zoom})`,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 330, 356, 438, 478);
  const t = Math.max(0, frame - 330);
  const rows = [
    'Conceptos centrales del material',
    'Ideas clave para el parcial',
    'Contenido ordenado para repasar',
  ];

  return (
    <FeatureFrame opacity={opacity} label="Resumen" title="Entendé primero lo importante." zoom={range(t, [0, 35], [0.94, 1])}>
      <AppWindow>
        <div style={{height: 1090, padding: 46}}>
          <div style={{fontSize: 17, color: BRAND, fontWeight: 900, letterSpacing: '.14em'}}>RESUMEN</div>
          <div style={{fontSize: 35, color: INK, fontWeight: 950, marginTop: 10}}>Tu PDF, condensado y ordenado</div>
          <div
            style={{
              marginTop: 34,
              borderRadius: 24,
              padding: 29,
              border: '1px solid #dbeafe',
              background: 'linear-gradient(135deg,#f8fbff,#f5f3ff)',
              fontSize: 22,
              lineHeight: 1.5,
              color: '#334155',
            }}
          >
            Evaluo identifica los temas principales y los convierte en una guía clara para empezar a estudiar.
          </div>
          <div style={{fontSize: 22, fontWeight: 900, color: INK, marginTop: 34}}>Puntos clave</div>
          <div style={{marginTop: 19, display: 'flex', flexDirection: 'column', gap: 16}}>
            {rows.map((row, index) => {
              const show = range(t, [25 + index * 10, 52 + index * 10], [0, 1]);
              return (
                <div
                  key={row}
                  style={{
                    height: 112,
                    borderRadius: 22,
                    border: `1px solid ${LINE}`,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    padding: '0 22px',
                    opacity: show,
                    transform: `translateX(${(1 - show) * 55}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 13,
                      background: BRAND,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 19,
                      fontWeight: 900,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{fontSize: 22, fontWeight: 750, color: '#334155'}}>{row}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AppWindow>
    </FeatureFrame>
  );
};

const GlossaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 435, 462, 548, 588);
  const t = Math.max(0, frame - 435);
  const terms = [
    ['Recuperación activa', 'Intentar recordar una idea antes de volver a consultar el material.'],
    ['Autoevaluación', 'Comprobar qué podés explicar o resolver sin mirar los apuntes.'],
    ['Retroalimentación', 'Información que te ayuda a detectar errores y ajustar el estudio.'],
  ];

  return (
    <FeatureFrame opacity={opacity} label="Glosario" title="Dominá los conceptos clave." zoom={range(t, [0, 35], [0.94, 1])}>
      <AppWindow>
        <div style={{height: 1090, padding: 46}}>
          <div style={{fontSize: 17, color: BRAND, fontWeight: 900, letterSpacing: '.14em'}}>GLOSARIO</div>
          <div style={{fontSize: 35, color: INK, fontWeight: 950, marginTop: 10}}>Definiciones del mismo material</div>
          <div style={{marginTop: 40, display: 'flex', flexDirection: 'column', gap: 19}}>
            {terms.map(([term, definition], index) => {
              const show = spring({frame: Math.max(0, t - 18 - index * 12), fps: 30, config: {damping: 16, stiffness: 115}});
              return (
                <div
                  key={term}
                  style={{
                    height: 220,
                    borderRadius: 26,
                    border: `1px solid ${LINE}`,
                    background: '#fff',
                    boxShadow: '0 14px 34px rgba(15,23,42,.055)',
                    padding: 28,
                    opacity: show,
                    transform: `translateY(${(1 - show) * 52}px) scale(${0.95 + show * 0.05})`,
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 15,
                        background: '#eff6ff',
                        color: BRAND,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 20,
                      }}
                    >
                      Aa
                    </div>
                    <div style={{fontSize: 27, fontWeight: 900, color: INK}}>{term}</div>
                  </div>
                  <div style={{fontSize: 21, lineHeight: 1.45, color: MUTED, marginTop: 21}}>{definition}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AppWindow>
    </FeatureFrame>
  );
};

const FlashcardsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 545, 574, 704, 744);
  const t = Math.max(0, frame - 545);
  const flip = range(t, [55, 90], [0, 180]);
  const slide = range(t, [122, 160], [0, -760]);
  const next = range(t, [128, 160], [760, 0]);
  const face: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 34,
    backfaceVisibility: 'hidden',
    padding: 48,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };

  return (
    <FeatureFrame opacity={opacity} label="Flashcards" title="Convertí lectura en memoria." zoom={range(t, [0, 35], [0.94, 1])}>
      <AppWindow>
        <div style={{height: 1090, padding: 46, overflow: 'hidden'}}>
          <div style={{fontSize: 17, color: BRAND, fontWeight: 900, letterSpacing: '.14em'}}>FLASHCARDS</div>
          <div style={{fontSize: 35, color: INK, fontWeight: 950, marginTop: 10}}>Repasá activamente</div>
          <div style={{height: 660, marginTop: 52, position: 'relative', perspective: 1500}}>
            <div
              style={{
                position: 'absolute',
                left: 42,
                top: 0,
                width: 720,
                height: 590,
                transformStyle: 'preserve-3d',
                transform: `translateX(${slide}px) rotateY(${flip}deg)`,
              }}
            >
              <div
                style={{
                  ...face,
                  background: 'linear-gradient(145deg,#fff,#f5f8ff)',
                  border: '1px solid #cfe0ff',
                  boxShadow: '0 28px 68px rgba(37,99,235,.13)',
                }}
              >
                <div style={{fontSize: 18, fontWeight: 900, color: BRAND, letterSpacing: '.14em'}}>PREGUNTA</div>
                <div style={{fontSize: 45, lineHeight: 1.15, fontWeight: 950, color: INK}}>
                  ¿Qué es la recuperación activa?
                </div>
                <div style={{fontSize: 21, color: MUTED}}>Tocá para ver la respuesta</div>
              </div>
              <div
                style={{
                  ...face,
                  transform: 'rotateY(180deg)',
                  background: `linear-gradient(145deg,${BRAND},${BRAND2})`,
                  color: '#fff',
                  boxShadow: '0 30px 75px rgba(37,99,235,.25)',
                }}
              >
                <div style={{fontSize: 18, fontWeight: 900, opacity: 0.76, letterSpacing: '.14em'}}>RESPUESTA</div>
                <div style={{fontSize: 38, lineHeight: 1.28, fontWeight: 850}}>
                  Intentar recordar una idea antes de volver a mirar el material.
                </div>
                <div style={{fontSize: 21, opacity: 0.82}}>Recordá. Comprobá. Repetí.</div>
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                left: 42,
                top: 0,
                width: 720,
                height: 590,
                borderRadius: 34,
                background: '#fff',
                border: `1px solid ${LINE}`,
                boxShadow: '0 28px 68px rgba(15,23,42,.11)',
                padding: 48,
                boxSizing: 'border-box',
                transform: `translateX(${next}px)`,
              }}
            >
              <div style={{fontSize: 18, fontWeight: 900, color: BRAND, letterSpacing: '.14em'}}>SIGUIENTE</div>
              <div style={{fontSize: 45, lineHeight: 1.15, fontWeight: 950, color: INK, marginTop: 135}}>
                ¿Para qué sirve la autoevaluación?
              </div>
              <div style={{fontSize: 21, color: MUTED, marginTop: 55}}>Seguí hasta dominar el tema.</div>
            </div>
          </div>
        </div>
      </AppWindow>
    </FeatureFrame>
  );
};

const ExamScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneOpacity(frame, 700, 728, 816, 850);
  const t = Math.max(0, frame - 700);
  const selected = range(t, [70, 88], [0, 1]);
  const options = [
    'Volver a leer el PDF completo',
    'Intentar recuperar una respuesta sin mirar',
    'Copiar el texto en otro documento',
    'Subrayar todas las páginas',
  ];

  return (
    <FeatureFrame opacity={opacity} label="Examen" title="Comprobá si realmente lo sabés." zoom={range(t, [0, 35], [0.94, 1])}>
      <AppWindow>
        <div style={{height: 1090, padding: 46, position: 'relative'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <div style={{fontSize: 17, color: BRAND, fontWeight: 900, letterSpacing: '.14em'}}>EXAMEN</div>
              <div style={{fontSize: 35, color: INK, fontWeight: 950, marginTop: 10}}>Ponete a prueba</div>
            </div>
            <div style={{fontSize: 19, color: MUTED}}>Pregunta 3 de 10</div>
          </div>
          <div style={{fontSize: 34, lineHeight: 1.22, color: INK, fontWeight: 900, marginTop: 58}}>
            ¿Cuál es un ejemplo de recuperación activa?
          </div>
          <div style={{marginTop: 38, display: 'flex', flexDirection: 'column', gap: 15}}>
            {options.map((option, index) => {
              const correct = index === 1;
              const reveal = correct && selected > 0.45;
              const show = spring({frame: Math.max(0, t - 18 - index * 6), fps: 30, config: {damping: 18, stiffness: 120}});
              return (
                <div
                  key={option}
                  style={{
                    minHeight: 96,
                    borderRadius: 22,
                    border: `2px solid ${reveal ? '#22c55e' : LINE}`,
                    background: reveal ? '#f0fdf4' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    padding: '16px 22px',
                    boxSizing: 'border-box',
                    opacity: show,
                    transform: `translateX(${(1 - show) * 55}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      background: reveal ? '#22c55e' : '#f1f5f9',
                      color: reveal ? '#fff' : MUTED,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {reveal ? '✓' : String.fromCharCode(65 + index)}
                  </div>
                  <div style={{fontSize: 20, lineHeight: 1.3, color: INK, fontWeight: 750}}>{option}</div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 32,
              height: 92,
              borderRadius: 23,
              background: INK,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '0 25px',
              opacity: selected,
              transform: `translateY(${(1 - selected) * 24}px)`,
            }}
          >
            <div style={{fontSize: 29}}>✓</div>
            <div>
              <div style={{fontSize: 20, fontWeight: 900}}>Correcto</div>
              <div style={{fontSize: 17, opacity: 0.74, marginTop: 3}}>Detectá qué dominás y qué necesitás reforzar.</div>
            </div>
          </div>
          <Cursor
            x={range(t, [45, 75], [760, 620])}
            y={range(t, [45, 75], [870, 770])}
            pulse={range(t, [72, 78, 87], [0, 1, 0])}
          />
        </div>
      </AppWindow>
    </FeatureFrame>
  );
};

const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = range(frame, [812, 840], [0, 1]);
  const t = Math.max(0, frame - 812);
  const logo = spring({frame: t, fps, config: {damping: 14, stiffness: 105}});
  const cards = [
    ['Resumen', '≡'],
    ['Glosario', 'Aa'],
    ['Flashcards', '↻'],
    ['Examen', '✓'],
  ];

  return (
    <AbsoluteFill style={{opacity}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 42%,rgba(37,99,235,.18),rgba(248,250,255,.7) 34%,#f8faff 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 230,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: logo,
          transform: `scale(${0.74 + logo * 0.26})`,
        }}
      >
        <Brand large />
      </div>
      <div style={{position: 'absolute', top: 430, left: 58, right: 58, textAlign: 'center'}}>
        <div style={{fontSize: 88, lineHeight: 0.97, fontWeight: 950, letterSpacing: '-0.075em', color: INK}}>
          Un PDF.
          <br />
          Todo tu estudio.
        </div>
        <div style={{fontSize: 31, color: MUTED, marginTop: 27}}>Entendé. Aprendé. Practicá. Comprobá.</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 820,
          left: 84,
          right: 84,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
        }}
      >
        {cards.map(([label, icon], index) => {
          const show = spring({frame: Math.max(0, t - 18 - index * 6), fps, config: {damping: 16, stiffness: 115}});
          return (
            <div
              key={label}
              style={{
                height: 180,
                borderRadius: 28,
                background: '#fff',
                border: `1px solid ${LINE}`,
                boxShadow: '0 18px 44px rgba(15,23,42,.075)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: show,
                transform: `translateY(${(1 - show) * 38}px) scale(${0.92 + show * 0.08})`,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 17,
                  background: '#eff6ff',
                  color: BRAND,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 900,
                }}
              >
                {icon}
              </div>
              <div style={{fontSize: 25, color: INK, fontWeight: 900, marginTop: 16}}>{label}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 108,
          right: 108,
          bottom: 170,
          height: 98,
          borderRadius: 27,
          background: `linear-gradient(90deg,${BRAND},${BRAND2})`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 29,
          fontWeight: 900,
          boxShadow: '0 24px 55px rgba(37,99,235,.25)',
          opacity: range(t, [42, 72], [0, 1]),
          transform: `translateY(${range(t, [42, 72], [35, 0])}px)`,
        }}
      >
        Subí tu PDF. Evaluo arma tu estudio.
      </div>
    </AbsoluteFill>
  );
};

export const EvaluoPdfVideo: React.FC = () => (
  <AbsoluteFill
    style={{
      background: BG,
      color: INK,
      fontFamily: 'Inter, Arial, sans-serif',
      overflow: 'hidden',
    }}
  >
    <Ambient />
    <HookScene />
    <UploadScene />
    <HubScene />
    <SummaryScene />
    <GlossaryScene />
    <FlashcardsScene />
    <ExamScene />
    <FinalScene />
  </AbsoluteFill>
);
