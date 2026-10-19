import { ImageResponse } from 'next/og';
import type { ShareCardKind } from '@/lib/share-card';

export const runtime = 'edge';

const COPY: Record<ShareCardKind, { eyebrow: string; detail: string; chips: string[] }> = {
  materia: { eyebrow: 'MATERIA EN EVALUO', detail: 'Recursos para estudiar mejor', chips: ['Recursos', 'Pregunteros', 'Simuladores'] },
  preguntero: { eyebrow: 'PREGUNTERO EN EVALUO', detail: 'Practicá antes del parcial', chips: ['Preguntas', 'Práctica', 'Feedback'] },
  material: { eyebrow: 'MATERIAL COMPARTIDO', detail: 'PDF preparado para estudiar', chips: ['PDF', 'Resumen', 'Glosario'] },
};

function clean(value: string | null, fallback: string, max: number) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return (text || fallback).slice(0, max);
}

function resolveKind(value: string | null): ShareCardKind {
  return value === 'preguntero' || value === 'material' ? value : 'materia';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = resolveKind(url.searchParams.get('kind'));
  const copy = COPY[kind];
  const title = clean(url.searchParams.get('title'), 'Evaluo', 92);
  const subtitle = clean(url.searchParams.get('subtitle'), 'Tu espacio académico', 124);
  const detail = clean(url.searchParams.get('detail'), copy.detail, 92);
  const titleSize = title.length > 68 ? 48 : title.length > 46 ? 56 : 64;

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', padding: 54, background: 'linear-gradient(145deg,#F8FBFF 0%,#EEF4FF 58%,#FFFFFF 100%)', color: '#0F172A', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '40px 46px', borderRadius: 34, border: '1px solid #DCE5F2', background: '#FFFFFF', boxShadow: '0 28px 80px rgba(15,23,42,0.10)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ width: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 17, background: 'linear-gradient(135deg,#2563EB 0%,#6366F1 100%)', color: '#FFFFFF', fontSize: 32, fontWeight: 900 }}>E</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.04em' }}>Evaluo</div>
              <div style={{ marginTop: 2, fontSize: 16, color: '#64748B' }}>Tu espacio académico</div>
            </div>
          </div>
          <div style={{ display: 'flex', borderRadius: 999, padding: '10px 16px', background: '#EEF4FF', color: '#2563EB', fontSize: 15, fontWeight: 800, letterSpacing: '0.1em' }}>{copy.eyebrow}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 50, maxWidth: 960 }}>
          <div style={{ fontSize: titleSize, lineHeight: 1.04, letterSpacing: '-0.055em', fontWeight: 850 }}>{title}</div>
          <div style={{ marginTop: 17, fontSize: 25, lineHeight: 1.35, color: '#475569' }}>{subtitle}</div>
          <div style={{ marginTop: 11, fontSize: 18, fontWeight: 700, color: '#2563EB' }}>{detail}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {copy.chips.map((chip) => <div key={chip} style={{ display: 'flex', padding: '9px 14px', borderRadius: 999, border: '1px solid #DBEAFE', background: '#FFFFFF', color: '#334155', fontSize: 15, fontWeight: 700 }}>{chip}</div>)}
          </div>
          <div style={{ display: 'flex', fontSize: 17, color: '#64748B' }}>evaluo.com.ar</div>
        </div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' } }
  );
}
