begin;

create table public.ai_diagnosis_suggestions (
  id uuid primary key default gen_random_uuid(),
  diagnostic_session_id uuid not null references public.diagnostic_sessions(id),
  organization_id uuid not null references public.organizations(id),
  requested_by uuid not null references public.profiles(id),
  request_id uuid not null unique,
  input_fingerprint text not null check (input_fingerprint ~ '^[a-f0-9]{64}$'),
  model_version text not null check (char_length(model_version) between 1 and 100),
  prompt_version text not null check (char_length(prompt_version) between 1 and 100),
  schema_version text not null check (char_length(schema_version) between 1 and 100),
  suggestion jsonb not null check (jsonb_typeof(suggestion) = 'object'),
  policy_review jsonb not null check (jsonb_typeof(policy_review) = 'object'),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  estimated_cost_microusd bigint check (estimated_cost_microusd is null or estimated_cost_microusd >= 0),
  created_at timestamptz not null default now()
);

comment on table public.ai_diagnosis_suggestions is
  'Append-only, tutor-only audit of optional de-identified AI suggestions. Raw prompts, identity, and chain-of-thought are never stored.';

create index ai_suggestions_diagnostic_created_idx
  on public.ai_diagnosis_suggestions(diagnostic_session_id, created_at desc);
create index ai_suggestions_organization_created_idx
  on public.ai_diagnosis_suggestions(organization_id, created_at desc);

create trigger ai_diagnosis_suggestions_immutable
before update or delete on public.ai_diagnosis_suggestions
for each row execute function private.prevent_immutable_change();

alter table public.ai_diagnosis_suggestions enable row level security;

revoke all on public.ai_diagnosis_suggestions from anon;
grant select on public.ai_diagnosis_suggestions to authenticated;
revoke insert, update, delete on public.ai_diagnosis_suggestions from authenticated;

create policy ai_suggestions_select_linked_tutor
on public.ai_diagnosis_suggestions for select to authenticated
using (
  (select private.is_organization_tutor(organization_id))
  and exists (
    select 1
    from public.diagnostic_sessions d
    where d.id = diagnostic_session_id
      and (select private.can_tutor_student(d.student_id))
  )
);

create function public.record_ai_diagnosis_suggestion(
  p_diagnostic_session_id uuid,
  p_request_id uuid,
  p_input_fingerprint text,
  p_model_version text,
  p_prompt_version text,
  p_schema_version text,
  p_suggestion jsonb,
  p_policy_review jsonb,
  p_input_tokens integer,
  p_output_tokens integer,
  p_estimated_cost_microusd bigint
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_organization_id uuid;
  v_suggestion_id uuid;
begin
  if v_actor is null or (select private.account_role()) <> 'tutor' then
    raise exception 'Tutor access is required';
  end if;
  if p_input_fingerprint !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(p_suggestion) <> 'object'
    or jsonb_typeof(p_policy_review) <> 'object'
    or p_input_tokens < 0 or p_output_tokens < 0
    or (p_estimated_cost_microusd is not null and p_estimated_cost_microusd < 0) then
    raise exception 'Invalid AI suggestion audit payload';
  end if;

  select tls.organization_id into v_organization_id
  from public.diagnostic_sessions d
  join public.tutor_student_links tls on tls.student_id = d.student_id
  where d.id = p_diagnostic_session_id
    and tls.tutor_id = v_actor
    and tls.status = 'active'
    and tls.retired_at is null
  order by tls.created_at
  limit 1;

  if v_organization_id is null then
    raise exception 'Diagnosis is outside the tutor scope';
  end if;

  select id into v_suggestion_id
  from public.ai_diagnosis_suggestions
  where request_id = p_request_id and requested_by = v_actor;
  if v_suggestion_id is not null then return v_suggestion_id; end if;

  insert into public.ai_diagnosis_suggestions (
    diagnostic_session_id, organization_id, requested_by, request_id,
    input_fingerprint, model_version, prompt_version, schema_version,
    suggestion, policy_review, input_tokens, output_tokens,
    estimated_cost_microusd
  ) values (
    p_diagnostic_session_id, v_organization_id, v_actor, p_request_id,
    p_input_fingerprint, left(trim(p_model_version), 100),
    left(trim(p_prompt_version), 100), left(trim(p_schema_version), 100),
    p_suggestion, p_policy_review, p_input_tokens, p_output_tokens,
    p_estimated_cost_microusd
  ) returning id into v_suggestion_id;

  insert into public.audit_logs (
    organization_id, actor_id, entity_type, entity_id, action, after_state
  ) values (
    v_organization_id, v_actor, 'ai_diagnosis_suggestion', v_suggestion_id,
    'created', jsonb_build_object(
      'diagnostic_session_id', p_diagnostic_session_id,
      'model_version', left(trim(p_model_version), 100),
      'prompt_version', left(trim(p_prompt_version), 100),
      'schema_version', left(trim(p_schema_version), 100)
    )
  );
  return v_suggestion_id;
end;
$$;

revoke all on function public.record_ai_diagnosis_suggestion(
  uuid, uuid, text, text, text, text, jsonb, jsonb, integer, integer, bigint
) from public, anon;
grant execute on function public.record_ai_diagnosis_suggestion(
  uuid, uuid, text, text, text, text, jsonb, jsonb, integer, integer, bigint
) to authenticated;

commit;
