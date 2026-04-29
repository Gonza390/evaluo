const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function seedPreguntas() {
  loadEnvLocal();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Faltan variables de entorno. Define SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_ANON_KEY).'
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const preguntas = [
    {
      enunciado:
        'Las causas de justificación son circunstancias que excluyen la punibilidad sin afectar el ilícito o la culpabilidad.',
      opciones: { a: 'VERDADERO', b: 'FALSO' },
      respuesta_correcta: 'b',
      explicacion: 'La respuesta correcta es FALSO.',
    },
    {
      enunciado: 'Autor directo es aquel que realiza personalmente la conducta.',
      opciones: { a: 'VERDADERO', b: 'FALSO' },
      respuesta_correcta: 'a',
      explicacion: 'La respuesta correcta es VERDADERO.',
    },
    {
      enunciado:
        '¿Cuál es el quórum legal de la asamblea extraordinaria de accionistas en primera convocatoria?',
      opciones: { a: '50%', b: '60%', c: '30%', d: 'Unanimidad' },
      respuesta_correcta: 'b',
      explicacion: 'El quórum es del 60%.',
    },
  ];

  const { data, error } = await supabase.from('preguntas').insert(preguntas).select();

  if (error) {
    throw error;
  }

  console.log(`Seed completado. Filas insertadas: ${data.length}`);
}

seedPreguntas()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error al insertar datos en Supabase:', err.message || err);
    process.exit(1);
  });
