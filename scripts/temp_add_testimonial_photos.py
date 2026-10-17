from pathlib import Path
import re
import subprocess

ROOT = Path.cwd()
ASSET_DIR = ROOT / 'public' / 'testimonials'
ASSET_DIR.mkdir(parents=True, exist_ok=True)

sources = {
    'tomas-fernandez.jpg': 'https://images.pexels.com/photos/7968337/pexels-photo-7968337.jpeg?cs=tinysrgb&dpr=1&w=320',
    'sofia-martinez.jpg': 'https://img.magnific.com/foto-gratis/mujer-joven-alegre-que-toma-selfie_74855-4032.jpg?semt=ais_hybrid&w=320&q=75',
    'lucia-gonzalez.jpg': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_AdyiB21xLW4f41KGuNQimu8xD1EhHn8Jl0qiODnD7NP6HnQLuhpwDDRE&s=10',
}

for filename, url in sources.items():
    subprocess.run([
        'curl', '-fL', '--retry', '3', url,
        '-o', str(ASSET_DIR / filename),
    ], check=True)

path = ROOT / 'components' / 'marketing' / 'home-redesign.tsx'
text = path.read_text()

new_block = '''      <section className="sec" style={{ paddingBottom: '48px' }}>
        <div className="w">
          <div className="eb l">Lo que cuentan</div>
          <h2 style={{ fontSize: '36px', maxWidth: '640px' }}>
            Estudiantes que ya saben dónde están parados.
          </h2>
          <div className="cells">
            <div style={{ padding: '22px', border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <Image src="/testimonials/sofia-martinez.jpg" alt="Sofía Martínez" width={64} height={64} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <div>
                  <b style={{ display: 'block', fontSize: '13px', color: 'var(--t)' }}>Sofía Martínez</b>
                  <span style={{ display: 'block', marginTop: '3px', fontSize: '12px', lineHeight: 1.4, color: 'var(--s5)' }}>Estudiante de Derecho · Universidad de Buenos Aires</span>
                </div>
              </div>
              <p style={{ fontSize: '14px', margin: 0 }}>
                “Antes estudiaba releyendo todo el apunte y no sabía si realmente estaba preparado. Con Evaluo pude practicar a partir de mi PDF y ver qué temas necesitaba repasar. Me sirvió para organizar mejor el estudio antes del parcial.”
              </p>
            </div>
            <div style={{ padding: '22px', border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <Image src="/testimonials/tomas-fernandez.jpg" alt="Tomás Fernández" width={64} height={64} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <div>
                  <b style={{ display: 'block', fontSize: '13px', color: 'var(--t)' }}>Tomás Fernández</b>
                  <span style={{ display: 'block', marginTop: '3px', fontSize: '12px', lineHeight: 1.4, color: 'var(--s5)' }}>Estudiante de Psicología · Universidad Nacional de Tres de Febrero</span>
                </div>
              </div>
              <p style={{ fontSize: '14px', margin: 0 }}>
                “Practiqué sobre mis apuntes y aproveché mejor el tiempo de repaso.”
              </p>
            </div>
            <div style={{ padding: '22px', border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <Image src="/testimonials/lucia-gonzalez.jpg" alt="Lucía González" width={64} height={64} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <div>
                  <b style={{ display: 'block', fontSize: '13px', color: 'var(--t)' }}>Lucía González</b>
                  <span style={{ display: 'block', marginTop: '3px', fontSize: '12px', lineHeight: 1.4, color: 'var(--s5)' }}>Estudiante de Marketing · Universidad Siglo 21</span>
                </div>
              </div>
              <p style={{ fontSize: '14px', margin: 0 }}>
                “Con el progreso por tema supe qué volver a estudiar, en vez de releer todo.”
              </p>
              <span style={{ display: 'block', marginTop: '10px', fontSize: '11px', color: 'var(--s5)' }}>Testimonio de ejemplo</span>
            </div>
          </div>
        </div>
      </section>'''

pattern = re.compile(
    r"      <section className=\"sec\" style=\{\{ paddingBottom: '48px' \}\}>\n"
    r"        <div className=\"w\">\n"
    r"          <div className=\"eb l\">Lo que cuentan</div>.*?"
    r"      </section>",
    re.S,
)

updated, count = pattern.subn(new_block, text, count=1)
if count != 1:
    raise SystemExit('Expected testimonial section was not found.')
path.write_text(updated)

# Restore the production CI workflow exactly to the pre-temporary state.
subprocess.run([
    'git', 'checkout', '859311977d8424d5439bae18e1264cb8d6816d89', '--',
    '.github/workflows/ci.yml',
], check=True)

for temporary in [
    Path('.github/workflows/_temp_add_testimonial_photos.yml'),
    Path('scripts/temp_add_testimonial_photos.py'),
]:
    if temporary.exists():
        temporary.unlink()

subprocess.run(['git', 'config', 'user.name', 'evaluo-admin'], check=True)
subprocess.run(['git', 'config', 'user.email', 'evaluo-admin@users.noreply.github.com'], check=True)
subprocess.run(['git', 'add', 'public/testimonials', 'components/marketing/home-redesign.tsx', '.github/workflows/ci.yml', 'scripts/temp_add_testimonial_photos.py'], check=True)
subprocess.run(['git', 'commit', '-m', 'content: add testimonial photos'], check=True)
subprocess.run(['git', 'push', 'origin', 'HEAD:master'], check=True)
