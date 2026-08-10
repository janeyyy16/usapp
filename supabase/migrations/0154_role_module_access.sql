-- =====================================================================
-- 0154_role_module_access.sql
--
-- Backs the new "Accessibility Management" page (Role x Module/Submodule
-- access matrix): lets Admin/SuperAdmin explicitly grant or revoke a
-- role's access to a specific module or submodule, overriding the
-- hardcoded gates in roleLabels.ts/dashboardAccess.ts/
-- m.$module.$submodule.tsx (CSR allow-list, Admin-module gate, User
-- Management gate, Company Settings gate, Dashboard-submodule gate).
--
-- submodule_slug = '' means a module-level row (applies to every
-- submodule under that module that doesn't have its own more specific
-- row). A submodule-level row always wins over a module-level row for
-- the same role; no row at all means "defer to the existing hardcoded
-- rule" — so creating this table with zero rows changes nothing for
-- anyone until an admin actually edits a cell on the new page.
--
-- Run once in the Supabase SQL Editor, after 0153. The app reads this via
-- a best-effort, non-throwing fetch (see getCompanyRoleModuleAccess in
-- roleModuleAccess.ts) so nothing else breaks if this hasn't been run yet
-- — every role/module/submodule just falls back to today's behavior.
-- =====================================================================

create table if not exists role_module_access (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  role text not null,
  module_slug text not null,
  submodule_slug text not null default '',
  allowed boolean not null,
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_role_module_access_unique
  on role_module_access(company_id, role, module_slug, submodule_slug);
create index if not exists idx_role_module_access_company on role_module_access(company_id);

create or replace function role_module_access_stamp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.company_id is null then
    new.company_id := auth_company_id();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_role_module_access_stamp on role_module_access;
create trigger trg_role_module_access_stamp before insert or update on role_module_access
  for each row execute function role_module_access_stamp();

alter table role_module_access enable row level security;
alter table role_module_access force row level security;

drop policy if exists role_module_access_select on role_module_access;
create policy role_module_access_select on role_module_access
  for select using (company_id = auth_company_id() or is_superadmin());

drop policy if exists role_module_access_insert on role_module_access;
create policy role_module_access_insert on role_module_access
  for insert with check (
    (company_id = auth_company_id() or is_superadmin())
    and (is_admin() or is_company_superadmin() or is_superadmin())
  );

drop policy if exists role_module_access_update on role_module_access;
create policy role_module_access_update on role_module_access
  for update using (
    (company_id = auth_company_id() or is_superadmin())
    and (is_admin() or is_company_superadmin() or is_superadmin())
  )
  with check (
    (company_id = auth_company_id() or is_superadmin())
    and (is_admin() or is_company_superadmin() or is_superadmin())
  );

drop policy if exists role_module_access_delete on role_module_access;
create policy role_module_access_delete on role_module_access
  for delete using (
    (company_id = auth_company_id() or is_superadmin())
    and (is_admin() or is_company_superadmin() or is_superadmin())
  );
