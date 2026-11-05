/** Reglas puras: el registro de una compra no debe degradarse al cancelar. */
export function preapprovalCheckoutStatus(
  providerStatus: string,
  previousCheckoutStatus: string | null | undefined,
): 'approved' | 'pending' | 'failed' {
  if (providerStatus.toLowerCase() === 'authorized' ||
      previousCheckoutStatus?.toLowerCase() === 'approved') return 'approved';
  if (['canceled', 'cancelled'].includes(providerStatus.toLowerCase())) return 'failed';
  return 'pending';
}

/** Una cancelación no debe acortar el período Premium previamente pagado.
 * Mercado Pago puede omitir next_payment_date después de cancelar.
 */
export function canceledSubscriptionAccessUntil(
  providerNextDate: string | null | undefined,
  persistedDates: readonly (string | null | undefined)[],
  now: number = Date.now(),
): string {
  const values = [providerNextDate, ...persistedDates]
    .map(value => value ? Date.parse(value) : Number.NaN)
    .filter(value => Number.isFinite(value) && value > now);
  return new Date(values.length ? Math.max(...values) : now).toISOString();
}
