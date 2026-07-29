-- =====================================================================
-- 0055_role_codes_expand2.sql
--
-- Expand the role check on profiles.role again — three role codes the
-- User Management "User Type" picker can now select were never added to
-- the constraint from 0024, so setting any of them as a user's PRIMARY
-- role fails at the database level (extra_roles has no such constraint,
-- so picking one as a secondary role already worked; only primary was
-- ever blocked):
--
--   • TECHNICAL_DIRECTOR
--   • TECHNICAL_ASSISTANT_DIRECTOR
--   • CLAIMS_TEAM_LEADER
--
-- Rewrites the constraint from 0024 verbatim, appending the new codes.
--
-- Run once in the Supabase SQL Editor.
-- =====================================================================

alter table profiles drop constraint if exists profiles_role_check;

alter table profiles add constraint profiles_role_check
  check (role in (
    -- Canonical base codes
    'SUPERADMIN','ADMIN','MANAGER','CSR','TECHNICIAN','TECHNICIAN_MANAGER',
    'DISPATCHER','CLAIMS','HR','IT','PARTS','FINANCE',
    -- Extended codes
    'CSR_AGENT','CSR_TEAM_LEADER','CSR_MANAGER',
    'BRANCH_MANAGER','SENIOR_BRANCH_MANAGER',
    'CLAIMS_MANAGER','PARTS_MANAGER',
    'BIZOPS_MANAGER','BIZOPS_SENIOR_MANAGER',
    'TRIAGE_USER','TRIAGE_MANAGER',
    -- New in this migration
    'TECHNICAL_DIRECTOR','TECHNICAL_ASSISTANT_DIRECTOR','CLAIMS_TEAM_LEADER',
    -- Legacy Title Case labels (back-compat)
    'CSR Agent','CSR Team Leader','CSR Manager',
    'Branch Manager','Senior Branch Manager',
    'Claims Manager','Parts Manager',
    'BizOps Manager','BizOps Senior Manager'
  ));
