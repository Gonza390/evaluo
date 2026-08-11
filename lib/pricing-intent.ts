'use client';

const PRICING_EMAIL_KEY = 'evaluo_pricing_prefill_email';
const PRICING_INTENT_KEY = 'evaluo_pricing_intent';

export function storePricingIntent(input: { email?: string; intent?: string }) {
  if (typeof window === 'undefined') return;

  if (input.email) {
    window.localStorage.setItem(PRICING_EMAIL_KEY, input.email.trim());
  }

  if (input.intent) {
    window.localStorage.setItem(PRICING_INTENT_KEY, input.intent.trim());
  }
}

export function consumeStoredPricingEmail() {
  if (typeof window === 'undefined') return '';

  const value = window.localStorage.getItem(PRICING_EMAIL_KEY) ?? '';
  if (value) {
    window.localStorage.removeItem(PRICING_EMAIL_KEY);
  }
  return value;
}

export function readStoredPricingIntent() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(PRICING_INTENT_KEY) ?? '';
}
