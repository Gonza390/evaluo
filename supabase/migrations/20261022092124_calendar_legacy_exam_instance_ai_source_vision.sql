-- Compatibilidad para clientes antiguos que todavía envían parcial_1 / parcial_2.
-- Conservamos el CHECK de valores canónicos para rechazar cualquier otro valor.
create or replace function public.normalize_legacy_calendar_exam_instance()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.exam_instance is not null then
    if lower(btrim(new.exam_instance)) = 'parcial_1' then
      new.exam_instance := '1';
    elsif lower(btrim(new.exam_instance)) = 'parcial_2' then
      new.exam_instance := '2';
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_normalize_legacy_calendar_exam_instance on public.study_calendar_events;
create trigger trg_normalize_legacy_calendar_exam_instance
before insert or update of exam_instance on public.study_calendar_events
for each row
execute function public.normalize_legacy_calendar_exam_instance();

comment on function public.normalize_legacy_calendar_exam_instance() is
  'Compatibilidad de escrituras antiguas parcial_1/parcial_2; el CHECK conserva 1, 2 e integrador.';

-- La extracción visual registra source_vision. Sin este valor, Postgres
-- rechaza todas las métricas del lote (no solamente las de OCR).
alter table public.student_material_ai_usage
  drop constraint if exists student_material_ai_usage_operation_check;
alter table public.student_material_ai_usage
  add constraint student_material_ai_usage_operation_check
  check (operation = any (array[
    'source_vision'::text,
    'summary_map'::text,
    'summary_reduce'::text,
    'summary_canonical'::text,
    'summary_pdf'::text,
    'summary_vision'::text,
    'glossary'::text,
    'glossary_pdf'::text,
    'glossary_vision'::text,
    'chunk_evaluation'::text
  ]));
