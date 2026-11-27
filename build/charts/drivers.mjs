// build/charts/drivers.mjs
// I due browser della prova dei grafici (build/check-charts.mjs), dietro la
// stessa interfaccia: Chromium con Playwright, con le dita date dagli eventi
// touch di CDP, e il Firefox del sistema con WebDriver BiDi, in un profilo
// nuovo a ogni avvio. Le coordinate sono pixel CSS della finestra.
//
// Una pagina (browser.open) sa:
//   goto(url)                       andare a un indirizzo e aspettare il load
//   run(fn, ...args)                eseguire fn(...args) nella pagina (anche async) e averne il valore,
//                                   passato in JSON; fn puo' essere anche il suo sorgente, come stringa
//   move(x, y)                      il mouse sopra un punto
//   click(x, y)                     un clic
//   drag(points, { touch })         premere nel primo punto, passare per gli altri, lasciare (mouse o un dito)
//   wheel(x, y, deltaY, { ctrl })   la rotella, anche con Ctrl
//   press(key, { shift })           un tasto: ArrowUp, ArrowDown, ArrowLeft, ArrowRight
//   tap(x, y)                       un tocco
//   pinch(x, y, from, to)           due dita su una riga orizzontale per (x, y), dalla distanza from a to
//   problems()                      gli errori e gli avvisi da quando la pagina e' aperta
//   close()
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// la funzione e i suoi argomenti come un'espressione: la valutano i protocolli dei due browser, che la
// Content Security Policy della pagina non ferma (la pagina stessa non puo' valutare codice)
const expression = (fn, args) => `(async () => JSON.stringify(await (${fn.toString()})(...${JSON.stringify(args)})))()`;
const parse = (text) => (typeof text === 'string' ? JSON.parse(text) : null);

// la prova legge i pixel dei canvas con getImageData: l'avviso di Chromium su willReadFrequently e' suo,
// non della pagina
const NOISE = /willReadFrequently/;

/** Chromium di Playwright (npx playwright install chromium, la prima volta). */
export async function launchChromium() {
  const browser = await chromium.launch();
  return {
    name: 'Chromium',
    async open({ width, height, touch = false }) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: touch ? 3 : 1, isMobile: touch, hasTouch: touch });
      const page = await context.newPage();
      const log = [];
      page.on('pageerror', (e) => log.push(`errore: ${e.message}`));
      page.on('console', (m) => {
        if ((m.type() === 'error' || m.type() === 'warning') && !NOISE.test(m.text())) log.push(`console ${m.type()}: ${m.text().slice(0, 200)}`);
      });
      page.on('requestfailed', (r) => {
        if (!/ERR_ABORTED/.test((r.failure() || {}).errorText || '')) log.push(`richiesta fallita: ${r.url()}`);
      });
      page.on('response', (r) => {
        if (r.status() >= 400) log.push(`HTTP ${r.status()}: ${r.url()}`);
      });
      const cdp = touch ? await context.newCDPSession(page) : null;
      const fingers = (type, points) => cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: points.map(([x, y], id) => ({ x: Math.round(x), y: Math.round(y), id, radiusX: 4, radiusY: 4, force: 1 })),
      });
      return {
        async goto(url) {
          await page.goto(url, { waitUntil: 'load', timeout: 60000 });
        },
        run: async (fn, ...args) => parse(await page.evaluate(expression(fn, args))),
        move: (x, y) => page.mouse.move(x, y),
        click: (x, y) => page.mouse.click(x, y),
        async drag(points, { touch: finger = false } = {}) {
          if (finger) {
            await fingers('touchStart', [points[0]]);
            for (let i = 1; i < points.length; i++) {
              const [a, b] = [points[i - 1], points[i]];
              for (let k = 1; k <= 6; k++) {
                await fingers('touchMove', [[a[0] + ((b[0] - a[0]) * k) / 6, a[1] + ((b[1] - a[1]) * k) / 6]]);
                await sleep(16);
              }
            }
            await fingers('touchEnd', []);
            return;
          }
          await page.mouse.move(points[0][0], points[0][1]);
          await page.mouse.down();
          for (const [x, y] of points.slice(1)) await page.mouse.move(x, y, { steps: 6 });
          await page.mouse.up();
        },
        async wheel(x, y, deltaY, { ctrl = false } = {}) {
          await page.mouse.move(x, y);
          if (ctrl) await page.keyboard.down('Control');
          await page.mouse.wheel(0, deltaY);
          if (ctrl) await page.keyboard.up('Control');
        },
        press: (key, { shift = false } = {}) => page.keyboard.press(shift ? `Shift+${key}` : key),
        async tap(x, y) {
          await fingers('touchStart', [[x, y]]);
          await sleep(40);
          await fingers('touchEnd', []);
        },
        async pinch(x, y, from, to) {
          const at = (d) => [[x - d / 2, y], [x + d / 2, y]];
          await fingers('touchStart', [at(from)[0]]);
          await fingers('touchStart', at(from));
          for (let k = 1; k <= 12; k++) {
            await fingers('touchMove', at(from + ((to - from) * k) / 12));
            await sleep(16);
          }
          await fingers('touchEnd', []);
        },
        problems: () => log.slice(),
        close: () => context.close(),
      };
    },
    close: () => browser.close(),
  };
}

