begin;

create type public.learning_style as enum ('daily_rhythm', 'deep_focus');
create type public.reading_priority as enum ('balanced', 'complete_words', 'daily_life', 'academic', 'mistake_review');
create type public.study_session_type as enum ('daily_core', 'quick', 'focused', 'deep', 'intensive', 'custom');
create type public.study_session_status as enum ('planned', 'active', 'paused', 'completed', 'abandoned');
create type public.study_session_source as enum ('dashboard', 'tutor_assignment', 'review_queue', 'library');

create table public.learner_study_plans (
  learner_id uuid primary key references public.profiles(id) on delete cascade,
  learning_style public.learning_style not null,
  default_daily_minutes smallint not null check (default_daily_minutes between 10 and 120),
  weekly_goal_minutes smallint not null check (weekly_goal_minutes between 30 and 840),
  study_days_per_week smallint not null check (study_days_per_week between 3 and 7),
  current_reading_level numeric(2,1) check (
    current_reading_level is null or (
      current_reading_level between 1 and 6 and
      mod(current_reading_level * 2, 1) = 0
    )
  ),
  target_reading_score numeric(2,1) check (
    target_reading_score is null or (
      target_reading_score between 1 and 6 and
      mod(target_reading_score * 2, 1) = 0
    )
  ),
  target_test_date date,
  reading_priority public.reading_priority not null default 'balanced',
  preferred_study_time time,
  timezone text not null check (char_length(timezone) between 1 and 80),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles(id) on delete cascade,
  session_type public.study_session_type not null,
  status public.study_session_status not null default 'planned',
  source public.study_session_source not null default 'dashboard',
  topic text not null check (topic in ('adaptive_mix', 'complete_words', 'daily_life', 'academic', 'mistake_review', 'due_reviews', 'timed_mixed')),
  planned_minutes smallint not null check (planned_minutes between 10 and 120),
  available_minutes smallint not null check (available_minutes between 1 and 120),
  active_seconds integer not null default 0 check (active_seconds between 0 and 43200),
  questions_answered smallint not null default 0 check (questions_answered between 0 and 500),
  correct_answers smallint not null default 0 check (correct_answers between 0 and questions_answered),
  due_reviews_completed smallint not null default 0 check (due_reviews_completed between 0 and questions_answered),
  transfer_items_completed smallint not null default 0 check (transfer_items_completed between 0 and questions_answered),
  diagnostic_loops_completed smallint not null default 0 check (diagnostic_loops_completed between 0 and questions_answered),
  include_due_reviews boolean not null default true,
  timed boolean not null default false,
  plan jsonb not null default '[]'::jsonb check (jsonb_typeof(plan) = 'array'),
  content_shortage boolean not null default false,
  shortage_message text,
  started_at timestamptz,
  last_activity_at timestamptz,
  paused_at timestamptz,
  completed_at timestamptz,
  ended_after_block_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or status in ('completed', 'abandoned'))
);

create index study_sessions_learner_recent on public.study_sessions (learner_id, created_at desc);
create index study_sessions_learner_status on public.study_sessions (learner_id, status);

create table public.daily_learner_progress (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null,
  active_seconds integer not null default 0 check (active_seconds between 0 and 86400),
  questions_answered smallint not null default 0 check (questions_answered between 0 and 1000),
  correct_answers smallint not null default 0 check (correct_answers between 0 and questions_answered),
  reviews_completed smallint not null default 0 check (reviews_completed between 0 and questions_answered),
  transfer_items_completed smallint not null default 0 check (transfer_items_completed between 0 and questions_answered),
  diagnostics_completed smallint not null default 0 check (diagnostics_completed between 0 and questions_answered),
  daily_core_completed boolean not null default false,
  streak_eligible boolean not null default false,
  goal_minutes smallint not null check (goal_minutes between 10 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, local_date)
);

create index daily_progress_learner_recent on public.daily_learner_progress (learner_id, local_date desc);

create table public.learner_streak_stats (
  learner_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= current_streak),
  last_eligible_local_date date,
  updated_at timestamptz not null default now()
);

