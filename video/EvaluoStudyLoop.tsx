import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import script from './study-loop-script.json';

const blue = '#0664ef';
const ink = '#10233f';
const muted = '#61718a';
const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };
const fileName = 'Derecho penal · Unidad 2.pdf';
const voiceDurations = [6.072, 6.264, 7.704, 9.336, 7.944, 9.888, 8.136, 8.88, 6.288, 7.032];

// Subtítulos por frases breves, sincronizados aproximadamente con la voz de trabajo.
const captionAt = (index: number, frame: number) => {
  const words = script[index].voice.split(' ');
  const word = Math.min(
    words.length - 1,
    Math.floor((frame / 30 / (voiceDurations[index] / 1.08)) * words.length)
  );
  const group = Math.floor(word / 9);
  return words.slice(group * 9, (group + 1) * 9).join(' ');
};

const Button: React.FC<{ children: React.ReactNode; secondary?: boolean }> = ({
  children,
  secondary,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      padding: '21px 30px',
      borderRadius: 16,
      background: secondary ? '#edf4ff' : blue,
      color: secondary ? blue : 'white',
      fontWeight: 700,
      fontSize: 26,
    }}
  >
    {children}
    <span>→</span>
  </div>
);

const Row: React.FC<{ label: string; selected?: boolean; correct?: boolean }> = ({
  label,
  selected,
  correct,
}) => (
  <div
    style={{
      padding: '24px 28px',
      border: `2px solid ${selected ? (correct ? '#13977d' : '#db7480') : '#dce4ef'}`,
      background: selected ? (correct ? '#effaf6' : '#fff5f5') : 'white',
      borderRadius: 18,
      fontSize: 27,
      display: 'flex',
      gap: 18,
      alignItems: 'center',
      lineHeight: 1.4,
    }}
  >
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: 30,
        border: `2px solid ${selected ? blue : '#91a0b4'}`,
        background: selected ? blue : 'transparent',
        flexShrink: 0,
      }}
    />
    {label}
  </div>
);

const Shell: React.FC<{ children: React.ReactNode; label?: string }> = ({
  children,
  label = 'Mi material',
}) => (
  <div
    style={{
      background: 'white',
      borderRadius: 24,
      overflow: 'hidden',
      boxShadow: '0 30px 100px #14254418',
      border: '1px solid #dce5f2',
      width: 1120,
    }}
  >
    <div
      style={{
        height: 70,
        background: '#f7f9fc',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 25px',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      {['#db7480', '#ecc16b', '#70bb9c'].map((c) => (
        <span key={c} style={{ height: 11, width: 11, borderRadius: 20, background: c }} />
      ))}
      <span style={{ fontSize: 20, color: muted, marginLeft: 20 }}>evaluo.com.ar · {label}</span>
    </div>
    <div style={{ padding: '35px 42px' }}>
      <div style={{ color: blue, fontSize: 24, fontWeight: 700, marginBottom: 26 }}>
        ▤ {fileName}
      </div>
      {children}
    </div>
  </div>
);

const Cursor: React.FC<{ x: number; y: number; at?: number }> = ({ x, y, at = 80 }) => {
  const f = useCurrentFrame();
  const arrive = spring({ frame: f - 25, fps: 30, config: { damping: 25 } });
  const pulse = interpolate(f, [at, at + 12, at + 25], [0, 1, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: interpolate(arrive, [0, 1], [x + 100, x]),
        top: interpolate(arrive, [0, 1], [y + 70, y]),
        opacity: interpolate(f, [20, 32], [0, 1], clamp),
        zIndex: 20,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 70,
          height: 70,
          borderRadius: '50%',
          border: `3px solid ${blue}`,
          transform: `translate(-25px,-25px) scale(${0.5 + pulse})`,
          opacity: pulse,
        }}
      />
      <svg width="42" height="48" viewBox="0 0 42 48">
        <path
          d="M4 3 L4 36 L13 29 L22 44 L30 40 L21 26 L34 25 Z"
          fill={ink}
          stroke="white"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
};

const Captured: React.FC<{ name: string; top: number; travel?: number }> = ({
  name,
  top,
  travel = 0,
}) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        width: 1120,
        height: 625,
        borderRadius: 22,
        overflow: 'hidden',
        background: 'white',
        border: '1px solid #dbe5f2',
        boxShadow: '0 28px 80px #14254420',
        position: 'relative',
      }}
    >
      <Img
        src={staticFile(`video/study-loop/${name}.png`)}
        style={{
          width: 1120,
          position: 'absolute',
          left: 0,
          top: (-(top + interpolate(f, [35, 180], [0, travel], clamp)) * 1120) / 888,
          clipPath:
            name === 'success'
              ? 'inset(0 0 150px 0)'
              : name === 'practice'
                ? 'inset(0 0 90px 0)'
                : undefined,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 15,
          bottom: 15,
          fontSize: 16,
          color: muted,
          background: '#ffffffed',
          padding: '8px 12px',
          borderRadius: 8,
        }}
      >
        Vista previa · datos de ejemplo
      </div>
    </div>
  );
};

