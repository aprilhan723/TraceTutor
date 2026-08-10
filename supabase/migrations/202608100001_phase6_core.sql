begin;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.account_role as enum ('tutor', 'student');
create type public.membership_status as enum ('active', 'retired');
create type public.content_status as enum ('draft', 'reviewed', 'published', 'retired');
create type public.assignment_status as enum ('draft', 'assigned', 'completed', 'cancelled');
create type public.attempt_status as enum ('in_progress', 'submitted', 'void');
create type public.diagnostic_status as enum ('pending', 'reviewed', 'ambiguous');
create type public.review_cadence as enum ('immediate', 'D2', 'D7');
create type public.review_status as enum ('scheduled', 'secure', 'needs_work', 'cancelled');
create type public.pattern_status as enum ('new', 'working', 'unstable', 'improving', 'resolved', 'recurring');
create type public.question_status as enum ('open', 'answered', 'closed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.account_role not null,
  display_name text not null check (char_length(display_name) between 2 and 80),
  target_test_date date,
  reading_confidence text check (reading_confidence is null or reading_confidence in ('beginner', 'developing', 'strong')),
  daily_study_minutes smallint check (daily_study_minutes is null or daily_study_minutes in (5, 10, 15)),
  reminder_time time,
  main_struggle text check (main_struggle is null or main_struggle in ('vocabulary', 'finding-evidence', 'inference', 'time-pressure', 'not-sure')),
  onboarding_completed_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  created_by uuid not null references public.profiles(id),
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  profile_id uuid not null references public.profiles(id),
  role public.account_role not null,
  joined_at timestamptz not null default now(),
  retired_at timestamptz,
  unique (organization_id, profile_id)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (char_length(name) between 2 and 100),
  created_by uuid not null references public.profiles(id),
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.tutor_student_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  class_id uuid not null references public.classes(id),
  tutor_id uuid not null references public.profiles(id),
  student_id uuid not null references public.profiles(id),
  status public.membership_status not null default 'active',
  linked_at timestamptz not null default now(),
  retired_at timestamptz,
  check (tutor_id <> student_id),
  unique (class_id, tutor_id, student_id)
);

create table public.student_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  class_id uuid not null references public.classes(id),
  tutor_id uuid not null references public.profiles(id),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.profiles(id),
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  check ((used_at is null) = (used_by is null))
);

create table public.stimuli (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  content_key text not null check (content_key ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  task_type text not null check (task_type in ('complete-the-words', 'daily-life', 'academic-passage')),
  created_by uuid not null references public.profiles(id),
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, content_key)
);

create table public.stimulus_versions (
  id uuid primary key default gen_random_uuid(),
  stimulus_id uuid not null references public.stimuli(id),
  version integer not null check (version > 0),
  title text not null check (char_length(title) between 2 and 160),
  context text not null default '',
  segments jsonb not null default '[]'::jsonb check (jsonb_typeof(segments) = 'array'),
  status public.content_status not null default 'draft',
  published_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stimulus_id, version),
  check ((status = 'published') = (published_at is not null) or status <> 'published')
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  stimulus_id uuid references public.stimuli(id),
  content_key text not null check (content_key ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  task_type text not null check (task_type in ('complete-the-words', 'daily-life', 'academic-passage')),
  created_by uuid not null references public.profiles(id),
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, content_key)
);

create table public.item_versions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id),
  stimulus_version_id uuid references public.stimulus_versions(id),
  version integer not null check (version > 0),
  prompt text not null check (char_length(prompt) between 2 and 1000),
  explanation text not null default '',
  response_kind text not null check (response_kind in ('choice', 'typed')),
  correct_response text,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, version),
  check (response_kind <> 'typed' or nullif(btrim(correct_response), '') is not null),
  check ((status = 'published') = (published_at is not null) or status <> 'published')
);

create table public.item_options (
  id uuid primary key default gen_random_uuid(),
  item_version_id uuid not null references public.item_versions(id) on delete cascade,
  option_key text not null check (option_key ~ '^[a-z0-9_-]{1,24}$'),
  label text not null check (char_length(label) between 1 and 800),
  is_correct boolean not null default false,
  distractor_tag text,
  position smallint not null check (position between 1 and 12),
  created_at timestamptz not null default now(),
  unique (item_version_id, option_key),
  unique (item_version_id, position),
  check (is_correct or nullif(btrim(distractor_tag), '') is not null)
);

create unique index item_options_one_correct
  on public.item_options (item_version_id) where is_correct;

