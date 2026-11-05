# Free V2 / Premium — control de lanzamiento (sin Preview)

Documento operativo. No implica autorización para hacer deploy, cambiar `main`, alterar credenciales de pagos ni habilitar Free V2.

## 1. Release gate técnico

1. Elegir un SHA **inmutable** de `master`; no usar un CI de un SHA anterior.
2. Verificar en GitHub Actions el workflow `CI`, con `CI required` y **todos** sus jobs en `success`: `security`, `quality` (TypeScript, lint, 88+ smoke, build, performance), `SEO landing Lighthouse` y `Free V2 isolated DB QA` (PostgreSQL 17, migraciones, RLS, PostgREST con JWT de prueba).
3. Verificar el mismo SHA para los QA de Onboarding, Progreso y Study UX. Comprobar `main...master`: `behind_by=0`.
4. Congelar el SHA antes de desplegar. Un commit posterior reabre los gates.
5. No crear Preview para esta revisión.

## 2. Respaldo obligatorio en Supabase Free

Supabase Free **no tiene backups diarios automáticos**. No ejecutar las migraciones de producción hasta contar con un respaldo lógico reciente y comprobado, almacenado **fuera** de GitHub.

En un equipo seguro con Docker y la CLI de Supabase instalada, iniciar sesión y enlazar el proyecto correcto:

```powershell
supabase login
supabase link --project-ref ybssujvrptqwpfqrelzk
New-Item -ItemType Directory -Force .\backups-evaluo
supabase db dump --linked --role-only --file .\backups-evaluo\roles.sql
supabase db dump --linked --file .\backups-evaluo\schema.sql
supabase db dump --linked --data-only --use-copy --file .\backups-evaluo\data.sql
Get-ChildItem .\backups-evaluo
Get-ChildItem .\backups-evaluo\*.sql | Get-FileHash -Algorithm SHA256
```

La CLI puede solicitar la contraseña de la BD. No pegar claves, dump, ni información de usuarios en tickets, chats públicos o el repositorio. Confirmar que todos los archivos existen, que el volcado de datos no está vacío, y probar su restauración en una BD aislada antes de considerar el respaldo verificado.

**Limitación importante:** `supabase db dump` omite esquemas administrados (entre ellos Auth y Storage) en su volcado estándar. Para recuperación **completa**, respaldar por separado los datos administrados pertinentes y los **objetos físicos** de Supabase Storage: el dump de la BD no incluye los archivos PDF/DOCX almacenados. Confirmar que las políticas del proveedor y el procedimiento de recuperación cubren autenticación, archivos y metadatos. En particular, no hacer un restore de prueba sobre producción.

Docs: https://supabase.com/docs/guides/platform/backups
CLI: https://supabase.com/docs/reference/cli/introduction
Restauración: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

## 3. Preflight de producción (solo consultas)

Ejecutar desde SQL Editor:

```sql
select
  to_regclass('public.free_study_v2_rollout') as rollout,
  to_regclass('public.free_study_v2_unlocks') as unlocks,
  to_regclass('public.free_study_v2_upload_claims') as claims,
  to_regclass('public.free_study_v2_plan_claims') as plans,
  to_regclass('public.study_material_v2_upload_ledger') as ledger;
select
  count(*) as materials,
  count(*) filter(where processing_status='ready') as ready,
  count(distinct user_id) filter(where processing_status='ready') as historic_claim_users
from public.student_materials;
select count(*) as historic_study_plans from public.student_personal_study_plans;
```

Situación comprobada el 2026-11-05: base ~128 MB, 158 materiales, 146 listos, 109 usuarios con material listo y 1 plan; las seis entidades Free V2 están ausentes. **Todos estos usuarios reciben cupos nuevos cuando Free V2 se active**; los registros antiguos permanecen, pero no se importan como consumo. Estos números **no son estáticos**: volver a medir antes del corte.

## 4. Migraciones con activación apagada — ejecutar solo tras backup verificado

Archivos, ya probados en PostgreSQL/PostgREST aislado:

- `supabase/migrations/20261104180000_free_study_v2_unlocks.sql`
- `supabase/migrations/20261104183000_free_study_v2_plan_claim.sql`

Aplicar en orden, registrando las versiones en historial de migraciones, preferentemente a través del mecanismo versionado de Supabase. No ejecutarlas dos veces por vías distintas.

Después de instalarlas, verificar **antes de cualquier activación**:

```sql
select enabled from public.free_study_v2_rollout where id = true; -- debe ser false
select count(*) from public.free_study_v2_upload_claims; -- DEBE ser 0
select count(*) from public.study_material_v2_upload_ledger; -- DEBE ser 0
select count(*) from public.free_study_v2_plan_claims; -- DEBE ser 0
select has_function_privilege('anon',
  'public.claim_free_study_v2_unlock(uuid,uuid,text,text)', 'EXECUTE') as anon_may_claim,
  has_function_privilege('authenticated',
  'public.claim_free_study_v2_unlock(uuid,uuid,text,text)', 'EXECUTE') as authenticated_may_claim;
-- ambos deben ser false
```

Confirmar que el modelo antiguo sigue funcionando, que no hay nuevas denegaciones de carga o plan y que las migraciones figuran en `supabase_migrations.schema_migrations`. **Revalidar los tres contadores en cero inmediatamente antes de la activación**: ningún material/plan procesado con el switch apagado debe gastar los nuevos cupos.

Al lanzar, probar con una cuenta que **ya tenía PDF y plan**: puede subir un PDF/DOCX nuevo, acceder a sus archivos anteriores y guardar el primer plan bajo V2. Recién su segunda carga nueva debe bloquearse. Un Premium con tres materiales históricos de ese mismo día debe poder cargar tres nuevos materiales desde el lanzamiento; el cuarto debe bloquearse. Confirmar que borrar el primer archivo nuevo no reinicia el cupo.

## 5. Habilitación, validación y rollback (NO ejecutar en etapa de preparación)

La activación requiere **dos interruptores**:

- Vercel producción: `FREE_STUDY_V2_ENABLED=1` junto con `VERCEL_ENV=production`.
- BD: `update public.free_study_v2_rollout set enabled=true, updated_at=now() where id=true;`

Activarlos de manera coordinada solamente tras autorización de release, pago Sandbox de extremo a extremo y checks verdes. No configurar esto en Preview, no cambiar `main` antes de la aprobación.

Si es necesario desactivar el sistema nuevo, **apagar ambos**: BD `enabled=false` y Vercel `FREE_STUDY_V2_ENABLED=0` más un despliegue correspondiente. Apagar uno solo no elimina todas las restricciones. Nunca borrar los nuevos claims ni el ledger para revertir: registran consumos hechos **después del lanzamiento** y deben sobrevivir si se apaga y reactiva el modelo. Los documentos previos permanecen sin contar.

## 6. Evidencia de pagos exigida al propietario

Mercado Pago debe aprobar **por separado** el flujo mensual recurrente y el semestre de término fijo; cuentas de vendedor y comprador de prueba, tarjetas de prueba, webhook con firma válida, checkout asociado a cuenta aislada, suscripción activa al volver, cancelación y vencimiento. No apuntar webhooks sandbox a una BD productiva ni cambiar `MERCADOPAGO_TEST_MODE` en producción para hacer QA.

Fuentes: https://www.mercadopago.com.ar/developers/es/news/2023/11/16/Questions-on-how-to-test-your-integration--
y https://www.mercadopago.com.ar/developers/es/docs/subscriptions/subscription-management

**Release:** NO GO si falta cualquiera de estos controles.
