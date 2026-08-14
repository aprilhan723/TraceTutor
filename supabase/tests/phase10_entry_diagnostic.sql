begin;
select plan(8);
select ok(exists (select 1 from pg_class where relname = 'entry_reading_diagnostics' and relrowsecurity), 'entry diagnostics have RLS');
select ok(exists (select 1 from pg_class where relname = 'entry_reading_diagnostic_responses' and relrowsecurity), 'entry responses have RLS');
select ok(not has_table_privilege('anon', 'public.entry_reading_diagnostics', 'SELECT'), 'anonymous users cannot read diagnostics');
select ok(not has_table_privilege('authenticated', 'public.entry_reading_diagnostics', 'INSERT'), 'students cannot forge diagnostic summaries');
select ok(not has_table_privilege('authenticated', 'private.entry_reading_diagnostic_keys', 'SELECT'), 'answer keys stay private');
select ok(has_function_privilege('authenticated', 'public.complete_reading_entry_diagnostic(uuid,date,jsonb)', 'EXECUTE'), 'validated diagnostic RPC is available');
select like(
  pg_get_functiondef('public.complete_reading_entry_diagnostic(uuid,date,jsonb)'::regprocedure),
  '%v_diagnostic_id%',
  'diagnostic completion uses an unambiguous local identifier'
);
select unlike(
  pg_get_functiondef('public.complete_reading_entry_diagnostic(uuid,date,jsonb)'::regprocedure),
  '%response.diagnostic_id = diagnostic_id%',
  'diagnostic completion does not compare against an ambiguous identifier'
);
select * from finish();
rollback;
