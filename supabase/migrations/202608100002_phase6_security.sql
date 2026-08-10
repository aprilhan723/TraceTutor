begin;

create function private.account_role()
returns public.account_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p
  where p.id = (select auth.uid()) and p.retired_at is null
$$;

create function private.is_organization_tutor(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = target_organization_id
      and m.profile_id = (select auth.uid())
      and m.role = 'tutor'
      and m.retired_at is null
  )
$$;

create function private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = target_organization_id
      and m.profile_id = (select auth.uid())
      and m.retired_at is null
  )
$$;

create function private.can_tutor_student(target_student_id uuid, target_organization_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tutor_student_links l
    where l.tutor_id = (select auth.uid())
      and l.student_id = target_student_id
      and (target_organization_id is null or l.organization_id = target_organization_id)
      and l.status = 'active'
      and l.retired_at is null
  )
$$;

create function private.can_student_tutor(target_tutor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tutor_student_links l
    where l.student_id = (select auth.uid())
      and l.tutor_id = target_tutor_id
      and l.status = 'active'
      and l.retired_at is null
  )
$$;

create function private.can_read_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.assignments a
    where a.id = target_assignment_id
      and (
        a.student_id = (select auth.uid())
        or (select private.can_tutor_student(a.student_id, a.organization_id))
      )
  )
$$;

create function private.can_read_attempt(target_attempt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.attempts a
    where a.id = target_attempt_id
      and (
        a.student_id = (select auth.uid())
        or (select private.can_tutor_student(a.student_id))
      )
  )
$$;

create function private.can_read_item_version(target_item_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.item_versions iv
    join public.items i on i.id = iv.item_id
    where iv.id = target_item_version_id
      and (
        (select private.is_organization_tutor(i.organization_id))
        or exists (
          select 1
          from public.assignment_items ai
          join public.assignments a on a.id = ai.assignment_id
          where ai.item_version_id = iv.id
            and a.student_id = (select auth.uid())
            and a.status in ('assigned', 'completed')
        )
      )
  )
$$;

create function private.can_read_stimulus(target_stimulus_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.stimuli s
    where s.id = target_stimulus_id
      and (
        (select private.is_organization_tutor(s.organization_id))
        or exists (
          select 1
          from public.items i
          join public.item_versions iv on iv.item_id = i.id
          where i.stimulus_id = s.id
            and (select private.can_read_item_version(iv.id))
        )
      )
  )
$$;

create function private.can_read_diagnostic(target_diagnostic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.diagnostic_sessions d
    where d.id = target_diagnostic_id
      and (
        d.student_id = (select auth.uid())
        or (select private.can_tutor_student(d.student_id))
      )
  )
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.account_role() to authenticated;
grant execute on function private.is_organization_tutor(uuid) to authenticated;
grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.can_tutor_student(uuid, uuid) to authenticated;
grant execute on function private.can_student_tutor(uuid) to authenticated;
grant execute on function private.can_read_assignment(uuid) to authenticated;
grant execute on function private.can_read_attempt(uuid) to authenticated;
grant execute on function private.can_read_item_version(uuid) to authenticated;
grant execute on function private.can_read_stimulus(uuid) to authenticated;
grant execute on function private.can_read_diagnostic(uuid) to authenticated;

