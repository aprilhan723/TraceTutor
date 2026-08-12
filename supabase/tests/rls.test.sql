begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, email, aud, role) values
  ('20000000-0000-4000-8000-000000000001', 'tutor-a@example.test', 'authenticated', 'authenticated'),
  ('20000000-0000-4000-8000-000000000002', 'student-a@example.test', 'authenticated', 'authenticated'),
  ('20000000-0000-4000-8000-000000000003', 'tutor-b@example.test', 'authenticated', 'authenticated'),
  ('20000000-0000-4000-8000-000000000004', 'student-b@example.test', 'authenticated', 'authenticated');

insert into public.profiles (id, role, display_name) values
  ('20000000-0000-4000-8000-000000000001', 'tutor', 'Tutor A'),
  ('20000000-0000-4000-8000-000000000002', 'student', 'Student A'),
  ('20000000-0000-4000-8000-000000000003', 'tutor', 'Tutor B'),
  ('20000000-0000-4000-8000-000000000004', 'student', 'Student B');

insert into public.organizations (id, name, created_by) values
  ('21000000-0000-4000-8000-000000000001', 'Organization A', '20000000-0000-4000-8000-000000000001'),
  ('21000000-0000-4000-8000-000000000002', 'Organization B', '20000000-0000-4000-8000-000000000003');
insert into public.memberships (organization_id, profile_id, role) values
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'tutor'),
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'student'),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', 'tutor'),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000004', 'student');
insert into public.classes (id, organization_id, name, created_by) values
  ('22000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', 'Class A', '20000000-0000-4000-8000-000000000001'),
  ('22000000-0000-4000-8000-000000000002', '21000000-0000-4000-8000-000000000002', 'Class B', '20000000-0000-4000-8000-000000000003');
insert into public.tutor_student_links (
  organization_id, class_id, tutor_id, student_id
) values
  ('21000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002'),
  ('21000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000004');

insert into public.stimuli (id, organization_id, content_key, task_type, created_by) values
  ('23000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', 'policy-test-source', 'daily-life', '20000000-0000-4000-8000-000000000001');
insert into public.stimulus_versions (id, stimulus_id, version, title, context, segments, status) values
  ('23100000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000001', 1, 'Policy test source', '', '[]', 'reviewed');
insert into public.items (id, organization_id, stimulus_id, content_key, task_type, created_by) values
  ('24000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', '23000000-0000-4000-8000-000000000001', 'policy-test-item', 'daily-life', '20000000-0000-4000-8000-000000000001');
insert into public.item_versions (id, item_id, stimulus_version_id, version, prompt, response_kind, status) values
  ('24100000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000001', '23100000-0000-4000-8000-000000000001', 1, 'Policy test prompt', 'choice', 'reviewed');
insert into public.assignments (id, organization_id, class_id, tutor_id, student_id, title) values
  ('25000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Assignment A');
insert into public.assignment_items (id, assignment_id, item_version_id, position) values
  ('25100000-0000-4000-8000-000000000001', '25000000-0000-4000-8000-000000000001', '24100000-0000-4000-8000-000000000001', 1);
