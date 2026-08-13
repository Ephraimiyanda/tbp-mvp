-- Demo: session modality (video vs chat), chat messages, mock payments.

do $$ begin
  create type public.session_modality as enum ('video', 'chat');
exception when duplicate_object then null; end $$;

alter table public.sessions
  add column if not exists modality public.session_modality not null default 'video';

create table if not exists public.session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists session_messages_session_created
  on public.session_messages (session_id, created_at);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  amount_kobo int not null,
  currency text not null default 'NGN',
  provider text not null default 'paystack_mock',
  reference text not null unique,
  status text not null default 'success',
  created_at timestamptz not null default now()
);

alter table public.session_messages enable row level security;
alter table public.payments enable row level security;

drop policy if exists "session_messages_participant_select" on public.session_messages;
create policy "session_messages_participant_select" on public.session_messages
  for select using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id
        and (s.student_id = auth.uid() or s.professional_id = auth.uid())
    )
  );

drop policy if exists "session_messages_participant_insert" on public.session_messages;
create policy "session_messages_participant_insert" on public.session_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.sessions s
      where s.id = session_id
        and (s.student_id = auth.uid() or s.professional_id = auth.uid())
    )
  );

drop policy if exists "payments_self_select" on public.payments;
create policy "payments_self_select" on public.payments
  for select using (student_id = auth.uid());

drop policy if exists "payments_self_insert" on public.payments;
create policy "payments_self_insert" on public.payments
  for insert with check (student_id = auth.uid());

-- Chat sessions have no Meet URL; allow opening the room at session time.
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
    raise exception 'The session opens at the scheduled time';
  end if;
  if s.meet_released_at is null then
    update public.sessions
      set meet_released_at = now(), status = 'released'
      where id = p_session;
  end if;

  if s.modality = 'chat' then
    return 'chat:' || p_session::text;
  end if;

  select meet_url into url from public.session_meet_links where session_id = p_session;
  if url is null then
    raise exception 'No Meet link on this session';
  end if;
  return url;
end;
$$;
