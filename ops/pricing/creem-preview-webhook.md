# Creem — Implementación de cobros internacionales de Evaluo

## Estado

- Argentina: Mercado Pago en ARS, código y flujos previos intactos.
- Resto del mundo: Premium mensual en USD 9.99, sin prometer importes adicionales (impuestos se informan en checkout de Creem).
- En Preview se puede probar Creem Test Mode sin otorgar Premium real.
- En Production el cobro Creem Live permanece **apagado** hasta configurar y probar el producto y las claves Live. Control: `CREEM_INTERNATIONAL_ENABLED=true` más las tres variables Live.
- Los intentos Creem se almacenan en `public.creem_checkout_sessions` separados de ARS, con RLS owner-only.
- La suscripción Live se activa solo con `subscription.paid` firmado y asociado a un checkout y producto que coincide con monto USD 999, período válido e ID de transacción.
- Renovación `subscription.paid`: extensión del período; cancelación: sin nuevas renovaciones y acceso hasta el final pagado; reembolso/disputa: revocación.
- Eventos duplicados/reintentos se registran en `payment_webhook_events`.
- Retorno de checkout por URL **no desbloquea Premium**.

## Endpoints y UI

- `POST /api/payments/creem/checkout` — checkout autenticado, CSRF, rate limit, bloqueo AR para Live.
- `GET /api/payments/creem/availability` — mercado (Argentina/internacional), disponibilidad, monto.
- `GET /api/payments/creem/status?attemptId=UUID` — historial propio con RLS.
- `POST /api/webhooks/creem` — **solo Test Mode en Preview** (firma CREEM_WEBHOOK_SECRET).
- `POST /api/webhooks/creem-live` — **solo Live en Production cuando está habilitado** (firma CREEM_LIVE_WEBHOOK_SECRET).
- `GET /pricing/creem-prueba?attemptId=UUID` — confirma el estado del pago ficticio.
- Selector público de planes y pantalla in-app Premium enrutan por país; Argentina conserva ambos planes ARS.

## Variables Vercel

Preview:
- `CREEM_API_KEY` (prefijo creem_test_)
- `CREEM_WEBHOOK_SECRET`

Production (todavía sin configurar; nunca reutilizar claves Test):
- `CREEM_LIVE_API_KEY` (prefijo creem_live_)
- `CREEM_LIVE_PRODUCT_ID` (el producto **Live** recurrente mensual de US$ 9.99)
- `CREEM_LIVE_WEBHOOK_SECRET` (secreto de webhook **Live**, distinto del Test)
- `CREEM_INTERNATIONAL_ENABLED` = `false` inicialmente; activar a `true` **solo al final de la validación**

Nunca pegar secretos en conversaciones, commits, ni variables `NEXT_PUBLIC_`.

## Checklist antes de activar Live

1. Verificar que se compila `master`, que las 102+ pruebas smoke y quality CI pasan y que no hay regresión de Mercado Pago.
2. Ejecutar checkout Test Mode de extremo a extremo y comprobar `creem_checkout_sessions` recibe `pending` → `paid` (sin `user_subscriptions`).
3. Validar eventos firmados válidos/firmas inválidas, replays, renewals, cancelaciones, reembolsos, disputas y eventos fuera de orden.
4. Crear producto **Live** recurrente `every-month`, `currency=USD`, `price=999`, `status=active`. El backend comprueba el contrato contra el producto antes de iniciar cobro.
5. Configurar credenciales Production, mantener inicialmente `CREEM_INTERNATIONAL_ENABLED=false`.
6. Crear webhook en **Creem Live Mode**, URL `https://evaluoapp.com/api/webhooks/creem-live`, seleccionar eventos activos/pagos/cancelación/caducidad/reembolsos/disputas, configurar su secreto en Production.
7. Realizar una prueba controlada real Live, validar el registro y el acceso, reintentos, futura cancelación y que toda la transacción queda USD (nunca `amount_ars`).
8. Cambiar flag a true y desplegar Production una vez aprobado el control. Monitorear las primeras entregas Live.
9. No enviar webhook de prueba a Production. El webhook Test Mode tiene bloqueo `VERCEL_ENV='production'`.

## Notas técnicas

- Una Preview Vercel protegida por SSO requiere bypass de automatización configurado en el endpoint Test de Creem. No publicar ese secreto.
- `main` es Production; `master` es desarrollo. No fusionar sin aprobación y CI.
- Si Creem rechaza un producto por moneda, precio o modalidad distinta, el checkout debe fallar cerrado para evitar cobros que no puedan otorgar Premium.
