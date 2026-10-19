alter table public.student_materials
  add column if not exists processing_strategy text
    check (processing_strategy in ('text_native', 'hybrid_text', 'slide_layout', 'ocr_recommended')),
  add column if not exists document_analysis jsonb;

update public.student_materials
set processing_strategy = coalesce(processing_strategy, 'text_native')
where processing_strategy is null;
