// build/check-charts.mjs
// La prova dei grafici di Statistics, in locale (npm run check:charts, che
// prima fa la build): serve dist con vite preview e apre ogni homework, la
// pagina del sito e il programma scaricabile, in Chromium e nel Firefox del
// sistema, con il mouse (una finestra di 1280x900) e con le dita (un
// telefono di 390x844).
// - Con il mouse: quanti grafici ci sono e se sono tutti disegnati, lo zoom
//   di ognuno (Ctrl + rotella, il suggerimento della rotella da sola, il
//   ritorno al grafico intero), le prove di ogni homework (un rettangolo,
//   l'etichetta sotto il mouse, le linee da trascinare, gli slider che non
//   perdono lo zoom, i canvas che disegnano da se'), le animazioni e le
//   verifiche.
// - Con le dita: l'etichetta con un tocco, il pizzico senza che la pagina si
//   muova, il pulsante del grafico intero, le linee trascinate con un dito, e
//   gli stessi canvas.
// - Sempre: nessun errore o avviso in console, nessuna pagina piu' larga
//   della finestra.
// Le schede degli homework sono in build/charts/homework.mjs, le prove in
// build/charts/scenarios.mjs, i due browser in build/charts/drivers.mjs.
// Esce con errore se trova qualcosa. Gira in locale e non su GitHub Actions,
// che sul piano gratuito ha minuti contati. Se Firefox non c'e', lo salta e
// lo dice. La prima volta serve il Chromium di Playwright:
// npx playwright install chromium
// Opzioni: --only=hw3,hw7 (solo quegli homework), --site o --zip,
//          --chromium o --firefox, --mouse o --touch,
//          --live (il sito pubblicato invece di dist, senza build:
//          node build/check-charts.mjs --live), --verbose (anche le prove
//          riuscite).
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { agent } from './charts/agent.mjs';
import { firefoxVersion, launchChromium, launchFirefox } from './charts/drivers.mjs';
import { HOMEWORK } from './charts/homework.mjs';
import { desktopChecks, touchChecks } from './charts/scenarios.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LIVE = 'https://nicholas-arcari.github.io/portfolio-nicholas/';
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => (args.find((a) => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
// due opzioni che si escludono: tutte e due se non se ne sceglie una (o se si scelgono entrambe)
const pick = (a, b) => (flag(a) === flag(b) ? [a, b] : [flag(a) ? a : b]);

const VIEWS = { mouse: { width: 1280, height: 900 }, touch: { width: 390, height: 844, touch: true } };
const SELECTORS = {
  site: { pending: '.hw1-pending', check: '.hw2-check' },
  zip: { pending: '.pending', check: '.check' },
};
const NAMES = { site: 'pagina', zip: 'zip', mouse: 'mouse', touch: 'dita' };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// le funzioni di agent.mjs, messe nella pagina come window.__charts
const INSTALL = `() => { window.__charts = (${agent.toString()})(); return true; }`;

/** Un homework, pagina o zip, in un browser, con il mouse o con le dita: le prove e il loro esito. */
async function job(browser, hw, variant, mode, base) {
  const results = [];
  const ok = (name, passed, detail = '') => results.push({ name, ok: !!passed, detail });
  const started = Date.now();
  const page = await browser.open(VIEWS[mode]);
  const call = (name, ...list) => page.run((n, a) => window.__charts[n](...a), name, list);
  try {
    await page.goto(variant === 'site' ? `${base}#${hw.route}` : `${base}downloads/statistics/${hw.zip}/index.html`);
    await page.run(INSTALL);
    const sel = SELECTORS[variant];
    let ready = false;
    for (const end = Date.now() + 180000; !ready && Date.now() < end;) {
      ready = await call('ready', hw.anchors, sel.pending);
      if (!ready) await sleep(300);
    }
    ok('si apre e finisce i calcoli', ready, `${((Date.now() - started) / 1000).toFixed(1)} s`);
    if (ready) {
      await sleep(800);
      await (mode === 'mouse' ? desktopChecks : touchChecks)({ page, hw, sel, variant, call, ok, sleep });
    }
    const wider = await call('overflow');
    ok('la pagina non e\' piu\' larga della finestra', wider <= 0, wider > 0 ? `${wider} px in piu'` : '');
  } catch (error) {
    ok('la prova arriva in fondo', false, error.message.split('\n')[0]);
  } finally {
    const problems = page.problems();
    ok('nessun errore o avviso in console', !problems.length, problems.slice(0, 4).join(' | '));
    await page.close().catch(() => {});
  }
  return { results, seconds: (Date.now() - started) / 1000 };
}

/** Le prove di un browser, una dopo l'altra (Firefox: uno per il mouse e uno per le dita). */
async function runBrowser(kind, plan, base, report) {
  const each = async (browser, mode) => {
    for (const hw of plan.homework) for (const variant of plan.variants) report(browser.name, hw, variant, mode, await job(browser, hw, variant, mode, base));
  };
  if (kind === 'chromium') {
    const browser = await launchChromium();
    try {
      for (const mode of plan.modes) await each(browser, mode);
    } finally {
      await browser.close();
    }
    return;
  }
  for (const mode of plan.modes) {
    const browser = await launchFirefox({ touch: mode === 'touch' });
    try {
      await each(browser, mode);
    } finally {
      await browser.close();
    }
  }
}

async function main() {
  const live = flag('live');
  const verbose = flag('verbose');
  if (!live && !existsSync(`${ROOT}dist/index.html`)) throw new Error('manca dist: prima la build (npm run check:charts la fa da se\')');
  const only = option('only') ? option('only').split(',') : null;
  const plan = {
    homework: HOMEWORK.filter((hw) => !only || only.includes(hw.id)),
    variants: pick('site', 'zip'),
    modes: pick('mouse', 'touch'),
  };
  if (!plan.homework.length) throw new Error(`nessun homework con questi nomi: ${only.join(', ')} (ci sono ${HOMEWORK.map((hw) => hw.id).join(', ')})`);
  let kinds = pick('chromium', 'firefox');
  if (kinds.includes('firefox') && !firefoxVersion()) {
    console.log('check-charts: Firefox non trovato, lo salto');
    kinds = kinds.filter((k) => k !== 'firefox');
  }
  if (!kinds.length) throw new Error('nessun browser da provare');

  const server = live ? null : await preview({ root: ROOT, logLevel: 'silent', preview: { port: 4318, strictPort: false } });
  const base = live ? LIVE : server.resolvedUrls.local[0];
  console.log(`check-charts: ${plan.homework.map((hw) => hw.name).join(', ')} su ${base} (${kinds.join(' e ')})`);

  let total = 0;
  const failures = [];
  const report = (browser, hw, variant, mode, { results, seconds }) => {
    const bad = results.filter((r) => !r.ok);
    const head = `${browser.padEnd(8)} ${hw.name.padEnd(6)} ${NAMES[variant].padEnd(6)} ${NAMES[mode].padEnd(5)}`;
    total += results.length;
    console.log(`${bad.length ? 'FAIL' : 'ok  '} ${head} ${results.length - bad.length}/${results.length} (${seconds.toFixed(0)} s)`);
    for (const r of results) if (!r.ok || verbose) console.log(`       ${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.detail ? `: ${r.detail}` : ''}`);
    for (const r of bad) failures.push(`${head.replace(/\s+/g, ' ')}: ${r.name}`);
  };
  const started = Date.now();
  try {
    await Promise.all(kinds.map((kind) => runBrowser(kind, plan, base, report)));
  } finally {
    if (server) await server.close();
  }
  const minutes = ((Date.now() - started) / 60000).toFixed(1);
  if (failures.length) {
    console.error(`\ncheck-charts: ${failures.length} prove su ${total} non vanno (${minutes} min)\n  ${failures.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`check-charts: nessun problema, ${total} prove (${minutes} min)`);
}

main().catch((error) => {
  console.error(`check-charts: ${error.message}`);
  process.exit(1);
});
