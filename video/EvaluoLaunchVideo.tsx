import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
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
const BORDER = '#e2e8f0';
const BG = '#f8fafc';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const BrandMark: React.FC<{small?: boolean}> = ({small = false}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: small ? 14 : 20}}>
    <Img
      src={staticFile('icon.svg')}
      style={{width: small ? 52 : 72, height: small ? 52 : 72, borderRadius: small ? 12 : 16}}
    />
    <div
      style={{
        fontSize: small ? 34 : 48,
        fontWeight: 800,
        letterSpacing: '-0.055em',
        color: HEADING,
      }}
    >
      Evaluo
    </div>
  </div>
);

const BrowserShell: React.FC<{children: React.ReactNode; scale?: number}> = ({children, scale = 1}) => (
  <div
    style={{
      width: 900,
      borderRadius: 36,
      border: `1px solid ${BORDER}`,
      background: '#fff',
      overflow: 'hidden',
      boxShadow: '0 34px 90px rgba(15, 27, 61, 0.14)',
      transform: `scale(${scale})`,
    }}
  >
    <div
      style={{
        height: 76,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 26px',
        background: '#f8fafc',
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      {['#ef4444', '#f59e0b', '#22c55e'].map((color) => (
        <div key={color} style={{width: 15, height: 15, borderRadius: 999, background: color}} />
      ))}
      <div
        style={{
          marginLeft: 12,
          height: 38,
          flex: 1,
          borderRadius: 12,
          background: '#fff',
          border: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 18,
          color: '#94a3b8',
          fontSize: 20,
        }}
      >
        app.evaluo.ai
      </div>
    </div>
    {children}
  </div>
);

const PdfSheet: React.FC<{index: number; frame: number}> = ({index, frame}) => {
  const y = interpolate(frame, [0, 70], [index * 10, index * -13], clamp);
  const rotate = (index - 3) * 1.9;
  return (
    <div
      style={{
        position: 'absolute',
        width: 610,
        height: 860,
        borderRadius: 28,
        border: `1px solid ${BORDER}`,
        background: '#fff',
        boxShadow: '0 24px 65px rgba(15, 27, 61, 0.11)',
        transform: `translateY(${y}px) rotate(${rotate}deg)`,
        padding: 50,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 34}}>
        <div style={{fontSize: 22, fontWeight: 800, color: '#ef4444'}}>PDF</div>
        <div style={{fontSize: 18, color: '#94a3b8'}}>pág. {index * 18 + 1}</div>
      </div>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
        <div
          key={row}
          style={{
            height: row === 1 ? 20 : 13,
            width: `${96 - ((row + index) % 4) * 10}%`,
            borderRadius: 999,
            background: row === 1 ? '#cbd5e1' : '#e2e8f0',
            marginBottom: row === 1 ? 30 : 20,
          }}
        />
      ))}
    </div>
  );
};

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 14, stiffness: 110}});
  const titleOpacity = interpolate(frame, [0, 12, 105, 145], [0, 1, 1, 0], clamp);
  const questionOpacity = interpolate(frame, [78, 100, 140], [0, 1, 1], clamp);

  return (
    <AbsoluteFill style={{background: BG, fontFamily: 'Inter, Arial, sans-serif', color: HEADING}}>
      <div
        style={{
          position: 'absolute',
          top: 110,
          left: 72,
          right: 72,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <BrandMark small />
        <div
          style={{
            fontSize: 20,
            color: MUTED,
            border: `1px solid ${BORDER}`,
            borderRadius: 999,
            padding: '12px 20px',
            background: '#fff',
          }}
        >
          Tu material, mejor organizado
        </div>
      </div>

      <div style={{position: 'absolute', top: 330, left: 0, right: 0, height: 970, display: 'flex', justifyContent: 'center'}}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <PdfSheet key={i} index={i} frame={frame} />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          bottom: 175,
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `scale(${0.9 + pop * 0.1})`,
        }}
      >
        <div style={{fontSize: 150, fontWeight: 900, letterSpacing: '-0.075em', lineHeight: 0.9}}>126 páginas.</div>
        <div style={{fontSize: 56, fontWeight: 700, letterSpacing: '-0.05em', marginTop: 34, opacity: questionOpacity}}>
          ¿Por dónde empezás?
        </div>
      </div>
    </AbsoluteFill>
  );
};

const UploadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({frame, fps, config: {damping: 16, stiffness: 100}});
  const pdfX = interpolate(frame, [25, 85], [-360, 0], clamp);
  const pdfY = interpolate(frame, [25, 85], [360, 0], clamp);
  const pdfScale = interpolate(frame, [25, 85], [1, 0.82], clamp);
  const zonePulse = interpolate(frame, [70, 90, 110], [1, 1.035, 1], clamp);

  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #eef4ff 0%, #f8fafc 100%)', fontFamily: 'Inter, Arial, sans-serif'}}>
      <div style={{position: 'absolute', top: 125, left: 74}}><BrandMark small /></div>
      <div
        style={{
          position: 'absolute',
          top: 250,
          left: 70,
          right: 70,
          textAlign: 'center',
          color: HEADING,
          opacity: entrance,
        }}
      >
        <div style={{fontSize: 78, fontWeight: 850, letterSpacing: '-0.065em'}}>Por acá.</div>
        <div style={{fontSize: 34, color: MUTED, marginTop: 18}}>Subí tu PDF a Evaluo.</div>
      </div>

      <div style={{position: 'absolute', top: 520, left: 90, right: 90, display: 'flex', justifyContent: 'center'}}>
        <BrowserShell scale={0.94}>
          <div style={{height: 950, padding: 48}}>
            <div style={{fontSize: 27, fontWeight: 800, color: HEADING, marginBottom: 30}}>Nuevo material</div>
            <div
              style={{
                height: 650,
                borderRadius: 30,
                border: `3px dashed ${BRAND}`,
                background: '#f7faff',
                transform: `scale(${zonePulse})`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: HEADING,
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 26,
                  background: BRAND,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 52,
                  fontWeight: 700,
                  boxShadow: '0 18px 40px rgba(37,99,235,.25)',
                }}
              >
                ↑
              </div>
              <div style={{fontSize: 34, fontWeight: 800, marginTop: 26}}>Arrastrá tu PDF</div>
              <div style={{fontSize: 23, color: MUTED, marginTop: 12}}>o elegí un archivo</div>
            </div>
          </div>
        </BrowserShell>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 990,
          left: '50%',
          width: 310,
          height: 190,
          borderRadius: 26,
          background: '#fff',
          border: `1px solid ${BORDER}`,
          boxShadow: '0 24px 55px rgba(15,27,61,.16)',
          transform: `translateX(calc(-50% + ${pdfX}px)) translateY(${pdfY}px) scale(${pdfScale}) rotate(-5deg)`,
          padding: 28,
        }}
      >
        <div style={{fontSize: 18, color: '#ef4444', fontWeight: 900}}>PDF</div>
        <div style={{fontSize: 25, fontWeight: 800, color: HEADING, marginTop: 14}}>Apuntes-Final.pdf</div>
        <div style={{fontSize: 20, color: MUTED, marginTop: 10}}>126 páginas</div>
      </div>
    </AbsoluteFill>
  );
};

const ProcessingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [15, 155], [0, 1], clamp);
  const labels = ['Leyendo el material', 'Detectando conceptos', 'Organizando el estudio'];
  const active = Math.min(2, Math.floor(progress * 3));

  return (
    <AbsoluteFill style={{background: '#fff', fontFamily: 'Inter, Arial, sans-serif'}}>
      <div style={{position: 'absolute', top: 112, left: 72}}><BrandMark small /></div>
      <div style={{position: 'absolute', top: 280, left: 70, right: 70, textAlign: 'center'}}>
        <div style={{fontSize: 68, fontWeight: 850, color: HEADING, letterSpacing: '-0.06em'}}>De PDF a material de estudio.</div>
        <div style={{fontSize: 31, lineHeight: 1.4, color: MUTED, marginTop: 22}}>Evaluo analiza el contenido y lo estructura para que puedas empezar por lo importante.</div>
      </div>

      <div style={{position: 'absolute', top: 610, left: 100, right: 100}}>
        <BrowserShell scale={0.93}>
          <div style={{height: 900, padding: 55}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div>
                <div style={{fontSize: 22, color: MUTED}}>Apuntes-Final.pdf</div>
                <div style={{fontSize: 34, fontWeight: 850, color: HEADING, marginTop: 8}}>Preparando tu material</div>
              </div>
              <div style={{fontSize: 28, fontWeight: 850, color: BRAND}}>{Math.round(progress * 100)}%</div>
            </div>
            <div style={{height: 14, borderRadius: 999, background: '#e8eefc', marginTop: 34, overflow: 'hidden'}}>
              <div style={{height: '100%', width: `${progress * 100}%`, background: `linear-gradient(90deg, ${BRAND}, ${BRAND_2})`, borderRadius: 999}} />
            </div>

            <div style={{marginTop: 65, display: 'flex', flexDirection: 'column', gap: 24}}>
              {labels.map((label, i) => {
                const done = progress * 3 > i + 0.75;
                const current = active === i && !done;
                return (
                  <div
                    key={label}
                    style={{
                      height: 116,
                      borderRadius: 24,
                      border: `1px solid ${done || current ? '#bfdbfe' : BORDER}`,
                      background: done || current ? '#f8fbff' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 28px',
                      gap: 22,
                    }}
                  >
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 16,
                        background: done ? BRAND : current ? '#dbeafe' : '#f1f5f9',
                        color: done ? '#fff' : BRAND,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 27,
                        fontWeight: 900,
                      }}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <div style={{fontSize: 27, fontWeight: 750, color: HEADING}}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </BrowserShell>
      </div>
    </AbsoluteFill>
  );
};

const ResultCard: React.FC<{title: string; eyebrow: string; delay: number; frame: number; children: React.ReactNode}> = ({title, eyebrow, delay, frame, children}) => {
  const local = Math.max(0, frame - delay);
  const y = interpolate(local, [0, 28], [90, 0], clamp);
  const opacity = interpolate(local, [0, 18], [0, 1], clamp);
  return (
    <div
      style={{
        borderRadius: 30,
        background: '#fff',
        border: `1px solid ${BORDER}`,
        boxShadow: '0 22px 55px rgba(15,27,61,.09)',
        padding: 34,
        transform: `translateY(${y}px)`,
        opacity,
      }}
    >
      <div style={{fontSize: 17, letterSpacing: '.14em', textTransform: 'uppercase', color: BRAND, fontWeight: 900}}>{eyebrow}</div>
      <div style={{fontSize: 32, fontWeight: 850, color: HEADING, marginTop: 10, letterSpacing: '-0.035em'}}>{title}</div>
      <div style={{marginTop: 24}}>{children}</div>
    </div>
  );
};

const ResultsScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)', fontFamily: 'Inter, Arial, sans-serif'}}>
      <div style={{position: 'absolute', top: 110, left: 72}}><BrandMark small /></div>
      <div style={{position: 'absolute', top: 260, left: 70, right: 70}}>
        <div style={{fontSize: 72, fontWeight: 880, color: HEADING, letterSpacing: '-0.065em', lineHeight: 1}}>Todo en un solo lugar.</div>
        <div style={{fontSize: 31, color: MUTED, marginTop: 24, lineHeight: 1.45}}>El contenido deja de ser una pila de páginas y se convierte en una guía para estudiar.</div>
      </div>

      <div style={{position: 'absolute', top: 600, left: 76, right: 76, display: 'grid', gap: 24}}>
        <ResultCard title="Resumen" eyebrow="Lo esencial" delay={0} frame={frame}>
          <div style={{fontSize: 22, lineHeight: 1.55, color: '#475569'}}>
            La inteligencia artificial reconoce patrones, predice y genera contenido. Su adopción responsable requiere evaluar utilidad, riesgos y supervisión humana.
          </div>
        </ResultCard>

        <ResultCard title="Puntos clave" eyebrow="Para repasar" delay={25} frame={frame}>
          <div style={{display: 'grid', gap: 14}}>
            {['IA ≠ cualquier automatización', 'Machine learning aprende de datos', 'Cloud, edge, IoT y robótica se combinan'].map((text) => (
              <div key={text} style={{display: 'flex', gap: 14, alignItems: 'center', fontSize: 21, color: '#475569'}}>
                <div style={{width: 12, height: 12, borderRadius: 999, background: BRAND}} />
                {text}
              </div>
            ))}
          </div>
        </ResultCard>

        <ResultCard title="Glosario" eyebrow="Conceptos" delay={50} frame={frame}>
          <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
            {['Alucinación', 'Machine learning', 'Inferencia', 'Deep learning'].map((term) => (
              <div key={term} style={{fontSize: 19, fontWeight: 700, color: HEADING, padding: '12px 16px', borderRadius: 999, background: '#eff6ff', border: '1px solid #dbeafe'}}>
                {term}
              </div>
            ))}
          </div>
        </ResultCard>
      </div>
    </AbsoluteFill>
  );
};

const BeforeAfterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const split = interpolate(frame, [25, 80], [0.5, 0.22], clamp);
  const headline = interpolate(frame, [0, 25], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: '#fff', fontFamily: 'Inter, Arial, sans-serif'}}>
      <div style={{position: 'absolute', top: 115, left: 72}}><BrandMark small /></div>
      <div style={{position: 'absolute', top: 275, left: 72, right: 72, textAlign: 'center', opacity: headline}}>
        <div style={{fontSize: 64, fontWeight: 880, letterSpacing: '-0.06em', color: HEADING}}>De leer páginas…</div>
        <div style={{fontSize: 64, fontWeight: 880, letterSpacing: '-0.06em', color: BRAND, marginTop: 10}}>a estudiar de verdad.</div>
      </div>

      <div style={{position: 'absolute', top: 610, left: 70, right: 70, height: 900, display: 'flex', gap: 22}}>
        <div
          style={{
            flex: split,
            borderRadius: 34,
            background: '#f8fafc',
            border: `1px solid ${BORDER}`,
            overflow: 'hidden',
            position: 'relative',
            minWidth: 180,
          }}
        >
          <div style={{padding: 28, fontSize: 22, color: MUTED, fontWeight: 750}}>ANTES</div>
          <div style={{position: 'absolute', left: 30, right: 30, top: 105}}>
            {Array.from({length: 10}).map((_, i) => (
              <div key={i} style={{height: 62, borderRadius: 10, background: '#fff', border: `1px solid ${BORDER}`, marginBottom: 12, padding: 13}}>
                <div style={{height: 9, width: `${74 - (i % 4) * 10}%`, borderRadius: 999, background: '#cbd5e1'}} />
                <div style={{height: 7, width: `${92 - (i % 3) * 14}%`, borderRadius: 999, background: '#e2e8f0', marginTop: 10}} />
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            flex: 1 - split,
            borderRadius: 34,
            background: '#f7faff',
            border: '1px solid #bfdbfe',
            padding: 32,
            boxShadow: '0 28px 70px rgba(37,99,235,.12)',
          }}
        >
          <div style={{fontSize: 22, color: BRAND, fontWeight: 850}}>CON EVALUO</div>
          <div style={{fontSize: 35, fontWeight: 850, color: HEADING, marginTop: 28}}>Tu material organizado para estudiar</div>
          <div style={{display: 'grid', gap: 18, marginTop: 38}}>
            {['Resumen listo', 'Puntos clave', 'Secciones ordenadas', 'Glosario de conceptos'].map((text, i) => (
              <div key={text} style={{height: 100, borderRadius: 22, background: '#fff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', gap: 18, padding: '0 22px'}}>
                <div style={{width: 46, height: 46, borderRadius: 14, background: i === 0 ? BRAND : '#eff6ff', color: i === 0 ? '#fff' : BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900}}>{i === 0 ? '✓' : i + 1}</div>
                <div style={{fontSize: 24, fontWeight: 750, color: HEADING}}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame, fps, config: {damping: 15, stiffness: 100}});
  const ctaY = interpolate(frame, [18, 48], [45, 0], clamp);
  const ctaOpacity = interpolate(frame, [18, 42], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 35%, #ffffff 0%, #eff6ff 55%, #dbeafe 100%)`,
        fontFamily: 'Inter, Arial, sans-serif',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{transform: `scale(${0.82 + pop * 0.18})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Img src={staticFile('icon.svg')} style={{width: 150, height: 150, borderRadius: 32, boxShadow: '0 28px 70px rgba(15,27,61,.18)'}} />
        <div style={{fontSize: 104, fontWeight: 900, color: HEADING, letterSpacing: '-0.075em', marginTop: 34}}>Evaluo</div>
      </div>

      <div style={{marginTop: 62, textAlign: 'center', transform: `translateY(${ctaY}px)`, opacity: ctaOpacity}}>
        <div style={{fontSize: 48, fontWeight: 820, color: HEADING, letterSpacing: '-0.045em'}}>Subí tu próximo PDF.</div>
        <div style={{fontSize: 37, color: BRAND, fontWeight: 800, marginTop: 14}}>Empezá a estudiar.</div>
      </div>

      <div style={{position: 'absolute', bottom: 115, color: MUTED, fontSize: 22}}>evaluo.ai</div>
    </AbsoluteFill>
  );
};

export const EvaluoLaunchVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{background: BG}}>
      <Sequence from={0} durationInFrames={150}>
        <HookScene />
      </Sequence>
      <Sequence from={150} durationInFrames={120}>
        <UploadScene />
      </Sequence>
      <Sequence from={270} durationInFrames={210}>
        <ProcessingScene />
      </Sequence>
      <Sequence from={480} durationInFrames={210}>
        <ResultsScene />
      </Sequence>
      <Sequence from={690} durationInFrames={120}>
        <BeforeAfterScene />
      </Sequence>
      <Sequence from={810} durationInFrames={90}>
        <EndScene />
      </Sequence>
    </AbsoluteFill>
  );
};
