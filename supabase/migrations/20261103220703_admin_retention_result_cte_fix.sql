do $fix$
declare body text;
begin
  body := pg_get_functiondef('public.admin_users_retention_v4(integer,date,date)'::regprocedure);
  body := replace(body,'from freq_summary f','from frequency f');
  body := replace(body,
    '(select jsonb_agg(to_jsonb(d) order by d.d) from daily d)',
    '(select jsonb_agg(to_jsonb(x) order by x.d) from daily x)');
  execute body;
end
$fix$;