create table public.evidence_spans (
  id uuid primary key default gen_random_uuid(),
  item_version_id uuid not null references public.item_versions(id) on delete cascade,
  segment_key text not null check (char_length(segment_key) between 1 and 80),
  excerpt text not null check (char_length(excerpt) between 1 and 2000),
  start_offset integer check (start_offset is null or start_offset >= 0),
  end_offset integer check (end_offset is null or end_offset >= 0),
  is_designated boolean not null default true,
  created_at timestamptz not null default now(),
  unique (item_version_id, segment_key),
  check (start_offset is null or end_offset is null or end_offset > start_offset)
);

create table public.taxonomy_versions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version integer not null check (version > 0),
  label text not null,
  status public.content_status not null default 'draft',
  definition jsonb not null default '{}'::jsonb check (jsonb_typeof(definition) = 'object'),
  published_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  unique (code, version)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  taxonomy_version_id uuid not null references public.taxonomy_versions(id),
  code text not null,
  label text not null,
  description text not null default '',
  parent_skill_id uuid references public.skills(id),
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  unique (taxonomy_version_id, code)
);

create table public.taxonomy_mappings (
  id uuid primary key default gen_random_uuid(),
  from_taxonomy_version_id uuid not null references public.taxonomy_versions(id),
  to_taxonomy_version_id uuid not null references public.taxonomy_versions(id),
  from_code text not null,
  to_code text not null,
  relation text not null check (relation in ('same', 'broader', 'narrower', 'retired')),
  created_at timestamptz not null default now(),
  unique (from_taxonomy_version_id, to_taxonomy_version_id, from_code, to_code)
);

create table public.item_skill_mappings (
  id uuid primary key default gen_random_uuid(),
  item_version_id uuid not null references public.item_versions(id) on delete cascade,
  skill_id uuid not null references public.skills(id),
  weight numeric(4,3) not null default 1 check (weight > 0 and weight <= 1),
  created_at timestamptz not null default now(),
  unique (item_version_id, skill_id)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  class_id uuid not null references public.classes(id),
  tutor_id uuid not null references public.profiles(id),
  student_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 3 and 120),
  status public.assignment_status not null default 'assigned',
  due_at timestamptz,
  assigned_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assignment_items (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  item_version_id uuid not null references public.item_versions(id),
  position smallint not null check (position between 1 and 100),
  purpose text not null default 'correction',
  created_at timestamptz not null default now(),
  unique (assignment_id, position),
  unique (assignment_id, item_version_id)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_item_id uuid not null references public.assignment_items(id),
  student_id uuid not null references public.profiles(id),
  attempt_number smallint not null default 1 check (attempt_number between 1 and 20),
  client_submission_id uuid not null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  elapsed_seconds integer not null default 0 check (elapsed_seconds between 0 and 7200),
  answer_changes smallint not null default 0 check (answer_changes between 0 and 100),
  status public.attempt_status not null default 'in_progress',
  created_at timestamptz not null default now(),
  unique (student_id, client_submission_id),
  unique (assignment_item_id, student_id, attempt_number)
);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.attempts(id),
  selected_option_id uuid references public.item_options(id),
  typed_response text,
  normalized_response text,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  check ((selected_option_id is not null)::integer + (typed_response is not null)::integer = 1)
);

create table public.response_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id),
  actor_id uuid not null references public.profiles(id),
  client_event_id uuid not null,
  event_type text not null check (event_type in ('started', 'answer_changed', 'evidence_selected', 'submitted', 'resumed')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (actor_id, client_event_id)
);

create table public.confidence_ratings (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.attempts(id),
  rating text not null check (rating in ('guessing', 'think-so', 'certain')),
  created_at timestamptz not null default now()
);

create table public.evidence_selections (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id),
  evidence_span_id uuid not null references public.evidence_spans(id),
  created_at timestamptz not null default now(),
  unique (attempt_id, evidence_span_id)
);

create table public.diagnostic_sessions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.attempts(id),
  student_id uuid not null references public.profiles(id),
  machine_suggestion jsonb not null default '{}'::jsonb check (jsonb_typeof(machine_suggestion) = 'object'),
  machine_model_version text not null,
  diagnosis_confidence numeric(4,3) check (diagnosis_confidence is null or diagnosis_confidence between 0 and 1),
  student_probe_answer jsonb,
  status public.diagnostic_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.error_hypotheses (
  id uuid primary key default gen_random_uuid(),
  diagnostic_session_id uuid not null references public.diagnostic_sessions(id),
  cause_code text not null,
  rank smallint not null check (rank between 1 and 3),
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  source text not null check (source in ('rule', 'probe', 'tutor')),
  rationale text not null default '',
  created_at timestamptz not null default now(),
  unique (diagnostic_session_id, source, rank)
);

