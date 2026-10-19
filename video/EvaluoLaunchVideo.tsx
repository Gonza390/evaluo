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
const BRAND_2 = '#6366f1';
const HEADING = '#0f1b3d';
const MUTED = '#64748b';
const BORDER = '#dbe3f0';
const BG = '#f7f9ff';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const fade = (frame: number, start: number, inEnd: number, outStart: number, end: number) =>
  interpolate(frame, [start, inEnd, outStart, end], [0, 1, 1, 0], clamp);

const local = (frame: number, start: number) => Math.max(0, frame - start);

const BrandMark: React.FC<{compact?: boolean}> = ({compact = false}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: compact ? 12 : 18}}>
    <Img
      src={staticFile('icon.svg')}
      style={{
        width: compact ? 46 : 62,
        height: compact ? 46 : 62,
        borderRadius: compact ? 12 : 16,
        boxShadow: '0 12px 34px rgba(37,99,235,.14)',
      }}
    />
    <div
      style={{
        fontSize: compact ? 30 : 42,
        fontWeight: 850,
        letterSpacing: '-0.055em',
        color: HEADING,
      }}
    >
      Evaluo
    </div>
  </div>
);

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 55) * 35;

  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: 999,
          top: -420,
          left: -300 + drift,
          background: 'radial-gradient(circle, rgba(37,99,235,.18), rgba(37,99,235,0) 68%)',
          filter: 'blur(18px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 850,
          height: 850,
          borderRadius: 999,
          bottom: -390,
          right: -320 - drift,
          background: 'radial-gradient(circle, rgba(99,102,241,.16), rgba(99,102,241,0) 68%)',
          filter: 'blur(24px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.28,
          backgroundImage:
            'linear-gradient(rgba(15,27,61,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,27,61,.035) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          transform: `translateY(${(frame * 0.22) % 64}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const TopBar: React.FC<{label?: string}> = ({label}) => (
  <div
    style={{
      position: 'absolute',
      top: 76,
      left: 62,
      right: 62,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 30,
    }}
  >
    <BrandMark compact />
    {label ? (
      <div
        style={{
          padding: '11px 18px',
          borderRadius: 999,
          border: `1px solid ${BORDER}`,
          background: 'rgba(255,255,255,.8)',
          backdropFilter: 'blur(14px)',
          fontSize: 18,
          fontWeight: 700,
          color: MUTED,
        }}
      >
        {label}
      </div>
    ) : null}
  </div>
);

const Window: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({children, style}) => (
  <div
    style={{
      width: 900,
      borderRadius: 34,
      border: `1px solid ${BORDER}`,
      background: 'rgba(255,255,255,.96)',
      boxShadow: '0 34px 90px rgba(15,27,61,.13)',
      overflow: 'hidden',
      ...style,
    }}
  >
    <div
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 24px',
        borderBottom: `1px solid ${BORDER}`,
        background: '#f8faff',
      }}
    >
      {['#fb7185', '#fbbf24', '#34d399'].map((c) => (
        <div key={c} style={{width: 12, height: 12, borderRadius: 99, background: c}} />
      ))}
      <div
        style={{
          height: 32,
          marginLeft: 10,
          flex: 1,
          borderRadius: 10,
          background: '#fff',
          border: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 14,
          fontSize: 15,
          color: '#94a3b8',
        }}
      >
        app.evaluo.ai
      </div>
    </div>
    {children}
  </div>
);

