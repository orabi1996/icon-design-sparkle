import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, actor, reviewer, now, after, run, punch } from './fixtures/m08.mjs';
import { canonical, payrollDelta } from '../src/lib/m08/attendance.mjs';
import { effectiveRevisions, publishedAssignments } from '../src/lib/m08/planning.mjs';

test('shift → template → repeating pattern → binding → approved publication → attendance → payroll → closed correction adjustment', () => {
  let s = fixture(); s.shifts = []; s.templates = []; s.patterns = []; s.bindings = [];
  const shift = { code: 'AM', nameAr: 'صباحي', nameEn: 'Morning', from: '2026-01-01', status: 'active', type: 'fixed', color: '#006B80',
    startTime: '08:00', endTime: '16:00', endDay: 0, timezone: 'UTC', requiredMinutes: 450, punchMode: 'pairs', windowBefore: 60, windowAfter: 120,
    breaks: [{ start: 240, end: 270, paid: false }], requiredSkills: [], disambiguation: 'reject' };
  let r = run(s, 'definition.save', { kind: 'shifts', value: shift, expectedVersion: 0 }); s = r.state; const shiftId = r.result.id;
  r = run(s, 'definition.save', { kind: 'templates', value: { code: 'DAY', nameAr: 'يوم عمل', nameEn: 'Workday', from: '2026-01-01', status: 'active', dayType: 'WORK', periods: [{ shiftId, shiftVersion: 1, siteCode: 'HQ' }] }, expectedVersion: 0 });
  s = r.state; const templateId = r.result.id;
  r = run(s, 'definition.save', { kind: 'patterns', value: { code: 'ROT', nameAr: 'دورة', nameEn: 'Cycle', from: '2026-01-01', status: 'active', type: 'rotating', anchor: '2026-10-01', days: [{ id: templateId, version: 1 }] }, expectedVersion: 0 });
  s = r.state; const patternId = r.result.id;
  r = run(s, 'binding.save', { value: { scope: 'employee', employeeIds: ['e1'], code: 'E-1', from: '2026-01-01', status: 'active', priority: 600, patternId, patternVersion: 1, policyId: 'policy', policyVersion: 1, anchor: '2026-10-01', offset: 0 } }); s = r.state;
  r = run(s, 'roster.create', { name: 'اختبار دورة العمل', from: '2026-10-05', to: '2026-10-05', employeeIds: ['e1'], policyId: 'policy', policyVersion: 1 });
  s = r.state; const rosterId = r.result.id;
  r = run(s, 'roster.generate', { rosterId, version: 1, mode: 'fill' }); s = r.state;
  assert.equal(r.result.assignments[0].shift.id, shiftId);
  for (const step of ['submit', 'approve', 'publish']) { r = run(s, `roster.${step}`, { rosterId, version: r.result.version }, reviewer); s = r.state; }
  assert.equal(s.rosters[0].status, 'published'); assert.equal(s.notifications.length, 1);
  const frozen = canonical(s.rosters[0].assignments);
  r = run(s, 'punch.ingest', { events: [punch('scan-in', '2026-10-05T08:00:00Z', 'in'), punch('scan-out', '2026-10-05T16:00:00Z', 'out')] }, actor, after);
  s = r.state; const rawId = s.punches.find(p => p.sourceEventId === 'scan-out').id;
  r = run(s, 'attendance.calculate', { assignmentKey: s.rosters[0].assignments[0].key }, actor, after); s = r.state;
  assert.equal(r.result.actualMinutes, 450); assert.equal(r.result.issues.length, 0);
  r = run(s, 'attendance.approve', { id: r.result.id }, reviewer, after); s = r.state;
  r = run(s, 'payroll.period', { from: '2026-10-01', to: '2026-10-31', status: 'open' }); s = r.state; const octoberId = r.result.id;
  r = run(s, 'payroll.deliver', { resultId: s.results[0].id, periodId: octoberId }); s = r.state;
  assert.equal(r.result.quantities.paid, 450);
  r = run(s, 'delivery.respond', { id: r.result.id, status: 'accepted', externalReference: 'staging-accepted-1' }); s = r.state;
  const accepted = canonical(s.deliveries[0]), prior = canonical(s.results[0]);
  r = run(s, 'payroll.period', { id: octoberId, from: '2026-10-01', to: '2026-10-31', status: 'closed' }); s = r.state;
  r = run(s, 'correction.request', { punchId: rawId, replacement: { at: '2026-10-05T15:30:00Z', kind: 'out' } }, actor, after); s = r.state;
  r = run(s, 'correction.approve', { id: r.result.id }, reviewer, after); s = r.state;
  r = run(s, 'attendance.calculate', { assignmentKey: s.rosters[0].assignments[0].key }, actor, after); s = r.state;
  assert.equal(r.result.actualMinutes, 420); assert.equal(r.result.previousId, s.results[0].id);
  r = run(s, 'attendance.approve', { id: r.result.id }, reviewer, after); s = r.state;
  r = run(s, 'payroll.period', { from: '2026-11-01', to: '2026-11-30', status: 'open' }); s = r.state; const novemberId = r.result.id;
  r = run(s, 'payroll.deliver', { resultId: s.results.at(-1).id, periodId: novemberId }); s = r.state;
  assert.equal(r.result.quantities.paid, -30); assert.equal(r.result.quantities.missing, 30); assert.deepEqual(r.result.adjustmentOf, [s.deliveries[0].id]);
  assert.equal(canonical(s.deliveries[0]), accepted); assert.equal(canonical(s.results[0]), prior);
  assert.equal(canonical(s.rosters[0].assignments), frozen); assert.equal(s.punches.find(p => p.id === rawId).at, '2026-10-05T16:00:00Z');
  assert.equal(s.corrections[0].status, 'approved'); assert.equal(effectiveRevisions(s.shifts, '2026-10-05')[0].id, shiftId);
});

test('changing active employment to stopped does not resurrect an old revision', () => {
  const s = fixture(); s.employments.push({ ...s.employments[0], version: 2, from: '2026-10-05', status: 'stopped' });
  assert.throws(() => run(s, 'roster.create', { name: 'جدول موقوف', from: '2026-10-05', to: '2026-10-05', employeeIds: ['e1'], policyId: 'policy', policyVersion: 1 }), /ارتباط وظيفي/);
});

test('versioned future definition suspension cannot authorize a new assignment, while historical snapshot remains', () => {
  const s = fixture(); s.shifts.push({ ...s.shifts[0], version: 2, from: '2026-10-05', status: 'stopped' });
  assert.equal(effectiveRevisions(s.shifts, '2026-10-04').find(x => x.id === 'morning').version, 1);
  assert.equal(effectiveRevisions(s.shifts, '2026-10-05').find(x => x.id === 'morning'), undefined);
});
