-- Jalankan di Supabase SQL Editor.
-- Pengguna baru mendapat profil nonaktif dan TIDAK mendapat role otomatis.
-- Owner harus memeriksa pendaftar, mengaktifkan profil, lalu memberi role.

create or replace function public.handle_gm_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    new_full_name text;
begin
    new_full_name := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');

    if new_full_name is null then
        new_full_name := split_part(coalesce(new.email, ''), '@', 1);
    end if;

    insert into public.profiles (id, full_name, is_active)
    values (new.id, new_full_name, false)
    on conflict (id) do nothing;

    return new;
end;
$$;

do $$
begin
    if not exists (
        select 1
        from pg_trigger
        where tgname = 'on_gm_auth_user_created'
          and tgrelid = 'auth.users'::regclass
          and not tgisinternal
    ) then
        create trigger on_gm_auth_user_created
        after insert on auth.users
        for each row
        execute function public.handle_gm_new_auth_user();
    end if;
end;
$$;