const PdfCard: React.FC<{
  scale?: number;
  rotate?: number;
  opacity?: number;
  title?: string;
}> = ({scale = 1, rotate = 0, opacity = 1, title = 'Material-de-estudio.pdf'}) => (
  <div
    style={{
      width: 410,
      height: 570,
      borderRadius: 28,
      background: '#fff',
      border: `1px solid ${BORDER}`,
      boxShadow: '0 28px 65px rgba(15,27,61,.14)',
      padding: 34,
      transform: `scale(${scale}) rotate(${rotate}deg)`,
      opacity,
    }}
  >
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div
        style={{
          padding: '7px 10px',
          borderRadius: 9,
          color: '#dc2626',
          background: '#fef2f2',
          fontSize: 16,
          fontWeight: 900,
        }}
      >
        PDF
      </div>
      <div style={{fontSize: 14, color: '#94a3b8'}}>documento</div>
    </div>
    <div style={{fontSize: 26, fontWeight: 850, color: HEADING, marginTop: 26}}>{title}</div>
    <div style={{marginTop: 34}}>
      {[90, 74, 94, 80, 62, 88, 70, 96, 66, 82, 57].map((w, i) => (
        <div
          key={`${w}-${i}`}
          style={{
            width: `${w}%`,
            height: i === 0 ? 15 : 10,
            borderRadius: 99,
            background: i === 0 ? '#cbd5e1' : '#e5e7eb',
            marginBottom: i === 0 ? 24 : 16,
          }}
        />
      ))}
    </div>
  </div>
);