create function public.create_tutor_profile(p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  created_profile public.profiles;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if char_length(btrim(p_display_name)) not between 2 and 80 then
    raise exception 'Display name must be between 2 and 80 characters';
  end if;
  if exists (select 1 from public.profiles where id = actor) then
    raise exception 'Account role has already been selected';
  end if;
  insert into public.profiles (id, role, display_name)
  values (actor, 'tutor', btrim(p_display_name))
  returning * into created_profile;
  return jsonb_build_object(
    'id', created_profile.id,
    'role', created_profile.role,
    'displayName', created_profile.display_name
  );
end;
$$;

create function public.create_tutor_workspace(p_organization_name text, p_class_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  organization_id uuid;
  class_id uuid;
begin
  if actor is null or not exists (
    select 1 from public.profiles p where p.id = actor and p.role = 'tutor' and p.retired_at is null
  ) then raise exception 'Tutor account required'; end if;
  if exists (select 1 from public.memberships m where m.profile_id = actor and m.retired_at is null) then
    raise exception 'A workspace already exists for this account';
  end if;
  if char_length(btrim(p_organization_name)) not between 2 and 100
    or char_length(btrim(p_class_name)) not between 2 and 100 then
    raise exception 'Workspace and class names must be between 2 and 100 characters';
  end if;
  insert into public.organizations (name, created_by)
  values (btrim(p_organization_name), actor) returning id into organization_id;
  insert into public.memberships (organization_id, profile_id, role)
  values (organization_id, actor, 'tutor');
  insert into public.classes (organization_id, name, created_by)
  values (organization_id, btrim(p_class_name), actor) returning id into class_id;
  insert into public.audit_logs (organization_id, actor_id, entity_type, entity_id, action, after_state)
  values (
    organization_id,
    actor,
    'organization',
    organization_id,
    'workspace.created',
    jsonb_build_object('classId', class_id)
  );
  return jsonb_build_object('organizationId', organization_id, 'classId', class_id);
end;
$$;

create function public.create_student_invite(p_class_id uuid, p_token_hash text, p_expires_at timestamptz)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  organization_id uuid;
  invite_id uuid;
begin
  if p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'Malformed invite token'; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '14 days' then
    raise exception 'Invite expiry must be within 14 days';
  end if;
  select c.organization_id into organization_id
  from public.classes c
  where c.id = p_class_id and c.retired_at is null;
  if organization_id is null or not (select private.is_organization_tutor(organization_id)) then
    raise exception 'Class not found';
  end if;
  insert into public.student_invites (
    organization_id, class_id, tutor_id, token_hash, expires_at
  ) values (organization_id, p_class_id, actor, p_token_hash, p_expires_at)
  returning id into invite_id;
  insert into public.audit_logs (organization_id, actor_id, entity_type, entity_id, action)
  values (organization_id, actor, 'student_invite', invite_id, 'invite.created');
  return invite_id;
end;
$$;

create function public.accept_student_invite(p_token_hash text, p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  invitation public.student_invites;
  existing_role public.account_role;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invitation is invalid or expired'; end if;
  if char_length(btrim(p_display_name)) not between 2 and 80 then
    raise exception 'Display name must be between 2 and 80 characters';
  end if;

  select * into invitation from public.student_invites
  where token_hash = p_token_hash for update;
  if invitation.id is null or invitation.retired_at is not null or invitation.expires_at <= now() then
    raise exception 'Invitation is invalid or expired';
  end if;
  if invitation.used_at is not null then
    if invitation.used_by = actor then
      return jsonb_build_object('studentId', actor, 'classId', invitation.class_id);
    end if;
    raise exception 'Invitation has already been used';
  end if;

  select p.role into existing_role from public.profiles p where p.id = actor;
  if existing_role = 'tutor' then raise exception 'Tutor accounts cannot redeem student invitations'; end if;
  if existing_role is null then
    insert into public.profiles (id, role, display_name)
    values (actor, 'student', btrim(p_display_name));
  end if;

  insert into public.memberships (organization_id, profile_id, role)
  values (invitation.organization_id, actor, 'student')
  on conflict (organization_id, profile_id) do update
    set retired_at = null, role = 'student';
  insert into public.tutor_student_links (
    organization_id, class_id, tutor_id, student_id
  ) values (
    invitation.organization_id, invitation.class_id, invitation.tutor_id, actor
  )
  on conflict (class_id, tutor_id, student_id) do update
    set status = 'active', retired_at = null;
  update public.student_invites
  set used_at = now(), used_by = actor
  where id = invitation.id;
  insert into public.audit_logs (organization_id, actor_id, entity_type, entity_id, action)
  values (invitation.organization_id, actor, 'student_invite', invitation.id, 'invite.accepted');
  return jsonb_build_object(
    'studentId', actor,
    'organizationId', invitation.organization_id,
    'classId', invitation.class_id,
    'tutorId', invitation.tutor_id
  );
end;
$$;

create function public.create_assignment(
  p_class_id uuid,
  p_student_id uuid,
  p_item_version_id uuid,
  p_title text,
  p_due_at timestamptz,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  organization_id uuid;
  assignment_id uuid;
begin
  select c.organization_id into organization_id from public.classes c
  where c.id = p_class_id and c.retired_at is null;
  if actor is null or organization_id is null
    or not (select private.can_tutor_student(p_student_id, organization_id)) then
    raise exception 'Student or class not found';
  end if;
  if not exists (
    select 1 from public.tutor_student_links l
    where l.tutor_id = actor and l.student_id = p_student_id and l.class_id = p_class_id
      and l.status = 'active' and l.retired_at is null
  ) then raise exception 'Student is not linked to this class'; end if;
  if not exists (
    select 1 from public.item_versions iv
    join public.items i on i.id = iv.item_id
    where iv.id = p_item_version_id and iv.status = 'published'
      and i.organization_id = organization_id
  ) then raise exception 'Published item not found'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(actor::text || ':' || p_idempotency_key::text, 0)
  );

  select r.result_entity_id into assignment_id from public.request_idempotency r
  where r.actor_id = actor and r.scope = 'create_assignment' and r.idempotency_key = p_idempotency_key;
  if assignment_id is not null then return assignment_id; end if;

  insert into public.assignments (
    organization_id, class_id, tutor_id, student_id, title, status, due_at, assigned_at
  ) values (
    organization_id, p_class_id, actor, p_student_id, btrim(p_title), 'assigned', p_due_at, now()
  ) returning id into assignment_id;
  insert into public.assignment_items (assignment_id, item_version_id, position)
  values (assignment_id, p_item_version_id, 1);
  insert into public.request_idempotency (actor_id, scope, idempotency_key, result_entity_id)
  values (actor, 'create_assignment', p_idempotency_key, assignment_id);
  insert into public.audit_logs (organization_id, actor_id, entity_type, entity_id, action)
  values (organization_id, actor, 'assignment', assignment_id, 'assignment.created');
  return assignment_id;
end;
$$;

create function public.submit_assignment_response(
  p_assignment_item_id uuid,
  p_client_submission_id uuid,
  p_selected_option_id uuid,
  p_typed_response text,
  p_confidence text,
  p_evidence_span_ids uuid[],
  p_elapsed_seconds integer,
  p_answer_changes integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target record;
  attempt_id uuid;
  option_is_correct boolean;
  is_correct boolean;
  normalized text;
  invalid_evidence_count integer;
begin
  if actor is null or (select private.account_role()) <> 'student' then
    raise exception 'Student account required';
  end if;
  if p_elapsed_seconds not between 0 and 7200 or p_answer_changes not between 0 and 100 then
    raise exception 'Attempt timing is invalid';
  end if;
  select ai.id, ai.item_version_id, a.id assignment_id, a.student_id, a.status,
    iv.response_kind, iv.correct_response
  into target
  from public.assignment_items ai
  join public.assignments a on a.id = ai.assignment_id
  join public.item_versions iv on iv.id = ai.item_version_id
  where ai.id = p_assignment_item_id;
  if target.id is null or target.student_id <> actor or target.status <> 'assigned' then
    raise exception 'Assignment item not found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(actor::text || ':' || p_client_submission_id::text, 0)
  );

  select a.id into attempt_id from public.attempts a
  where a.student_id = actor and a.client_submission_id = p_client_submission_id;
  if attempt_id is not null then
    return jsonb_build_object('attemptId', attempt_id, 'duplicate', true);
  end if;

  if target.response_kind = 'choice' then
    if p_selected_option_id is null or p_typed_response is not null then
      raise exception 'Exactly one choice response is required';
    end if;
    select io.is_correct into option_is_correct from public.item_options io
    where io.id = p_selected_option_id and io.item_version_id = target.item_version_id;
    if option_is_correct is null then raise exception 'Selected option does not belong to this item'; end if;
    is_correct := option_is_correct;
    if p_confidence not in ('guessing', 'think-so', 'certain') then
      raise exception 'Confidence is required for reading questions';
    end if;
    if cardinality(coalesce(p_evidence_span_ids, '{}'::uuid[])) = 0 then
      raise exception 'Evidence selection is required for reading questions';
    end if;
  else
    if nullif(btrim(p_typed_response), '') is null or p_selected_option_id is not null then
      raise exception 'A typed response is required';
    end if;
    normalized := lower(regexp_replace(btrim(p_typed_response), '\s+', ' ', 'g'));
    is_correct := normalized = lower(regexp_replace(btrim(target.correct_response), '\s+', ' ', 'g'));
  end if;

  select count(*) into invalid_evidence_count
  from unnest(coalesce(p_evidence_span_ids, '{}'::uuid[])) evidence_id
  where not exists (
    select 1 from public.evidence_spans es
    where es.id = evidence_id and es.item_version_id = target.item_version_id
  );
  if invalid_evidence_count > 0 then raise exception 'Evidence does not belong to this item'; end if;

  insert into public.attempts (
    assignment_item_id, student_id, attempt_number, client_submission_id,
    submitted_at, elapsed_seconds, answer_changes, status
  ) values (
    p_assignment_item_id, actor,
    coalesce((select max(a.attempt_number) + 1 from public.attempts a
      where a.assignment_item_id = p_assignment_item_id and a.student_id = actor), 1),
    p_client_submission_id, now(), p_elapsed_seconds, p_answer_changes, 'submitted'
  ) returning id into attempt_id;
  insert into public.responses (
    attempt_id, selected_option_id, typed_response, normalized_response, is_correct
  ) values (
    attempt_id, p_selected_option_id, p_typed_response, normalized, is_correct
  );
  if p_confidence is not null then
    insert into public.confidence_ratings (attempt_id, rating) values (attempt_id, p_confidence);
  end if;
  insert into public.evidence_selections (attempt_id, evidence_span_id)
  select attempt_id, evidence_id from unnest(coalesce(p_evidence_span_ids, '{}'::uuid[])) evidence_id;
  insert into public.response_events (
    attempt_id, actor_id, client_event_id, event_type, payload, occurred_at
  ) values (
    attempt_id, actor, p_client_submission_id, 'submitted',
    jsonb_build_object('isCorrect', is_correct), now()
  );
  if not exists (
    select 1 from public.assignment_items remaining_item
    where remaining_item.assignment_id = target.assignment_id
      and not exists (
        select 1 from public.attempts completed_attempt
        where completed_attempt.assignment_item_id = remaining_item.id
          and completed_attempt.student_id = actor
          and completed_attempt.status = 'submitted'
      )
  ) then
    update public.assignments
    set status = 'completed', completed_at = now()
    where id = target.assignment_id;
  end if;
  return jsonb_build_object('attemptId', attempt_id, 'duplicate', false, 'isCorrect', is_correct);
end;
$$;

create function public.adjudicate_diagnosis(
  p_diagnostic_session_id uuid,
  p_decision text,
  p_primary_cause text,
  p_secondary_causes text[],
  p_feedback text,
  p_transfer_item_version_id uuid,
  p_follow_up_question text,
  p_add_to_lesson boolean,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target record;
  adjudication_id uuid;
  next_revision integer;
begin
  select d.student_id, a.organization_id into target
  from public.diagnostic_sessions d
  join public.attempts at on at.id = d.attempt_id
  join public.assignment_items ai on ai.id = at.assignment_item_id
  join public.assignments a on a.id = ai.assignment_id
  where d.id = p_diagnostic_session_id;
  if actor is null or target.student_id is null
    or not (select private.can_tutor_student(target.student_id, target.organization_id)) then
    raise exception 'Diagnosis not found';
  end if;
  if p_decision not in ('approved', 'changed', 'ambiguous') then raise exception 'Invalid decision'; end if;
  if cardinality(coalesce(p_secondary_causes, '{}')) > 3 then raise exception 'Too many secondary causes'; end if;
  if p_decision <> 'ambiguous' and nullif(btrim(p_primary_cause), '') is null then
    raise exception 'A primary cause is required';
  end if;
  if p_transfer_item_version_id is not null and not exists (
    select 1 from public.item_versions iv
    join public.items i on i.id = iv.item_id
    where iv.id = p_transfer_item_version_id
      and iv.status = 'published'
      and i.organization_id = target.organization_id
  ) then raise exception 'Transfer item not found'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(actor::text || ':' || p_idempotency_key::text, 0)
  );

  select r.result_entity_id into adjudication_id from public.request_idempotency r
  where r.actor_id = actor and r.scope = 'adjudicate_diagnosis'
    and r.idempotency_key = p_idempotency_key;
  if adjudication_id is not null then return adjudication_id; end if;

  select coalesce(max(ta.revision), 0) + 1 into next_revision
  from public.tutor_adjudications ta
  where ta.diagnostic_session_id = p_diagnostic_session_id;
  insert into public.tutor_adjudications (
    diagnostic_session_id, tutor_id, revision, decision, primary_cause,
    secondary_causes, feedback, transfer_item_version_id, follow_up_question, add_to_lesson
  ) values (
    p_diagnostic_session_id, actor, next_revision, p_decision, nullif(btrim(p_primary_cause), ''),
    coalesce(p_secondary_causes, '{}'), nullif(btrim(p_feedback), ''),
    p_transfer_item_version_id, nullif(btrim(p_follow_up_question), ''), p_add_to_lesson
  ) returning id into adjudication_id;
  update public.diagnostic_sessions set status = case when p_decision = 'ambiguous' then 'ambiguous' else 'reviewed' end
  where id = p_diagnostic_session_id;
  insert into public.request_idempotency (actor_id, scope, idempotency_key, result_entity_id)
  values (actor, 'adjudicate_diagnosis', p_idempotency_key, adjudication_id);
  insert into public.audit_logs (
    organization_id, actor_id, entity_type, entity_id, action, after_state
  ) values (
    target.organization_id, actor, 'tutor_adjudication', adjudication_id,
    'diagnosis.adjudicated', jsonb_build_object('revision', next_revision, 'decision', p_decision)
  );
  return adjudication_id;
end;
$$;

revoke all on function public.create_tutor_profile(text) from public, anon;
revoke all on function public.create_tutor_workspace(text, text) from public, anon;
revoke all on function public.create_student_invite(uuid, text, timestamptz) from public, anon;
revoke all on function public.accept_student_invite(text, text) from public, anon;
revoke all on function public.create_assignment(uuid, uuid, uuid, text, timestamptz, uuid) from public, anon;
revoke all on function public.submit_assignment_response(uuid, uuid, uuid, text, text, uuid[], integer, integer) from public, anon;
revoke all on function public.adjudicate_diagnosis(uuid, text, text, text[], text, uuid, text, boolean, uuid) from public, anon;
grant execute on function public.create_tutor_profile(text) to authenticated;
grant execute on function public.create_tutor_workspace(text, text) to authenticated;
grant execute on function public.create_student_invite(uuid, text, timestamptz) to authenticated;
grant execute on function public.accept_student_invite(text, text) to authenticated;
grant execute on function public.create_assignment(uuid, uuid, uuid, text, timestamptz, uuid) to authenticated;
grant execute on function public.submit_assignment_response(uuid, uuid, uuid, text, text, uuid[], integer, integer) to authenticated;
grant execute on function public.adjudicate_diagnosis(uuid, text, text, text[], text, uuid, text, boolean, uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.classes enable row level security;
alter table public.tutor_student_links enable row level security;
alter table public.student_invites enable row level security;
alter table public.stimuli enable row level security;
alter table public.stimulus_versions enable row level security;
alter table public.items enable row level security;
alter table public.item_versions enable row level security;
alter table public.item_options enable row level security;
alter table public.evidence_spans enable row level security;
alter table public.taxonomy_versions enable row level security;
alter table public.skills enable row level security;
alter table public.taxonomy_mappings enable row level security;
alter table public.item_skill_mappings enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_items enable row level security;
alter table public.attempts enable row level security;
alter table public.responses enable row level security;
alter table public.response_events enable row level security;
alter table public.confidence_ratings enable row level security;
alter table public.evidence_selections enable row level security;
alter table public.diagnostic_sessions enable row level security;
alter table public.error_hypotheses enable row level security;
alter table public.tutor_adjudications enable row level security;
alter table public.transfer_links enable row level security;
alter table public.review_schedules enable row level security;
alter table public.review_attempts enable row level security;
alter table public.learner_error_states enable row level security;
alter table public.questions enable row level security;
alter table public.messages enable row level security;
alter table public.tutor_notes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.request_idempotency enable row level security;

grant usage on schema public to authenticated;
revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update, delete on public.organizations, public.classes, public.stimuli,
  public.stimulus_versions, public.items, public.item_versions, public.item_options,
  public.evidence_spans, public.item_skill_mappings, public.questions,
  public.messages, public.tutor_notes to authenticated;
grant update (display_name, target_test_date, reading_confidence, daily_study_minutes,
  reminder_time, main_struggle, onboarding_completed_at, retired_at, updated_at)
  on public.profiles to authenticated;
revoke insert, delete on public.profiles from authenticated;
revoke select on public.item_versions, public.item_options, public.evidence_spans from authenticated;
grant select (id, item_id, stimulus_version_id, version, prompt, response_kind,
  status, published_at, retired_at, created_at, updated_at)
  on public.item_versions to authenticated;
grant select (id, item_version_id, option_key, label, position, created_at)
  on public.item_options to authenticated;
grant select (id, item_version_id, segment_key, excerpt, start_offset, end_offset, created_at)
  on public.evidence_spans to authenticated;
revoke insert, update, delete on public.memberships, public.tutor_student_links,
  public.student_invites, public.attempts, public.responses, public.response_events,
  public.confidence_ratings, public.evidence_selections, public.diagnostic_sessions,
  public.error_hypotheses, public.tutor_adjudications, public.transfer_links,
  public.review_schedules, public.review_attempts, public.learner_error_states,
  public.assignments, public.assignment_items, public.audit_logs,
  public.request_idempotency from authenticated;

create policy profiles_select_related on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or (select private.can_tutor_student(id))
  or (select private.can_student_tutor(id))
);
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy organizations_select_member on public.organizations for select to authenticated
using ((select private.is_organization_member(id)));
create policy organizations_update_tutor on public.organizations for update to authenticated
using ((select private.is_organization_tutor(id))) with check ((select private.is_organization_tutor(id)));

create policy memberships_select_self_or_tutor on public.memberships for select to authenticated
using (profile_id = (select auth.uid()) or (select private.is_organization_tutor(organization_id)));

create policy classes_select_member on public.classes for select to authenticated
using ((select private.is_organization_member(organization_id)));
create policy classes_insert_tutor on public.classes for insert to authenticated
with check (created_by = (select auth.uid()) and (select private.is_organization_tutor(organization_id)));
create policy classes_update_tutor on public.classes for update to authenticated
using ((select private.is_organization_tutor(organization_id)))
with check ((select private.is_organization_tutor(organization_id)));
create policy classes_delete_tutor on public.classes for delete to authenticated
using ((select private.is_organization_tutor(organization_id)));

create policy links_select_participants on public.tutor_student_links for select to authenticated
using (
  status = 'active' and retired_at is null
  and (tutor_id = (select auth.uid()) or student_id = (select auth.uid()))
);
create policy invites_select_tutor on public.student_invites for select to authenticated
using (tutor_id = (select auth.uid()) and (select private.is_organization_tutor(organization_id)));

create policy stimuli_select_authorized on public.stimuli for select to authenticated
using ((select private.can_read_stimulus(id)));
create policy stimuli_insert_tutor on public.stimuli for insert to authenticated
with check (created_by = (select auth.uid()) and (select private.is_organization_tutor(organization_id)));
create policy stimuli_update_tutor on public.stimuli for update to authenticated
using ((select private.is_organization_tutor(organization_id)))
with check ((select private.is_organization_tutor(organization_id)));
create policy stimuli_delete_tutor on public.stimuli for delete to authenticated
using ((select private.is_organization_tutor(organization_id)));

create policy stimulus_versions_select_authorized on public.stimulus_versions for select to authenticated
using ((select private.can_read_stimulus(stimulus_id)));
create policy stimulus_versions_insert_tutor on public.stimulus_versions for insert to authenticated
with check (exists (
  select 1 from public.stimuli s where s.id = stimulus_id
    and (select private.is_organization_tutor(s.organization_id))
));
create policy stimulus_versions_update_tutor on public.stimulus_versions for update to authenticated
using (exists (
  select 1 from public.stimuli s where s.id = stimulus_id
    and (select private.is_organization_tutor(s.organization_id))
));
create policy stimulus_versions_delete_tutor on public.stimulus_versions for delete to authenticated
using (exists (
  select 1 from public.stimuli s where s.id = stimulus_id
    and (select private.is_organization_tutor(s.organization_id))
));

create policy items_select_authorized on public.items for select to authenticated
using (
  (select private.is_organization_tutor(organization_id))
  or exists (
    select 1 from public.item_versions iv where iv.item_id = id
      and (select private.can_read_item_version(iv.id))
  )
);
create policy items_insert_tutor on public.items for insert to authenticated
with check (created_by = (select auth.uid()) and (select private.is_organization_tutor(organization_id)));
create policy items_update_tutor on public.items for update to authenticated
using ((select private.is_organization_tutor(organization_id)))
with check ((select private.is_organization_tutor(organization_id)));
create policy items_delete_tutor on public.items for delete to authenticated
using ((select private.is_organization_tutor(organization_id)));

create policy item_versions_select_authorized on public.item_versions for select to authenticated
using ((select private.can_read_item_version(id)));
create policy item_versions_insert_tutor on public.item_versions for insert to authenticated
with check (exists (
  select 1 from public.items i where i.id = item_id
    and (select private.is_organization_tutor(i.organization_id))
));
create policy item_versions_update_tutor on public.item_versions for update to authenticated
using (exists (
  select 1 from public.items i where i.id = item_id
    and (select private.is_organization_tutor(i.organization_id))
));
create policy item_versions_delete_tutor on public.item_versions for delete to authenticated
using (exists (
  select 1 from public.items i where i.id = item_id
    and (select private.is_organization_tutor(i.organization_id))
));

create policy item_options_select_authorized on public.item_options for select to authenticated
using ((select private.can_read_item_version(item_version_id)));
create policy item_options_insert_tutor on public.item_options for insert to authenticated
with check ((select private.can_read_item_version(item_version_id)) and (select private.account_role()) = 'tutor');
create policy item_options_update_tutor on public.item_options for update to authenticated
using ((select private.can_read_item_version(item_version_id)) and (select private.account_role()) = 'tutor');
create policy item_options_delete_tutor on public.item_options for delete to authenticated
using ((select private.can_read_item_version(item_version_id)) and (select private.account_role()) = 'tutor');

create policy evidence_select_authorized on public.evidence_spans for select to authenticated
using ((select private.can_read_item_version(item_version_id)));
create policy evidence_insert_tutor on public.evidence_spans for insert to authenticated
with check ((select private.can_read_item_version(item_version_id)) and (select private.account_role()) = 'tutor');
create policy evidence_update_tutor on public.evidence_spans for update to authenticated
using ((select private.can_read_item_version(item_version_id)) and (select private.account_role()) = 'tutor');
create policy evidence_delete_tutor on public.evidence_spans for delete to authenticated
using ((select private.can_read_item_version(item_version_id)) and (select private.account_role()) = 'tutor');

create policy taxonomy_versions_read_published on public.taxonomy_versions for select to authenticated
using (status = 'published');
create policy skills_read_active on public.skills for select to authenticated
using (retired_at is null and exists (
  select 1 from public.taxonomy_versions tv where tv.id = taxonomy_version_id and tv.status = 'published'
));
create policy taxonomy_mappings_read on public.taxonomy_mappings for select to authenticated
using (true);
create policy item_skills_read_authorized on public.item_skill_mappings for select to authenticated
using ((select private.can_read_item_version(item_version_id)));
create policy item_skills_write_tutor on public.item_skill_mappings for insert to authenticated
with check ((select private.can_read_item_version(item_version_id)) and (select private.account_role()) = 'tutor');
create policy item_skills_update_tutor on public.item_skill_mappings for update to authenticated
using ((select private.can_read_item_version(item_version_id)) and (select private.account_role()) = 'tutor');
create policy item_skills_delete_tutor on public.item_skill_mappings for delete to authenticated
using ((select private.can_read_item_version(item_version_id)) and (select private.account_role()) = 'tutor');

create policy assignments_select_authorized on public.assignments for select to authenticated
using (student_id = (select auth.uid()) or (select private.can_tutor_student(student_id, organization_id)));
create policy assignments_insert_tutor on public.assignments for insert to authenticated
with check (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)));
create policy assignments_update_tutor on public.assignments for update to authenticated
using (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)))
with check (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)));
create policy assignments_delete_tutor on public.assignments for delete to authenticated
using (tutor_id = (select auth.uid()) and status = 'draft');

