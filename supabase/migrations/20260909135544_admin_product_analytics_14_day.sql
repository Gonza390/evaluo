do $$
declare
  function_def text;
  updated_def text;
begin
  select pg_get_functiondef('public.admin_product_user_journeys(integer,uuid[])'::regprocedure)
  into function_def;

  updated_def := replace(
    function_def,
    'case when p_period_days in (1, 7, 30) then p_period_days else 7 end',
    'case when p_period_days in (1, 7, 14, 30) then p_period_days else 7 end'
  );

  if updated_def = function_def then
    raise exception 'Expected period whitelist was not found in admin_product_user_journeys';
  end if;

  execute updated_def;
end;
$$;
