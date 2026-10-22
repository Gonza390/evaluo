-- Evaluo · Pricing 2.0 · sincronización de PRECIO DE NUEVAS ALTAS
--
-- EJECUTAR MANUALMENTE SOLO DESPUÉS de desplegar el backend nuevo en producción
-- y verificar que GET /api/payments/offer y el checkout muestran/cobran ARS 9.990.
-- NO es una migración automática; no ejecutar en previews ni antes del despliegue.
--
-- Verificado el 2026-10-22: public.subscription_plans('premium') = ARS 12.990.
-- No altera user_subscriptions, payment_checkout_attempts ni contratos Mercado Pago.
-- Mercado Pago usa el monto guardado en cada suscripción preapproval;
-- cambiar el precio del catálogo NO actualiza esos contratos.
--
-- Preflight recomendado:
-- SELECT code, price_ars, is_active FROM public.subscription_plans WHERE code = 'premium';
-- SELECT payment_provider,status,amount_ars,count(*)
-- FROM public.user_subscriptions GROUP BY 1,2,3 ORDER BY 1,2,3;
--
BEGIN;

DO $$
DECLARE
  previous_price numeric;
BEGIN
  SELECT price_ars INTO STRICT previous_price
  FROM public.subscription_plans
  WHERE code = 'premium' AND is_active = true
  FOR UPDATE;

  IF previous_price = 9990 THEN
    RAISE NOTICE 'Premium ya sincronizado: ARS 9.990; sin cambios.';
    RETURN;
  END IF;

  IF previous_price <> 12990 THEN
    RAISE EXCEPTION 'Precio Premium inesperado: %. Se esperaba ARS 12.990. Se canceló la sincronización.', previous_price;
  END IF;

  UPDATE public.subscription_plans
     SET price_ars = 9990
   WHERE code = 'premium' AND is_active = true AND price_ars = 12990;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo actualizar exactamente la fila Premium.';
  END IF;
END
$$;

COMMIT;

SELECT code, price_ars, is_active
FROM public.subscription_plans
WHERE code = 'premium';

-- Reversión de configuración (solamente si también se revierte la app):
-- BEGIN;
-- UPDATE public.subscription_plans SET price_ars = 12990
--  WHERE code = 'premium' AND is_active = true AND price_ars = 9990;
-- COMMIT;
-- IMPORTANTE: la reversión no modifica los importes ya acordados con Mercado Pago.
