import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');
const sql = read('supabase/migrations/20261106205429_admin_user_languages_v1.sql');
const actions = read('app/(es)/administrador/admin-language-actions.ts');
const breakdown = read('app/(es)/administrador/admin-language-metrics.tsx');
const homepage = read('app/(es)/administrador/resumen/page.tsx');
const home = read('app/(es)/administrador/admin-home.tsx');
const retentionActions = read('app/(es)/administrador/users-retention-actions.ts');
const usersPage = read('app/(es)/administrador/usuarios/page.tsx');
const users = read('app/(es)/administrador/users-retention-dashboard.tsx');
const provider = read('components/i18n/app-locale-provider.tsx');

// Admin-only read: private email and profile details must not leave the server.
assert.match(sql, /SECURITY DEFINER/);
assert.match(sql, /SET search_path = ''/);
assert.match(sql, /service_role only/);
assert.match(sql, /REVOKE ALL ON FUNCTION public\.admin_user_languages_v1\(date, date\) FROM PUBLIC, anon, authenticated/);
assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.admin_user_languages_v1\(date, date\) TO service_role/);
assert.match(sql, /coalesce\(p\.role, 'student'\) <> 'admin'/);
assert.match(sql, /raw_user_meta_data ->> 'ui_locale'/);
assert.match(sql, /public\.admin_study_days_v1\(v_start, v_end\)/);
assert.match(sql, /'unknown'/);
assert.doesNotMatch(sql, /UPDATE auth\.users|ALTER TABLE auth\.users/i);

assert.match(actions, /await requireAdminAccess\(\)/);
assert.match(actions, /createAdminClient\(\)\.rpc\('admin_user_languages_v1'/);
assert.match(actions, /revalidate: 300/);
assert.match(homepage, /obtenerMetricasIdiomas/);
assert.match(home, /<AdminLanguageMetrics data=\{language\}/);
assert.match(retentionActions, /obtenerMetricasIdiomas\(languageStart,to\?\?todayStr\)/);
assert.match(usersPage, /language=\{r\.language\}/);
assert.match(users, /<AdminLanguageMetrics data=\{language\}/);

for (const label of ['Español','Inglés','Sin identificar','Nuevos','Activos','Estudiaron']) {
  assert.ok(breakdown.includes(label), label + ' must render');
}
assert.match(breakdown, /La clasificación refleja la preferencia de interfaz/);
// Existing accounts become classified only upon using the product again.
assert.match(provider, /missingLocale = accountLocale === null/);
assert.match(provider, /data\.ui_locale = storedLocale\(\) \?\? locale/);
assert.match(provider, /supabase\.auth\.updateUser\(\{ data \}\)/);
console.log('[admin-language] Secure Spanish, English and unclassified segments wired into overview and retention; legacy accounts capture real displayed language on next sign-in.');