create table public.tutor_adjudications (
  id uuid primary key default gen_random_uuid(),
  diagnostic_session_id uuid not null references public.diagnostic_sessions(id),
  tutor_id uuid not null references public.profiles(id),
  revision integer not null check (revision > 0),
  decision text not null check (decision in ('approved', 'changed', 'ambiguous')),
  primary_cause text,
  secondary_causes text[] not null default '{}',
  feedback text check (feedback is null or char_length(feedback) <= 500),
  transfer_item_version_id uuid references public.item_versions(id),
  follow_up_question text check (follow_up_question is null or char_length(follow_up_question) <= 240),
  add_to_lesson boolean not null default false,
  created_at timestamptz not null default now(),
  unique (diagnostic_session_id, revision)
);

create table public.transfer_links (
  id uuid primary key default gen_random_uuid(),
  diagnostic_session_id uuid not null references public.diagnostic_sessions(id),
  source_item_version_id uuid not null references public.item_versions(id),
  transfer_item_version_id uuid not null references public.item_versions(id),
  assigned_by uuid not null references public.profiles(id),
  relation_code text not null,
  created_at timestamptz not null default now(),
  retired_at timestamptz,
  check (source_item_version_id <> transfer_item_version_id),
  unique (diagnostic_session_id, transfer_item_version_id)
);

create table public.review_schedules (
  id uuid primary key default gen_random_uuid(),
  diagnostic_session_id uuid not null references public.diagnostic_sessions(id),
  student_id uuid not null references public.profiles(id),
  transfer_link_id uuid not null references public.transfer_links(id),
  cadence public.review_cadence not null,
  due_at timestamptz not null,
  status public.review_status not null default 'scheduled',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (diagnostic_session_id, cadence)
);

create table public.review_attempts (
  id uuid primary key default gen_random_uuid(),
  review_schedule_id uuid not null references public.review_schedules(id),
  attempt_id uuid not null unique references public.attempts(id),
  outcome public.review_status not null check (outcome in ('secure', 'needs_work')),
  created_at timestamptz not null default now(),
  unique (review_schedule_id, attempt_id)
);

create table public.learner_error_states (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  taxonomy_version_id uuid not null references public.taxonomy_versions(id),
  skill_id uuid references public.skills(id),
  error_cause_code text not null,
  status public.pattern_status not null default 'new',
  recurrence_count integer not null default 1 check (recurrence_count >= 0),
  secure_transfer_count integer not null default 0 check (secure_transfer_count >= 0),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, taxonomy_version_id, error_cause_code)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  student_id uuid not null references public.profiles(id),
  tutor_id uuid not null references public.profiles(id),
  diagnostic_session_id uuid references public.diagnostic_sessions(id),
  subject text not null check (char_length(subject) between 2 and 160),
  status public.question_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id),
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  client_message_id uuid not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  retired_at timestamptz,
  unique (sender_id, client_message_id)
);

