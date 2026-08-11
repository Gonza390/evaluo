alter table public.student_materials
  add column if not exists processing_stage text not null default 'uploaded'
    check (processing_stage in ('uploaded', 'extracting', 'summarizing', 'glossary', 'ready', 'failed')),
  add column if not exists processing_progress integer not null default 5
    check (processing_progress >= 0 and processing_progress <= 100),
  add column if not exists processing_message text,
  add column if not exists processing_error text;

update public.student_materials
set
  processing_stage = case
    when processing_status = 'ready' then 'ready'
    when processing_status = 'failed' then 'failed'
    when processing_status = 'processing' then 'summarizing'
    else 'uploaded'
  end,
  processing_progress = case
    when processing_status = 'ready' then 100
    when processing_status = 'failed' then 0
    when processing_status = 'processing' then 55
    else 10
  end,
  processing_message = case
    when processing_status = 'ready' then 'Material listo para estudiar.'
    when processing_status = 'failed' then 'No pudimos terminar el procesamiento del PDF.'
    when processing_status = 'processing' then 'Estamos generando el espacio de estudio.'
    else 'PDF subido. Preparando procesamiento.'
  end
where processing_message is null;
