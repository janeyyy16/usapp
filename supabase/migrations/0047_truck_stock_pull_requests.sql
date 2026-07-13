create table if not exists truck_stock_pull_requests (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references companies(id) on delete cascade,
  ticket_id         uuid not null,
  part_id           uuid not null references parts(id) on delete cascade,
  part_no           text not null,
  branch            text not null,
  storage_location  text,
  quantity          integer not null default 1,
  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by      uuid references profiles(id),
  requested_at      timestamptz not null default now(),
  reviewed_by       uuid references profiles(id),
  reviewed_at       timestamptz,
  rejection_reason  text,
  constraint truck_stock_pull_requests_ticket_same_company
    foreign key (ticket_id, company_id) references tickets(id, company_id) on delete cascade
);

create index if not exists idx_truck_stock_pull_requests_company_status
  on truck_stock_pull_requests (company_id, status);
create index if not exists idx_truck_stock_pull_requests_ticket
  on truck_stock_pull_requests (ticket_id);

-- ---------- Auto-stamp company_id + requested_by from the caller's session ----------
create or replace function truck_stock_pull_requests_stamp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.company_id is null then
    new.company_id := auth_company_id();
  end if;
  if new.requested_by is null then
    new.requested_by := auth_profile_id();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_truck_stock_pull_requests_stamp on truck_stock_pull_requests;
create trigger trg_truck_stock_pull_requests_stamp
  before insert on truck_stock_pull_requests
  for each row execute function truck_stock_pull_requests_stamp();

-- ---------- RLS: company-scoped, matches truck_stock / parts pattern ----------
alter table truck_stock_pull_requests enable row level security;
alter table truck_stock_pull_requests force row level security;

drop policy if exists truck_stock_pull_requests_select on truck_stock_pull_requests;
create policy truck_stock_pull_requests_select on truck_stock_pull_requests
  for select using (company_id = auth_company_id() or is_superadmin());

drop policy if exists truck_stock_pull_requests_insert on truck_stock_pull_requests;
create policy truck_stock_pull_requests_insert on truck_stock_pull_requests
  for insert with check (company_id = auth_company_id() or is_superadmin());

drop policy if exists truck_stock_pull_requests_update on truck_stock_pull_requests;
create policy truck_stock_pull_requests_update on truck_stock_pull_requests
  for update using (company_id = auth_company_id() or is_superadmin())
              with check (company_id = auth_company_id() or is_superadmin());
