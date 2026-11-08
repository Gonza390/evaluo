import type { ReactNode } from 'react';

/**
 * Personaje de Evaluo: la hoja del ícono de la app, con una expresión por estado.
 * Fuente única: los SVG de /public/evi*.svg se generan con las mismas formas.
 */
export type PersonajeEstado =
  | 'contento'
  | 'feliz'
  | 'pensando'
  | 'concentrado'
  | 'dormido'
  | 'birrete';

const FACES: Record<Exclude<PersonajeEstado, 'birrete'>, ReactNode> = {
  contento: (
    <>
      <circle cx="47" cy="58" r="5" fill="#1b1c3a" />
      <circle cx="73" cy="58" r="5" fill="#1b1c3a" />
      <circle cx="48.6" cy="56.2" r="1.6" fill="#fff" />
      <circle cx="74.6" cy="56.2" r="1.6" fill="#fff" />
      <ellipse cx="39" cy="70" rx="5.5" ry="3.2" fill="#f2b8ad" />
      <ellipse cx="81" cy="70" rx="5.5" ry="3.2" fill="#f2b8ad" />
      <path
        d="M52 71 Q60 78 68 71"
        fill="none"
        stroke="#1b1c3a"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  ),
  feliz: (
    <>
      <path
        d="M41 60 Q47 53 53 60 M67 60 Q73 53 79 60"
        fill="none"
        stroke="#1b1c3a"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <ellipse cx="39" cy="70" rx="5.5" ry="3.2" fill="#f2b8ad" />
      <ellipse cx="81" cy="70" rx="5.5" ry="3.2" fill="#f2b8ad" />
      <path d="M50 69 Q60 69 70 69 Q69 80 60 80 Q51 80 50 69 Z" fill="#1b1c3a" />
      <path
        d="M55 76 Q60 79 65 76"
        fill="none"
        stroke="#f2b8ad"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </>
  ),
  pensando: (
    <>
      <circle cx="49" cy="55" r="5" fill="#1b1c3a" />
      <circle cx="75" cy="55" r="5" fill="#1b1c3a" />
      <circle cx="50.6" cy="53.2" r="1.6" fill="#fff" />
      <circle cx="76.6" cy="53.2" r="1.6" fill="#fff" />
      <path
        d="M41 46 L52 44 M68 44 L79 47"
        stroke="#1b1c3a"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path d="M55 74 H66" stroke="#1b1c3a" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  concentrado: (
    <>
      <circle cx="47" cy="58" r="5" fill="#1b1c3a" />
      <circle cx="73" cy="58" r="5" fill="#1b1c3a" />
      <circle cx="48.6" cy="56.2" r="1.6" fill="#fff" />
      <circle cx="74.6" cy="56.2" r="1.6" fill="#fff" />
      <path
        d="M41 47 L52 46 M68 46 L79 47"
        stroke="#1b1c3a"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M54 72 Q60 76 66 72"
        fill="none"
        stroke="#1b1c3a"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  ),
  dormido: (
    <>
      <path
        d="M41 59 Q47 64 53 59 M67 59 Q73 64 79 59"
        fill="none"
        stroke="#1b1c3a"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M55 75 Q60 72 65 75"
        fill="none"
        stroke="#1b1c3a"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M100 14 h10 l-10 12 h10"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
};

const BODY = (
  <>
    <path
      d="M40 10 H72 L96 34 V88 Q96 104 80 104 H40 Q24 104 24 88 V26 Q24 10 40 10 Z"
      fill="#fff"
      stroke="#1b1c3a"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M72 10 V26 Q72 34 80 34 H96 Z"
      fill="#ffc933"
      stroke="#1b1c3a"
      strokeWidth="4"
      strokeLinejoin="round"
    />
  </>
);

type Props = {
  estado?: PersonajeEstado;
  /** Texto accesible. Sin título, el personaje es decorativo. */
  title?: string;
  /** Sombra debajo (para ilustraciones grandes). */
  sombra?: boolean;
  className?: string;
};

export function Personaje({ estado = 'contento', title, sombra = true, className }: Props) {
  const conBirrete = estado === 'birrete';
  return (
    <svg
      viewBox="0 -4 120 124"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {sombra ? <ellipse cx="60" cy="113" rx="28" ry="3.5" fill="#e6e9f1" /> : null}
      {conBirrete ? (
        <>
          <g transform="translate(0 8)">
            {BODY}
            {FACES.contento}
          </g>
          <path d="M60 0 L100 14 L60 28 L20 14 Z" fill="#1b1c3a" />
          <path d="M42 20 V30 Q60 38 78 30 V20" fill="#1b1c3a" />
          <path d="M100 14 V32" stroke="#ffc933" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="34" r="3" fill="#ffc933" />
        </>
      ) : (
        <>
          {BODY}
          {FACES[estado]}
        </>
      )}
    </svg>
  );
}
