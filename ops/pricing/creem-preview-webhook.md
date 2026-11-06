# Creem · webhook en Preview (etapa de validación)

## Estado y límites de seguridad

- Endpoint preparado en `app/api/webhooks/creem/route.ts`: `POST /api/webhooks/creem`.
- **No habilita Premium** ni altera `user_subscriptions` o `payment_transactions` con eventos de prueba. Preview y Production comparten hoy el proyecto Supabase.
- El endpoint devuelve 503 en `VERCEL_ENV=production`, por diseño.
- Solo procesa eventos firmados con HMAC-SHA256 (header `creem-signature`), con `CREEM_API_KEY` de prueba y `CREEM_WEBHOOK_SECRET`.
- Los eventos de prueba se registran en la tabla existente `payment_webhook_events` con `provider='creem_test'` y deduplicación por `(provider, provider_event_id)`.
- Sin `CREEM_WEBHOOK_SECRET`, devuelve 503. No inventar claves ni usar una API key como webhook secret.

## Configuración pendiente (no publicar todavía)

1. Crear/editar un endpoint **Test Mode** en Creem Dashboard > Developers > Webhooks.
2. Usar la URL HTTPS del despliegue **Preview de `master`** que contenga el commit de la integración y agregar `/api/webhooks/creem`. No usar `https://evaluoapp.com/api/webhooks/creem`.
3. Suscribir `checkout.completed`, `subscription.active`, `subscription.paid`, `subscription.canceled`, `subscription.expired`, `subscription.paused`, `subscription.update`, `refund.created`, `dispute.created`.
4. Guardar el **webhook signing secret** generado por Creem como `CREEM_WEBHOOK_SECRET` en Vercel **Preview** (dato sensible). Nunca enviarlo por chat ni exponerlo con `NEXT_PUBLIC_`.
5. Desplegar nuevamente Preview para que el secreto esté disponible. Verificar que el endpoint sea accesible desde Creem sin exigir login o CAPTCHA (revisar protección de Vercel/Cloudflare).
6. Enviar eventos de test desde Creem y revisar `payment_webhook_events`. Duplicados deben responder 200 sin volver a procesar; firmas inválidas deben responder 401.

## Falta para habilitar cobros internacionales reales

- Crear producto y claves **Live** distintos de Test.
- Implementar creación de checkout internacional autenticado y persistir el intento con monto en **USD**, no en `amount_ars`; conciliar IDs, importe, moneda, usuario y producto.
- Usar una base aislada para validar el ciclo de Premium sin afectar a estudiantes reales.
- Incorporar un handler **Live** independiente con firma propia, idempotencia, reconciliación de renovaciones, cancelaciones, reembolsos y disputas, y fecha de fin de acceso confirmada.
- Integrar el estado internacional al selector de checkout, pantalla de retorno, gestión de suscripciones y panel de administración.
- Validar todas las pruebas y habilitar únicamente tras revisión explícita.