const Cursor: React.FC<{x: number; y: number; click?: number}> = ({x, y, click = 0}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      zIndex: 60,
      transform: `scale(${1 - click * 0.12})`,
      transformOrigin: '0 0',
      filter: 'drop-shadow(0 8px 10px rgba(15,27,61,.25))',
    }}
  >
    <div
      style={{
        width: 0,
        height: 0,
        borderTop: '30px solid #0f172a',
        borderRight: '18px solid transparent',
        transform: 'rotate(-28deg)',
      }}
    />
    {click > 0 ? (
      <div
        style={{
          position: 'absolute',
          width: 42 + click * 28,
          height: 42 + click * 28,
          left: -14 - click * 14,
          top: -14 - click * 14,
          border: `3px solid rgba(37,99,235,${0.65 - click * 0.5})`,
          borderRadius: 99,
        }}
      />
    ) : null}
  </div>
);

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame, fps, config: {damping: 14, stiffness: 115}});
  const opacity = fade(frame, 0, 12, 92, 130);
  const stackOut = interpolate(frame, [72, 132], [0, 1], clamp);

  return (
    <AbsoluteFill style={{opacity, fontFamily: 'Inter, Arial, sans-serif'}}>
      <TopBar label="Estudiar no debería empezar ordenando apuntes" />
      <div
        style={{
          position: 'absolute',
          top: 265,
          left: 72,
          right: 72,
          textAlign: 'center',
          transform: `translateY(${(1 - p) * 45}px)`,
        }}
      >
        <div
          style={{
            fontSize: 82,
            lineHeight: 0.98,
            fontWeight: 900,
            color: HEADING,
            letterSpacing: '-0.07em',
          }}
        >
          Un PDF.
          <br />
          Demasiada información.
        </div>
        <div style={{fontSize: 31, color: MUTED, marginTop: 26}}>¿Y ahora qué estudiás primero?</div>
      </div>

      <div style={{position: 'absolute', top: 700, left: 0, right: 0, height: 800}}>
        {[4, 3, 2, 1, 0].map((i) => {
          const spread = interpolate(frame, [0, 70], [0, 1], clamp);
          const x = (i - 2) * 42 * spread;
          const y = i * 15 * spread - stackOut * 230;
          const r = (i - 2) * 3.2 * spread;
          const s = 0.89 + i * 0.025 - stackOut * 0.18;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                transform: `translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${r}deg) scale(${s})`,
                transformOrigin: 'center top',
              }}
            >
              <PdfCard />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const UploadTransform: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = fade(frame, 82, 110, 220, 260);
  const t = local(frame, 82);
  const windowIn = spring({frame: t, fps, config: {damping: 16, stiffness: 105}});
  const drop = interpolate(t, [12, 68], [0, 1], clamp);
  const processing = interpolate(t, [85, 145], [0, 1], clamp);
  const cursorX = interpolate(t, [15, 68], [760, 510], clamp);
  const cursorY = interpolate(t, [15, 68], [1320, 910], clamp);
  const click = interpolate(t, [64, 70, 80], [0, 1, 0], clamp);

  return (
    <AbsoluteFill style={{opacity, fontFamily: 'Inter, Arial, sans-serif'}}>
      <TopBar label="1 archivo → 4 herramientas de estudio" />
      <div
        style={{
          position: 'absolute',
          top: 225,
          left: 64,
          right: 64,
          textAlign: 'center',
          color: HEADING,
          transform: `translateY(${(1 - windowIn) * 35}px)`,
        }}
      >
        <div style={{fontSize: 70, fontWeight: 900, letterSpacing: '-0.065em'}}>Subilo una vez.</div>
        <div style={{fontSize: 31, color: MUTED, marginTop: 14}}>Evaluo transforma el contenido por vos.</div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 500,
          left: 90,
          right: 90,
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${0.92 + windowIn * 0.08})`,
        }}
      >
        <Window>
          <div style={{height: 950, padding: 48, position: 'relative'}}>
            <div style={{fontSize: 26, fontWeight: 850, color: HEADING}}>Nuevo material</div>
            <div
              style={{
                marginTop: 28,
                height: 670,
                borderRadius: 30,
                border: `2px dashed ${processing > 0.15 ? '#93c5fd' : BRAND}`,
                background: 'linear-gradient(180deg,#f8fbff,#f3f7ff)',
                display: 'flex',
                flexDirection: 'column',
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
                  background: `linear-gradient(90deg, transparent, rgba(37,99,235,.08), transparent)`,
                  transform: `translateX(${interpolate(t, [85, 145], [-900, 900], clamp)}px)`,
                }}
              />
              <div
                style={{
                  opacity: 1 - processing,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 94,
                    height: 94,
                    borderRadius: 26,
                    background: BRAND,
                    color: '#fff',
                    fontSize: 46,
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 20px 45px rgba(37,99,235,.24)',
                  }}
                >
                  ↑
                </div>
                <div style={{fontSize: 30, color: HEADING, fontWeight: 850, marginTop: 24}}>Arrastrá tu PDF</div>
                <div style={{fontSize: 20, color: MUTED, marginTop: 10}}>y empezá a estudiar</div>
              </div>

              <div
                style={{
                  position: 'absolute',
                  opacity: processing,
                  left: 80,
                  right: 80,
                  top: 170,
                  textAlign: 'center',
                }}
              >
                <div style={{fontSize: 24, color: MUTED}}>Analizando material...</div>
                <div style={{fontSize: 42, color: HEADING, fontWeight: 900, marginTop: 10}}>
                  Construyendo tu estudio
                </div>
                <div
                  style={{
                    height: 14,
                    borderRadius: 99,
                    background: '#dbeafe',
                    marginTop: 48,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${processing * 100}%`,
                      borderRadius: 99,
                      background: `linear-gradient(90deg, ${BRAND}, ${BRAND_2})`,
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: 38,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                  }}
                >
                  {['Resumen', 'Glosario', 'Flashcards', 'Examen'].map((label, i) => {
                    const item = interpolate(processing, [i * 0.18, i * 0.18 + 0.4], [0, 1], clamp);
                    return (
                      <div
                        key={label}
                        style={{
                          height: 78,
                          borderRadius: 20,
                          border: `1px solid ${BORDER}`,
                          background: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 20px',
                          gap: 14,
                          opacity: item,
                          transform: `translateY(${(1 - item) * 18}px)`,
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: '#eff6ff',
                            color: BRAND,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                          }}
                        >
                          ✓
                        </div>
                        <div style={{fontSize: 22, color: HEADING, fontWeight: 800}}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Window>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 335,
          top: 1110,
          transform: `translate(${interpolate(drop, [0, 1], [-260, 105], clamp)}px, ${interpolate(
            drop,
            [0, 1],
            [210, -185],
            clamp,
          )}px) scale(${interpolate(drop, [0, 1], [0.68, 0.42], clamp)}) rotate(${interpolate(
            drop,
            [0, 1],
            [-8, 0],
            clamp,
          )}deg)`,
          opacity: 1 - processing,
        }}
      >
        <PdfCard />
      </div>
      <Cursor x={cursorX} y={cursorY} click={click} />
    </AbsoluteFill>
  );
};

