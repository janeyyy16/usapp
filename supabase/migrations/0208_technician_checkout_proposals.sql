-- =====================================================================
-- 0208 — Auto-proposed technician Time Out on branch/home arrival.
--
-- A clocked-in technician's live GPS (technician_location_pings) already
-- exists; this adds a table for the moment that GPS shows them back at
-- their branch or home address — instead of silently clocking them out,
-- it records a PROPOSED check-out time, tagged with which geofence
-- triggered it and their most recent ticket update (for review context).
-- It stays "pending" until a SuperAdmin or Finance reviewer approves it on
-- Attendance Monitoring's Daily Attendance Tracker — only then does the
-- proposed time get written onto their real timecard_entries.check_out
-- (see approveCheckoutProposal in technicianCheckoutProposals.ts).
--
-- One row per technician per work_date (upserted in place while still
-- pending) — mirrors technician_location_pings' one-row-per-technician
-- shape (0189_technician_location_pings.sql), just keyed by day instead of
-- being overwritten every ping.
--
-- Deliberately SuperAdmin + Finance only, NOT plain Admin and NOT the
-- platform-level SUPERSUPERADMIN — the latter's bypass was intentionally
-- removed from operational tables like this one in
-- 0100_platform_admin_data_lockdown.sql; is_company_superadmin() is the
-- per-company SUPERADMIN role, not the platform role.
--
-- Run once in the Supabase SQL Editor, after 0207.
-- =====================================================================

create table if not exists technician_checkout_proposals (
  id                      uuid primary key default uuid_generate_v4(),
  company_id              uuid not null references companies(id) on delete cascade,
  profile_id              uuid not null references profiles(id) on delete cascade,
  work_date               date not null,
  -- "HH:MM:SS" — same format timecard_entries.check_out already uses.
  proposed_check_out      text not null,
  source                  text not null check (source in ('branch', 'home')),
  last_ticket_no          text,
  last_ticket_updated_at  timestamptz,
  status                  text not null default 'pending' check (status in ('pending', 'approved', 'dismissed')),
  approved_by             uuid references profiles(id),
  approved_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (profile_id, work_date)
);

create index if not exists idx_technician_checkout_proposals_company on technician_checkout_proposals(company_id);
create index if not exists idx_technician_checkout_proposals_status on technician_checkout_proposals(company_id, status);

alter table technician_checkout_proposals enable row level security;
alter table technician_checkout_proposals force row level security;

-- Select: SuperAdmin/Finance see every proposal for their company (to
-- review); a technician can also see their own, for self-visibility.
drop policy if exists technician_checkout_proposals_select on technician_checkout_proposals;
create policy technician_checkout_proposals_select on technician_checkout_proposals
  for select using (
    company_id = auth_company_id()
    and (profile_id = auth_profile_id() or is_company_superadmin() or is_finance())
  );

-- Insert: only the technician's own row, and only while they have a
-- genuinely open shift — same guard as technician_location_pings_insert.
drop policy if exists technician_checkout_proposals_insert on technician_checkout_proposals;
create policy technician_checkout_proposals_insert on technician_checkout_proposals
  for insert with check (
    profile_id = auth_profile_id()
    and company_id = auth_company_id()
    and exists (
      select 1 from timecard_entries te
      where te.profile_id = technician_checkout_proposals.profile_id
        and te.work_date = technician_checkout_proposals.work_date
        and te.check_in is not null and te.check_in <> ''
        and (te.check_out is null or te.check_out = '')
    )
  );

-- Update: the technician can refresh their own STILL-PENDING row (e.g. a
-- second geofence hit before it's been reviewed); SuperAdmin/Finance can
-- move any row to approved/dismissed.
drop policy if exists technician_checkout_proposals_update on technician_checkout_proposals;
create policy technician_checkout_proposals_update on technician_checkout_proposals
  for update using (
    company_id = auth_company_id()
    and (profile_id = auth_profile_id() or is_company_superadmin() or is_finance())
  )
  with check (
    company_id = auth_company_id()
    and (
      (profile_id = auth_profile_id() and status = 'pending')
      or is_company_superadmin()
      or is_finance()
    )
  );

-- Auto-stamp company_id from the caller's own JWT, same shared trigger
-- every tenant table uses (see 0190_technician_location_pings_company_trigger.sql)
-- — the client omits company_id from its insert payload entirely, since
-- useAuth()'s companyId is the legacy human-readable code, not this FK's
-- real companies.id UUID.
drop trigger if exists trg_technician_checkout_proposals_company on technician_checkout_proposals;
create trigger trg_technician_checkout_proposals_company
  before insert on technician_checkout_proposals
  for each row execute function set_company_id();
