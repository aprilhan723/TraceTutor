begin;

insert into public.taxonomy_versions (
  id, code, version, label, status, definition, published_at
) values (
  '10000000-0000-4000-8000-000000000001',
  'tracetutor-reading-mistake-intelligence',
  1,
  'TraceTutor Reading Mistake Intelligence',
  'published',
  '{"axes":["skill","process_stage","error_cause","distractor_relation","behavioral_context"],"claim":"rule-derived and tutor-verifiable"}'::jsonb,
  now()
);

insert into public.skills (id, taxonomy_version_id, code, label, description) values
  ('11000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'main-idea', 'Main idea', 'Identify the central claim without promoting one example.'),
  ('11000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'detail', 'Detail', 'Match a choice to a stated detail and its limits.'),
  ('11000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'purpose', 'Purpose', 'Explain why a detail or sentence is included.'),
  ('11000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'reference', 'Reference', 'Trace a referring expression to its supported referent.'),
  ('11000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'vocabulary-in-context', 'Vocabulary in context', 'Use the local meaning and grammatical role.'),
  ('11000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'inference', 'Inference', 'Select only the conclusion supported within the text limits.'),
  ('11000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'text-structure', 'Text structure', 'Track how claims, examples, and contrasts relate.'),
  ('11000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', 'complete-the-words-language-form', 'Complete the Words language form', 'Use lemma, inflection, derivation, spelling, grammar, and context signals.');

commit;