const Hub: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = fade(frame, 205, 235, 310, 350);
  const t = local(frame, 205);
  const pop = spring({frame: t, fps, config: {damping: 15, stiffness: 110}});
  const labels = [
    {name: 'Resumen', x: 108, y: 750, icon: '≡'},
    {name: 'Glosario', x: 600, y: 750, icon: 'Aa'},
    {name: 'Flashcards', x: 108, y: 1150, icon: '↻'},
    {name: 'Examen', x: 600, y: 1150, icon: '✓'},
  ];

  return (
    <AbsoluteFill style={{opacity, fontFamily: 'Inter, Arial, sans-serif'}}>
      <TopBar label="Tu PDF se convierte en estudio accionable" />
      <div
        style={{
          position: 'absolute',
          top: 220,
          left: 65,
          right: 65,
          textAlign: 'center',
        }}
      >
        <div style={{fontSize: 72, fontWeight: 900, color: HEADING, letterSpacing: '-0.065em'}}>
          Un PDF. Cuatro formas de aprender.
        </div>
        <div style={{fontSize: 30, color: MUTED, marginTop: 18}}>Sin copiar, ordenar ni empezar desde cero.</div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 885,
          transform: `translate(-50%,-50%) scale(${0.75 + pop * 0.25})`,
          width: 220,
          height: 220,
          borderRadius: 52,
          background: `linear-gradient(145deg, ${BRAND}, ${BRAND_2})`,
          boxShadow: '0 30px 80px rgba(37,99,235,.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4,
        }}
      >
        <Img src={staticFile('icon.svg')} style={{width: 118, height: 118, borderRadius: 28}} />
      </div>

      {labels.map((item, i) => {
        const itemIn = spring({frame: Math.max(0, t - 12 - i * 7), fps, config: {damping: 15, stiffness: 120}});
        return (
          <React.Fragment key={item.name}>
            <div
              style={{
                position: 'absolute',
                left: item.x < 300 ? 280 : 540,
                top: item.y + 105,
                width: 270,
                height: 4,
                borderRadius: 99,
                background: 'linear-gradient(90deg,rgba(37,99,235,.12),rgba(37,99,235,.48),rgba(99,102,241,.14))',
                transform: `rotate(${item.x < 300 ? (item.y < 900 ? 27 : -27) : item.y < 900 ? -27 : 27}deg) scaleX(${itemIn})`,
                transformOrigin: item.x < 300 ? 'right center' : 'left center',
                opacity: itemIn,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: item.x,
                top: item.y,
                width: 370,
                height: 190,
                borderRadius: 30,
                background: '#fff',
                border: `1px solid ${BORDER}`,
                boxShadow: '0 22px 55px rgba(15,27,61,.09)',
                padding: 28,
                opacity: itemIn,
                transform: `translateY(${(1 - itemIn) * 48}px) scale(${0.88 + itemIn * 0.12})`,
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
                  fontSize: 26,
                  fontWeight: 900,
                }}
              >
                {item.icon}
              </div>
              <div style={{fontSize: 29, fontWeight: 900, color: HEADING, marginTop: 18}}>{item.name}</div>
            </div>
          </React.Fragment>
        );
      })}

      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontSize: 25,
          color: MUTED,
          opacity: interpolate(t, [65, 100], [0, 1], clamp),
        }}
      >
        Todo sale del mismo material que ya tenías.
      </div>
    </AbsoluteFill>
  );
};