create policy assignment_items_select_authorized on public.assignment_items for select to authenticated
using ((select private.can_read_assignment(assignment_id)));
create policy assignment_items_insert_tutor on public.assignment_items for insert to authenticated
with check ((select private.can_read_assignment(assignment_id)) and (select private.account_role()) = 'tutor');
create policy assignment_items_update_tutor on public.assignment_items for update to authenticated
using ((select private.can_read_assignment(assignment_id)) and (select private.account_role()) = 'tutor');
create policy assignment_items_delete_tutor on public.assignment_items for delete to authenticated
using ((select private.can_read_assignment(assignment_id)) and (select private.account_role()) = 'tutor');

create policy attempts_select_authorized on public.attempts for select to authenticated
using (student_id = (select auth.uid()) or (select private.can_tutor_student(student_id)));
create policy responses_select_authorized on public.responses for select to authenticated
using ((select private.can_read_attempt(attempt_id)));
create policy response_events_select_authorized on public.response_events for select to authenticated
using ((select private.can_read_attempt(attempt_id)));
create policy confidence_select_authorized on public.confidence_ratings for select to authenticated
using ((select private.can_read_attempt(attempt_id)));
create policy evidence_selections_select_authorized on public.evidence_selections for select to authenticated
using ((select private.can_read_attempt(attempt_id)));