/** La versione del Firefox del sistema, o null se non c'e'. */
export function firefoxVersion() {
  const r = spawnSync('firefox', ['--version'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

const freePort = () => new Promise((resolve, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(() => resolve(port));
  });
});

// i tasti di WebDriver sono caratteri dell'area privata di Unicode
const KEYS = { Shift: 0xe008, Control: 0xe009, ArrowLeft: 0xe012, ArrowUp: 0xe013, ArrowRight: 0xe014, ArrowDown: 0xe015 };
const key = (name) => String.fromCharCode(KEYS[name]);

/**
 * Il Firefox del sistema, senza finestra, in un profilo nuovo. Con touch le dita arrivano alla pagina anche
 * come eventi touch (la preferenza vale per tutto il profilo: per questo un Firefox per il mouse e uno per
 * le dita).
 */
export async function launchFirefox({ touch = false } = {}) {
  const profile = mkdtempSync(join(tmpdir(), 'check-charts-firefox-'));
  writeFileSync(join(profile, 'user.js'), [
    'user_pref("browser.shell.checkDefaultBrowser", false);',
    'user_pref("datareporting.policy.dataSubmissionEnabled", false);',
    'user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);',
    touch ? 'user_pref("dom.w3c_touch_events.enabled", 1);' : '',
    '',
  ].join('\n'));
  const port = await freePort();
  const child = spawn('firefox', ['--headless', '--no-remote', '--profile', profile, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' });
  const gone = new Promise((resolve) => child.once('exit', resolve));
  const cleanup = async () => {
    child.kill();
    await Promise.race([gone, sleep(5000)]);
    rmSync(profile, { recursive: true, force: true });
  };

  let ws = null;
  for (let i = 0; i < 80 && !ws; i++) {
    try {
      ws = await new Promise((resolve, reject) => {
        const socket = new WebSocket(`ws://127.0.0.1:${port}/session`);
        socket.onopen = () => resolve(socket);
        socket.onerror = () => reject(new Error('nessuna connessione'));
      });
    } catch {
      await sleep(250);
    }
  }
  if (!ws) {
    await cleanup();
    throw new Error('Firefox non risponde su WebDriver BiDi');
  }

  let nextId = 0;
  const waiting = new Map();
  const logs = new Map(); // context -> le righe di quella pagina
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && waiting.has(msg.id)) {
      waiting.get(msg.id)(msg);
      waiting.delete(msg.id);
    } else if (msg.method === 'log.entryAdded') {
      const e = msg.params;
      const lines = logs.get(e.source && e.source.context);
      if (lines && (e.level === 'error' || e.level === 'warn')) lines.push(`console ${e.level}: ${String(e.text).slice(0, 200)}`);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    waiting.set(id, (msg) => (msg.type === 'error' ? reject(new Error(`${method}: ${msg.error} ${msg.message || ''}`)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
  await send('session.new', { capabilities: {} });
  await send('session.subscribe', { events: ['log.entryAdded'] });

  return {
    name: 'Firefox',
    async open({ width, height }) {
      const { context } = await send('browsingContext.create', { type: 'tab' });
      logs.set(context, []);
      await send('browsingContext.activate', { context });
      await send('browsingContext.setViewport', { context, viewport: { width, height }, devicePixelRatio: touch ? 3 : 1 });
      const act = async (actions) => {
        await send('input.performActions', { context, actions });
        await send('input.releaseActions', { context });
      };
      const at = (x, y, duration = 0) => ({ type: 'pointerMove', x: Math.round(x), y: Math.round(y), origin: 'viewport', duration });
      const pointer = (id, pointerType, actions) => ({ type: 'pointer', id, parameters: { pointerType }, actions });
      const keys = (actions) => ({ type: 'key', id: 'keys', actions });
      return {
        async goto(url) {
          await send('browsingContext.navigate', { context, url, wait: 'complete' });
        },
        async run(fn, ...args) {
          const r = await send('script.evaluate', { expression: expression(fn, args), target: { context }, awaitPromise: true, resultOwnership: 'none' });
          if (r.type === 'exception') throw new Error(`nella pagina: ${r.exceptionDetails.text}`);
          return parse(r.result.value);
        },
        move: (x, y) => act([pointer('mouse', 'mouse', [at(x, y)])]),
        click: (x, y) => act([pointer('mouse', 'mouse', [at(x, y), { type: 'pause', duration: 50 }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }])]),
        drag: (points, { touch: finger = false } = {}) => act([pointer(finger ? 'finger' : 'mouse', finger ? 'touch' : 'mouse', [
          at(points[0][0], points[0][1]),
          { type: 'pointerDown', button: 0 },
          ...points.slice(1).map(([x, y]) => at(x, y, 120)),
          { type: 'pointerUp', button: 0 },
        ])]),
        // Ctrl resta premuto mentre gira la rotella: le due sorgenti avanzano insieme, un passo per volta
        wheel: (x, y, deltaY, { ctrl = false } = {}) => act([
          ...(ctrl ? [keys([{ type: 'keyDown', value: key('Control') }, { type: 'pause' }, { type: 'pause' }, { type: 'keyUp', value: key('Control') }])] : []),
          {
            type: 'wheel',
            id: 'wheel',
            actions: [
              ...(ctrl ? [{ type: 'pause' }] : []),
              { type: 'scroll', x: Math.round(x), y: Math.round(y), deltaX: 0, deltaY: Math.round(deltaY), origin: 'viewport' },
              ...(ctrl ? [{ type: 'pause' }, { type: 'pause' }] : []),
            ],
          },
        ]),
        press: (name, { shift = false } = {}) => act([keys([
          ...(shift ? [{ type: 'keyDown', value: key('Shift') }] : []),
          { type: 'keyDown', value: key(name) },
          { type: 'keyUp', value: key(name) },
          ...(shift ? [{ type: 'keyUp', value: key('Shift') }] : []),
        ])]),
        tap: (x, y) => act([pointer('finger', 'touch', [at(x, y), { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 60 }, { type: 'pointerUp', button: 0 }])]),
        pinch: (x, y, from, to) => act([-1, 1].map((side, i) => pointer(`finger${i}`, 'touch', [
          at(x + (side * from) / 2, y),
          { type: 'pointerDown', button: 0 },
          at(x + (side * (from + to)) / 4, y, 150),
          at(x + (side * to) / 2, y, 150),
          { type: 'pointerUp', button: 0 },
        ]))),
        problems: () => (logs.get(context) || []).slice(),
        async close() {
          logs.delete(context);
          await send('browsingContext.close', { context });
        },
      };
    },
    async close() {
      try {
        await send('session.end', {});
      } catch {
        // gia' chiusa
      }
      ws.close();
      await cleanup();
    },
  };
}
