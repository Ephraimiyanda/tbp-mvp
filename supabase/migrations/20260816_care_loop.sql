-- Care Loop: between-session exercise plans, progress, and AI assist flags.
-- Session type preference lives on the subscription so the professional can
-- set Chat vs Video when they match, and edit it later.

alter table public.subscriptions
  add column if not exists session_type text check (session_type in ('chat', 'video'));

alter table public.subscriptions
  add column if not exists meet_url text;

create table if not exists public.loop_plans (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  professional_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  title text not null default 'Between-session plan',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id)
);

create table if not exists public.loop_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.loop_plans (id) on delete cascade,
  sort_order int not null default 0,
  title text not null,
  instructions text not null default '',
  resource_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.loop_exercise_progress (
  exercise_id uuid not null references public.loop_exercises (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (exercise_id, student_id)
);

create table if not exists public.loop_assists (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.loop_exercises (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  question text,
  suggestion text not null,
  created_at timestamptz not null default now()
);

create index if not exists loop_plans_student_idx on public.loop_plans (student_id, status, created_at desc);
create index if not exists loop_plans_pro_idx on public.loop_plans (professional_id, created_at desc);
create index if not exists loop_exercises_plan_idx on public.loop_exercises (plan_id, sort_order);
create index if not exists loop_assists_exercise_idx on public.loop_assists (exercise_id, created_at desc);

alter table public.loop_plans enable row level security;
alter table public.loop_exercises enable row level security;
alter table public.loop_exercise_progress enable row level security;
alter table public.loop_assists enable row level security;

drop policy if exists "loop_plans_participants" on public.loop_plans;
create policy "loop_plans_participants" on public.loop_plans
  for select using (student_id = auth.uid() or professional_id = auth.uid());

drop policy if exists "loop_plans_pro_write" on public.loop_plans;
create policy "loop_plans_pro_write" on public.loop_plans
  for all using (professional_id = auth.uid()) with check (professional_id = auth.uid());

drop policy if exists "loop_exercises_via_plan" on public.loop_exercises;
create policy "loop_exercises_via_plan" on public.loop_exercises
  for select using (
    exists (
      select 1 from public.loop_plans p
      where p.id = plan_id
        and (p.student_id = auth.uid() or p.professional_id = auth.uid())
        and (p.status = 'published' or p.professional_id = auth.uid())
    )
  );

drop policy if exists "loop_exercises_pro_write" on public.loop_exercises;
create policy "loop_exercises_pro_write" on public.loop_exercises
  for all using (
    exists (select 1 from public.loop_plans p where p.id = plan_id and p.professional_id = auth.uid())
  )
  with check (
    exists (select 1 from public.loop_plans p where p.id = plan_id and p.professional_id = auth.uid())
  );

drop policy if exists "loop_progress_student" on public.loop_exercise_progress;
create policy "loop_progress_student" on public.loop_exercise_progress
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "loop_progress_pro_read" on public.loop_exercise_progress;
create policy "loop_progress_pro_read" on public.loop_exercise_progress
  for select using (
    exists (
      select 1 from public.loop_exercises e
      join public.loop_plans p on p.id = e.plan_id
      where e.id = exercise_id and p.professional_id = auth.uid()
    )
  );

drop policy if exists "loop_assists_student_write" on public.loop_assists;
create policy "loop_assists_student_write" on public.loop_assists
  for insert with check (student_id = auth.uid());

drop policy if exists "loop_assists_participants" on public.loop_assists;
create policy "loop_assists_participants" on public.loop_assists
  for select using (
    student_id = auth.uid()
    or exists (
      select 1 from public.loop_exercises e
      join public.loop_plans p on p.id = e.plan_id
      where e.id = exercise_id and p.professional_id = auth.uid()
    )
  );
