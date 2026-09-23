import { ImageResponse } from 'next/og';

export const alt = 'Evaluo | Subí tu PDF y prepará tu examen';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'Arial, Helvetica, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 520,
            height: 520,
            borderRadius: 999,
            background: '#e0e7ff',
            right: -120,
            top: -190,
            opacity: 0.82,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            borderRadius: 999,
            background: '#dbeafe',
            right: 300,
            bottom: -250,
            opacity: 0.8,
          }}
        />

        <div
          style={{
            width: 650,
            padding: '62px 0 54px 72px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                background: '#2563eb',
                color: 'white',
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: '-0.08em',
              }}
            >
              E
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em' }}>
              Evaluo
            </div>
          </div>

          <div
            style={{
              marginTop: 58,
              fontSize: 67,
              lineHeight: 0.98,
              fontWeight: 850,
              letterSpacing: '-0.055em',
              maxWidth: 590,
            }}
          >
            Subí tu PDF y prepará tu examen.
          </div>

          <div
            style={{
              marginTop: 28,
              color: '#475569',
              fontSize: 25,
              lineHeight: 1.35,
              maxWidth: 560,
            }}
          >
            Estudiá, practicá y detectá qué reforzar usando tus propios apuntes.
          </div>

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#1d4ed8',
              fontSize: 21,
              fontWeight: 700,
            }}
          >
            Tu material. Tu preparación.
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingRight: 52,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 430,
              height: 450,
              borderRadius: 30,
              background: 'white',
              border: '1px solid #dbe3f0',
              boxShadow: '0 30px 70px rgba(15, 23, 42, 0.14)',
              display: 'flex',
              flexDirection: 'column',
              padding: 28,
              transform: 'rotate(2deg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div
                style={{
                  width: 58,
                  height: 70,
                  borderRadius: 10,
                  background: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  fontWeight: 900,
                  fontSize: 20,
                }}
              >
                PDF
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>Mis apuntes.pdf</div>
                <div style={{ fontSize: 16, color: '#64748b' }}>Procesado · listo para estudiar</div>
              </div>
            </div>

            <div
              style={{
                marginTop: 28,
                height: 1,
                background: '#e2e8f0',
                width: '100%',
              }}
            />

            {[
              ['Resumen', 'Entendé lo importante'],
              ['Conceptos clave', 'Ubicá los temas centrales'],
              ['Flashcards', 'Repasá activamente'],
              ['Práctica', 'Probate antes del examen'],
            ].map(([title, description], index) => (
              <div
                key={title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 0',
                  borderBottom: index < 3 ? '1px solid #eef2f7' : 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: index === 3 ? '#ecfdf5' : '#eff6ff',
                    color: index === 3 ? '#059669' : '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 18, fontWeight: 750 }}>{title}</div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>{description}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              position: 'absolute',
              top: 82,
              right: 28,
              borderRadius: 999,
              background: '#dcfce7',
              color: '#047857',
              padding: '10px 16px',
              fontSize: 15,
              fontWeight: 800,
              transform: 'rotate(4deg)',
            }}
          >
            ✓ Tu PDF, listo
          </div>
        </div>
      </div>
    ),
    size
  );
}
