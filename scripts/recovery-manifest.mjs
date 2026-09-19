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
  'profiles',
  'student_materials',
  'student_material_jobs',
  'simulator_attempts',
  'historial_respuestas',
  'user_subscriptions',
  'payment_transactions',
  'payment_checkout_attempts',
  'payment_webhook_events',
];

async function countAuthUsers() {
  let page = 1;
  let count = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const users = data?.users ?? [];
    count += users.length;
    if (users.length < 1000) break;
    page += 1;
  }

  return count;
}

async function countTable(table) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
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
      objects.push({
        path: fullPath,
        size,
      });
    }

    if (entries.length < 1000) break;
    offset += entries.length;
  }

  return objects;
}

const authUsers = await countAuthUsers();
const tables = {};
for (const table of criticalTables) {
  tables[table] = await countTable(table);
}

const storageObjects = await listStorageObjects('biblioteca');
storageObjects.sort((a, b) => a.path.localeCompare(b.path));

const storageFingerprint = createHash('sha256')
  .update(
    storageObjects
      .map((item) => `${item.path}\t${item.size}`)
      .join('\n')
  )
  .digest('hex');

const manifest = {
  version: 1,
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
