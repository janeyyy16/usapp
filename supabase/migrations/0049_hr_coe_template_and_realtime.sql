-- HR & Recruitment Dashboard update, pulled from the angelo collaborator
-- repo. Everything else this update depends on (hr_candidates extensions,
-- onboarding_documents, hr_signable_documents, hr_activity_log,
-- hr_jotform_submissions, hr_coe_documents, companies.settings +
-- set_company_map_provider) was already applied live in an earlier session
-- — verified directly against the database before writing this file. The
-- one genuinely missing piece is the COE body template RPC; the realtime
-- publication grants below are idempotent (exception-guarded) so they're
-- safe to include even if already applied.

create or replace function set_company_coe_body_template(p_template text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_company_id uuid;
  v_role text;
begin
  select company_id, role into v_company_id, v_role
  from profiles
  where firebase_uid = current_setting('request.jwt.claims', true)::json->>'sub'
  limit 1;

  if v_role is null or upper(v_role) not in ('ADMIN', 'SUPERADMIN') then
    raise exception 'Only an Admin can edit the Certificate of Employment template';
  end if;

  update companies
  set settings = jsonb_set(coalesce(settings, '{}'::jsonb), '{coeBodyTemplate}', to_jsonb(p_template))
  where id = v_company_id;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table hr_candidates;
exception when duplicate_object then
  raise notice 'hr_candidates already in supabase_realtime publication';
end $$;

do $$
begin
  alter publication supabase_realtime add table employee_conduct_notes;
exception when duplicate_object then
  raise notice 'employee_conduct_notes already in supabase_realtime publication';
end $$;

do $$
begin
  alter publication supabase_realtime add table hr_signable_documents;
exception when duplicate_object then
  raise notice 'hr_signable_documents already in supabase_realtime publication';
end $$;

do $$
begin
  alter publication supabase_realtime add table hr_activity_log;
exception when duplicate_object then
  raise notice 'hr_activity_log already in supabase_realtime publication';
end $$;

do $$
begin
  alter publication supabase_realtime add table pto_requests;
exception when duplicate_object then
  raise notice 'pto_requests already in supabase_realtime publication';
end $$;

do $$
begin
  alter publication supabase_realtime add table timecard_entries;
exception when duplicate_object then
  raise notice 'timecard_entries already in supabase_realtime publication';
end $$;

do $$
begin
  alter publication supabase_realtime add table timecard_corrections;
exception when duplicate_object then
  raise notice 'timecard_corrections already in supabase_realtime publication';
end $$;

do $$
begin
  alter publication supabase_realtime add table employee_requests;
exception when duplicate_object then
  raise notice 'employee_requests already in supabase_realtime publication';
end $$;
