-- =====================================================================
-- 0116 — "Salary Sent" flag on payroll line items
--
-- A per-employee, per-payslip checkbox Finance can toggle on the Reports
-- tab (AccountingDashboard.tsx) to record that the actual salary payment
-- has gone out — independent of "generated" (a run existing) or "Paid"
-- (payroll_runs.status), since a run can be generated well before the
-- money is actually sent, and Finance needs to track that separately per
-- employee (some employees on a run may be paid before others).
--
-- Run once in the Supabase SQL Editor, after 0115.
-- =====================================================================

alter table payroll_line_items add column if not exists salary_sent boolean not null default false;
