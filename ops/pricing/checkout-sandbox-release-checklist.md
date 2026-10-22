# Evaluo Pricing 2.0 — validación de sandbox y publicación

## Estado verificado (22 de octubre de 2026)
- **No se hizo un cobro real ni de sandbox**. CI comprueba monto y solicitud Mercado Pago con `fetch` simulado, sin credenciales.
- CI de la rama comprueba `npm audit --audit-level=high`, TypeScript, tests, build y Lighthouse.
- Next.js actualizado en esta rama a `16.4.2`; `package-lock.json` incluido.
- Entorno Vercel **Preview**: `MERCADOPAGO_WEBHOOK_SECRET` disponible, **`MERCADOPAGO_ACCESS_TOKEN` no configurado** (solo en Production). No se leen ni copian secretos productivos.
- Entorno Production: variables de Mercado Pago presentes. **No usar el token de producción para testear pagos.**
- `public.subscription_plans` en Supabase productivo: precio Premium $12.990. Script de corrección preparado pero no ejecutado.

## Prueba obligatoria ANTES del merge
1. Configurar en Vercel Preview credenciales **exclusivas de Mercado Pago TEST** (token de prueba, correo pagador de prueba y webhook secret de prueba) desde su consola segura. No pegarlas en GitHub, logs ni en un chat.
2. Para aislar pruebas de producción, usar una **base de datos Supabase de pruebas**; no apuntar Preview a la base productiva al generar operaciones de ensayo.
3. Desplegar preview de la rama exacta y confirmar: `GET /api/payments/offer` devuelve `monthlyPriceArs:9990`, `monthlyReferencePriceArs:14990`, `semesterPriceArs:45000`.
4. Registrar/login con usuario comprador de prueba, verificar que las tres tarjetas estén visibles y que el plan mensual muestre $9.990/mes, $14.990 tachado, renovación mensual.
5. Seleccionar **Premium mensual**; verificar en el checkout sandbox de Mercado Pago `ARS 9.990` y periodicidad mensual; completar el pago de prueba.
6. Verificar webhook con firma, `payment_checkout_attempts.status='approved'`, suscripción activa por $9.990, transacción registrada y UI Premium activada. Repetir el webhook: no debe duplicar registros.
7. Con **otro usuario de prueba** seleccionar **Premium 6 meses**; comprobar `ARS 45.000` pago único y ausencia de renovación automática; completar y verificar activación por seis meses.
8. Verificar que al intentar un monto de la UI desactualizado se recibe `409 price_changed` sin crear checkout.
9. Verificar que una suscripción preexistente mantiene su importe y fecha de renovación.
10. Repetir con pantalla móvil. NO probar operaciones reales hasta tener credenciales y usuarios de sandbox correctamente separados.

## Publicación
1. Confirmar CI verde (incluida seguridad y Lighthouse) **para el SHA final**; revisión de PR y conflicto con `master` resuelto.
2. Fusionar el PR a `master` y comprobar el despliegue `READY` en `evaluo.com.ar`.
3. Confirmar GET del API de ofertas y que el checkout de nuevas altas calcule el precio de $9.990; verificar que el frontend envía `expectedBaseAmountArs`.
4. Ejecutar **después del despliegue** `ops/pricing/launch-premium-price-9990.sql` sobre Supabase productivo. El script solo modifica el `price_ars` del catálogo si el precio anterior es $12.990.
5. Confirmar en Supabase: `SELECT code,price_ars,is_active FROM public.subscription_plans WHERE code='premium';` -> 9990.
6. Controlar errores de webhook, checkout y renovaciones luego de la publicación. Registrar la versión y respaldo de rollback.

## Rollback
- Si el checkout de producción falla, restaurar el deployment anterior y revisar intentos pendientes **sin reescribir importes o suscripciones existentes**.
- Si se vuelve al código anterior, revertir el precio del catálogo mediante SQL protegido con guard de $9.990; no tocar cuotas acordadas por Mercado Pago.