create table public.study_activity_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.study_sessions(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  client_event_id uuid not null,
  local_date date not null,
  active_seconds smallint not null default 0 check (active_seconds between 0 and 90),
  questions_answered smallint not null default 0 check (questions_answered between 0 and 10),
  correct_answers smallint not null default 0 check (correct_answers between 0 and questions_answered),
  reviews_completed smallint not null default 0 check (reviews_completed between 0 and questions_answered),
  transfer_items_completed smallint not null default 0 check (transfer_items_completed between 0 and questions_answered),
  diagnostics_completed smallint not null default 0 check (diagnostics_completed between 0 and questions_answered),
  created_at timestamptz not null default now(),
  unique (session_id, client_event_id)
);

create index study_activity_events_learner_date on public.study_activity_events (learner_id, local_date);

create table public.tutor_study_recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  tutor_id uuid not null references public.profiles(id),
  student_id uuid not null references public.profiles(id),
  weekly_goal_minutes smallint check (weekly_goal_minutes is null or weekly_goal_minutes between 30 and 840),
  reading_priority public.reading_priority,
  session_type public.study_session_type check (session_type is null or session_type in ('focused', 'deep')),
  note text not null check (char_length(note) between 3 and 500),
  acknowledged_at timestamptz,
  decision text check (decision is null or decision in ('accepted', 'kept_current')),
  created_at timestamptz not null default now(),
  check (tutor_id <> student_id),
  check ((acknowledged_at is null) = (decision is null))
);

create index tutor_study_recommendations_student_recent on public.tutor_study_recommendations (student_id, created_at desc);

create function private.validate_learner_study_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Invalid IANA timezone';
  end if;
  return new;
end;
$$;

create trigger validate_learner_study_plan_trigger
before insert or update on public.learner_study_plans
for each row execute function private.validate_learner_study_plan();

create function private.validate_new_study_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and (
    new.learner_id <> auth.uid() or
    new.active_seconds <> 0 or
    new.questions_answered <> 0 or
    new.correct_answers <> 0 or
    new.due_reviews_completed <> 0 or
    new.transfer_items_completed <> 0 or
    new.diagnostic_loops_completed <> 0 or
    new.status not in ('planned', 'active')
  ) then
    raise exception 'New study sessions must start with zero activity';
  end if;
  return new;
end;
$$;

create trigger validate_new_study_session_trigger
before insert on public.study_sessions
for each row execute function private.validate_new_study_session();

-- Existing student profiles keep their Phase 6 onboarding data. This creates a
-- conservative personalized-plan baseline without inventing study time,
-- attempts, scores, or activity history. Students can edit every planning
-- preference later; incomplete profiles still continue through onboarding.
insert into public.learner_study_plans (
  learner_id,
  learning_style,
  default_daily_minutes,
  weekly_goal_minutes,
  study_days_per_week,
  current_reading_level,
  target_reading_score,
  target_test_date,
  reading_priority,
  preferred_study_time,
  timezone,
  onboarding_completed_at,
  created_at,
  updated_at
)
select
  profile.id,
  case when coalesce(profile.daily_study_minutes, 10) > 30
    then 'deep_focus'::public.learning_style
    else 'daily_rhythm'::public.learning_style
  end,
  greatest(10, coalesce(profile.daily_study_minutes, 10)),
  greatest(50, greatest(10, coalesce(profile.daily_study_minutes, 10)) * 5),
  5,
  case profile.reading_confidence
    when 'beginner' then 2.0
    when 'developing' then 3.5
    when 'strong' then 5.0
    else null
  end,
  null,
  profile.target_test_date,
  case profile.main_struggle
    when 'vocabulary' then 'complete_words'::public.reading_priority
    when 'inference' then 'academic'::public.reading_priority
    when 'finding-evidence' then 'mistake_review'::public.reading_priority
    else 'balanced'::public.reading_priority
  end,
  profile.reminder_time,
  'UTC',
  profile.onboarding_completed_at,
  profile.created_at,
  profile.updated_at
from public.profiles profile
where profile.role = 'student'
  and profile.onboarding_completed_at is not null
on conflict (learner_id) do nothing;

