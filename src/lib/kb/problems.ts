// The problems inside one merged ticket. Pages explain them; this file is what runs.
//
// causes.ts says which cause a report's tenant and channel point to. desk-notes.json says which
// reports the desk read as a one-day move. A one-day move is not a day/month flip, and a parser
// that reads month first cannot move a date by one day, so it is a problem of its own, whatever
// the tenant.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

// What each problem is, in the desk's words. Order is the order of the fix list.
export const PROBLEMS: Record<Problem, string> = {
  parser: 'the shared parser reads day-first dates month first',
  hint: 'booking-v3 prints MM/DD/YYYY under its date field',
  'one-day': 'the date moves by one day, not a day/month flip',
  unplaced: 'no tenant on file, or a month-first tenant',
};

export function problemOf(r: Report, t: Tenant | undefined, oneDay: readonly string[]): Problem {
  if (oneDay.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
  // How they came in: channel → count.
  channels: Record<string, number>;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

export type TicketSplit = {
  // Rows in the export merged into the ticket, repeats included.
  rows: number;
  // One report per id.
  merged: Report[];
  groups: ProblemGroup[];
};

const tally = (rs: Report[], key: (r: Report) => string) =>
  rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {});

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDay: readonly string[],
): TicketSplit {
  const rows = all.filter((r) => r.mergedInto === ticket).length;
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDay);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const order = Object.keys(PROBLEMS) as Problem[];
  const groups = [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        taggedAs: tally(rs, (r) => r.meta.intakeTag),
        channels: tally(rs, (r) => r.channel),
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => order.indexOf(a.problem) - order.indexOf(b.problem));
  return { rows, merged, groups };
}
