alter table public.student_material_chunks
  add column if not exists page_start integer,
  add column if not exists page_end integer,
  add column if not exists section_title text,
  add column if not exists content_hash text;

alter table public.student_material_chunks
  drop constraint if exists student_material_chunks_page_range_chk;

alter table public.student_material_chunks
  add constraint student_material_chunks_page_range_chk check (
    (page_start is null and page_end is null)
    or (
      page_start is not null
      and page_end is not null
      and page_start > 0
      and page_end >= page_start
    )
  );

create index if not exists student_material_chunks_material_page_idx
  on public.student_material_chunks(student_material_id, page_start, chunk_index);

create index if not exists student_material_chunks_content_hash_idx
  on public.student_material_chunks(content_hash)
  where content_hash is not null;
