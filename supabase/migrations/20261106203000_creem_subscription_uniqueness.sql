-- Garantizar que las notificaciones concurrentes de Creem no creen dos
-- accesos Premium para una misma suscripción en producción.
-- El índice afecta solo a Creem, sin cambiar datos de Mercado Pago.
create unique index if not exists user_subscriptions_creem_subscription_unique
  on public.user_subscriptions (payment_provider, provider_subscription_id)
  where payment_provider = 'creem' and provider_subscription_id is not null;