create table public.tutor_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  tutor_id uuid not null references public.profiles(id),
  student_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) <= 5000),
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id),
  actor_id uuid references public.profiles(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create table public.request_idempotency (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  scope text not null,
  idempotency_key uuid not null,
  result_entity_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  unique (actor_id, scope, idempotency_key)
);

create index memberships_profile_active_idx on public.memberships(profile_id, organization_id) where retired_at is null;
create index classes_org_active_idx on public.classes(organization_id) where retired_at is null;
create index links_tutor_student_active_idx on public.tutor_student_links(tutor_id, student_id, organization_id) where status = 'active';
create index links_student_tutor_active_idx on public.tutor_student_links(student_id, tutor_id, organization_id) where status = 'active';
create index invites_tutor_active_idx on public.student_invites(tutor_id, expires_at) where used_at is null and retired_at is null;
create index stimuli_org_idx on public.stimuli(organization_id);
create index stimulus_versions_stimulus_idx on public.stimulus_versions(stimulus_id, version desc);
create index items_org_idx on public.items(organization_id);
create index item_versions_item_idx on public.item_versions(item_id, version desc);
create index assignment_student_status_idx on public.assignments(student_id, status, due_at);
create index assignment_tutor_status_idx on public.assignments(tutor_id, status, due_at);
create index assignment_items_item_idx on public.assignment_items(item_version_id);
create index attempts_student_submitted_idx on public.attempts(student_id, submitted_at desc);
create index response_events_attempt_idx on public.response_events(attempt_id, occurred_at);
create index diagnostics_student_status_idx on public.diagnostic_sessions(student_id, status, created_at desc);
create index adjudications_session_idx on public.tutor_adjudications(diagnostic_session_id, revision desc);
create index reviews_student_due_idx on public.review_schedules(student_id, status, due_at);
create index error_states_student_status_idx on public.learner_error_states(student_id, status);
create index questions_student_status_idx on public.questions(student_id, status, created_at desc);
create index questions_tutor_status_idx on public.questions(tutor_id, status, created_at desc);
create index messages_question_idx on public.messages(question_id, created_at);
create index audit_org_created_idx on public.audit_logs(organization_id, created_at desc);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.prevent_profile_privilege_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.id <> new.id or old.role <> new.role then
    raise exception 'Account identity and role are immutable';
  end if;
  return new;
end;
$$;

create function private.prevent_immutable_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Historical records are immutable';
end;
$$;

create function private.prevent_published_version_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published' then
    raise exception 'Published content must be versioned, not modified';
  end if;
  return new;
end;
$$;

create function private.prevent_published_child_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_id uuid;
begin
  if tg_op = 'DELETE' then
    parent_id := old.item_version_id;
  else
    parent_id := new.item_version_id;
  end if;
  if exists (
    select 1 from public.item_versions iv
    where iv.id = parent_id and iv.status = 'published'
  ) then
    raise exception 'Published content children are immutable';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create function private.prevent_question_scope_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.organization_id <> new.organization_id
    or old.student_id <> new.student_id
    or old.tutor_id <> new.tutor_id
    or old.diagnostic_session_id is distinct from new.diagnostic_session_id then
    raise exception 'Question participants and scope are immutable';
  end if;
  return new;
end;
$$;

create function private.prevent_message_scope_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.question_id <> new.question_id or old.sender_id <> new.sender_id
    or old.client_message_id <> new.client_message_id then
    raise exception 'Message ownership and scope are immutable';
  end if;
  return new;
end;
$$;

create function private.validate_item_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  correct_count integer;
  option_count integer;
  evidence_count integer;
begin
  if tg_op = 'INSERT' and new.status = 'published' then
    raise exception 'Create content as reviewed, add options and evidence, then publish it';
  end if;
  if tg_op = 'UPDATE' and new.status = 'published' and old.status <> 'published' then
    if new.response_kind = 'choice' then
      select count(*), count(*) filter (where is_correct)
        into option_count, correct_count
      from public.item_options where item_version_id = new.id;
      if option_count < 2 or correct_count <> 1 then
        raise exception 'Published choice content needs complete options and exactly one correct answer';
      end if;
    end if;
    select count(*) into evidence_count
    from public.evidence_spans where item_version_id = new.id and is_designated;
    if evidence_count = 0 then
      raise exception 'Published content needs designated evidence';
    end if;
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger profiles_role_immutable before update on public.profiles
for each row execute function private.prevent_profile_privilege_change();

create trigger item_versions_validate_publish before insert or update on public.item_versions
for each row execute function private.validate_item_publication();
create trigger item_versions_published_immutable before update or delete on public.item_versions
for each row execute function private.prevent_published_version_change();
create trigger stimulus_versions_published_immutable before update or delete on public.stimulus_versions
for each row execute function private.prevent_published_version_change();
create trigger item_options_published_immutable before insert or update or delete on public.item_options
for each row execute function private.prevent_published_child_change();
create trigger evidence_spans_published_immutable before insert or update or delete on public.evidence_spans
for each row execute function private.prevent_published_child_change();
create trigger item_skills_published_immutable before insert or update or delete on public.item_skill_mappings
for each row execute function private.prevent_published_child_change();
create trigger adjudications_immutable before update or delete on public.tutor_adjudications
for each row execute function private.prevent_immutable_change();
create trigger audit_logs_immutable before update or delete on public.audit_logs
for each row execute function private.prevent_immutable_change();
create trigger responses_immutable before update or delete on public.responses
for each row execute function private.prevent_immutable_change();
create trigger questions_scope_immutable before update on public.questions
for each row execute function private.prevent_question_scope_change();
create trigger messages_scope_immutable before update on public.messages
for each row execute function private.prevent_message_scope_change();

create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger organizations_updated_at before update on public.organizations for each row execute function private.set_updated_at();
create trigger classes_updated_at before update on public.classes for each row execute function private.set_updated_at();
create trigger stimuli_updated_at before update on public.stimuli for each row execute function private.set_updated_at();
create trigger stimulus_versions_updated_at before update on public.stimulus_versions for each row execute function private.set_updated_at();
create trigger items_updated_at before update on public.items for each row execute function private.set_updated_at();
create trigger item_versions_updated_at before update on public.item_versions for each row execute function private.set_updated_at();
create trigger assignments_updated_at before update on public.assignments for each row execute function private.set_updated_at();
create trigger diagnostics_updated_at before update on public.diagnostic_sessions for each row execute function private.set_updated_at();
create trigger reviews_updated_at before update on public.review_schedules for each row execute function private.set_updated_at();
create trigger error_states_updated_at before update on public.learner_error_states for each row execute function private.set_updated_at();
create trigger questions_updated_at before update on public.questions for each row execute function private.set_updated_at();
create trigger tutor_notes_updated_at before update on public.tutor_notes for each row execute function private.set_updated_at();

commit;
