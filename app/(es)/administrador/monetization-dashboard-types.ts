export type MonetizationFilters = {
  period: '1' | '7' | '14' | '30' | 'custom';
  from: string | null;
  to: string | null;
  university: string;
  career: string;
  country: string;
  provider: string;
  state: 'all' | 'free' | 'active' | 'pending' | 'canceled' | 'expired';
};
export type MonetizationSnapshot = {
  from: string;
  through: string;
  days: number;
  financial: {
    registered: number; active_premium: number; free_users: number; new_subs: number;
    revenue_ars: number; previous_ars: number; paying_users: number;
    paid_users: number; checkout_users: number; approved_payments: number;
    premium_seen: number; pricing_seen: number; free_active: number;
  };
  checkout: {
    attempts: number; approved: number; failed: number; pending: number;
    previous_attempts: number; previous_approved: number;
  };
  subscriptions: {
    active: number; pending: number; canceled: number; expired: number;
    cancellations_in_period: number; expirations_in_period: number;
  };
  mismatches: {
    paid_without_active: number;
    approved_checkout_without_paid: number;
  };
  daily: Array<{
    d: string; revenue_ars: number; approved_payments: number; new_subs: number;
  }>;
  providers: Array<{
    provider: string; attempts: number; approved: number; rejected: number;
    pending: number; paid_payments: number; revenue_ars: number;
    technical_events: number;
  }>;
  segments: Array<{
    dimension: 'university' | 'career' | 'country' | 'source' | 'provider';
    label: string; users: number; premium: number; revenue_ars: number; rank: number;
  }>;
  options: {
    countries: string[];
    universities: Array<{value: string; label: string}>;
    careers: Array<{value: string; label: string}>;
    providers: string[];
  };
};