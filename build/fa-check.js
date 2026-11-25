// build/fa-check.js
// Il sito pubblica Font Awesome ridotto alle icone che usa (build/fa-subset.py):
// un'icona nuova scritta nel codice non avrebbe ne' la sua regola CSS ne' il
// suo glifo, e al suo posto non comparirebbe niente. La build si ferma se il
// codice usa un'icona di Font Awesome che il sottoinsieme pubblicato non ha.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RULE = /\.fa-([a-z0-9-]+):before\{content:"\\[ef][0-9a-f]{3}"\}/g;

const ruleNames = (file) => new Set([...readFileSync(file, 'utf8').matchAll(RULE)].map((m) => m[1]));

const sources = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) return sources(path);
  return /\.(jsx?|mjs)$/.test(entry.name) ? [path] : [];
});

export default function faCheck() {
  return {
    name: 'fa-check',
    apply: 'build',
    buildStart() {
      const all = ruleNames(join(ROOT, 'build', 'fontawesome', 'fontawesome-all.min.css'));
      const published = ruleNames(join(ROOT, 'public', 'assets', 'css', 'fontawesome-all.min.css'));
      const used = new Set();
      for (const file of [join(ROOT, 'index.html'), ...sources(join(ROOT, 'src'))]) {
        for (const m of readFileSync(file, 'utf8').matchAll(/\bfa-([a-z0-9-]+)/g)) used.add(m[1]);
      }
      const missing = [...used].filter((name) => all.has(name) && !published.has(name)).sort();
      if (missing.length) {
        throw new Error(`fa-check: icone usate ma non nel Font Awesome ridotto del sito: ${missing.map((n) => `fa-${n}`).join(', ')}.\n`
          + '  Rigenera il sottoinsieme con: python3 build/fa-subset.py');
      }
    },
  };
}
