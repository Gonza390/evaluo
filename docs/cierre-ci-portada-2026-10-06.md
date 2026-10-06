# Corrección de CI y entrada a Mi espacio — 2026-10-06

## Cambios

- La portada sin cookie de sesión retorna antes de crear el cliente Supabase. Cookies vacías, preferencias, referidos y el verificador PKCE no se consideran una sesión.
- Las cookies `sb-<proyecto>-auth-token` y sus partes `.0`, `.1`, etc. solo indican que hay que validar: `getUser()` sigue siendo quien decide la identidad. Una cookie inválida o una sesión vencida no habilitan la redirección.
- Las respuestas de la portada que verifican una sesión son `private, no-store`, incluidos los casos inválidos. La redirección autenticada conserva las cookies renovadas y la atribución de referidos. Las rutas protegidas mantienen su validación.
- Se elimina `eslint-config-next`, que no estaba importado ni aplicado en `eslint.config.mjs`. Esto retira la cadena vulnerable de `braces`/`micromatch` sin cambiar las reglas activas, bajar Next.js ni excluir dependencias del audit.
- CI ejecuta `security` y `quality` independientemente. `CI required` exige que ambos terminen correctamente; el audit conserva `npm audit --audit-level=high` y todas las verificaciones de calidad permanecen.

## Verificación local

- `npm audit --audit-level=high`: 0 vulnerabilidades.
- `npm run lint`: aprobado.
- `npm test`: aprobado, incluido el proxy real con Auth controlado para visitantes, cookies inválidas, sesiones válidas, cookies divididas, renovación y rutas protegidas.
- `npx tsc --noEmit`: aprobado.
- `npm run build`: aprobado; la portada sigue prerenderizada como ruta estática.
- El lockfile no introduce ni actualiza versiones de paquetes: únicamente retira dependencias que quedaron sin uso.

La prueba de Auth usa respuestas controladas y no sustituye una sesión real del usuario. Los comandos locales usan Node 24; CI ejecuta Node 22. La ejecución completa de GitHub, incluido Lighthouse, debe revisarse después del push. No se despliega Vercel con este cambio.

## Revisión

Security: no se usa la cookie para autenticar; no hay cambios de roles, RLS, secretos ni permisos. La lectura de cookies es solo una optimización de la ruta pública. La auditoría permanece bloqueante.

CTO: aprobado para integrar; el cambio conserva el contrato de autenticación y elimina una dependencia sin consumidores. El gate agregado no configura por sí mismo reglas de protección de la rama.

QA: verificación técnica local aprobada; el cierre de CI remoto depende de la ejecución posterior al push. No se afirma una mejora cuantificada de latencia o retención.
