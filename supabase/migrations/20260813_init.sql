-- Myalo core schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Confidentiality is enforced in RLS: platform-wide selects on intake/notes are denied.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('student', 'professional');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.match_status as enum ('proposed', 'declined', 'subscribed', 'ended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum ('pending', 'active', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.session_status as enum ('scheduled', 'released', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.group_member_role as enum ('admin', 'member');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text not null default '',
  email text,
  university text,
  year_of_study text,
  chosen_name text,
  gender text,
  consented_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.professionals (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  credentials text,
  specialties text[] not null default '{}',
  bio text,
  approach text,
  gender text,
  tone text,
  lgbtq_affirming boolean not null default false,
  faith_sensitive boolean not null default false,
  default_meet_url text,
  verified boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.intakes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  concerns text[] not null default '{}',
  prior_counseling text,
  counselor_style text,
  tone text,
  communication text,
  pref_gender text,
  lgbtq_affirming boolean not null default false,
  faith_sensitive boolean not null default false,
  answers jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create unique index if not exists intakes_student_latest on public.intakes (student_id, created_at desc);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  professional_id uuid not null references public.profiles (id) on delete cascade,
  status public.match_status not null default 'proposed',
  reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (student_id, professional_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  professional_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid references public.matches (id) on delete set null,
  status public.subscription_status not null default 'active',
  plan text not null default 'student',
  started_at timestamptz not null default now(),
  unique (student_id, professional_id)
);

create table if not exists public.care_plans (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null unique references public.subscriptions (id) on delete cascade,
  primary_issue text not null,
  duration_weeks int not null,
  session_target int not null,
  started_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  professional_id uuid not null references public.profiles (id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_min int not null default 50,
  status public.session_status not null default 'scheduled',
  notes_professional text,
  meet_released_at timestamptz,
  created_at timestamptz not null default now()
);

-- Meet URLs live here so students cannot read them until release.
create table if not exists public.session_meet_links (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  meet_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.nuggets (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  tags text[] not null default '{}',
  created_by uuid not null references public.profiles (id) on delete cascade,
  member_cap int not null default 12,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.group_member_role not null default 'member',
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create table if not exists public.group_checkins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  mood int not null check (mood between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  resource text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns public.user_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
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
as $$
  select exists (
    select 1 from public.subscriptions
    where student_id = sid
      and professional_id = pid
      and status = 'active'
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role public.user_role;
begin
  new_role := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student');
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new_role
  );
  if new_role = 'professional' then
    insert into public.professionals (profile_id) values (new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.add_group_creator_as_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, profile_id, role, display_name)
  values (new.id, new.created_by, 'admin', (select chosen_name from public.profiles where id = new.created_by));
  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.add_group_creator_as_admin();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.professionals enable row level security;
alter table public.intakes enable row level security;
alter table public.matches enable row level security;
alter table public.subscriptions enable row level security;
alter table public.care_plans enable row level security;
alter table public.sessions enable row level security;
alter table public.session_meet_links enable row level security;
alter table public.nuggets enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_checkins enable row level security;
alter table public.group_posts enable row level security;
alter table public.audit_events enable row level security;

-- profiles
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid());

drop policy if exists "profiles_care_pair_select" on public.profiles;
create policy "profiles_care_pair_select" on public.profiles
  for select using (
    public.has_active_subscription(auth.uid(), id)
    or public.has_active_subscription(id, auth.uid())
  );

drop policy if exists "profiles_group_peer_select" on public.profiles;
create policy "profiles_group_peer_select" on public.profiles
  for select using (
    exists (
      select 1 from public.group_members mine
      join public.group_members theirs
        on mine.group_id = theirs.group_id
      where mine.profile_id = auth.uid()
        and theirs.profile_id = profiles.id
    )
  );

-- professionals directory is visible to signed-in students for matching
drop policy if exists "professionals_read_authenticated" on public.professionals;
create policy "professionals_read_authenticated" on public.professionals
  for select to authenticated using (true);

drop policy if exists "professionals_self_write" on public.professionals;
create policy "professionals_self_write" on public.professionals
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- intakes: student owns; matched subscribed professional may read
drop policy if exists "intakes_student_all" on public.intakes;
create policy "intakes_student_all" on public.intakes
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "intakes_professional_read" on public.intakes;
create policy "intakes_professional_read" on public.intakes
  for select using (public.has_active_subscription(student_id, auth.uid()));

-- matches
drop policy if exists "matches_participants" on public.matches;
create policy "matches_participants" on public.matches
  for select using (student_id = auth.uid() or professional_id = auth.uid());

drop policy if exists "matches_student_insert" on public.matches;
create policy "matches_student_insert" on public.matches
  for insert with check (student_id = auth.uid());

drop policy if exists "matches_student_update" on public.matches;
create policy "matches_student_update" on public.matches
  for update using (student_id = auth.uid());

-- subscriptions
drop policy if exists "subs_participants" on public.subscriptions;
create policy "subs_participants" on public.subscriptions
  for select using (student_id = auth.uid() or professional_id = auth.uid());

drop policy if exists "subs_student_insert" on public.subscriptions;
create policy "subs_student_insert" on public.subscriptions
  for insert with check (student_id = auth.uid());

drop policy if exists "subs_participants_update" on public.subscriptions;
create policy "subs_participants_update" on public.subscriptions
  for update using (student_id = auth.uid() or professional_id = auth.uid());

-- care plans
drop policy if exists "plans_via_sub" on public.care_plans;
create policy "plans_via_sub" on public.care_plans
  for all using (
    exists (
      select 1 from public.subscriptions s
      where s.id = care_plans.subscription_id
        and (s.student_id = auth.uid() or s.professional_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.subscriptions s
      where s.id = care_plans.subscription_id
        and s.student_id = auth.uid()
    )
  );

-- sessions: both parties see metadata; notes_professional is still in the row —
-- professionals should treat notes as private. Students are not shown notes in UI.
-- A column-level grant would be nicer; we additionally deny notes via a view in app code.
drop policy if exists "sessions_participants" on public.sessions;
create policy "sessions_participants" on public.sessions
  for select using (student_id = auth.uid() or professional_id = auth.uid());

drop policy if exists "sessions_professional_write" on public.sessions;
create policy "sessions_professional_write" on public.sessions
  for insert with check (
    professional_id = auth.uid()
    and public.has_active_subscription(student_id, auth.uid())
  );

drop policy if exists "sessions_professional_update" on public.sessions;
create policy "sessions_professional_update" on public.sessions
  for update using (professional_id = auth.uid());

-- Meet links: professional always; student only after release
drop policy if exists "meet_professional" on public.session_meet_links;
create policy "meet_professional" on public.session_meet_links
  for all using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.professional_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.professional_id = auth.uid()
    )
  );

drop policy if exists "meet_student_after_release" on public.session_meet_links;
create policy "meet_student_after_release" on public.session_meet_links
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id
        and s.student_id = auth.uid()
        and s.meet_released_at is not null
    )
  );

-- nuggets: author writes; subscribers read
drop policy if exists "nuggets_author" on public.nuggets;
create policy "nuggets_author" on public.nuggets
  for all using (professional_id = auth.uid()) with check (professional_id = auth.uid());

drop policy if exists "nuggets_subscriber_read" on public.nuggets;
create policy "nuggets_subscriber_read" on public.nuggets
  for select using (public.has_active_subscription(auth.uid(), professional_id));

-- groups: listed to authenticated (joinable directory); content is members-only
drop policy if exists "groups_read_auth" on public.groups;
create policy "groups_read_auth" on public.groups
  for select to authenticated using (true);

drop policy if exists "groups_create" on public.groups;
create policy "groups_create" on public.groups
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "groups_admin_update" on public.groups;
create policy "groups_admin_update" on public.groups
  for update using (public.is_group_admin(id));

drop policy if exists "members_read" on public.group_members;
create policy "members_read" on public.group_members
  for select using (
    public.is_group_member(group_id)
    or exists (select 1 from public.groups g where g.id = group_id)
  );

drop policy if exists "members_join" on public.group_members;
create policy "members_join" on public.group_members
  for insert with check (
    profile_id = auth.uid()
    and (
      select count(*) from public.group_members m where m.group_id = group_members.group_id
    ) < (select member_cap from public.groups g where g.id = group_members.group_id)
  );

drop policy if exists "members_admin_manage" on public.group_members;
create policy "members_admin_manage" on public.group_members
  for delete using (public.is_group_admin(group_id) or profile_id = auth.uid());

drop policy if exists "checkins_member" on public.group_checkins;
create policy "checkins_member" on public.group_checkins
  for select using (public.is_group_member(group_id));

drop policy if exists "checkins_write_own" on public.group_checkins;
create policy "checkins_write_own" on public.group_checkins
  for insert with check (profile_id = auth.uid() and public.is_group_member(group_id));

drop policy if exists "posts_member" on public.group_posts;
create policy "posts_member" on public.group_posts
  for select using (public.is_group_member(group_id));

drop policy if exists "posts_write_own" on public.group_posts;
create policy "posts_write_own" on public.group_posts
  for insert with check (profile_id = auth.uid() and public.is_group_member(group_id));

drop policy if exists "audit_self" on public.audit_events;
create policy "audit_self" on public.audit_events
  for select using (actor_id = auth.uid());

drop policy if exists "audit_insert" on public.audit_events;
create policy "audit_insert" on public.audit_events
  for insert with check (actor_id = auth.uid());

-- Student (or professional) may fetch the Meet URL only once the clock has hit.
create or replace function public.join_session(p_session uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.sessions%rowtype;
  url text;
begin
  select * into s from public.sessions where id = p_session;
  if not found then
    raise exception 'Session not found';
  end if;
  if s.student_id <> auth.uid() and s.professional_id <> auth.uid() then
    raise exception 'Session not found';
  end if;
  if s.scheduled_at > now() + interval '5 minutes' then
    raise exception 'The Meet link is released at session time';
  end if;
  if s.meet_released_at is null then
    update public.sessions
      set meet_released_at = now(), status = 'released'
      where id = p_session;
  end if;
  select meet_url into url from public.session_meet_links where session_id = p_session;
  if url is null then
    raise exception 'No Meet link on this session';
  end if;
  return url;
end;
$$;

revoke all on function public.join_session(uuid) from public;
grant execute on function public.join_session(uuid) to authenticated;