const FeatureShell: React.FC<{
  title: string;
  kicker: string;
  children: React.ReactNode;
  opacity: number;
  zoom?: number;
}> = ({title, kicker, children, opacity, zoom = 1}) => (
  <AbsoluteFill style={{opacity, fontFamily: 'Inter, Arial, sans-serif'}}>
    <TopBar label={kicker} />
    <div style={{position: 'absolute', top: 220, left: 64, right: 64, textAlign: 'center'}}>
      <div
        style={{
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: '-0.065em',
          color: HEADING,
          lineHeight: 1,
        }}
      >
        {title}
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        top: 430,
        left: 78,
        right: 78,
        display: 'flex',
        justifyContent: 'center',
        transform: `scale(${zoom})`,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

const SummaryFeature: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fade(frame, 300, 330, 420, 462);
  const t = local(frame, 300);
  const zoom = interpolate(t, [0, 40], [0.92, 1], clamp);
  const rows = [
    'La IA reconoce patrones, predice y genera contenido.',
    'Machine learning aprende a partir de datos.',
    'La adopción tecnológica exige evaluar riesgos.',
  ];

  return (
    <FeatureShell
      title="Primero, entendé lo importante."
      kicker="Resumen"
      opacity={opacity}
      zoom={zoom}
    >
      <Window>
        <div style={{height: 1090, padding: 45}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <div style={{fontSize: 17, fontWeight: 900, color: BRAND, letterSpacing: '.12em'}}>RESUMEN</div>
              <div style={{fontSize: 34, fontWeight: 900, color: HEADING, marginTop: 10}}>Tu material, condensado</div>
            </div>
            <div style={{padding: '10px 16px', borderRadius: 99, background: '#eff6ff', color: BRAND, fontSize: 18, fontWeight: 800}}>
              listo para repasar
            </div>
          </div>

          <div
            style={{
              marginTop: 34,
              padding: 30,
              borderRadius: 24,
              background: 'linear-gradient(135deg,#f8fbff,#f6f4ff)',
              border: '1px solid #dbeafe',
              fontSize: 23,
              lineHeight: 1.5,
              color: '#334155',
            }}
          >
            Evaluo identifica los conceptos centrales y convierte el documento en una explicación breve y ordenada.
          </div>

          <div style={{marginTop: 34, fontSize: 22, fontWeight: 850, color: HEADING}}>Puntos clave</div>
          <div style={{marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16}}>
            {rows.map((row, i) => {
              const r = spring({frame: Math.max(0, t - 28 - i * 9), fps: 30, config: {damping: 16, stiffness: 115}});
              const glow = interpolate(t, [75 + i * 10, 100 + i * 10], [0, 1], clamp);
              return (
                <div
                  key={row}
                  style={{
                    minHeight: 104,
                    borderRadius: 22,
                    border: `1px solid ${glow > 0.35 ? '#bfdbfe' : BORDER}`,
                    background: glow > 0.35 ? '#f8fbff' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    padding: '18px 22px',
                    opacity: r,
                    transform: `translateX(${(1 - r) * 65}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      background: BRAND,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 19,
                      fontWeight: 900,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{fontSize: 21, lineHeight: 1.35, color: '#334155', fontWeight: 650}}>{row}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Window>
    </FeatureShell>
  );
};

const GlossaryFeature: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fade(frame, 410, 442, 535, 575);
  const t = local(frame, 410);
  const cards = [
    ['Machine learning', 'Métodos que aprenden reglas a partir de ejemplos.'],
    ['Alucinación', 'Respuesta plausible, pero incorrecta o inventada.'],
    ['Inferencia', 'Etapa en la que un modelo aplica lo aprendido.'],
  ];

  return (
    <FeatureShell
      title="Después, dominá los conceptos."
      kicker="Glosario automático"
      opacity={opacity}
      zoom={interpolate(t, [0, 35], [0.94, 1], clamp)}
    >
      <Window>
        <div style={{height: 1090, padding: 46}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div>
              <div style={{fontSize: 17, fontWeight: 900, color: BRAND, letterSpacing: '.12em'}}>GLOSARIO</div>
              <div style={{fontSize: 34, fontWeight: 900, color: HEADING, marginTop: 10}}>Conceptos que tenés que saber</div>
            </div>
            <div style={{fontSize: 20, color: MUTED}}>del mismo PDF</div>
          </div>

          <div style={{marginTop: 44, display: 'flex', flexDirection: 'column', gap: 20}}>
            {cards.map(([term, definition], i) => {
              const r = spring({frame: Math.max(0, t - 22 - i * 13), fps: 30, config: {damping: 15, stiffness: 110}});
              return (
                <div
                  key={term}
                  style={{
                    height: 210,
                    borderRadius: 26,
                    border: `1px solid ${BORDER}`,
                    background: '#fff',
                    boxShadow: '0 14px 35px rgba(15,27,61,.055)',
                    padding: 28,
                    opacity: r,
                    transform: `translateY(${(1 - r) * 55}px) scale(${0.94 + r * 0.06})`,
                  }}
                >
                  <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 15,
                        background: i === 1 ? '#f5f3ff' : '#eff6ff',
                        color: i === 1 ? BRAND_2 : BRAND,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        fontWeight: 900,
                      }}
                    >
                      Aa
                    </div>
                    <div style={{fontSize: 27, fontWeight: 900, color: HEADING}}>{term}</div>
                  </div>
                  <div style={{fontSize: 21, color: MUTED, lineHeight: 1.45, marginTop: 21}}>{definition}</div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 32,
              padding: '20px 26px',
              borderRadius: 22,
              background: '#0f1b3d',
              color: '#fff',
              fontSize: 22,
              fontWeight: 750,
              opacity: interpolate(t, [80, 112], [0, 1], clamp),
              transform: `translateY(${interpolate(t, [80, 112], [24, 0], clamp)}px)`,
            }}
          >
            Del término desconocido → a una definición lista para estudiar.
          </div>
        </div>
      </Window>
    </FeatureShell>
  );
};

const FlashcardsFeature: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fade(frame, 525, 558, 695, 735);
  const t = local(frame, 525);
  const flip = interpolate(t, [62, 92], [0, 180], clamp);
  const slide = interpolate(t, [125, 164], [0, -760], clamp);
  const nextIn = interpolate(t, [132, 164], [760, 0], clamp);

  const faceCommon: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 34,
    backfaceVisibility: 'hidden',
    padding: 48,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  };

  return (
    <FeatureShell
      title="Convertí conceptos en memoria."
      kicker="Flashcards"
      opacity={opacity}
      zoom={interpolate(t, [0, 35], [0.94, 1], clamp)}
    >
      <Window>
        <div style={{height: 1090, padding: 46, overflow: 'hidden'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <div style={{fontSize: 17, fontWeight: 900, color: BRAND, letterSpacing: '.12em'}}>FLASHCARDS</div>
              <div style={{fontSize: 34, fontWeight: 900, color: HEADING, marginTop: 10}}>Repasá activamente</div>
            </div>
            <div style={{fontSize: 20, fontWeight: 800, color: MUTED}}>1 / 12</div>
          </div>

          <div style={{height: 660, marginTop: 50, position: 'relative', perspective: 1500}}>
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
                  ...faceCommon,
                  background: 'linear-gradient(145deg,#ffffff,#f4f8ff)',
                  border: '1px solid #cfe0ff',
                  boxShadow: '0 28px 70px rgba(37,99,235,.13)',
                }}
              >
                <div style={{fontSize: 18, fontWeight: 900, color: BRAND, letterSpacing: '.14em'}}>PREGUNTA</div>
                <div style={{fontSize: 44, lineHeight: 1.15, fontWeight: 900, color: HEADING}}>
                  ¿Qué diferencia hay entre machine learning y deep learning?
                </div>
                <div style={{fontSize: 21, color: MUTED}}>Tocá para ver la respuesta</div>
              </div>
              <div
                style={{
                  ...faceCommon,
                  transform: 'rotateY(180deg)',
                  background: `linear-gradient(145deg, ${BRAND}, ${BRAND_2})`,
                  color: '#fff',
                  boxShadow: '0 30px 75px rgba(37,99,235,.25)',
                }}
              >
                <div style={{fontSize: 18, fontWeight: 900, opacity: 0.76, letterSpacing: '.14em'}}>RESPUESTA</div>
                <div style={{fontSize: 37, lineHeight: 1.28, fontWeight: 800}}>
                  Deep learning es una familia de machine learning basada en redes neuronales profundas.
                </div>
                <div style={{fontSize: 21, opacity: 0.8}}>Una idea. Una tarjeta. Un repaso rápido.</div>
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
                border: `1px solid ${BORDER}`,
                boxShadow: '0 28px 70px rgba(15,27,61,.11)',
                padding: 48,
                transform: `translateX(${nextIn}px)`,
              }}
            >
              <div style={{fontSize: 18, fontWeight: 900, color: BRAND, letterSpacing: '.14em'}}>SIGUIENTE</div>
              <div style={{fontSize: 44, lineHeight: 1.15, fontWeight: 900, color: HEADING, marginTop: 135}}>
                ¿Qué significa “inferencia” en IA?
              </div>
              <div style={{fontSize: 21, color: MUTED, marginTop: 55}}>Seguí hasta dominar el tema.</div>
            </div>
          </div>

          <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20}}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: i === 0 ? 82 : 20,
                  height: 10,
                  borderRadius: 99,
                  background: i === 0 ? BRAND : '#dbe3f0',
                }}
              />
            ))}
          </div>
        </div>
      </Window>
    </FeatureShell>
  );
};

const ExamFeature: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fade(frame, 690, 720, 815, 850);
  const t = local(frame, 690);
  const selected = interpolate(t, [72, 88], [0, 1], clamp);
  const options = [
    'Automatizar cualquier tarea repetitiva',
    'Aplicar un modelo entrenado a nuevos datos',
    'Guardar datos en la nube',
    'Crear una red 5G',
  ];

  return (
    <FeatureShell
      title="Y comprobá si realmente lo sabés."
      kicker="Examen"
      opacity={opacity}
      zoom={interpolate(t, [0, 35], [0.94, 1], clamp)}
    >
      <Window>
        <div style={{height: 1090, padding: 46, position: 'relative'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <div style={{fontSize: 17, fontWeight: 900, color: BRAND, letterSpacing: '.12em'}}>EXAMEN</div>
              <div style={{fontSize: 34, fontWeight: 900, color: HEADING, marginTop: 10}}>Ponete a prueba</div>
            </div>
            <div style={{fontSize: 20, color: MUTED}}>Pregunta 3 de 10</div>
          </div>

          <div style={{fontSize: 34, lineHeight: 1.22, fontWeight: 900, color: HEADING, marginTop: 58}}>
            En inteligencia artificial, ¿qué describe mejor la inferencia?
          </div>

          <div style={{marginTop: 38, display: 'flex', flexDirection: 'column', gap: 16}}>
            {options.map((option, i) => {
              const isCorrect = i === 1;
              const showCorrect = isCorrect && selected > 0.45;
              const rowIn = spring({frame: Math.max(0, t - 18 - i * 6), fps: 30, config: {damping: 18, stiffness: 120}});
              return (
                <div
                  key={option}
                  style={{
                    minHeight: 96,
                    borderRadius: 22,
                    border: `2px solid ${showCorrect ? '#22c55e' : BORDER}`,
                    background: showCorrect ? '#f0fdf4' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    padding: '16px 22px',
                    opacity: rowIn,
                    transform: `translateX(${(1 - rowIn) * 55}px) scale(${showCorrect ? 1 + selected * 0.012 : 1})`,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      background: showCorrect ? '#22c55e' : '#f1f5f9',
                      color: showCorrect ? '#fff' : MUTED,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {showCorrect ? '✓' : String.fromCharCode(65 + i)}
                  </div>
                  <div style={{fontSize: 20, lineHeight: 1.3, color: HEADING, fontWeight: 700}}>{option}</div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 34,
              height: 92,
              borderRadius: 23,
              background: '#0f1b3d',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              padding: '0 26px',
              gap: 16,
              opacity: selected,
              transform: `translateY(${(1 - selected) * 25}px)`,
            }}
          >
            <div style={{fontSize: 29}}>✓</div>
            <div>
              <div style={{fontSize: 20, fontWeight: 850}}>Correcto</div>
              <div style={{fontSize: 17, opacity: 0.72, marginTop: 3}}>Ahora sabés qué reforzar y qué ya dominás.</div>
            </div>
          </div>

          <Cursor
            x={interpolate(t, [45, 75], [760, 620], clamp)}
            y={interpolate(t, [45, 75], [870, 770], clamp)}
            click={interpolate(t, [72, 78, 87], [0, 1, 0], clamp)}
          />
        </div>
      </Window>
    </FeatureShell>
  );
};

const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = fade(frame, 812, 840, 900, 900);
  const t = local(frame, 812);
  const logo = spring({frame: t, fps, config: {damping: 14, stiffness: 105}});
  const cards = [
    ['Resumen', '≡'],
    ['Glosario', 'Aa'],
    ['Flashcards', '↻'],
    ['Examen', '✓'],
  ];

  return (
    <AbsoluteFill style={{opacity, fontFamily: 'Inter, Arial, sans-serif'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 42%, rgba(37,99,235,.18), rgba(247,249,255,.7) 32%, #f7f9ff 68%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 235,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${0.72 + logo * 0.28})`,
          opacity: logo,
        }}
      >
        <BrandMark />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 430,
          left: 62,
          right: 62,
          textAlign: 'center',
          color: HEADING,
        }}
      >
        <div style={{fontSize: 86, lineHeight: 0.98, fontWeight: 950, letterSpacing: '-0.075em'}}>
          Un PDF.
          <br />
          Todo tu estudio.
        </div>
        <div style={{fontSize: 31, color: MUTED, marginTop: 26}}>
          Resumí. Entendé. Practicá. Evaluá.
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 820,
          left: 85,
          right: 85,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
        }}
      >
        {cards.map(([label, icon], i) => {
          const c = spring({frame: Math.max(0, t - 18 - i * 6), fps, config: {damping: 16, stiffness: 115}});
          return (
            <div
              key={label}
              style={{
                height: 180,
                borderRadius: 28,
                background: '#fff',
                border: `1px solid ${BORDER}`,
                boxShadow: '0 18px 44px rgba(15,27,61,.075)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: c,
                transform: `translateY(${(1 - c) * 38}px) scale(${0.92 + c * 0.08})`,
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
              <div style={{fontSize: 25, color: HEADING, fontWeight: 850, marginTop: 16}}>{label}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 110,
          right: 110,
          bottom: 175,
          height: 96,
          borderRadius: 26,
          background: `linear-gradient(90deg, ${BRAND}, ${BRAND_2})`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 29,
          fontWeight: 900,
          boxShadow: '0 24px 55px rgba(37,99,235,.25)',
          transform: `translateY(${interpolate(t, [42, 72], [35, 0], clamp)}px)`,
          opacity: interpolate(t, [42, 72], [0, 1], clamp),
        }}
      >
        Subí tu PDF. Evaluo arma tu estudio.
      </div>
    </AbsoluteFill>
  );
};

export const EvaluoLaunchVideo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        color: HEADING,
        fontFamily: 'Inter, Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      <Background />
      <Hook />
      <UploadTransform />
      <Hub />
      <SummaryFeature />
      <GlossaryFeature />
      <FlashcardsFeature />
      <ExamFeature />
      <FinalScene />
    </AbsoluteFill>
  );
};
