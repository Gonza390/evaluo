# Evaluo Free V2 y Premium — rollout técnico

Estado: código y migraciones en `master`; no desplegar en `main` ni aplicar cambios a producción hasta que pase QA.

## Contrato Free

- Una carga PDF o DOCX de por vida por cuenta, sin reposición si se elimina.
- PDF hasta 100 páginas; DOCX hasta 150.000 caracteres extraídos; archivo máximo 20 MB.
- Ejercicios desbloqueables por cuenta: 12 opciones múltiples, 10 verdadero/falso, una ronda de 6 pares, 2 casos, 25 flashcards y un simulacro de 20 preguntas.
- 1 plan de estudio gratuito. Se puede editar el mismo plan; borrarlo no devuelve el cupo.
- Resumen y glosario accesibles; mapa mental exclusivo de Premium.
- Las explicaciones pedagógicas de respuestas equivocadas NO tienen cupo independiente.
- La generación fallida no consume material; repetir ejercicios desbloqueados no consume otro cupo.

## Contrato Premium

- Premium no utiliza los cupos vitalicios de Free V2.
- Se conserva el límite operativo de 3 nuevos materiales por día UTC y uno en procesamiento.
- Práctica, casos, flashcards, simulacros, planes y mapas mentales no tienen los cupos comerciales de Free.
- Los endpoints IA siguen con rate limits y validación pedagógica. Evitar prometer «IA ilimitada» sin presupuesto específico.
- El acceso depende de `hasPremiumSubscriptionAccess` y su expiración; una cancelación con vencimiento futuro mantiene el acceso hasta ese vencimiento.

## Dos switches necesarios

1. El código sólo usa Free V2 si `VERCEL_ENV=production` y `FREE_STUDY_V2_ENABLED=1`.
2. PostgreSQL sólo aplica los triggers de límite de carga y los bloqueos RLS de escrituras directas de planes cuando `public.free_study_v2_rollout.enabled=true`.

Migrar con switch DB en `false` no debe bloquear el modelo anterior. La tabla de claims sí registra materiales procesados, para conservar el historial irreversible sin cambiar el acceso actual.

## Secuencia de activación

1. Verificar GitHub Actions de `master`: Typecheck, lint, smoke, build, security, presupuestos de performance.
2. En QA, ensayar las migraciones `20261104180000_free_study_v2_unlocks.sql` y `20261104183000_free_study_v2_plan_claim.sql`, sin cuentas reales, especialmente políticas RLS, triggers y RPCs.
3. Crear respaldo/plan de recuperación de Supabase. En producción aplicar ambas migraciones con `enabled=false`. Comprobar que el plan anterior continúa funcionando.
4. Sincronizar `master` con `main` únicamente cuando el usuario autorice el lanzamiento. Configurar `FREE_STUDY_V2_ENABLED=1` únicamente para production de Vercel y desplegar.
5. Activar switch DB mediante cambio explícito supervisado: `update public.free_study_v2_rollout set enabled=true, updated_at=now() where id=true;`. Mantener el período entre ambas activaciones al mínimo; controlar tráfico.
6. Validar una cuenta Free, una Premium activa, una cancelada vigente y una vencida; ejercitar los dos flujos de carga PDF/DOCX, colisión de dos solicitudes, generación por tema y todos los cupos por cuenta.

## Desactivación / rollback sin romper planes anteriores

Para desactivar **completamente**, deshabilitar **ambos** switches: `update public.free_study_v2_rollout set enabled=false, updated_at=now() where id=true;` y `FREE_STUDY_V2_ENABLED=0` con despliegue de producción. Desactivar sólo Vercel deja los triggers y bloqueos RLS activos; desactivar sólo la tabla deja vigente el control Free del backend.

No borrar tablas, claims, planes ni ejercicios ante un rollback; conservar historial y evitar duplicar cupos en un lanzamiento posterior.

## Regresión técnica mínima

- Usuario sin material: primera carga lista se permite. Segunda concurrente, borrado o reintento: se bloquea.
- Carga fallida: se puede intentar una nueva. Cuenta Premium: 3 altas UTC, no 4; una concurrente, no dos.
- Plan Free: crear, editar, eliminar y reintentar; JWT directo no puede saltarse la regla cuando DB está habilitada.
- Los bancos de opciones, temas con IA, verdadero/falso, casos, pares y flashcards verifican item IDs en servidor y cupos globales.
- Un fallo de Supabase no debe degradar silenciosamente Premium a Free ni consumir cupos.
- Previews de `master` siempre operan sin cobro de cupos Free V2.
- No tocar vistas de precios, diseños, estilos, upsells ni pantallas: quedan a cargo del diseñador del producto.

## Contrato técnico para tus nuevas pantallas

- `GET /api/free-study-v2/quota?materialId=<UUID propio>` requiere autenticación y devuelve los cupos globales de la cuenta, por modalidad. Sólo ofrece `upgrade` cuando un cupo realmente está agotado. En un preview devuelve `active:false`; en Premium, `quotas:null`. Si falla Supabase devuelve 503, nunca un cupo inventado.
- `POST /api/free-study-v2/claim`: al agotar un ejercicio devuelve `allowed:false` y `upgrade` (`reason`, `source`, `returnTo`, `href`). Un error de autenticación, red o verificación de material nunca se confunde con venta.
- `POST /api/study-plans`: al agotar el único plan gratuito devuelve 403 con `upgrade`. Editar el plan ya creado sigue permitido.
- Ambas Server Actions de carga devuelven `upgrade` únicamente ante `FreeStudyV2UploadLimitError`, no ante errores de formato, servicio o procesamiento.
- `lib/premium-flow.ts` valida el retorno a rutas internas y preserva materia, modalidad, tema y ancla en `returnTo` cuando los provea la pantalla. No admite URLs externas ni retornos a loops de checkout.
- `/pricing` propaga `source`, `materia`, `parcial` y `returnTo` en las ofertas. `/api/payments/checkout` los traslada a la URL de retorno de Mercado Pago.
- `/pricing/resultado` muestra éxito sólo si el acceso Premium es efectivo. Una suscripción antigua vencida no invalida un intento de compra nuevo pendiente. Confirmar un pago emite `PREMIUM_ACCESS_CHANGED_EVENT` y las pantallas activas revalidan sus permisos.
- `/api/payments/status` devuelve 503 si falla el chequeo de suscripción; un fallo del historial auxiliar de pagos no oculta un Premium legítimo. `hooks/usePremium.tsx` invalida la caché tras pago, cancelación o regreso a la pestaña.

**Pendiente para el lanzamiento:** conectar los estados visuales a estos contratos con los diseños del usuario, verificar sandbox y webhooks reales, probar ambas migraciones en Supabase aislado, y pedir autorización antes de pasar a `main` o activar el nuevo modelo en producción.
