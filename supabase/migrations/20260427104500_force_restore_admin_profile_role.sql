alter table public.profiles disable trigger profiles_protect_role;

update public.profiles
set role = 'admin',
    updated_at = now()
where id = '7148f1ef-22fd-4f69-8076-bd10e663895e';

alter table public.profiles enable trigger profiles_protect_role;
