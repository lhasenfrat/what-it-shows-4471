// Writes one built kb page as a single self-contained HTML file: the page as the desk sees it,
// with its stylesheets inlined and the client scripts dropped (the page is fully prerendered).
// Usage: node scripts/snapshot.mjs build/kb/incidents/4471/problems.html rendered/kb-incidents-4471-problems.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [from, to] = process.argv.slice(2);
if (!from || !to) throw new Error('usage: node scripts/snapshot.mjs <built page> <output file>');

let html = readFileSync(from, 'utf8');
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, (tag) => {
  const href = tag.match(/href="([^"]+)"/)?.[1];
  if (!href) return tag;
  const css = readFileSync(resolve(dirname(from), href), 'utf8');
  return `<style>${css}</style>`;
});
html = html.replace(/<link\b[^>]*rel="modulepreload"[^>]*>\s*/g, '');
html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>\s*/g, '');
mkdirSync(dirname(to), { recursive: true });
writeFileSync(to, html);
console.log(`wrote ${to} (${html.length} bytes)`);