create function public.record_study_activity(
  p_session_id uuid,
  p_client_event_id uuid,
  p_local_date date,
  p_active_seconds smallint default 0,
  p_questions_answered smallint default 0,
  p_correct_answers smallint default 0,
  p_reviews_completed smallint default 0,
  p_transfer_items_completed smallint default 0,
  p_diagnostics_completed smallint default 0
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  goal smallint;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.study_sessions s
    where s.id = p_session_id and s.learner_id = actor and s.status = 'active'
  ) then raise exception 'Active session not found'; end if;
  if p_active_seconds not between 0 and 90
    or p_questions_answered not between 0 and 10
    or p_correct_answers not between 0 and p_questions_answered
    or p_reviews_completed not between 0 and p_questions_answered
    or p_transfer_items_completed not between 0 and p_questions_answered
    or p_diagnostics_completed not between 0 and p_questions_answered then
    raise exception 'Malformed activity event';
  end if;
  insert into public.study_activity_events (
    session_id, learner_id, client_event_id, local_date, active_seconds,
    questions_answered, correct_answers, reviews_completed,
    transfer_items_completed, diagnostics_completed
  ) values (
    p_session_id, actor, p_client_event_id, p_local_date, p_active_seconds,
    p_questions_answered, p_correct_answers, p_reviews_completed,
    p_transfer_items_completed, p_diagnostics_completed
  ) on conflict (session_id, client_event_id) do nothing;
  if not found then return false; end if;
  select default_daily_minutes into goal from public.learner_study_plans where learner_id = actor;
  if goal is null then goal := 10; end if;
  update public.study_sessions set
    active_seconds = active_seconds + p_active_seconds,
    questions_answered = questions_answered + p_questions_answered,
    correct_answers = correct_answers + p_correct_answers,
    due_reviews_completed = due_reviews_completed + p_reviews_completed,
    transfer_items_completed = transfer_items_completed + p_transfer_items_completed,
    diagnostic_loops_completed = diagnostic_loops_completed + p_diagnostics_completed,
    last_activity_at = now(),
    updated_at = now()
  where id = p_session_id;
  insert into public.daily_learner_progress (
    learner_id, local_date, active_seconds, questions_answered, correct_answers,
    reviews_completed, transfer_items_completed, diagnostics_completed, goal_minutes
  ) values (
    actor, p_local_date, p_active_seconds, p_questions_answered, p_correct_answers,
    p_reviews_completed, p_transfer_items_completed, p_diagnostics_completed, goal
  ) on conflict (learner_id, local_date) do update set
    active_seconds = public.daily_learner_progress.active_seconds + excluded.active_seconds,
    questions_answered = public.daily_learner_progress.questions_answered + excluded.questions_answered,
    correct_answers = public.daily_learner_progress.correct_answers + excluded.correct_answers,
    reviews_completed = public.daily_learner_progress.reviews_completed + excluded.reviews_completed,
    transfer_items_completed = public.daily_learner_progress.transfer_items_completed + excluded.transfer_items_completed,
    diagnostics_completed = public.daily_learner_progress.diagnostics_completed + excluded.diagnostics_completed,
    updated_at = now();
  return true;
end;
$$;

