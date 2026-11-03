<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { PROBLEMS, splitTicket, type Problem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';
  import type { Report } from '#lib/kb/causes';

  // issues: problem → URL of the ticket filed for it. status: problem → where that ticket stands, in words.
  let {
    ticket,
    issues = {},
    status = {},
  }: { ticket: number; issues?: Partial<Record<Problem, string>>; status?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const list = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
  const short = (url: string) => `issue #${url.split('/').pop()}`;
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
  <span class="rows">({split.rows} rows in the export: a report can come twice, so each id counts once)</span>
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>came in by</th><th>tagged as</th><th>tenants</th><th>seen</th><th>ticket</th><th>status</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code><br /><span class="what">{PROBLEMS[g.problem]}</span></td>
        <td class="n">{g.reports.length}</td>
        <td class="tags">{list(g.channels)}</td>
        <td class="tags">{list(g.taggedAs)}</td>
        <td class="n">{g.tenants}</td>
        <td class="tags">{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issues[g.problem]}<a href={issues[g.problem]}>{short(issues[g.problem] ?? '')}</a>{:else}<span class="none">no ticket yet</span>{/if}
        </td>
        <td class:none={status[g.problem] === 'open'}>{status[g.problem] ?? '—'}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .rows { color: var(--muted); font-size: 0.8em; }
  .what { color: var(--muted); font-size: 0.85em; }
  .tags { color: var(--muted); font-size: 0.85em; }
  .n { font-variant-numeric: tabular-nums; }
  .none { color: var(--warn); font-weight: 600; }
</style>
