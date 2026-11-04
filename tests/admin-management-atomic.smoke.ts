import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(p:string)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const action=source('app/(es)/administrador/gestion-dashboard-actions.ts');
const sql=source('supabase/migrations/20261104123703_admin_management_catalog_atomic_v1.sql');

assert.ok(action.includes("rpc('admin_management_resolve_catalog_v1'"));
assert.ok(action.includes('if(!data?.audited)'));
assert.ok(!action.includes("from('admin_management_audit').insert"), 'Audit cannot be a second HTTP request');
assert.ok(sql.includes('PERFORM public.resolve_university_request'));
assert.ok(sql.includes('INSERT INTO public.admin_management_audit'));
assert.ok(sql.includes("IS DISTINCT FROM 'service_role'"));
assert.ok(sql.includes("p.role = 'admin'"));
assert.ok(sql.includes('SECURITY INVOKER'));
assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.admin_management_resolve_catalog_v1'));
for(const table of ['public.carreras','public.materias','public.carrera_materias','public.facultades'])
 assert.ok(sql.includes(table));
console.log('Admin catalog approvals and mandatory audit are atomic and service-role-restricted.');
