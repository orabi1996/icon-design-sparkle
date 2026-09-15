# M08 — Shifts and rosters

Source: `HRMS_Shifts_and_Rosters_Business_AR.docx`, revision 1, 14 September 2026, 25 pages. Acceptance IDs below refer to that document, not invented replacements.

## Architecture and rollout

The existing application uses React 19, TanStack Start/Router/Query, Supabase PostgreSQL and shared HR components. Existing `work_shift_groups` and `attendance_records` are editable summaries, not a versioned scheduling engine. Existing leave requests use employee names; payroll buttons do not implement an approved time-delivery/locking contract. These records must not silently become authoritative inputs.

M08 uses a server-only deterministic domain engine and a company aggregate with optimistic concurrency. All mutation RPCs are restricted to the service role, reached through authenticated TanStack server functions. Every command rechecks current membership and action grants; the transactional commit rechecks the authorization revision and aggregate revision. A company-wide compare-and-swap deliberately covers neighboring rosters and concurrent swaps/open-slot claims. No client-supplied computed totals, approval actor, raw-event revision or published snapshot is accepted.

Versioned definitions, employment links, rosters, attendance results and ledgers are stored together; raw events and immutable audit entries have separate append-only tables. This is an initial operational aggregate, not an unlimited-scale reporting warehouse. Performance targets (100 employees/3 seconds; 10,000 import rows/2 minutes) require measurement on the deployment environment. Never silently truncate input or reports.

Apply additive company-foundation and M08 migrations in staging first. Configure country/timezone policies, authorized users/scopes and effective employment links; then enable `VITE_M08_ENABLED` and `M08_ENABLED`. M08 does not import old shifts, names-only leave approvals, mutable attendance summaries or payroll totals automatically. Existing records remain available for reconciliation. Legacy raw-punch imports retain a source identifier and require an authorized mapping/acceptance action. The second M08 migration makes `fingerprint_records` immutable and limits the legacy report to permission administrators until a scoped backfill is reviewed; old device adapters must use the M08 ingestion gateway after activation.

## Decisions requiring establishment approval

- All work/rest/grace/overtime thresholds are policy inputs, not legal defaults. Only the suggested two-period limit is prefilled. Mandatory limits cannot be waived.
- Operational work date is the local start date. Local DST gaps are rejected; repeated times require earlier/later selection. Instants, timezone and offsets are preserved.
- Seasonal bindings default to continued base cycles; pause/resume is explicit. Equal-priority bindings block generation.
- Missing punches block attendance approval; an unscheduled day is never automatic absence. Single punch modes distinguish presence evidence and standard paid minutes.
- Leave balance movements and monetary payroll calculations are owned by the receiving modules. M08 sends versioned quantities and corrections through an idempotent delivery ledger; it does not invent monetary postings.
- Configure approval stages, separation of duties, notification deadlines, employee scope, payroll period boundaries and holiday classification before production use.

## Implementation evidence

See the acceptance matrix and test output committed alongside this document. A passing unit or database contract test is not a claim that production migrations or browser acceptance have run.