insert into public.attempts (id, assignment_item_id, student_id, client_submission_id, submitted_at, status) values
  ('26000000-0000-4000-8000-000000000001', '25100000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '26100000-0000-4000-8000-000000000001', now(), 'submitted');
insert into public.diagnostic_sessions (
  id, attempt_id, student_id, machine_suggestion, machine_model_version
) values (
  '27000000-0000-4000-8000-000000000001',
  '26000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  '{"primaryCause":"scope-expanded"}',
  'rule-v1'
);
insert into public.ai_diagnosis_suggestions (
  id, diagnostic_session_id, organization_id, requested_by, request_id,
  input_fingerprint, model_version, prompt_version, schema_version,
  suggestion, policy_review
) values (
  '27100000-0000-4000-8000-000000000001',
  '27000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '27200000-0000-4000-8000-000000000001',
  repeat('a', 64), 'mock-v1', 'prompt-v1', 'schema-v1',
  '{"primaryErrorCause":"scope-expanded"}',
  '{"tutorReviewRequired":true}'
);
insert into public.tutor_notes (organization_id, tutor_id, student_id, body) values
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Tutor-only note');
insert into public.learner_study_plans (
  learner_id, learning_style, default_daily_minutes, weekly_goal_minutes,
  study_days_per_week, reading_priority, timezone, onboarding_completed_at
) values (
  '20000000-0000-4000-8000-000000000002', 'daily_rhythm', 15, 75,
  5, 'balanced', 'UTC', now()
);
insert into public.study_sessions (
  id, learner_id, session_type, status, source, topic,
  planned_minutes, available_minutes, active_seconds, plan
) values (
  '28000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  'focused', 'active', 'dashboard', 'adaptive_mix', 30, 26, 300, '[]'
);
insert into public.daily_learner_progress (
  learner_id, local_date, active_seconds, questions_answered, correct_answers,
  daily_core_completed, streak_eligible, goal_minutes
) values (
  '20000000-0000-4000-8000-000000000002', '2026-08-11', 300, 3, 2, true, true, 15
);
insert into public.learner_streak_stats (
  learner_id, current_streak, longest_streak, last_eligible_local_date
) values ('20000000-0000-4000-8000-000000000002', 3, 4, '2026-08-11');
insert into public.tutor_study_recommendations (
  organization_id, tutor_id, student_id, weekly_goal_minutes,
  reading_priority, session_type, note
) values (
  '21000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  120, 'mistake_review', 'focused', 'Try one focused block this week.'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated"}', true);

select results_eq(
  $$ select id from public.assignments order by id $$,
  $$ values ('25000000-0000-4000-8000-000000000001'::uuid) $$,
  'student reads only their own assignment'
);
select is((select count(*) from public.tutor_notes), 0::bigint, 'student cannot read tutor-only notes');
select lives_ok(
  $$ select * from public.responses where attempt_id = '26000000-0000-4000-8000-000000000001' $$,
  'student can query their own response boundary'
);
select throws_ok(
  $$ update public.profiles set role = 'tutor' where id = '20000000-0000-4000-8000-000000000002' $$,
  '42501',
  null,
  'student cannot escalate their account role'
);
select is((select count(*) from public.ai_diagnosis_suggestions), 0::bigint, 'student cannot read tutor-only AI suggestions');
select throws_ok(
  $$ insert into public.tutor_adjudications (diagnostic_session_id, tutor_id, revision, decision) values ('27000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 1, 'approved') $$,
  '42501',
  null,
  'student cannot write a tutor adjudication'
);
select is((select count(*) from public.learner_study_plans), 1::bigint, 'student reads only their own private study plan');
select is((select count(*) from public.study_sessions), 1::bigint, 'student reads their own study session');
select is((select count(*) from public.tutor_study_recommendations), 1::bigint, 'student reads a linked tutor recommendation');
select throws_ok(
  $$ update public.daily_learner_progress set active_seconds = 999 where learner_id = '20000000-0000-4000-8000-000000000002' $$,
  '42501',
  null,
  'student cannot directly rewrite server-backed daily progress'
);
select throws_ok(
  $$ update public.study_sessions set active_seconds = 999 where id = '28000000-0000-4000-8000-000000000001' $$,
  '42501',
  null,
  'student cannot directly rewrite server-backed session time'
);
select throws_ok(
  $$ insert into public.study_sessions (learner_id, session_type, source, topic, planned_minutes, available_minutes) values ('20000000-0000-4000-8000-000000000004', 'focused', 'dashboard', 'adaptive_mix', 30, 30) $$,
  'P0001',
  null,
  'student cannot create a session for another learner'
);

select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select results_eq(
  $$ select id from public.profiles where role = 'student' order by id $$,
  $$ values ('20000000-0000-4000-8000-000000000002'::uuid) $$,
  'tutor reads only the explicitly linked student'
);
select is((select count(*) from public.attempts), 1::bigint, 'linked tutor reads the linked student attempt');
select is((select count(*) from public.ai_diagnosis_suggestions), 1::bigint, 'linked tutor reads the linked student AI suggestion audit');
select is((select count(*) from public.learner_study_plans), 0::bigint, 'tutor cannot read learner private schedule fields');
select is((select count(*) from public.study_sessions), 1::bigint, 'linked tutor reads engagement session summary');
select is((select count(*) from public.daily_learner_progress), 1::bigint, 'linked tutor reads linked daily progress summary');

select set_config('request.jwt.claims', '{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.attempts), 0::bigint, 'another tutor cannot read an unlinked student attempt');
select is((select count(*) from public.ai_diagnosis_suggestions), 0::bigint, 'another tutor cannot read an unlinked AI suggestion audit');
select is((select count(*) from public.study_sessions), 0::bigint, 'another tutor cannot read an unlinked study session');
select is((select count(*) from public.daily_learner_progress), 0::bigint, 'another tutor cannot read unlinked daily progress');

select * from finish();
rollback;