create policy diagnostics_select_authorized on public.diagnostic_sessions for select to authenticated
using (student_id = (select auth.uid()) or (select private.can_tutor_student(student_id)));
create policy hypotheses_select_authorized on public.error_hypotheses for select to authenticated
using ((select private.can_read_diagnostic(diagnostic_session_id)));
create policy adjudications_select_authorized on public.tutor_adjudications for select to authenticated
using ((select private.can_read_diagnostic(diagnostic_session_id)));
create policy transfers_select_authorized on public.transfer_links for select to authenticated
using ((select private.can_read_diagnostic(diagnostic_session_id)));

create policy reviews_select_authorized on public.review_schedules for select to authenticated
using (student_id = (select auth.uid()) or (select private.can_tutor_student(student_id)));
create policy review_attempts_select_authorized on public.review_attempts for select to authenticated
using (exists (
  select 1 from public.review_schedules rs where rs.id = review_schedule_id
    and (rs.student_id = (select auth.uid()) or (select private.can_tutor_student(rs.student_id)))
));
create policy error_states_select_authorized on public.learner_error_states for select to authenticated
using (student_id = (select auth.uid()) or (select private.can_tutor_student(student_id)));

create policy questions_select_participants on public.questions for select to authenticated
using (
  (student_id = (select auth.uid()) and exists (
    select 1 from public.tutor_student_links l
    where l.student_id = (select auth.uid())
      and l.tutor_id = tutor_id
      and l.organization_id = organization_id
      and l.status = 'active'
      and l.retired_at is null
  ))
  or (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)))
);
create policy questions_insert_participant on public.questions for insert to authenticated
with check (
  (
    (student_id = (select auth.uid()) and exists (
      select 1 from public.tutor_student_links l
      where l.student_id = (select auth.uid())
        and l.tutor_id = tutor_id
        and l.organization_id = organization_id
        and l.status = 'active'
        and l.retired_at is null
    ))
    or (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)))
  )
  and (
    diagnostic_session_id is null
    or exists (
      select 1 from public.diagnostic_sessions d
      where d.id = diagnostic_session_id and d.student_id = student_id
    )
  )
);
create policy questions_update_participant on public.questions for update to authenticated
using (
  (student_id = (select auth.uid()) and (select private.can_student_tutor(tutor_id)))
  or (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)))
)
with check (
  (student_id = (select auth.uid()) and (select private.can_student_tutor(tutor_id)))
  or (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)))
);

