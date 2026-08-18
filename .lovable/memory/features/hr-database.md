---
name: HR database and CRUD layer
description: Lovable Cloud tables for the HR system, demo seed data, generic CRUD table component, and live dashboard metrics
type: feature
---
Backend tables: employees, departments, entitlements, deductions, loans, leave_requests, requests, announcements, attendance_records, payroll_runs. All seeded with Arabic demo data.

Access is currently open (anon can read/write) because the system has no login yet — tighten policies when auth is added.

Data layer: `src/lib/hr-db.ts` (useRows / useSaveRow / useDeleteRow, react-query + sonner toasts).
Generic CRUD UI: `src/components/hr/CrudTable.tsx` — pass table name + field defs to get search, add/edit modal, delete.
Dashboard `src/routes/index.tsx` computes all KPIs and recharts charts from these tables.

DB-backed pages: /, /staff, /staff/add, /regulations (استحقاقات), /regulations/deductions, /regulations/loans, /leaves, /request-notifications, /surveys. Other screens are still static mockups.
