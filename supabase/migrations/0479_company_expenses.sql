-- =====================================================================
-- 0479 — Accounting → Expenses → Flash Tech → Other Expenses.
--
-- Company expenses from the bank accounts (Finance's "AHS Expenses"
-- workbook): payroll, bills & utilities, taxes, insurance, bank charges,
-- lease, Car IQ, parts … Not tied to an employee like `expenses`, and not
-- one of the branch sheet's fixed lines like `branch_expenses`. One row
-- per transaction:
--   Amount · Date · Category · Branch · Memo · Account
--
-- amount  : what was spent, positive. A credit / refund (a positive line
--           in the bank workbook) is stored negative, so totals net it off.
-- branch  : "Company" for company-wide, a branch ("Memphis, TN"), or a
--           state ("North Carolina" — state taxes).
-- account : the bank account's last 4 digits ("3510") — from the workbook's sheet
--           name, "101-1115 3510" = statement 10/1 – 11/15, account 3510;
--           blank when added by hand without one.
-- receipts: photos / PDFs attached in Add / Edit - imported lines start
--           with none and get them later.
--           [{ "url": "...", "path": "...", "name": "receipt.jpg" }]
--           Files: companies/{company_id}/expenses/company-{id}/...
--
-- Access (same as branch_expenses): Finance (Accounting), Admin, Super Admin.
--
-- New table and functions only — nothing else is changed.
-- Safe to run again. Run once in the Supabase SQL Editor, after 0478.
-- =====================================================================

create or replace function company_expenses_can_access()
returns boolean language sql stable security definer set search_path = public as $$
  select is_finance() or is_admin() or is_company_superadmin() or is_superadmin();
$$;

create table if not exists company_expenses (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies(id) on delete cascade,
  amount          numeric(12,2) not null check (amount <> 0),
  expense_date    date not null default current_date,
  category        text not null check (btrim(category) <> ''),
  branch          text not null default 'Company' check (btrim(branch) <> ''),
  memo            text not null default '',
  account         text not null default '',
  receipts        jsonb not null default '[]'::jsonb,
  -- Set on rows that came from Import Excel: the file name, so an import can be found later.
  import_source   text,
  created_by      uuid references profiles(id) on delete set null,
  created_by_name text,
  created_at      timestamptz not null default now(),
  updated_by_name text,
  updated_at      timestamptz not null default now()
);

-- Already ran an earlier copy of 0479 (before receipts)? This adds the column.
alter table company_expenses add column if not exists receipts jsonb not null default '[]'::jsonb;

create index if not exists idx_company_expenses_company_date on company_expenses(company_id, expense_date desc);

-- Who added / last changed it, from the signed-in profile (not trusted from the page).
create or replace function company_expenses_stamp()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name text := (select coalesce(nullif(btrim(display_name), ''), email) from profiles where id = auth_profile_id());
begin
  if tg_op = 'INSERT' then
    new.company_id := auth_company_id();
    new.created_by := auth_profile_id();
    new.created_by_name := v_name;
    new.created_at := now();
  else
    new.company_id := old.company_id;
    new.created_by := old.created_by;
    new.created_by_name := old.created_by_name;
    new.created_at := old.created_at;
    new.import_source := old.import_source;
  end if;
  new.updated_by_name := v_name;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_company_expenses_stamp on company_expenses;
create trigger trg_company_expenses_stamp before insert or update on company_expenses
  for each row execute function company_expenses_stamp();

alter table company_expenses enable row level security;

drop policy if exists company_expenses_select on company_expenses;
create policy company_expenses_select on company_expenses
  for select using (company_id = auth_company_id() and company_expenses_can_access());

drop policy if exists company_expenses_insert on company_expenses;
create policy company_expenses_insert on company_expenses
  for insert with check (company_expenses_can_access());

drop policy if exists company_expenses_update on company_expenses;
create policy company_expenses_update on company_expenses
  for update using (company_id = auth_company_id() and company_expenses_can_access())
  with check (company_id = auth_company_id() and company_expenses_can_access());

drop policy if exists company_expenses_delete on company_expenses;
create policy company_expenses_delete on company_expenses
  for delete using (company_id = auth_company_id() and company_expenses_can_access());
