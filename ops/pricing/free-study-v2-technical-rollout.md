# Evaluo Free V2 y Premium — rollout técnico

Estado: código y migraciones en `master`; no desplegar en `main` ni aplicar cambios a producción hasta que pase QA.

## Contrato Free

- Una **nueva** carga PDF o DOCX de por vida por cuenta **desde la activación de Free V2**, sin reposición si se elimina.
- **Lanzamiento desde cero:** los PDFs/DOCX y planes anteriores permanecen accesibles, pero no consumen cupos Free V2. Los estudiantes históricos reciben el mismo cupo nuevo que una cuenta recién creada.
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

Migrar con switch DB en `false` no debe bloquear el modelo anterior. **Tampoco debe crear claims ni registros en el ledger V2**, incluso si alguien sube o procesa materiales mientras el switch está apagado. Al activarlo, solo las nuevas cargas se incorporan al ledger y pueden gastar el cupo vitalicio Free o el límite diario Premium.

## Secuencia de activación

1. Verificar GitHub Actions de `master`: Typecheck, lint, smoke, build, security, presupuestos de performance.
2. En QA, ensayar las migraciones `20261104180000_free_study_v2_unlocks.sql` y `20261104183000_free_study_v2_plan_claim.sql`, sin cuentas reales, especialmente políticas RLS, triggers y RPCs.
3. Crear respaldo/plan de recuperación de Supabase. En producción aplicar ambas migraciones con `enabled=false`. Comprobar que el plan anterior continúa funcionando y que las tablas de claims Free, planes y ledger Premium **empiezan vacías**, preservando todos los archivos y planes históricos.
4. Sincronizar `master` con `main` únicamente cuando el usuario autorice el lanzamiento. Configurar `FREE_STUDY_V2_ENABLED=1` únicamente para production de Vercel y desplegar.
5. Activar switch DB mediante cambio explícito supervisado: `update public.free_study_v2_rollout set enabled=true, updated_at=now() where id=true;`. Mantener el período entre ambas activaciones al mínimo; controlar tráfico.
6. Validar una cuenta Free, una Premium activa, una cancelada vigente y una vencida; ejercitar los dos flujos de carga PDF/DOCX, colisión de dos solicitudes, generación por tema y todos los cupos por cuenta.

## Desactivación / rollback sin romper planes anteriores

Para desactivar **completamente**, deshabilitar **ambos** switches: `update public.free_study_v2_rollout set enabled=false, updated_at=now() where id=true;` y `FREE_STUDY_V2_ENABLED=0` con despliegue de producción. Desactivar sólo Vercel deja los triggers y bloqueos RLS activos; desactivar sólo la tabla deja vigente el control Free del backend.

No borrar tablas, claims, planes ni ejercicios ante un rollback; conservar los consumos **hechos después de la primera activación** y evitar regalar cupos dos veces ante un relanzamiento. Desactivar y volver a activar no debe importar retrospectivamente materiales de la etapa anterior.

## Regresión técnica mínima

- Usuario con o sin archivos históricos: recibe una nueva carga de Free V2, y solo la **segunda carga nueva** se bloquea. La eliminación del primer archivo nuevo no devuelve el cupo. Reprocesar un PDF antiguo no consume el nuevo cupo.
- Cuenta con plan previo: conserva su plan y recibe el cupo para su primer guardado V2. El historial previo no debe importar claims.
- Cuenta Premium con cargas anteriores al lanzamiento, incluso realizadas hoy: tiene tres nuevas altas por día UTC desde el lanzamiento. Las cargas antiguas no cuentan.
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


### Ajustes de cierre de suscripciones (2026-11-05)

- El webhook conserva el fin del período ya pagado cuando Mercado Pago envía una cancelación sin `next_payment_date`.
- Una suscripción cancelada **antes de aprobarse** deja su checkout en `failed`; la cancelación de una compra previamente aprobada mantiene el intento `approved`.
- Las pruebas automatizadas cubren estos estados de forma determinista, sin consumir créditos de Mercado Pago ni alterar suscripciones reales.
- **Resultado del diagnóstico de la base productiva, solo lectura:** catálogo Premium ARS 9.990; 18 checkouts históricos (1 aprobado de agosto, 8 pendientes y 9 fallidos), ninguna transacción `approved` registrada en `payment_transactions`. Los 6 webhooks `failed` se concentran en 2026-08-17; no atribuirlos a la versión actual.
- Las migraciones Free V2 `20261104180000_free_study_v2_unlocks.sql` y `20261104183000_free_study_v2_plan_claim.sql` aún no constaban instaladas en producción al consultar (no se aplican en esta auditoría).
- Antes de desplegar: aplicar las migraciones bajo un plan de recuperación y mantener `free_study_v2_rollout.enabled=false` hasta el despliegue coordinado. Luego activar el flag de Vercel y el switch de Supabase en el lanzamiento.
- El **único ensayo pendiente del proveedor** es confirmar en sandbox, con cuentas y base aisladas: mensual, semestral, pago real de prueba → webhook firmado → acceso Premium → retorno → cancelación/expiración. Un checkout que abre correctamente no demuestra el ciclo completo.
- No mostrar Premium al cerrar una práctica; el límite comercial se presenta solo cuando se solicita contenido nuevo sin cupos.
