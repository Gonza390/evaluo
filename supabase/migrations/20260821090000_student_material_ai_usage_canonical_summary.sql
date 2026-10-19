alter table public.student_material_ai_usage
  drop constraint if exists student_material_ai_usage_operation_check;

alter table public.student_material_ai_usage
  add constraint student_material_ai_usage_operation_check
  check (
    operation in (
      'summary_map',
      'summary_reduce',
      'summary_canonical',
      'summary_pdf',
      'summary_vision',
      'glossary',
      'glossary_pdf',
      'glossary_vision',
      'chunk_evaluation'
    )
  );
