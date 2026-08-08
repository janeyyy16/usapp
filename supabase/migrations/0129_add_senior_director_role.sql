-- =====================================================================
-- 0129_add_senior_director_role.sql
--
-- Adds SENIOR_DIRECTOR to the profiles.role check constraint (see
-- roleLabels.ts/ROLE_LABELS) — without this, assigning it as anyone's
-- primary role fails with "new row for relation profiles violates check
-- constraint profiles_role_check".
--
-- Run once in the Supabase SQL Editor.
-- =====================================================================

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in (
    -- Canonical base codes
    'SUPERSUPERADMIN','SUPERADMIN','ADMIN','MANAGER','SENIOR_MANAGER','CSR','TECHNICIAN','TECHNICIAN_MANAGER',
    'DISPATCHER','CLAIMS','HR','IT','PARTS','FINANCE',
    -- Extended codes
    'CSR_AGENT','CSR_TEAM_LEADER','CSR_MANAGER',
    'BRANCH_MANAGER','SENIOR_BRANCH_MANAGER',
    'CLAIMS_MANAGER','PARTS_MANAGER','PARTS_TEAM_LEADER',
    'BIZOPS_MANAGER','BIZOPS_SENIOR_MANAGER',
    'TRIAGE_USER','TRIAGE_MANAGER',
    'TECHNICAL_DIRECTOR',
    'TECHNICAL_ASSISTANT_DIRECTOR','CLAIMS_TEAM_LEADER',
    'SENIOR_DIRECTOR',
    -- Legacy Title Case labels (back-compat)
    'CSR Agent','CSR Team Leader','CSR Manager',
    'Branch Manager','Senior Branch Manager',
    'Claims Manager','Parts Manager',
    'BizOps Manager','BizOps Senior Manager'
  ));