const Story: React.FC<{ index: number }> = ({ index }) => {
  const f = useCurrentFrame();
  if (index === 0)
    return (
      <Shell label="Práctica">
        <div style={{ fontSize: 19, color: muted, marginBottom: 12 }}>FINALISMO · PREGUNTA 3</div>
        <h2 style={{ fontSize: 38, lineHeight: 1.2, margin: '0 0 25px' }}>
          ¿Qué caracteriza a la acción en la teoría finalista?
        </h2>
        <Row label="Un movimiento explicado solo por su causalidad." selected={f > 32} />
        <div style={{ marginTop: 18, opacity: interpolate(f, [60, 78], [0, 1], clamp) }}>
          <p style={{ color: '#ba4555', fontSize: 26, fontWeight: 700 }}>
            Esta respuesta no es correcta.
          </p>
          <p style={{ fontSize: 27 }}>La conducta está orientada conscientemente a un fin.</p>
        </div>
      </Shell>
    );
  if (index === 1)
    return (
      <Shell label="Subir PDF">
        <div
          style={{
            padding: 45,
            border: '2px dashed #a6c4f6',
            borderRadius: 22,
            textAlign: 'center',
            background: '#f7faff',
          }}
        >
          <div style={{ fontSize: 85, transform: `translateY(${Math.sin(f / 20) * 7}px)` }}>▤</div>
          <h2 style={{ fontSize: 38, margin: '15px 0' }}>Tus apuntes, en un solo lugar</h2>
          <p style={{ fontSize: 26, color: muted }}>Derecho penal · Unidad 2 · 32 páginas</p>
          <div style={{ height: 8, background: '#e1ebfa', borderRadius: 8, margin: '35px 0' }}>
            <div
              style={{
                height: 8,
                width: `${interpolate(f, [30, 135], [0, 100], clamp)}%`,
                borderRadius: 8,
                background: blue,
              }}
            />
          </div>
          <Button>{f > 135 ? 'PDF listo para estudiar' : 'Preparando tu material'}</Button>
        </div>
      </Shell>
    );
  if (index === 2)
    return (
      <Shell label="Diagnóstico inicial">
        <h2 style={{ fontSize: 38, margin: '0 0 16px' }}>Descubrí tu punto de partida</h2>
        <p style={{ fontSize: 27, color: muted }}>Un diagnóstico sobre tus apuntes.</p>
        {[
          ['Finalismo', 'Para reforzar'],
          ['Culpabilidad', 'Para reforzar'],
          ['Dogmática penal', 'Buen punto de partida'],
        ].map(([topic, state], i) => (
          <div
            key={topic}
            style={{
              padding: '24px 0',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 28,
              opacity: interpolate(f, [25 + i * 30, 45 + i * 30], [0, 1], clamp),
            }}
          >
            <strong>{topic}</strong>
            <span style={{ color: i === 2 ? '#13826d' : blue }}>{state}</span>
          </div>
        ))}
        <div style={{ marginTop: 30 }}>
          <Button>Estudiar este PDF</Button>
        </div>
      </Shell>
    );
  if (index === 3) {
    const part = Math.min(2, Math.floor(f / 85));
    return (
      <Shell label={['Resumen', 'Flashcards', 'Práctica'][part]}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 35 }}>
          {['Resumen', 'Flashcards', 'Preguntas'].map((t, i) => (
            <div
              key={t}
              style={{
                fontSize: 24,
                padding: '15px 23px',
                borderRadius: 12,
                color: i === part ? 'white' : muted,
                background: i === part ? blue : '#f4f7fc',
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <h2 style={{ fontSize: 39, margin: '0 0 24px' }}>Teoría de la acción</h2>
        <p style={{ fontSize: 31, lineHeight: 1.65 }}>
          {part === 0
            ? 'En el finalismo, la conducta humana se dirige conscientemente hacia un objetivo.'
            : part === 1
              ? '¿Qué diferencia al finalismo de una explicación únicamente causal?'
              : '¿Qué caracteriza a la acción en la teoría finalista?'}
        </p>
        <div style={{ marginTop: 30 }}>
          {part === 2 ? (
            <Row label="Solo importa el movimiento y su resultado." selected />
          ) : (
            <Button>{part === 0 ? 'Repasar el concepto' : 'Mostrar respuesta'}</Button>
          )}
        </div>
      </Shell>
    );
  }
  if (index === 4) return <Captured name="selector" top={360} travel={60} />;
  if (index === 5)
    return f < 105 ? (
      <Captured name="error" top={600} />
    ) : (
      <Captured name="explanation" top={780} travel={140} />
    );
  if (index === 6) return <Captured name="source" top={1100} travel={180} />;
  if (index === 7) return <Captured name="practice" top={350} travel={220} />;
  if (index === 8) return <Captured name="success" top={620} travel={100} />;
  return (
    <div style={{ width: 1050, textAlign: 'center' }}>
      <div style={{ fontSize: 110, fontWeight: 800, color: blue, letterSpacing: -6 }}>
        evaluo<span style={{ color: ink }}>.</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, margin: '45px 0' }}>
        {['Practicar', 'Entender', 'Volver a probar'].map((x, i) => (
          <React.Fragment key={x}>
            <div
              style={{
                padding: '20px 25px',
                borderRadius: 18,
                background: 'white',
                fontSize: 30,
                color: ink,
                border: '1px solid #dbe5f2',
              }}
            >
              {x}
            </div>
            {i < 2 ? (
              <span style={{ fontSize: 32, color: blue, alignSelf: 'center' }}>→</span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
      <p style={{ fontSize: 30, color: muted }}>Estudiá con tu PDF.</p>
      <div style={{ fontSize: 29, fontWeight: 700, color: blue }}>evaluo.com.ar</div>
      <p style={{ fontSize: 18, color: muted, marginTop: 35 }}>
        Próximo paso propuesto: volver a comprobar qué recordás.
      </p>
    </div>
  );
};

const Scene: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scene = script[index];
  const duration = (scene.end - scene.start) * fps;
  const enter = spring({ frame, fps, config: { damping: 22 } });
  const exit = interpolate(frame, [duration - 12, duration], [1, 0], clamp);
  const zoom = interpolate(frame, [0, duration], [1, 1.018], clamp);
  return (
    <AbsoluteFill style={{ opacity: exit, transform: `translateY(${(1 - enter) * 35}px)` }}>
      <div style={{ position: 'absolute', left: 90, top: 135, width: 530 }}>
        <div
          style={{ color: blue, fontSize: 21, fontWeight: 750, letterSpacing: 3, marginBottom: 28 }}
        >
          {scene.step}
        </div>
        <h1 style={{ fontSize: 67, lineHeight: 1.08, letterSpacing: -3, margin: 0, color: ink }}>
          {scene.title}
        </h1>
        <div style={{ width: 65, height: 5, background: blue, marginTop: 35, borderRadius: 8 }} />
        <p style={{ fontSize: 25, color: muted, lineHeight: 1.5, marginTop: 28 }}>
          {index === 0
            ? 'Saber cuál era la respuesta no siempre alcanza.'
            : index === 9
              ? 'Tu material te acompaña durante todo el recorrido.'
              : fileName}
        </p>
        {index > 0 && index < 9 ? (
          <div style={{ marginTop: 45, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['PDF', 'Practicar', 'Entender', 'Comprobar'].map((label, i) => (
              <span
                key={label}
                style={{
                  fontSize: 19,
                  padding: '12px 16px',
                  borderRadius: 30,
                  background: i === [0, 0, 0, 1, 2, 2, 2, 3, 3][index] ? blue : '#e5edf9',
                  color: i === [0, 0, 0, 1, 2, 2, 2, 3, 3][index] ? 'white' : muted,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
        {index < 4 ? (
          <p style={{ fontSize: 17, color: muted, marginTop: 28 }}>
            Escena ilustrativa del recorrido de estudio.
          </p>
        ) : null}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 700,
          top: 140,
          width: 1120,
          height: 660,
          display: 'flex',
          alignItems: 'center',
          transform: `scale(${zoom})`,
        }}
      >
        <Story index={index} />
        {[1, 4, 5, 7].includes(index) && (index !== 5 || frame < 105) ? (
          <Cursor
            x={index === 1 ? 660 : 300}
            y={index === 5 ? 405 : index === 4 ? 340 : index === 7 ? 285 : 490}
            at={index === 5 ? 85 : 90}
          />
        ) : null}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 260,
          right: 260,
          bottom: 75,
          textAlign: 'center',
          fontSize: 29,
          lineHeight: 1.45,
          color: ink,
          minHeight: 85,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ background: '#ffffffed', borderRadius: 14, padding: '15px 25px' }}>
          {captionAt(index, frame)}
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const EvaluoStudyLoop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: '#f2f6fc', fontFamily: 'Arial, sans-serif', color: ink }}>
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          right: -300,
          top: -430,
          borderRadius: '50%',
          background: '#e3edff',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          left: -300,
          bottom: -450,
          borderRadius: '50%',
          background: '#e1eaff',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 42,
          color: blue,
          fontWeight: 800,
          fontSize: 31,
          letterSpacing: -1,
        }}
      >
        evaluo.
      </div>
      <div style={{ position: 'absolute', right: 90, top: 50, fontSize: 19, color: muted }}>
        DEL ERROR A ENTENDERLO
      </div>
      {script.map((scene, index) => (
        <Sequence
          key={scene.start}
          from={scene.start * 30}
          durationInFrames={(scene.end - scene.start) * 30}
        >
          <Scene index={index} />
          <Audio
            src={staticFile(`video/study-loop/voice-${index}.mp3`)}
            volume={1}
            playbackRate={1.08}
          />
        </Sequence>
      ))}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          height: 5,
          width: `${(frame / 2700) * 100}%`,
          background: blue,
        }}
      />
    </AbsoluteFill>
  );
};
