import { requireRule } from './time.mjs';
import { dates } from './time.mjs';
import { effectiveRevisions } from './planning.mjs';

export const ACTIONS = ['read', 'configure', 'link', 'draft', 'import', 'approve', 'publish', 'revise', 'exception', 'request', 'request_approve', 'punch', 'correct', 'leave', 'recalculate', 'attendance_approve', 'attendance_reopen', 'payroll', 'payroll_close', 'export', 'audit', 'notify', 'access'];
export function allowed(actor, action, entity = {}) {
  return actor?.grants?.some(g => g.actions.includes(action) &&
    (!g.employeeId || g.employeeId === entity.employeeId) &&
    (!g.branch || g.branch === entity.branch) && (!g.department || g.department === entity.department) && (!g.team || g.team === entity.team));
}
export function assertAccess(actor, action, entity = {}) { requireRule(allowed(actor, action, entity), 'FORBIDDEN', 'غير مصرح بهذا الإجراء أو نطاق البيانات'); }
export function allowedField(actor, field, entity = {}) {
  return actor?.grants?.some(g => g.fields?.includes(field) && (!g.employeeId || g.employeeId === entity.employeeId) && (!g.branch || g.branch === entity.branch) && (!g.department || g.department === entity.department) && (!g.team || g.team === entity.team));
}
export function employeeScope(state, id) { return state.employments.filter(e => e.employeeId === id).sort((a, b) => b.version - a.version)[0] ?? { employeeId: id, branch: '__unknown__' }; }
export function authorizeRoster(actor, action, roster, state) {
  requireRule(roster.employeeIds.length > 0, 'ROSTER_SCOPE', 'اختر موظفًا واحدًا على الأقل');
  for (const id of roster.employeeIds) {
    const records = [...new Map(dates(roster.from, roster.to).flatMap(day => effectiveRevisions(state.employments, day).filter(e => e.employeeId === id).map(e => [e.id + ':' + e.version, e]))).values()];
    requireRule(records.length > 0, 'FORBIDDEN', 'ارتباط وظيفي غير متاح');
    records.forEach(e => assertAccess(actor, action, e));
  }
}
/** Server response projection: no draft, colleague reasons, payroll or access details leak through self-service. */
export function projectState(state, actor) {
  const visible = state.employments.filter(e => allowed(actor, 'read', e));
  const ids = new Set(visible.map(e => e.employeeId));
  const planner = actor.grants.some(g => g.actions.some(a => ['draft', 'approve', 'publish', 'audit'].includes(a)));
  const scrub = (record, entity) => {
    const x = structuredClone(record);
    if (!allowedField(actor, 'cost', entity)) { delete x.costCenter; delete x.costCenterCode; }
    if (!allowedField(actor, 'leave_detail', entity)) { delete x.reason; delete x.leaveType; }
    return x;
  };
  const rosterManageable = r => r.employeeIds.every(id => allowed(actor, 'draft', employeeScope(state, id)));
  const rosters = state.rosters.filter(r => r.status === 'published' || planner && rosterManageable(r)).map(r => ({ ...r,
    employeeIds: r.employeeIds.filter(id => ids.has(id)),
    assignments: r.assignments.filter(a => ids.has(a.employeeId) && allowed(actor, 'read', a)).map(a => {
      const x = structuredClone(a); if (!allowedField(actor, 'cost', a)) delete x.costCenter; return x;
    }), history: planner && rosterManageable(r) ? r.history.map(h => ({ ...h, assignments: h.assignments.filter(a => ids.has(a.employeeId)).map(a => { const x = structuredClone(a); if (!allowedField(actor, 'cost', a)) delete x.costCenter; return x; }) })) : [],
    approvals: planner && rosterManageable(r) ? r.approvals : [], reason: planner && rosterManageable(r) ? r.reason : '',
  })).filter(r => r.employeeIds.length);
  return { ...state, sites: state.sites.map(s => allowedField(actor, 'cost') ? s : { ...s, costCenters: [] }), employments: visible.map(e => scrub(e, e)), rosters,
    bindings: planner ? state.bindings.filter(b => (b.employeeIds ?? []).some(id => ids.has(id)) || actor.grants.some(g => !g.branch && !g.employeeId && g.actions.includes('read'))) : [],
    leaves: state.leaves.filter(l => ids.has(l.employeeId)).map(l => scrub(l, employeeScope(state, l.employeeId))),
    requests: state.requests.filter(r => ids.has(r.employeeId) || ids.has(r.otherEmployeeId)),
    results: state.results.filter(r => ids.has(r.employeeId)).map(r => scrub(r, employeeScope(state, r.employeeId))),
    corrections: state.corrections.filter(c => ids.has(c.employeeId)).map(c => scrub(c, employeeScope(state, c.employeeId))),
    punches: (state.punches ?? []).filter(p => ids.has(p.employeeId)),
    deliveries: state.deliveries.filter(d => allowed(actor, 'payroll', employeeScope(state, d.employeeId))),
    payrollPeriods: actor.grants.some(g => g.actions.includes('payroll')) ? state.payrollPeriods : [],
    exceptions: planner ? state.exceptions.filter(e => !e.employeeId || ids.has(e.employeeId)) : [],
    notifications: state.notifications.filter(n => n.userId === actor.id || (n.employeeId && ids.has(n.employeeId) && allowed(actor, 'notify', employeeScope(state, n.employeeId)))),
    demands: planner ? state.demands.filter(d => allowed(actor, 'read', d)) : [],
    openShifts: state.openShifts.filter(o => planner || o.status === 'open' && visible.some(e => (e.allowedSites ?? []).includes(o.siteCode) && (!o.skill || e.skills.some(s => (typeof s === 'string' ? s : s.code) === o.skill)))).map(o => { const x = { ...o }; delete x.claims; return x; }),
    swapOptions: state.rosters.filter(r => r.status === 'published').flatMap(r => r.assignments).filter(a => a.dayType === 'WORK' &&
      visible.some(e => e.branch === a.branch && e.employeeId !== a.employeeId) && state.employments.some(e => e.employeeId === a.employeeId && e.userId)).map(a => ({
      key: a.key, employeeId: a.employeeId, employeeCode: a.employeeCode, workDate: a.workDate, start: a.start, shiftCode: a.shift.code, siteCode: a.siteCode })),
  };
}
