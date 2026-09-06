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
import {COMFY_HERO} from './ComfyHeroAsset';
import {EvaluoPdfVideoPolished} from './EvaluoPdfVideoPolished';

const BRAND = '#2563eb';
const BRAND2 = '#6366f1';
const INK = '#0f172a';
const MUTED = '#64748b';
const BG = '#f7f9ff';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const r = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, clamp);

const Brand: React.FC<{large?: boolean}> = ({large = false}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: large ? 18 : 12}}>
    <Img
      src={staticFile('icon.png')}
      style={{width: large ? 72 : 46, height: large ? 72 : 46, objectFit: 'contain'}}
    />
    <div
      style={{
        color: INK,
        fontWeight: 950,
        fontSize: large ? 48 : 30,
        letterSpacing: '-0.055em',
      }}
    >
      Evaluo
    </div>
  </div>
);

const ComfyHero: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = r(frame, [0, 10, 78, 105], [0, 1, 1, 0]);
  const intro = spring({frame, fps, config: {damping: 16, stiffness: 105}});
  const scale = r(frame, [0, 105], [1.04, 1.16]);
  const y = r(frame, [0, 105], [20, -38]);

  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden', background: '#87a9dc'}}>
      <Img
        src={COMFY_HERO}
        style={{
          position: 'absolute',
          inset: -40,
          width: 1160,
          height: 2000,
          objectFit: 'cover',
          transform: `translateY(${y}px) scale(${scale})`,
          filter: 'saturate(.9) contrast(.96)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg,rgba(7,18,50,.68) 0%,rgba(7,18,50,.08) 34%,rgba(7,18,50,.13) 62%,rgba(7,18,50,.72) 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 82,
          left: 60,
          right: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            padding: '11px 17px',
            borderRadius: 999,
            background: 'rgba(255,255,255,.9)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <Brand />
        </div>
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 999,
            background: 'rgba(7,18,50,.58)',
            color: '#fff',
            fontSize: 18,
            fontWeight: 850,
            backdropFilter: 'blur(14px)',
          }}
        >
          1 PDF → 4 herramientas
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 62,
          right: 62,
          bottom: 155,
          opacity: intro,
          transform: `translateY(${(1 - intro) * 44}px)`,
        }}
      >
        <div
          style={{
            fontSize: 86,
            lineHeight: 0.96,
            fontWeight: 950,
            letterSpacing: '-0.075em',
            color: '#fff',
            textShadow: '0 14px 42px rgba(5,13,36,.32)',
          }}
        >
          Subí un PDF.
          <br />
          Convertílo en estudio.
        </div>
        <div style={{fontSize: 29, color: 'rgba(255,255,255,.92)', marginTop: 25, fontWeight: 700}}>
          Resumen · Glosario · Flashcards · Examen
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PlatformDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = r(frame, [72, 98, 490, 516], [0, 1, 1, 0]);

  return (
    <AbsoluteFill style={{opacity}}>
      <Sequence from={-220}>
        <EvaluoPdfVideoPolished />
      </Sequence>
    </AbsoluteFill>
  );
};

const FinalCta: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = r(frame, [495, 518], [0, 1]);
  const t = Math.max(0, frame - 495);
  const pop = spring({frame: t, fps, config: {damping: 15, stiffness: 105}});
  const tools = ['Resumen', 'Glosario', 'Flashcards', 'Examen'];

  return (
    <AbsoluteFill style={{opacity, background: BG}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 50% 40%,rgba(37,99,235,.18),rgba(247,249,255,.75) 38%,#f7f9ff 72%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 245,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: pop,
          transform: `scale(${0.78 + pop * 0.22})`,
        }}
      >
        <Brand large />
      </div>
      <div style={{position: 'absolute', top: 455, left: 56, right: 56, textAlign: 'center'}}>
        <div
          style={{
            fontSize: 88,
            lineHeight: 0.97,
            fontWeight: 950,
            letterSpacing: '-0.075em',
            color: INK,
          }}
        >
          Un PDF.
          <br />
          Todo tu estudio.
        </div>
        <div style={{fontSize: 30, color: MUTED, marginTop: 25}}>Entendé. Recordá. Practicá.</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 850,
          left: 84,
          right: 84,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
        }}
      >
        {tools.map((tool, index) => {
          const show = spring({
            frame: Math.max(0, t - 12 - index * 5),
            fps,
            config: {damping: 16, stiffness: 115},
          });
          return (
            <div
              key={tool}
              style={{
                height: 164,
                borderRadius: 27,
                border: '1px solid #dbe4f0',
                background: '#fff',
                boxShadow: '0 18px 44px rgba(15,23,42,.07)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: INK,
                fontSize: 25,
                fontWeight: 900,
                opacity: show,
                transform: `translateY(${(1 - show) * 34}px)`,
              }}
            >
              {tool}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 108,
          right: 108,
          bottom: 165,
          height: 100,
          borderRadius: 28,
          background: `linear-gradient(90deg,${BRAND},${BRAND2})`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 29,
          fontWeight: 900,
          boxShadow: '0 24px 56px rgba(37,99,235,.24)',
          opacity: r(t, [25, 45], [0, 1]),
          transform: `translateY(${r(t, [25, 45], [28, 0])}px)`,
        }}
      >
        Subí tu PDF en Evaluo
      </div>
    </AbsoluteFill>
  );
};

export const EvaluoComfyDemo: React.FC = () => (
  <AbsoluteFill style={{background: BG, color: INK, fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden'}}>
    <ComfyHero />
    <PlatformDemo />
    <FinalCta />
  </AbsoluteFill>
);
