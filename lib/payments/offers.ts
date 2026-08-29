export const PREMIUM_MONTHLY_PRICE_ARS = 12_990;
export const PREMIUM_MONTHLY_REFERENCE_PRICE_ARS = 15_990;
export const PREMIUM_SEMESTER_PRICE_ARS = 45_000;
export const PREMIUM_SEMESTER_MONTHS = 6;
export const PREMIUM_SEMESTER_LIMIT = 50;
export const PREMIUM_RECOVERY_PRICE_ARS = 9_990;

export type PremiumOfferCode = 'monthly' | 'semester' | 'recovery';

export const PUBLIC_PREMIUM_OFFERS = ['monthly', 'semester'] as const;

export function isPremiumOfferCode(value: unknown): value is PremiumOfferCode {
  return value === 'monthly' || value === 'semester' || value === 'recovery';
}

export function semesterEquivalentMonthlyPrice() {
  return Math.round(PREMIUM_SEMESTER_PRICE_ARS / PREMIUM_SEMESTER_MONTHS);
}

export function semesterSavingsPercent(monthlyPrice = PREMIUM_MONTHLY_PRICE_ARS) {
  const regularSixMonths = monthlyPrice * PREMIUM_SEMESTER_MONTHS;
  if (regularSixMonths <= 0) return 0;
  return Math.round((1 - PREMIUM_SEMESTER_PRICE_ARS / regularSixMonths) * 100);
}
