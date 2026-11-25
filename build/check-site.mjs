// build/check-site.mjs
// Il controllo del sito costruito, in locale (npm run check, dopo lint e
// build): serve dist con vite preview e lo visita con Chromium (Playwright).
// - Tutte le pagine, in italiano e in inglese: errori e avvisi di console,
//   richieste fallite, chiavi di traduzione mostrate al posto del testo,
//   "undefined" o "NaN" nel testo, pagine quasi vuote.
// - axe-core sulle stesse pagine, regole WCAG 2.1 A e AA, in tema chiaro e
//   scuro (contrasto, nomi accessibili, riquadri raggiungibili da tastiera...).
// Esce con errore se trova qualcosa. Gira in locale e non su GitHub Actions,
// che sul piano gratuito ha minuti contati.
// La prima volta serve il Chromium di Playwright: npx playwright install chromium
// Opzioni: --quick (solo italiano, axe solo in tema chiaro),
//          --all (tutte le lezioni e gli esercizi, non solo i primi due),
//          --routes=/a,/b (solo quelle pagine).
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => (args.find((a) => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

// le pagine: i percorsi fissi di App.jsx, la 404, e per ogni elenco con
// :slug le pagine che l'elenco stesso linka
function staticRoutes() {
  const app = readFileSync(`${ROOT}src/App.jsx`, 'utf8');
  const paths = [...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]);
  return {
    pages: paths.filter((p) => !p.includes(':') && p !== '*').concat('/pagina-che-non-esiste'),
    lists: paths.filter((p) => p.endsWith('/:slug')).map((p) => p.slice(0, -'/:slug'.length)),
  };
}

const sections = readdirSync(`${ROOT}src/i18n`).filter((f) => f.endsWith('.js') && f !== 'registry.js').map((f) => f.slice(0, -3));
const rawKey = new RegExp(`\\b(?:${sections.join('|')})\\.[A-Za-z][\\w.]*`, 'g');

const problems = [];
const report = (where, what) => problems.push(`${where}: ${what}`);

async function openPage(browser, base, { lang = 'it', theme = 'light' } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', bypassCSP: true });
  await context.addInitScript(([l, t]) => {
    try { localStorage.setItem('lang', l); localStorage.setItem('theme', t); } catch { /* memoria bloccata */ }
  }, [lang, theme]);
  const page = await context.newPage();
  page.log = [];
  page.on('pageerror', (e) => page.log.push(`errore: ${e.message}`));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) page.log.push(`console ${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('requestfailed', (r) => page.log.push(`richiesta fallita: ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) page.log.push(`HTTP ${r.status()}: ${r.url()}`); });
  return page;
}

async function visit(page, base, route) {
  page.log.length = 0;
  await page.goto('about:blank');
  await page.goto(`${base}#${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
}

async function main() {
  const server = await preview({ root: ROOT, logLevel: 'silent', preview: { port: 4317, strictPort: false } });
  const base = server.resolvedUrls.local[0];
  const browser = await chromium.launch();
  try {
    const { pages, lists } = staticRoutes();
    let routes = option('routes') ? option('routes').split(',') : pages;
    if (!option('routes')) {
      const page = await openPage(browser, base);
      for (const list of lists) {
        await visit(page, base, list);
        const links = await page.evaluate((l) => [...new Set([...document.querySelectorAll(`a[href^="#${l}/"]`)].map((a) => a.getAttribute('href').slice(1)))], list);
        routes = routes.concat(flag('all') ? links : links.slice(0, 2));
      }
      await page.context().close();
    }

    // le pagine nelle due lingue
    for (const lang of flag('quick') ? ['it'] : ['it', 'en']) {
      const page = await openPage(browser, base, { lang });
      for (const route of routes) {
        await visit(page, base, route);
        const where = `[${lang}] ${route}`;
        page.log.forEach((line) => report(where, line));
        const text = await page.evaluate(() => document.body.innerText);
        const keys = [...new Set(text.match(rawKey) || [])];
        if (keys.length) report(where, `chiavi al posto del testo: ${keys.slice(0, 5).join(', ')}`);
        // senza gli appunti e il codice, dove "undefined" puo' essere una parola vera
        // (undefined behaviour), non un valore mancante
        const prose = await page.evaluate(() => {
          const copy = document.body.cloneNode(true);
          copy.querySelectorAll('.ssa-doc, .ds-doc, .lab-doc, pre, code').forEach((e) => e.remove());
          return copy.textContent;
        });
        for (const bad of ['undefined', 'NaN', '[object Object]']) {
          if (new RegExp(`(^|\\W)${bad.replace(/[[\]]/g, '\\$&')}(\\W|$)`).test(prose)) report(where, `"${bad}" nel testo`);
        }
        if (text.trim().length < 200) report(where, 'pagina quasi vuota');
      }
      await page.context().close();
      console.log(`[${lang}] ${routes.length} pagine visitate`);
    }

    // accessibilita'
    for (const theme of flag('quick') ? ['light'] : ['light', 'dark']) {
      const page = await openPage(browser, base, { theme });
      for (const route of routes) {
        await visit(page, base, route);
        await page.addScriptTag({ content: AXE });
        const violations = await page.evaluate(async () => {
          const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
          return result.violations.map((v) => `${v.id} x${v.nodes.length} (${v.nodes[0].target.join(' ').slice(-60)})`);
        });
        violations.forEach((v) => report(`[axe ${theme}] ${route}`, v));
      }
      await page.context().close();
      console.log(`[axe ${theme}] ${routes.length} pagine controllate`);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  if (problems.length) {
    console.error(`\ncheck-site: ${problems.length} problemi\n  ${problems.slice(0, 60).join('\n  ')}${problems.length > 60 ? `\n  ... e altri ${problems.length - 60}` : ''}`);
    process.exit(1);
  }
  console.log('check-site: nessun problema');
}

main().catch((error) => {
  console.error(`check-site: ${error.message}`);
  process.exit(1);
});
