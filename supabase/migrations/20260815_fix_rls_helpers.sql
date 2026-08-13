-- Fix RLS recursion: helper functions were not SECURITY DEFINER, so policies that
-- call is_group_member / has_active_subscription re-entered RLS until stack overflow.
-- That broke professionals(*, profiles(...)) embeds and group_members selects.

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and profile_id = auth.uid()
  )
$$;

create or replace function public.is_group_admin(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and profile_id = auth.uid() and role = 'admin'
  )
$$;

create or replace function public.has_active_subscription(sid uuid, pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where student_id = sid
      and professional_id = pid
      and status = 'active'
  )
$$;

-- Directory: signed-in users may read professional display names for matching.
drop policy if exists "profiles_professional_directory_select" on public.profiles;
create policy "profiles_professional_directory_select" on public.profiles
  for select to authenticated
  using (
    role = 'professional'
    or exists (
      select 1 from public.professionals p where p.profile_id = profiles.id
    )
  );
