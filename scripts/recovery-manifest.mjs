import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const url = process.env.RECOVERY_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.RECOVERY_SUPABASE_SERVICE_ROLE_KEY?.trim();
const outputPath = process.argv[2] || 'recovery-manifest.json';

if (!url || !serviceRoleKey) {
  console.error(
    'Definí RECOVERY_SUPABASE_URL y RECOVERY_SUPABASE_SERVICE_ROLE_KEY antes de ejecutar este script.'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const criticalTables = [
  {
    name: 'profiles',
    fingerprintColumns: ['id', 'carrera_id', 'universidad_id', 'role', 'last_subject_id'],
  },
  {
    name: 'student_materials',
    fingerprintColumns: [
      'id',
      'user_id',
      'file_path',
      'file_size_bytes',
      'page_count',
      'processing_status',
      'visibility',
      'content_fingerprint',
    ],
  },
  {
    name: 'student_material_jobs',
    fingerprintColumns: ['id', 'student_material_id', 'status', 'attempts'],
  },
  {
    name: 'simulator_attempts',
    fingerprintColumns: [
      'id',
      'user_id',
      'materia_id',
      'parcial',
      'total_questions',
      'correct_answers',
      'wrong_answers',
      'answered_questions',
      'premium_only',
      'mode',
    ],
  },
  {
    name: 'historial_respuestas',
    fingerprintColumns: ['id', 'usuario_id', 'pregunta_id', 'materia_id', 'es_correcta', 'peso'],
  },
  {
    name: 'user_subscriptions',
    fingerprintColumns: [
      'id',
      'user_id',
      'plan_id',
      'status',
      'payment_provider',
      'provider_subscription_id',
      'amount_ars',
      'promotion_code',
      'promotional_cycles_used',
    ],
  },
  {
    name: 'payment_transactions',
    fingerprintColumns: [
      'id',
      'user_id',
      'subscription_id',
      'provider',
      'provider_payment_id',
      'provider_subscription_id',
      'status',
      'amount_ars',
      'currency',
      'paid_at',
    ],
  },
  {
    name: 'payment_checkout_attempts',
    fingerprintColumns: [
      'id',
      'user_id',
      'plan_id',
      'provider',
      'provider_subscription_id',
      'offer_code',
      'base_amount_ars',
      'discount_amount_ars',
      'amount_ars',
      'currency',
      'status',
    ],
  },
  {
    name: 'payment_webhook_events',
    fingerprintColumns: ['id', 'provider', 'provider_event_id', 'event_type', 'resource_id', 'status'],
  },
];

function sha256(lines) {
  return createHash('sha256').update(lines.join('\n')).digest('hex');
}

function stableValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') {
    return JSON.stringify(
      Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)))
    );
  }
  return String(value);
}

async function fingerprintAuthUsers() {
  let page = 1;
  const ids = [];

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const users = data?.users ?? [];
    ids.push(...users.map((user) => user.id));
    if (users.length < 1000) break;
    page += 1;
  }

  ids.sort();
  return { count: ids.length, sha256: sha256(ids) };
}

async function fingerprintTable({ name, fingerprintColumns }) {
  const pageSize = 1000;
  let offset = 0;
  const rows = [];

  while (true) {
    const { data, error } = await supabase
      .from(name)
      .select(fingerprintColumns.join(','))
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(`${name}: ${error.message}`);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += page.length;
  }

  const normalizedRows = rows.map((row) =>
    fingerprintColumns.map((column) => stableValue(row[column])).join('\t')
  );

  return { count: rows.length, sha256: sha256(normalizedRows) };
}

async function listStorageObjects(bucket, prefix = '') {
  const objects = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw error;

    const entries = data ?? [];
    for (const entry of entries) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (!entry.id && !entry.metadata) {
        objects.push(...(await listStorageObjects(bucket, fullPath)));
        continue;
      }

      const size = Number(entry.metadata?.size ?? 0) || 0;
      objects.push({ path: fullPath, size });
    }

    if (entries.length < 1000) break;
    offset += entries.length;
  }

  return objects;
}

const authUsers = await fingerprintAuthUsers();
const tables = {};
for (const table of criticalTables) {
  tables[table.name] = await fingerprintTable(table);
}

const storageObjects = await listStorageObjects('biblioteca');
storageObjects.sort((a, b) => a.path.localeCompare(b.path));

const storageFingerprint = sha256(storageObjects.map((item) => `${item.path}\t${item.size}`));

const manifest = {
  version: 2,
  generatedAt: new Date().toISOString(),
  projectHost: new URL(url).host,
  auth: { users: authUsers },
  tables,
  storage: {
    biblioteca: {
      objectCount: storageObjects.length,
      totalBytes: storageObjects.reduce((sum, item) => sum + item.size, 0),
      sha256: storageFingerprint,
    },
  },
};

await writeFile(outputPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`Manifest de recuperación guardado en ${outputPath}`);
