-- Private learner accounts, independent of surveys and other academy products.
create table public.av_students (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9][a-z0-9._-]{2,63}$'),
  full_name text not null check (length(full_name) between 1 and 120),
  password_hash text not null check (length(password_hash) between 60 and 300),
  is_active boolean not null default true,
  session_version uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.av_settings (
  id boolean primary key default true check (id),
  release_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.av_settings(id) values(true);
alter table public.av_students enable row level security;
alter table public.av_settings enable row level security;
revoke all on public.av_students,public.av_settings from public,anon,authenticated;
grant all on public.av_students,public.av_settings to service_role;

create function public.av_student_create(p_username text,p_full_name text,p_password_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
  insert into public.av_students(username,full_name,password_hash)
  values(p_username,p_full_name,p_password_hash)
  returning jsonb_build_object('id',id,'username',username,'full_name',full_name,'is_active',is_active,'created_at',created_at) into result;
  return result;
end $$;
create function public.av_student_update(p_id uuid,p_is_active boolean default null,p_password_hash text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
  update public.av_students set is_active=coalesce(p_is_active,is_active),password_hash=coalesce(p_password_hash,password_hash),session_version=gen_random_uuid(),updated_at=now()
  where id=p_id
  returning jsonb_build_object('id',id,'username',username,'full_name',full_name,'is_active',is_active,'created_at',created_at) into result;
  if result is null then raise exception 'STUDENT_NOT_FOUND'; end if;
  return result;
end $$;
create function public.av_release_set(p_enabled boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
  if p_enabled is null then raise exception 'INVALID_INPUT'; end if;
  update public.av_settings set release_enabled=p_enabled,updated_at=now() where id=true;
  return p_enabled;
end $$;
revoke all on function public.av_student_create(text,text,text),public.av_student_update(uuid,boolean,text),public.av_release_set(boolean) from public,anon,authenticated;
grant execute on function public.av_student_create(text,text,text),public.av_student_update(uuid,boolean,text),public.av_release_set(boolean) to service_role;
