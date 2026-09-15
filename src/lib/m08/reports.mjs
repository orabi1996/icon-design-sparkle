import { dates, minutes } from './time.mjs';
import { publishedAssignments, coverage, requiredIntervals } from './planning.mjs';
export function reportRows(state, report, from, to, audit = []) {
  dates(from, to);
  if (report === 'rosters') return state.rosters.flatMap(r => r.assignments.filter(a => a.workDate >= from && a.workDate <= to).map(a => ({
    employeeId: a.employeeId, employeeCode: a.employeeCode, name: a.nameAr, branch: a.branch, department: a.department, team: a.team,
    workDate: a.workDate, dayType: a.dayType, periodNo: a.periodNo, shiftCode: a.shift?.code ?? '', start: a.start ?? '', end: a.end ?? '', timezone: a.timezone ?? '',
    siteCode: a.siteCode, costCenter: a.costCenter ?? '', requiredMinutes: a.dayType === 'WORK' ? minutes(requiredIntervals(a)) : 0,
    night: a.shift?.endDay === 1 ? 1 : 0, source: a.source, rosterId: r.id, version: r.version, status: r.status })));
  if (report === 'coverage') return coverage(state, publishedAssignments(state), state.demands.filter(d => d.workDate >= from && d.workDate <= to)).segments;
  if (report === 'results') return state.results.filter(r => r.workDate >= from && r.workDate <= to).map(r => ({ employeeId: r.employeeId, workDate: r.workDate, resultId: r.id, version: r.version,
    requiredMinutes: r.requiredMinutes, presenceMinutes: r.presenceMinutes, actualMinutes: r.actualMinutes, paidMinutes: r.paidMinutes, excusedMinutes: r.excusedMinutes,
    missingMinutes: r.missingMinutes, lateMinutes: r.lateMinutes, plannedOvertime: r.plannedOvertimeMinutes, observedOvertime: r.observedOvertimeMinutes,
    eligibleOvertime: r.eligibleOvertimeMinutes, approvedOvertime: r.approvedOvertimeMinutes, exportedOvertime: state.deliveries.filter(d => d.resultId === r.id && d.status === 'accepted').reduce((n, d) => n + (d.quantities.overtime ?? 0), 0),
    costCenter: r.costCenter ?? '', approval: r.approval.status, rosterId: r.sources.rosterId, rosterVersion: r.sources.rosterVersion, policyVersion: r.sources.policyVersion }));
  if (report === 'requests') return state.requests.filter(r => r.at.slice(0, 10) >= from && r.at.slice(0, 10) <= to).map(r => ({ id: r.id, employeeId: r.employeeId, kind: r.kind, status: r.status, at: r.at, executedAt: r.executedAt ?? '', reason: r.reason }));
  if (report === 'deliveries') return state.deliveries.filter(d => (d.workDate ?? d.at.slice(0, 10)) >= from && (d.workDate ?? d.at.slice(0, 10)) <= to).map(d => ({ id: d.id, employeeId: d.employeeId, workDate: d.workDate ?? '', kind: d.kind, periodId: d.periodId ?? '', resultId: d.resultId ?? '', status: d.status, ...d.quantities, costCenter: d.costCenter ?? '', adjustmentOf: d.adjustmentOf?.join(';') ?? '', reference: d.externalReference ?? '' }));
  if (report === 'audit') return audit.filter(a => a.at.slice(0, 10) >= from && a.at.slice(0, 10) <= to).map(a => ({ revision: a.revision, at: a.at, actor: a.actor_id, action: a.event.type, reason: a.event.reason, before: JSON.stringify(a.event.before), after: JSON.stringify(a.event.after) }));
  throw new Error('تقرير غير مدعوم');
}
export function csvExport(rows, metadata = {}) {
  const safe = value => {
    const s = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    // Prevent formula execution when an exported CSV is opened in spreadsheet applications.
    return `"${(/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""')}"`;
  };
  const headers = [...new Set(rows.flatMap(r => Object.keys(r)))];
  return '\uFEFF' + [Object.entries(metadata).map(([k, v]) => safe(`${k}: ${v}`)).join(','), headers.map(safe).join(','), ...rows.map(r => headers.map(k => safe(r[k])).join(','))].join('\r\n');
}
