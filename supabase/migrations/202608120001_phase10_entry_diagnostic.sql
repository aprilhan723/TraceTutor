begin;

create table public.entry_reading_diagnostics (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles(id) on delete cascade,
  idempotency_key uuid not null,
  version text not null default 'reading-entry-v1',
  reading_priority public.reading_priority not null,
  recommended_skill text not null,
  primary_observation text not null,
  result jsonb not null default '{}'::jsonb check (jsonb_typeof(result) = 'object'),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (learner_id, idempotency_key)
);

create table public.entry_reading_diagnostic_responses (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid not null references public.entry_reading_diagnostics(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null,
  response text not null check (char_length(response) between 1 and 120),
  confidence text not null check (confidence in ('guessing', 'think-so', 'certain')),
  elapsed_seconds integer not null check (elapsed_seconds between 0 and 900),
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique (diagnostic_id, item_id)
);

create table private.entry_reading_diagnostic_keys (
  item_id text primary key,
  position smallint not null unique check (position between 1 and 6),
  task_type text not null check (task_type in ('complete-the-words', 'daily-life', 'academic-passage')),
  skill text not null,
  accepted_responses text[] not null check (cardinality(accepted_responses) > 0)
);

insert into private.entry_reading_diagnostic_keys
  (item_id, position, task_type, skill, accepted_responses)
values
  ('ctw-02', 1, 'complete-the-words', 'complete-the-words-language-form', array['ture', 'moisture']),
  ('ctw-04', 2, 'complete-the-words', 'complete-the-words-language-form', array['al', 'seasonal']),
  ('daily-01', 3, 'daily-life', 'purpose', array['b']),
  ('daily-05', 4, 'daily-life', 'purpose', array['a']),
  ('academic-01', 5, 'academic-passage', 'purpose', array['b']),
  ('academic-05', 6, 'academic-passage', 'purpose', array['b']);

create index entry_reading_diagnostics_learner_recent
  on public.entry_reading_diagnostics (learner_id, completed_at desc);
create index entry_reading_responses_learner_recent
  on public.entry_reading_diagnostic_responses (learner_id, created_at desc);

-- Existing verified learners retain access without being forced through a new
-- baseline. This record is explicitly marked as derived from their existing
-- personalized plan and never claims that a diagnostic test was completed.
insert into public.entry_reading_diagnostics (
  learner_id,
  idempotency_key,
  version,
  reading_priority,
  recommended_skill,
  primary_observation,
  result,
  completed_at
)
select
  plan.learner_id,
  gen_random_uuid(),
  'existing-plan-baseline-v0',
  plan.reading_priority,
  case plan.reading_priority
    when 'complete_words' then 'complete-the-words-language-form'
    when 'daily_life' then 'detail'
    when 'academic' then 'evidence-location'
    when 'mistake_review' then 'evidence-interpretation'
    else 'balanced-reading'
  end,
  'Existing personalized plan preserved; no entry diagnostic score was inferred.',
  jsonb_build_object(
    'version', 'existing-plan-baseline-v0',
    'derivedFrom', 'verified-existing-study-plan',
    'readingPriority', replace(plan.reading_priority::text, '_', '-'),
    'recommendedSkill', case plan.reading_priority
      when 'complete_words' then 'complete-the-words-language-form'
      when 'daily_life' then 'detail'
      when 'academic' then 'evidence-location'
      when 'mistake_review' then 'evidence-interpretation'
      else 'balanced-reading'
    end,
    'primaryObservation', 'Existing personalized plan preserved; no entry diagnostic score was inferred.',
    'taskResults', '[]'::jsonb,
    'nextStep', 'Continue the verified study plan and complete tutor-assigned corrections first.'
  ),
  coalesce(plan.onboarding_completed_at, plan.updated_at)
from public.learner_study_plans plan
where plan.onboarding_completed_at is not null
on conflict (learner_id, idempotency_key) do nothing;

create function public.complete_reading_entry_diagnostic(
  p_idempotency_key uuid,
  p_target_test_date date,
  p_responses jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  diagnostic_id uuid;
  response_row jsonb;
  answer_key private.entry_reading_diagnostic_keys;
  normalized_response text;
  recommendation_task text;
  recommendation_priority public.reading_priority;
  recommendation_skill text;
  diagnostic_observation text;
  task_results jsonb;
  final_result jsonb;
  organization_id uuid;
begin
  if actor is null or (select private.account_role()) <> 'student' then
    raise exception 'Student account required';
  end if;
  if p_target_test_date < current_date or p_target_test_date > current_date + interval '3 years' then
    raise exception 'Choose a valid target test date';
  end if;
  if not exists (
    select 1 from public.tutor_student_links link
    where link.student_id = actor and link.status = 'active' and link.retired_at is null
  ) then raise exception 'A linked tutor class is required'; end if;
  if jsonb_typeof(p_responses) <> 'array' or jsonb_array_length(p_responses) <> 6 then
    raise exception 'Exactly six diagnostic responses are required';
  end if;
  if (select count(distinct row ->> 'itemId') from jsonb_array_elements(p_responses) row) <> 6 then
    raise exception 'Diagnostic item IDs must be unique';
  end if;

  select diagnostic.id, diagnostic.result into diagnostic_id, final_result
  from public.entry_reading_diagnostics diagnostic
  where diagnostic.learner_id = actor and diagnostic.idempotency_key = p_idempotency_key;
  if diagnostic_id is not null then return final_result; end if;

  insert into public.entry_reading_diagnostics (
    learner_id, idempotency_key, reading_priority, recommended_skill, primary_observation
  ) values (actor, p_idempotency_key, 'balanced', 'pending', 'pending')
  returning id into diagnostic_id;

  for response_row in select value from jsonb_array_elements(p_responses)
  loop
    select * into answer_key from private.entry_reading_diagnostic_keys
    where item_id = response_row ->> 'itemId';
    if answer_key.item_id is null then raise exception 'Unknown diagnostic item'; end if;
    if nullif(btrim(response_row ->> 'response'), '') is null then
      raise exception 'Every diagnostic item needs a response';
    end if;
    if response_row ->> 'confidence' not in ('guessing', 'think-so', 'certain') then
      raise exception 'Every diagnostic item needs a confidence rating';
    end if;
    if coalesce((response_row ->> 'elapsedSeconds')::integer, -1) not between 0 and 900 then
      raise exception 'Diagnostic timing is invalid';
    end if;
    normalized_response := lower(regexp_replace(btrim(response_row ->> 'response'), '\s+', '', 'g'));
    insert into public.entry_reading_diagnostic_responses (
      diagnostic_id, learner_id, item_id, response, confidence, elapsed_seconds, is_correct
    ) values (
      diagnostic_id,
      actor,
      answer_key.item_id,
      btrim(response_row ->> 'response'),
      response_row ->> 'confidence',
      (response_row ->> 'elapsedSeconds')::integer,
      normalized_response = any(answer_key.accepted_responses)
    );
  end loop;

  select scored.task_type into recommendation_task
  from (
    select key.task_type,
      count(*) filter (where not response.is_correct)::numeric
        + 0.75 * count(*) filter (
          where not response.is_correct and response.confidence = 'certain'
        ) as risk,
      min(key.position) as task_order
    from public.entry_reading_diagnostic_responses response
    join private.entry_reading_diagnostic_keys key on key.item_id = response.item_id
    where response.diagnostic_id = diagnostic_id
    group by key.task_type
  ) scored
  order by scored.risk desc, scored.task_order
  limit 1;

  recommendation_priority := case recommendation_task
    when 'complete-the-words' then 'complete_words'::public.reading_priority
    when 'daily-life' then 'daily_life'::public.reading_priority
    else 'academic'::public.reading_priority
  end;
  select key.skill into recommendation_skill
  from private.entry_reading_diagnostic_keys key
  join public.entry_reading_diagnostic_responses response on response.item_id = key.item_id
  where response.diagnostic_id = diagnostic_id and key.task_type = recommendation_task
  order by response.is_correct asc, (response.confidence = 'certain') desc, key.position
  limit 1;
  diagnostic_observation := recommendation_task || ' needs a supported correction before more volume.';

  select jsonb_agg(task_row.result order by task_row.task_order) into task_results
  from (
    select min(key.position) as task_order,
      jsonb_build_object(
        'taskType', key.task_type,
        'correct', count(*) filter (where response.is_correct),
        'total', count(*),
        'highConfidenceWrong', count(*) filter (
          where not response.is_correct and response.confidence = 'certain'
        )
      ) as result
    from public.entry_reading_diagnostic_responses response
    join private.entry_reading_diagnostic_keys key on key.item_id = response.item_id
    where response.diagnostic_id = diagnostic_id
    group by key.task_type
  ) task_row;

  final_result := jsonb_build_object(
    'version', 'reading-entry-v1',
    'completedAt', now(),
    'readingPriority', replace(recommendation_priority::text, '_', '-'),
    'recommendedSkill', recommendation_skill,
    'primaryObservation', diagnostic_observation,
    'taskResults', task_results,
    'nextStep', 'Make the supporting clue explicit before choosing.'
  );

  update public.entry_reading_diagnostics set
    reading_priority = recommendation_priority,
    recommended_skill = recommendation_skill,
    primary_observation = diagnostic_observation,
    result = final_result,
    completed_at = now()
  where id = diagnostic_id;

  insert into public.learner_study_plans (
    learner_id, learning_style, default_daily_minutes, weekly_goal_minutes,
    study_days_per_week, target_test_date, reading_priority, timezone,
    onboarding_completed_at
  ) values (
    actor, 'daily_rhythm', 15, 75, 5, p_target_test_date,
    recommendation_priority, 'UTC', now()
  )
  on conflict (learner_id) do update set
    target_test_date = excluded.target_test_date,
    reading_priority = excluded.reading_priority,
    onboarding_completed_at = coalesce(
      public.learner_study_plans.onboarding_completed_at,
      excluded.onboarding_completed_at
    ),
    updated_at = now();
  update public.profiles set
    target_test_date = p_target_test_date,
    onboarding_completed_at = coalesce(onboarding_completed_at, now()),
    updated_at = now()
  where id = actor;

  select link.organization_id into organization_id
  from public.tutor_student_links link
  where link.student_id = actor and link.status = 'active' and link.retired_at is null
  order by link.linked_at limit 1;
  insert into public.audit_logs (
    organization_id, actor_id, entity_type, entity_id, action, after_state
  ) values (
    organization_id,
    actor,
    'entry_reading_diagnostic',
    diagnostic_id,
    'entry_reading_diagnostic.completed',
    jsonb_build_object(
      'version', 'reading-entry-v1',
      'readingPriority', recommendation_priority,
      'recommendedSkill', recommendation_skill
    )
  );
  return final_result;
end;
$$;

alter table public.entry_reading_diagnostics enable row level security;
alter table public.entry_reading_diagnostic_responses enable row level security;

create policy entry_reading_diagnostics_read_authorized
on public.entry_reading_diagnostics for select to authenticated
using (
  learner_id = (select auth.uid())
  or (select private.can_tutor_student(learner_id))
);
create policy entry_reading_responses_read_authorized
on public.entry_reading_diagnostic_responses for select to authenticated
using (
  learner_id = (select auth.uid())
  or (select private.can_tutor_student(learner_id))
);

revoke all on public.entry_reading_diagnostics,
  public.entry_reading_diagnostic_responses from anon, authenticated;
grant select on public.entry_reading_diagnostics,
  public.entry_reading_diagnostic_responses to authenticated;
revoke all on private.entry_reading_diagnostic_keys from public, anon, authenticated;
revoke all on function public.complete_reading_entry_diagnostic(uuid, date, jsonb)
  from public, anon;
grant execute on function public.complete_reading_entry_diagnostic(uuid, date, jsonb)
  to authenticated;

commit;
