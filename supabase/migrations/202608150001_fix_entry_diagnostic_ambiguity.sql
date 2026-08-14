begin;

create or replace function public.complete_reading_entry_diagnostic(
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
  v_diagnostic_id uuid;
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

  select diagnostic.id, diagnostic.result into v_diagnostic_id, final_result
  from public.entry_reading_diagnostics diagnostic
  where diagnostic.learner_id = actor and diagnostic.idempotency_key = p_idempotency_key;
  if v_diagnostic_id is not null then return final_result; end if;

  insert into public.entry_reading_diagnostics (
    learner_id, idempotency_key, reading_priority, recommended_skill, primary_observation
  ) values (actor, p_idempotency_key, 'balanced', 'pending', 'pending')
  returning id into v_diagnostic_id;

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
      v_diagnostic_id,
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
    where response.diagnostic_id = v_diagnostic_id
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
  where response.diagnostic_id = v_diagnostic_id and key.task_type = recommendation_task
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
    where response.diagnostic_id = v_diagnostic_id
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

  update public.entry_reading_diagnostics as diagnostic set
    reading_priority = recommendation_priority,
    recommended_skill = recommendation_skill,
    primary_observation = diagnostic_observation,
    result = final_result,
    completed_at = now()
  where diagnostic.id = v_diagnostic_id;

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
    v_diagnostic_id,
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

revoke all on function public.complete_reading_entry_diagnostic(uuid, date, jsonb)
  from public, anon;
grant execute on function public.complete_reading_entry_diagnostic(uuid, date, jsonb)
  to authenticated;

commit;