create policy messages_select_participants on public.messages for select to authenticated
using (exists (
  select 1 from public.questions q where q.id = question_id
    and (q.student_id = (select auth.uid()) or q.tutor_id = (select auth.uid()))
));
create policy messages_insert_sender on public.messages for insert to authenticated
with check (sender_id = (select auth.uid()) and exists (
  select 1 from public.questions q where q.id = question_id
    and (q.student_id = (select auth.uid()) or q.tutor_id = (select auth.uid()))
));
create policy messages_update_sender on public.messages for update to authenticated
using (sender_id = (select auth.uid())) with check (sender_id = (select auth.uid()));

create policy tutor_notes_select_owner on public.tutor_notes for select to authenticated
using (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)));
create policy tutor_notes_insert_owner on public.tutor_notes for insert to authenticated
with check (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)));
create policy tutor_notes_update_owner on public.tutor_notes for update to authenticated
using (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)))
with check (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)));
create policy tutor_notes_delete_owner on public.tutor_notes for delete to authenticated
using (tutor_id = (select auth.uid()) and (select private.can_tutor_student(student_id, organization_id)));

create policy audit_select_org_tutor on public.audit_logs for select to authenticated
using (organization_id is not null and (select private.is_organization_tutor(organization_id)));
create policy idempotency_select_owner on public.request_idempotency for select to authenticated
using (actor_id = (select auth.uid()));

commit;
