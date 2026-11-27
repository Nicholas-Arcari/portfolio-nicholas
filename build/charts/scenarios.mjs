// build/charts/scenarios.mjs
// Le prove di una pagina (il sito o lo zip di un homework) in un browser:
// quelle che valgono per ogni homework, con il mouse (desktopChecks) e con
// le dita (touchChecks), e quelle che la scheda dell'homework elenca
// (build/charts/homework.mjs). Ogni tipo di prova e' una funzione in
// STEPS, ogni tipo di canvas che disegna da se' una coppia in SOURCES:
// per una prova nuova basta una funzione qui e una riga nella scheda.
//
// ctx: { page (il driver), hw (la scheda), sel (i selettori di sito o zip),
//        call(nome, ...argomenti) (le funzioni di agent.mjs nella pagina),
//        ok(prova, riuscita, dettaglio), sleep(ms) }

const short = (s) => (s.length > 44 ? `${s.slice(0, 44)}...` : s);
const at = (b, fx = 0.5, fy = 0.5) => [b.x + b.w * fx, b.y + b.h * fy];
const px = (v) => `${Math.round(v)} px`;
// dove due testi cominciano a essere diversi
const diff = (a, b) => {
  if (a === b) return 'niente e\' cambiato';
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  const from = Math.max(0, i - 12);
  return `"${a.slice(from, i + 28)}" -> "${b.slice(from, i + 28)}"`;
};
const PLAY = '^(play|avvia|resume|riprendi)';

// il grafico di una prova: per titolo (label) o per posizione nella sua sezione
const chartOf = (step) => (step.label ? { label: step.label } : { section: step.section, k: step.chart || 0 });

// ---- i gesti, uguali per tutte le prove

async function wheelZoom(ctx, name, where = [0.5, 0.45]) {
  const b = await ctx.call('place', name);
  const [x, y] = at(b, ...where);
  await ctx.page.wheel(x, y, -400, { ctrl: true });
  await ctx.sleep(500);
  return (await ctx.call('state', name)).zoomed;
}

// il terzo pulsante dello zoom, con un clic o con un tocco: torna al grafico intero?
async function reset(ctx, name, { touch = false } = {}) {
  await ctx.call('place', name);
  const button = (await ctx.call('buttons', name))[2];
  if (!button) return false;
  const [x, y] = at(button);
  if (touch) await ctx.page.tap(x, y);
  else await ctx.page.click(x, y);
  await ctx.sleep(400);
  return !(await ctx.call('state', name)).zoomed;
}

// l'etichetta sotto il mouse, o con un tocco, in un punto dove la pagina dice che c'e'
async function label(ctx, name, { touch = false } = {}) {
  await ctx.call('place', name);
  const p = await ctx.call('findTip', name);
  if (!p) return { ok: false, detail: 'nessun punto con un\'etichetta' };
  if (touch) await ctx.page.tap(p.x, p.y);
  else await ctx.page.move(p.x, p.y);
  await ctx.sleep(350);
  const s = await ctx.call('state', name);
  return { ok: !!s.tip, detail: s.tip || 'nessuna etichetta' };
}

// due dita che si allontanano: il grafico si ingrandisce e la pagina non si muove
async function pinch(ctx, name, where = [0.5, 0.45]) {
  const b = await ctx.call('place', name);
  const before = await ctx.call('state', name);
  const [x, y] = at(b, ...where);
  await ctx.page.pinch(x, y, Math.min(60, b.w * 0.2), Math.min(220, b.w * 0.75));
  await ctx.sleep(500);
  const after = await ctx.call('state', name);
  return { ok: after.zoomed && Math.abs(after.y - before.y) < 1, detail: `ingrandito ${after.zoomed}, il grafico da ${px(before.y)} a ${px(after.y)} dall'alto` };
}

// la rotella da sola mostra il suggerimento, il pulsante torna al grafico intero
async function hintAndReset(ctx, title, name) {
  const b = await ctx.call('place', name);
  const [x, y] = at(b, 0.5, 0.3);
  await ctx.page.wheel(x, y, 120);
  await ctx.sleep(300);
  ctx.ok(`${title}: la rotella da sola mostra il suggerimento`, (await ctx.call('state', name)).hint);
  ctx.ok(`${title}: il pulsante torna al grafico intero`, await reset(ctx, name));
}

