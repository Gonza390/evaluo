create or replace function public.claim_my_referral_attribution(
  p_code text,
  p_source text default 'link'
)
returns table (
  referral_code_id uuid,
  code text,
  discount_percent numeric,
  applies_to text,
  partner_id uuid,
  partner_name text,
  brand_name text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  return query
  select *
  from public.claim_referral_attribution(auth.uid(), p_code, p_source);
end;
$$;

revoke all on function public.claim_my_referral_attribution(text, text) from public, anon;
grant execute on function public.claim_my_referral_attribution(text, text) to authenticated;