create function public.complete_daily_core(p_local_date date, p_goal_minutes smallint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_count integer := 0;
  longest_count integer := 0;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_goal_minutes not between 10 and 120 then raise exception 'Malformed daily goal'; end if;
  insert into public.daily_learner_progress (
    learner_id, local_date, daily_core_completed, streak_eligible, goal_minutes
  ) values (actor, p_local_date, true, true, p_goal_minutes)
  on conflict (learner_id, local_date) do update set
    daily_core_completed = true,
    streak_eligible = true,
    updated_at = now();
  with recursive chain(local_date) as (
    select p_local_date where exists (
      select 1 from public.daily_learner_progress d
      where d.learner_id = actor and d.local_date = p_local_date and d.streak_eligible
    )
    union all
    select (chain.local_date - 1) from chain where exists (
      select 1 from public.daily_learner_progress d
      where d.learner_id = actor and d.local_date = chain.local_date - 1 and d.streak_eligible
    )
  ) select count(*) into current_count from chain;
  with dated as (
    select local_date, local_date - (row_number() over (order by local_date))::integer as island
    from public.daily_learner_progress
    where learner_id = actor and streak_eligible
  ), runs as (select count(*) as length from dated group by island)
  select coalesce(max(length), 0) into longest_count from runs;
  insert into public.learner_streak_stats (
    learner_id, current_streak, longest_streak, last_eligible_local_date
  ) values (actor, current_count, longest_count, p_local_date)
  on conflict (learner_id) do update set
    current_streak = excluded.current_streak,
    longest_streak = greatest(public.learner_streak_stats.longest_streak, excluded.longest_streak),
    last_eligible_local_date = greatest(public.learner_streak_stats.last_eligible_local_date, excluded.last_eligible_local_date),
    updated_at = now();
  return jsonb_build_object('current', current_count, 'longest', longest_count);
end;
$$;

create function public.respond_to_study_recommendation(p_recommendation_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  recommendation public.tutor_study_recommendations;
begin
  select * into recommendation from public.tutor_study_recommendations
  where id = p_recommendation_id and student_id = actor and acknowledged_at is null
  for update;
  if recommendation.id is null then raise exception 'Recommendation not found'; end if;
  if p_accept then
    update public.learner_study_plans set
      weekly_goal_minutes = coalesce(recommendation.weekly_goal_minutes, weekly_goal_minutes),
      reading_priority = coalesce(recommendation.reading_priority, reading_priority),
      default_daily_minutes = case recommendation.session_type
        when 'focused' then 30 when 'deep' then 60 else default_daily_minutes end,
      updated_at = now()
    where learner_id = actor;
  end if;
  update public.tutor_study_recommendations set
    acknowledged_at = now(), decision = case when p_accept then 'accepted' else 'kept_current' end
  where id = p_recommendation_id;
end;
$$;

revoke all on function public.record_study_activity(uuid, uuid, date, smallint, smallint, smallint, smallint, smallint, smallint) from public, anon;
revoke all on function public.complete_daily_core(date, smallint) from public, anon;
revoke all on function public.respond_to_study_recommendation(uuid, boolean) from public, anon;
grant execute on function public.record_study_activity(uuid, uuid, date, smallint, smallint, smallint, smallint, smallint, smallint) to authenticated;
grant execute on function public.complete_daily_core(date, smallint) to authenticated;
grant execute on function public.respond_to_study_recommendation(uuid, boolean) to authenticated;

alter table public.learner_study_plans enable row level security;
alter table public.study_sessions enable row level security;
alter table public.daily_learner_progress enable row level security;
alter table public.learner_streak_stats enable row level security;
alter table public.study_activity_events enable row level security;
alter table public.tutor_study_recommendations enable row level security;

grant select on public.learner_study_plans, public.study_sessions,
  public.daily_learner_progress, public.learner_streak_stats,
  public.study_activity_events, public.tutor_study_recommendations to authenticated;
grant insert, update on public.learner_study_plans, public.study_sessions to authenticated;
grant insert on public.tutor_study_recommendations to authenticated;
revoke update on public.study_sessions from authenticated;
grant update (status, paused_at, completed_at, ended_after_block_key, updated_at)
  on public.study_sessions to authenticated;
revoke insert, update, delete on public.daily_learner_progress,
  public.learner_streak_stats, public.study_activity_events from authenticated;
revoke update, delete on public.tutor_study_recommendations from authenticated;

create policy learner_study_plans_select_self on public.learner_study_plans for select to authenticated
using (learner_id = (select auth.uid()));
create policy learner_study_plans_insert_self on public.learner_study_plans for insert to authenticated
with check (learner_id = (select auth.uid()) and (select private.account_role()) = 'student');
create policy learner_study_plans_update_self on public.learner_study_plans for update to authenticated
using (learner_id = (select auth.uid())) with check (learner_id = (select auth.uid()) and (select private.account_role()) = 'student');

create policy study_sessions_select_authorized on public.study_sessions for select to authenticated
using (learner_id = (select auth.uid()) or (select private.can_tutor_student(learner_id)));
create policy study_sessions_insert_self on public.study_sessions for insert to authenticated
with check (learner_id = (select auth.uid()) and (select private.account_role()) = 'student');
create policy study_sessions_update_self on public.study_sessions for update to authenticated
using (learner_id = (select auth.uid())) with check (learner_id = (select auth.uid()) and (select private.account_role()) = 'student');

create policy daily_progress_select_authorized on public.daily_learner_progress for select to authenticated
using (learner_id = (select auth.uid()) or (select private.can_tutor_student(learner_id)));
create policy streak_stats_select_authorized on public.learner_streak_stats for select to authenticated
using (learner_id = (select auth.uid()) or (select private.can_tutor_student(learner_id)));
create policy activity_events_select_self on public.study_activity_events for select to authenticated
using (learner_id = (select auth.uid()));

create policy study_recommendations_select_participants on public.tutor_study_recommendations for select to authenticated
using (student_id = (select auth.uid()) or (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id))));
create policy study_recommendations_insert_linked_tutor on public.tutor_study_recommendations for insert to authenticated
with check (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)));

commit;