// una linea del grafico (un parametro) trascinata verso il centro: le parole della sezione cambiano
async function dragLine(ctx, step, { touch = false } = {}) {
  const title = `${step.title}: la linea trascinata con ${touch ? 'un dito' : 'il mouse'}`;
  if (!(await ctx.call('mark', 'line', chartOf(step)))) return ctx.ok(title, false, 'grafico non trovato');
  const b = await ctx.call('place', 'line');
  const p = await ctx.call('findCursor', 'line', ['ew-resize', 'ns-resize'], step.scan || {});
  if (!p) return ctx.ok(title, false, 'nessuna linea da prendere');
  const before = await ctx.call('words', step.section);
  const d = step.by || 70;
  const to = p.cursor === 'ew-resize' ? [p.x + (p.x < b.x + b.w / 2 ? d : -d), p.y] : [p.x, p.y + (p.y < b.y + b.h / 2 ? d : -d)];
  await ctx.page.drag([[p.x, p.y], [(p.x + to[0]) / 2, (p.y + to[1]) / 2], to], { touch });
  await ctx.sleep(500);
  const after = await ctx.call('words', step.section);
  const s = await ctx.call('state', 'line');
  // con un dito la pagina non deve seguire la linea (qualche pixel puo' venire dal testo che cambia sopra)
  const still = !touch || Math.abs(s.y - b.y) < 35;
  ctx.ok(title, after !== before && still, `${diff(before, after)}${touch ? `; il grafico da ${px(b.y)} a ${px(s.y)} dall'alto` : ''}`);
}

// il canvas di una prova che disegna da se' (sito e zip hanno classi diverse)
async function markSource(ctx, source) {
  const selector = source[ctx.variant];
  return (await ctx.call('mark', 'source', { section: source.section, selector })) || ctx.call('mark', 'source', { selector });
}

// ---- le prove di una scheda, con il mouse

const STEPS = {
  // Ctrl + rotella vera, e l'etichetta sotto il mouse nel grafico ingrandito
  async wheel(ctx, step) {
    const title = `${step.title}: Ctrl + rotella${step.tip ? ' e l\'etichetta' : ''}`;
    if (!(await ctx.call('mark', 'step', chartOf(step)))) return ctx.ok(title, false, 'grafico non trovato');
    const zoomed = await wheelZoom(ctx, 'step', step.at);
    const l = step.tip ? await label(ctx, 'step') : { ok: true, detail: '' };
    const back = await reset(ctx, 'step');
    ctx.ok(title, zoomed && l.ok && back, `ingrandito ${zoomed}, ritorno ${back}${step.tip ? `, ${l.detail}` : ''}`);
  },
  // un rettangolo disegnato con il mouse, e l'etichetta
  async box(ctx, step) {
    const title = `${step.title}: un rettangolo${step.tip ? ' e l\'etichetta' : ''}`;
    if (!(await ctx.call('mark', 'step', chartOf(step)))) return ctx.ok(title, false, 'grafico non trovato');
    const b = await ctx.call('place', 'step');
    const [from, to] = [step.from || [0.3, 0.2], step.to || [0.6, 0.8]];
    await ctx.page.drag([at(b, ...from), at(b, (from[0] + to[0]) / 2, (from[1] + to[1]) / 2), at(b, ...to)]);
    await ctx.sleep(500);
    const zoomed = (await ctx.call('state', 'step')).zoomed;
    const l = step.tip ? await label(ctx, 'step') : { ok: true, detail: '' };
    const back = await reset(ctx, 'step');
    ctx.ok(title, zoomed && l.ok && back, `ingrandito ${zoomed}, ritorno ${back}${step.tip ? `, ${l.detail}` : ''}`);
  },
  handle: (ctx, step) => dragLine(ctx, step),
  // uno slider di un passo: la sezione cambia, e il grafico ingrandito prima (chart) resta ingrandito
  async slider(ctx, step) {
    const keep = step.chart !== undefined;
    const title = `${step.title}: lo slider${keep ? ', e lo zoom resta' : ''}`;
    let zoomed = null;
    if (keep) {
      if (!(await ctx.call('mark', 'step', { section: step.section, k: step.chart }))) return ctx.ok(title, false, 'grafico non trovato');
      zoomed = await wheelZoom(ctx, 'step', step.at);
    }
    const before = await ctx.call('words', step.section);
    const moved = await ctx.call('nudge', step.section, step.k || 0);
    if (!moved) return ctx.ok(title, false, 'slider non trovato');
    await ctx.sleep(150);
    await ctx.call('idle');
    await ctx.sleep(400);
    const after = await ctx.call('words', step.section);
    const still = keep ? (await ctx.call('state', 'step')).zoomed : true;
    ctx.ok(title, after !== before && (!keep || (zoomed && still)), `${moved.from} -> ${moved.to}; ${diff(before, after)}${keep ? `; ingrandito prima ${zoomed}, dopo ${still}` : ''}`);
    if (keep && still) await reset(ctx, 'step');
  },
  // un pulsante di scelta (un livello, un caso): la sezione cambia
  async choice(ctx, step) {
    const before = await ctx.call('words', step.section);
    const pressed = await ctx.call('press', step.section, step.button);
    await ctx.sleep(150);
    await ctx.call('idle');
    await ctx.sleep(300);
    const after = await ctx.call('words', step.section);
    ctx.ok(`${step.title}: la scelta`, !!pressed && after !== before, pressed ? diff(before, after) : 'pulsante non trovato');
  },
};

// ---- i canvas che disegnano da se', ospitati dal kit (kitSource): mouse e dita

const SOURCES = {
  // un'animazione: continua anche ingrandita
  animation: {
    async desktop(ctx, s) {
      if (!(await markSource(ctx, s))) return ctx.ok(`${s.title}: il canvas`, false, 'non trovato');
      const st = await ctx.call('state', 'source');
      ctx.ok(`${s.title}: nel riquadro del kit, con i suoi pulsanti`, st.tools, `${Math.round(st.w)}x${Math.round(st.h)}`);
      ctx.ok(`${s.title}: Ctrl + rotella ingrandisce`, await wheelZoom(ctx, 'source', [0.4, 0.45]));
      if (s.tip) {
        const l = await label(ctx, 'source');
        ctx.ok(`${s.title}: l'etichetta sotto il mouse, ingrandito`, l.ok, l.detail);
      }
      const before = await ctx.call('words', s.section);
      const pressed = await ctx.call('press', s.section, PLAY);
      await ctx.sleep(2500);
      const after = await ctx.call('words', s.section);
      const still = (await ctx.call('state', 'source')).zoomed;
      ctx.ok(`${s.title}: l'animazione va avanti, ingrandita`, after !== before && still, `${pressed ? '' : 'nessun pulsante Play; '}${diff(before, after)}; ingrandito ${still}`);
      await hintAndReset(ctx, s.title, 'source');
      if (s.box) {
        const b = await ctx.call('place', 'source');
        await ctx.page.drag([at(b, 0.3, 0.3), at(b, 0.45, 0.45), at(b, 0.55, 0.55)]);
        await ctx.sleep(400);
        ctx.ok(`${s.title}: un rettangolo ingrandisce`, (await ctx.call('state', 'source')).zoomed);
        await reset(ctx, 'source');
      }
    },
    async touch(ctx, s) {
      if (!(await markSource(ctx, s))) return ctx.ok(`${s.title}: il canvas`, false, 'non trovato');
      if (s.tip) {
        const l = await label(ctx, 'source', { touch: true });
        ctx.ok(`${s.title}: un tocco mostra l'etichetta`, l.ok, l.detail);
      }
      const p = await pinch(ctx, 'source', [0.4, 0.45]);
      ctx.ok(`${s.title}: due dita ingrandiscono, la pagina resta ferma`, p.ok, p.detail);
    },
  },

  // dati da trascinare (i punti hanno il cursore grab): il trascinamento resta loro anche ingrandito
  drag: {
    async desktop(ctx, s) {
      if (!(await markSource(ctx, s))) return ctx.ok(`${s.title}: il canvas`, false, 'non trovato');
      const st = await ctx.call('state', 'source');
      ctx.ok(`${s.title}: nel riquadro del kit, con i suoi pulsanti`, st.tools, `${Math.round(st.w)}x${Math.round(st.h)}`);
      ctx.ok(`${s.title}: Ctrl + rotella ingrandisce`, await wheelZoom(ctx, 'source', s.zoomAt));
      await ctx.call('place', 'source');
      const p = await ctx.call('findCursor', 'source', ['grab'], { rows: s.rows, cols: [] });
      if (!p) ctx.ok(`${s.title}: un dato da prendere, ingrandito`, false, 'nessuno');
      else {
        const before = await ctx.call('words', s.section);
        await ctx.page.drag([[p.x, p.y], [p.x + 20, p.y], [p.x + 40, p.y]]);
        await ctx.sleep(400);
        const after = await ctx.call('words', s.section);
        const still = (await ctx.call('state', 'source')).zoomed;
        ctx.ok(`${s.title}: il mouse trascina un dato, la vista resta`, after !== before && still, `${diff(before, after)}; ingrandito ${still}`);
      }
      await hintAndReset(ctx, s.title, 'source');
    },
    async touch(ctx, s) {
      if (!(await markSource(ctx, s))) return ctx.ok(`${s.title}: il canvas`, false, 'non trovato');
      const b = await ctx.call('place', 'source');
      const p = await ctx.call('findCursor', 'source', ['grab'], { rows: s.rows, cols: [] });
      if (!p) ctx.ok(`${s.title}: un dato da prendere con un dito`, false, 'nessuno');
      else {
        const before = await ctx.call('words', s.section);
        await ctx.page.drag([[p.x, p.y], [p.x + 15, p.y], [p.x + 30, p.y]], { touch: true });
        await ctx.sleep(400);
        const after = await ctx.call('words', s.section);
        const st = await ctx.call('state', 'source');
        ctx.ok(`${s.title}: un dito trascina un dato, la pagina resta ferma`, after !== before && !st.zoomed && Math.abs(st.y - b.y) < 1, `${diff(before, after)}; il grafico da ${px(b.y)} a ${px(st.y)} dall'alto`);
      }
      const q = await pinch(ctx, 'source', s.zoomAt);
      ctx.ok(`${s.title}: due dita ingrandiscono, la pagina resta ferma`, q.ok, q.detail);
    },
  },

  // l'editor della prior (HW7): le frecce muovono le maniglie, Maiusc + frecce la vista
  editor: {
    async desktop(ctx, s) {
      if (!(await markSource(ctx, s))) return ctx.ok(`${s.title}: il canvas`, false, 'non trovato');
      const st = await ctx.call('state', 'source');
      ctx.ok(`${s.title}: nel riquadro del kit, con i suoi pulsanti`, st.tools, `${Math.round(st.w)}x${Math.round(st.h)}`);
      ctx.ok(`${s.title}: Ctrl + rotella ingrandisce`, await wheelZoom(ctx, 'source', [0.5, 0.5]));
      await ctx.call('focus', 'source');
      const a = await ctx.call('state', 'source');
      await ctx.page.press('ArrowRight', { shift: true });
      await ctx.sleep(300);
      const b = await ctx.call('state', 'source');
      ctx.ok(`${s.title}: Maiusc + freccia sposta la vista, non le maniglie`, b.zoomed && b.hash !== a.hash && b.value === a.value, b.value);
      await ctx.page.press('ArrowUp');
      await ctx.sleep(300);
      const c = await ctx.call('state', 'source');
      ctx.ok(`${s.title}: una freccia da sola sposta la maniglia`, c.value !== b.value, `${b.value} -> ${c.value}`);
      await ctx.call('place', 'source');
      const p = await ctx.call('findCursor', 'source', ['ns-resize'], { rows: [0.5, 0.35, 0.65], cols: [] });
      if (!p) ctx.ok(`${s.title}: una maniglia da prendere, ingrandito`, false, 'nessuna');
      else {
        await ctx.page.drag([[p.x, p.y], [p.x, p.y - 20], [p.x, p.y - 40]]);
        await ctx.sleep(400);
        const d = await ctx.call('state', 'source');
        ctx.ok(`${s.title}: il mouse trascina una maniglia, la vista resta`, d.value !== c.value && d.zoomed, `${c.value} -> ${d.value}`);
      }
      await hintAndReset(ctx, s.title, 'source');
    },
    async touch(ctx, s) {
      if (!(await markSource(ctx, s))) return ctx.ok(`${s.title}: il canvas`, false, 'non trovato');
      const b = await ctx.call('place', 'source');
      const a = await ctx.call('state', 'source');
      const p = await ctx.call('findCursor', 'source', ['ns-resize'], { rows: [0.5, 0.35, 0.65], cols: [] });
      if (!p) ctx.ok(`${s.title}: una maniglia da prendere con un dito`, false, 'nessuna');
      else {
        await ctx.page.drag([[p.x, p.y], [p.x, p.y - 15], [p.x, p.y - 30]], { touch: true });
        await ctx.sleep(400);
        const st = await ctx.call('state', 'source');
        ctx.ok(`${s.title}: un dito trascina una maniglia, la pagina resta ferma`, st.value !== a.value && Math.abs(st.y - b.y) < 1, `${a.value} -> ${st.value}; il grafico da ${px(b.y)} a ${px(st.y)} dall'alto`);
      }
      const q = await pinch(ctx, 'source', [0.5, 0.5]);
      ctx.ok(`${s.title}: due dita ingrandiscono, la pagina resta ferma`, q.ok, q.detail);
    },
  },
};

// ---- le prove di ogni pagina

/** Con il mouse: i grafici disegnati, lo zoom su ognuno, le prove della scheda, le animazioni, le verifiche. */
export async function desktopChecks(ctx) {
  const { hw, call, ok } = ctx;
  const titles = await call('charts');
  const blank = [];
  for (let i = 0; i < titles.length; i++) if (!(await call('visit', i)).drawn) blank.push(short(titles[i]));
  ok('i grafici ci sono tutti e sono disegnati', titles.length === hw.charts && !blank.length, `${titles.length}, attesi ${hw.charts}${blank.length ? `; vuoti: ${blank.join(', ')}` : ''}`);

  let zoomable = 0;
  const wrong = [];
  for (let i = 0; i < titles.length; i++) {
    const s = await call('sweep', i);
    if (!s.zoomable) continue;
    zoomable++;
    const why = [!s.zoomed && 'non si ingrandisce', !s.hint && 'niente suggerimento', !s.back && 'non torna intero'].filter(Boolean);
    if (why.length) wrong.push(`${short(titles[i])}: ${why.join(', ')}`);
  }
  const expected = hw.zoomable ?? hw.charts;
  ok('lo zoom di ogni grafico: Ctrl + rotella, il suggerimento, il ritorno', zoomable === expected && !wrong.length, `${zoomable} con lo zoom, attesi ${expected}${wrong.length ? `; ${wrong.join('; ')}` : ''}`);

  for (const step of hw.steps || []) await STEPS[step.type](ctx, step);
  for (const source of hw.sources || []) await SOURCES[source.kind].desktop(ctx, source);

  // per ultime le animazioni del kit, che lasciano i grafici a meta'
  const players = await call('players');
  const stuck = players.filter((p) => !p.moved).map((p) => p.from);
  ok('le animazioni partono', players.length === (hw.players || 0) && !stuck.length, `${players.length}, attese ${hw.players || 0}${stuck.length ? `; ferme: ${stuck.join(', ')}` : ''}`);

  if (hw.checks) {
    const c = await call('checks', ctx.sel.check);
    const sum = c.sums[0];
    ok('le verifiche passano tutte', !c.bad.length && !!sum && c.sums.every((s) => s.ok === s.total) && sum.total === hw.checks,
      `${sum ? `${sum.ok} su ${sum.total}` : 'nessun riepilogo'}, attese ${hw.checks}${c.bad.length ? `; fallite: ${c.bad.join(' | ')}` : ''}`);
  }
}

/**
 * Con le dita, su un telefono: etichetta, pizzico e pulsante sul primo grafico del kit (i canvas che
 * disegnano da se' hanno le loro prove), le linee, i canvas.
 */
export async function touchChecks(ctx) {
  const { hw, call, ok } = ctx;
  const titles = await call('charts');
  ok('i grafici ci sono tutti', titles.length === hw.charts, `${titles.length}, attesi ${hw.charts}`);
  let first = -1;
  for (let i = 0; i < titles.length && first < 0; i++) {
    const v = await call('visit', i);
    if (v.zoomable && !v.source) first = i;
  }
  if (first >= 0) {
    const title = short(titles[first]);
    await call('mark', 'chart', { selector: `[data-chart="${first}"]` });
    const l = await label(ctx, 'chart', { touch: true });
    ok(`${title}: un tocco mostra l'etichetta`, l.ok, l.detail);
    const p = await pinch(ctx, 'chart');
    ok(`${title}: due dita ingrandiscono, la pagina resta ferma`, p.ok, p.detail);
    ok(`${title}: un tocco sul pulsante torna al grafico intero`, await reset(ctx, 'chart', { touch: true }));
  }
  for (const step of (hw.steps || []).filter((s) => s.type === 'handle')) await dragLine(ctx, step, { touch: true });
  for (const source of hw.sources || []) await SOURCES[source.kind].touch(ctx, source);
}
