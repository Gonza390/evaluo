# Recuperación ante desastres de Evaluo

Este procedimiento valida que Evaluo pueda recuperarse en un entorno aislado sin depender de que las migraciones históricas reconstruyan una base vacía.

## Alcance

La prueba debe cubrir por separado:

- Auth: usuarios.
- Base de datos: perfiles, materiales, jobs, intentos de simulador, historial de respuestas, suscripciones y tablas de pagos.
- Storage: objetos reales del bucket `biblioteca`.
- Aplicación: login, apertura de un PDF restaurado, simulador y lectura del estado de una suscripción.

**Importante:** los backups de base de Supabase no contienen los bytes de Storage; sólo contienen metadatos. Los PDFs deben respaldarse y restaurarse por separado.

## 1. Capturar la huella del origen

Usar credenciales de service role sólo en un entorno local/seguro. Nunca commitearlas.

```bash
export RECOVERY_SUPABASE_URL="https://<project-ref>.supabase.co"
export RECOVERY_SUPABASE_SERVICE_ROLE_KEY="<service-role>"
node scripts/recovery-manifest.mjs recovery-source.json
```

El archivo resultante contiene conteos y fingerprints SHA-256 de IDs/estado crítico, más una huella de paths/tamaños de Storage. No contiene emails, teléfonos, tokens ni contenido de PDFs.

## 2. Generar backup lógico de la base

Seguir el procedimiento oficial de Supabase con una conexión de base de datos del proyecto origen:

```bash
supabase db dump --db-url "$SOURCE_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$SOURCE_DB_URL" -f schema.sql
supabase db dump --db-url "$SOURCE_DB_URL" -f data.sql --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

Guardar estos archivos cifrados y fuera del mismo proveedor/proyecto cuando el objetivo sea disaster recovery real.

## 3. Respaldar Storage

Exportar el bucket `biblioteca` por separado usando la API de Storage o su interfaz S3 compatible. Conservar paths exactos, bytes y metadata necesaria.

No considerar completo un backup que tenga sólo `storage.objects`: esa tabla no contiene los PDFs.

## 4. Crear un destino aislado

Usar un proyecto/branch de Supabase dedicado al drill. No restaurar sobre producción para probar el procedimiento.

Antes de ejecutar el restore:

- habilitar las extensiones necesarias;
- mantener deshabilitados webhooks/cron que puedan producir efectos externos;
- no reutilizar secretos de Mercado Pago en el destino de prueba.

## 5. Restaurar la base

En el destino aislado:

```bash
psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$TARGET_DB_URL"
```

Si el restore falla, descartar el destino y repetir desde cero. El drill no debe reparar manualmente filas para "hacerlo pasar"; cualquier paso manual requerido debe incorporarse al runbook.

## 6. Restaurar Storage

Recrear el bucket y volver a cargar los objetos conservando sus paths originales. Verificar al menos un PDF privado y uno compartido, si existen.

## 7. Comparar origen y restaurado

Generar la huella en el destino:

```bash
export RECOVERY_SUPABASE_URL="https://<target-ref>.supabase.co"
export RECOVERY_SUPABASE_SERVICE_ROLE_KEY="<target-service-role>"
node scripts/recovery-manifest.mjs recovery-target.json
node scripts/compare-recovery-manifests.mjs recovery-source.json recovery-target.json
```

La comparación debe terminar en PASS para Auth, tablas críticas y Storage. Desde la versión 2 del manifest se comparan tanto conteos como fingerprints, para evitar falsos PASS cuando dos conjuntos distintos tienen la misma cantidad de filas.

## 8. Smoke funcional del destino

Validar:

1. login de una cuenta de prueba;
2. perfil y materias;
3. apertura de un material restaurado;
4. descarga/visualización del PDF;
5. historial de respuestas y un simulador;
6. lectura de suscripción/transacción existente;
7. que ningún webhook de Mercado Pago del entorno aislado pueda modificar producción.

## 9. RTO/RPO del drill

Registrar:

- inicio del backup;
- inicio y fin del restore de DB;
- inicio y fin del restore de Storage;
- fin de los smoke tests;
- cantidad de datos perdida respecto del punto de backup, si la hubiera.

Con eso se obtiene un RTO observado y un RPO observado, en lugar de asumir que "tener backups" equivale a poder recuperarse.

## Rollback de aplicación

Un deploy defectuoso de Vercel debe revertirse al último deployment READY conocido sin modificar la base. Si el incidente incluye una migración destructiva, el rollback del código no restaura datos: usar el backup/PITR correspondiente y documentar el downtime.

## Estado actual

Las migraciones históricas del repositorio todavía no constituyen un baseline reproducible desde una base vacía. Hasta que exista ese baseline, el camino de recuperación soportado para un desastre completo es **backup lógico/físico + backup separado de Storage + verificación mediante este drill**.
