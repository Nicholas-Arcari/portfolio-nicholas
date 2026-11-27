// build/charts/agent.mjs
// Le funzioni che la prova dei grafici esegue dentro la pagina: dopo il
// caricamento il driver valuta agent() e la mette in window.__charts.
// Si appoggiano solo a quello che il kit mette nel DOM, uguale nel sito e
// negli zip: i canvas in .kit-plot (quello aria-hidden e' la
// sovrapposizione), .kit-tools con .is-zoomed e i suoi tre pulsanti (+, -,
// tutto il grafico), .kit-hint, .chart-tip, .kit-player con .kit-play e
// .kit-step, e il cursore che il kit, o il canvas stesso, mette sopra una
// cosa da trascinare. Gli elementi che una prova segue hanno un nome in
// data-check; i grafici della pagina un numero in data-chart.
// agent() passa alla pagina come sorgente: non usa niente fuori di se'.

export function agent() {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const frames = (n) => new Promise((resolve) => {
    const next = (k) => (k ? requestAnimationFrame(() => next(k - 1)) : resolve());
    next(n);
  });
  // test() finche' da' qualcosa, o finche' il tempo finisce
  const until = async (test, ms) => {
    const end = Date.now() + ms;
    for (;;) {
      const value = test();
      if (value || Date.now() > end) return value;
      await sleep(25);
    }
  };
  const named = (name) => document.querySelector(`[data-check="${name}"]`);
  const box = (el) => {
    const q = el.getBoundingClientRect();
    return { x: q.left, y: q.top, w: q.width, h: q.height };
  };
  const center = (el) => el.scrollIntoView({ block: 'center', behavior: 'instant' });
  const stage = (c) => c.closest('.kit-stage');
  const tools = (c) => {
    const t = stage(c) && stage(c).querySelector('.kit-tools');
    return t && !t.hidden ? t : null;
  };
  const zoomed = (c) => {
    const t = tools(c);
    return !!t && t.classList.contains('is-zoomed');
  };
  const tip = (c) => {
    const t = c.parentElement.querySelector('.chart-tip');
    return t && !t.hidden && t.textContent.trim() ? t.textContent.trim().slice(0, 80) : null;
  };
  const hint = (c) => {
    const h = stage(c) && stage(c).querySelector('.kit-hint');
    return !!h && !h.hidden;
  };
  // disegnato: non tutto di un colore (basta un pixel ogni 97 per dirlo)
  const drawn = (c) => {
    if (!c.width || !c.height) return false;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let varied = 0;
    for (let i = 0; i < d.length; i += 4 * 97) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2] || d[i + 3] !== d[3]) varied++;
    return varied >= 3;
  };
  // il disegno di un grafico, sovrapposizione compresa, in un numero: cambia quando cambia il disegno
  const hash = (c) => {
    let h = 0;
    const over = c.nextElementSibling && c.nextElementSibling.tagName === 'CANVAS' ? c.nextElementSibling : null;
    for (const cv of [c, over]) {
      if (!cv || !cv.width || !cv.height) continue;
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      for (let i = 0; i < d.length; i += 4 * 37) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7 + d[i + 3] * 11) % 1000000007;
    }
    return h;
  };
  // eventi che vede solo la pagina: niente scorrimento, niente selezione, nessun effetto fuori del canvas
  const wheelOn = (c, x, y, ctrl) => c.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: x, clientY: y, deltaY: ctrl ? -300 : 120, deltaMode: 0, ctrlKey: ctrl }));
  const pointerOn = (c, type, x, y) => c.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'mouse', pointerId: 1, isPrimary: true }));
  // la parte di pagina che un titolo apre: fino al prossimo titolo dello stesso livello o piu' alto, oppure
  // il riquadro "Try it" in cui sta; un id che non e' un titolo e' la sua parte
  const section = (id) => {
    const h = document.getElementById(id);
    if (!h) return [];
    const tryBox = h.closest('.hw4-try, .try');
    if (tryBox) return [tryBox];
    if (!/^H[1-6]$/.test(h.tagName)) return [h];
    const level = Number(h.tagName[1]);
    const parts = [];
    for (let el = h.nextElementSibling; el && !(/^H[1-6]$/.test(el.tagName) && Number(el.tagName[1]) <= level); el = el.nextElementSibling) parts.push(el);
    return parts;
  };
  const find = (id, selector) => section(id).flatMap((e) => (e.matches(selector) ? [e] : []).concat([...e.querySelectorAll(selector)]));
  const CHARTS = '.kit-plot canvas:not([aria-hidden])';

  return {
    // l'ancora c'e' e nessun calcolo e' in corso
    ready(anchors, pending) {
      return anchors.some((a) => document.getElementById(a)) && !document.querySelector(pending) && !document.querySelector('.kit-busy:not([hidden])');
    },
    idle: () => until(() => !document.querySelector('.kit-busy:not([hidden])'), 30000).then(Boolean),
    overflow: () => document.documentElement.scrollWidth - document.documentElement.clientWidth,

    // i grafici della pagina, numerati: i loro titoli
    charts() {
      const list = [...document.querySelectorAll(CHARTS)];
      list.forEach((c, i) => {
        c.dataset.chart = String(i);
      });
      return list.map((c) => (c.getAttribute('aria-label') || c.className).slice(0, 60));
    },
    // il grafico i al centro dello schermo: disegnato? con lo zoom?
    // (le sezioni lontane hanno content-visibility: auto, e si disegnano solo vicino allo schermo)
    async visit(i) {
      const c = document.querySelector(`[data-chart="${i}"]`);
      center(c);
      await frames(2);
      return { drawn: !!(await until(() => drawn(c), 3000)), zoomable: !!tools(c), source: !!stage(c) && stage(c).classList.contains('kit-source') };
    },
    // lo zoom del grafico i con eventi della pagina: Ctrl + rotella ingrandisce (nel primo punto del
    // disegno, fra alcuni), la rotella da sola mostra il suggerimento, il terzo pulsante torna indietro
    async sweep(i) {
      const c = document.querySelector(`[data-chart="${i}"]`);
      if (!tools(c)) return { zoomable: false };
      center(c);
      await frames(2);
      const q = c.getBoundingClientRect();
      let zoomedIn = false;
      for (const [fx, fy] of [[0.5, 0.5], [0.5, 0.3], [0.4, 0.65], [0.6, 0.2], [0.5, 0.85]]) {
        wheelOn(c, q.left + q.width * fx, q.top + q.height * fy, true);
        zoomedIn = await until(() => zoomed(c), 500);
        if (zoomedIn) break;
      }
      wheelOn(c, q.left + q.width * 0.5, q.top + q.height * 0.5, false);
      const hinted = await until(() => hint(c), 800);
      const reset = tools(c) && tools(c).querySelectorAll('button')[2];
      if (reset) reset.click();
      const back = await until(() => !zoomed(c), 800);
      return { zoomable: true, zoomed: !!zoomedIn, hint: !!hinted, back: !!back };
    },
    // le verifiche: quelle fallite, e i riepiloghi, che cominciano con "n of m", "n verifiche su m",
    // "n checks out of m"... (non "137,425 jumps of 16 kangaroos")
    checks(selector) {
      const all = [...document.querySelectorAll(selector)];
      const text = (e) => e.textContent.replace(/\s+/g, ' ').trim();
      const summary = /^(\d+)\s+(?:of|(?:checks|verifiche|controlli)(?:\s+superate)?\s+(?:su|out of))\s+(\d+)/i;
      const sums = all.map((e) => text(e).match(summary)).filter(Boolean).map((m) => ({ ok: Number(m[1]), total: Number(m[2]) }));
      return { bad: all.filter((e) => e.classList.contains('is-bad')).map((e) => text(e).slice(0, 100)), sums };
    },
    // tutte le animazioni del kit: partono e avanzano, poi si fermano. Il passo si guarda ogni 50 ms: una
    // animazione corta, che parte dall'inizio e arriva in fondo prima della fine della prova, avanza lo stesso
    async players() {
      const bars = [...document.querySelectorAll('.kit-player')].filter((p) => !p.hidden && p.querySelector('.kit-play'));
      const step = (p) => (p.querySelector('.kit-step') || {}).textContent || '';
      const before = bars.map(step);
      const seen = bars.map(() => new Set());
      bars.forEach((p) => p.querySelector('.kit-play').click());
      for (const end = Date.now() + 1500; Date.now() < end;) {
        bars.forEach((p, i) => seen[i].add(step(p)));
        await sleep(50);
      }
      bars.forEach((p) => {
        const play = p.querySelector('.kit-play');
        if (play.getAttribute('aria-pressed') === 'true') play.click();
      });
      return bars.map((p, i) => ({ moved: [...seen[i]].some((s) => s !== before[i]), from: before[i], steps: seen[i].size }));
    },

    // dare un nome al k-esimo elemento di una sezione (o della pagina, senza sezione), eventualmente fra quelli
    // con un titolo (aria-label) che corrisponde a label; lo porta al centro dello schermo
    mark(name, { section: id = null, selector = CHARTS, k = 0, label = null } = {}) {
      document.querySelectorAll(`[data-check="${name}"]`).forEach((e) => e.removeAttribute('data-check'));
      let list = id ? find(id, selector) : [...document.querySelectorAll(selector)];
      if (label) list = list.filter((e) => new RegExp(label, 'i').test(e.getAttribute('aria-label') || ''));
      const el = list[k];
      if (!el) return null;
      el.dataset.check = name;
      center(el);
      return box(el);
    },
    async place(name) {
      center(named(name));
      await frames(2);
      return box(named(name));
    },
    state(name) {
      const c = named(name);
      return { ...box(c), zoomed: zoomed(c), tools: !!tools(c), tip: tip(c), hint: hint(c), hash: hash(c), value: c.getAttribute('aria-valuetext') || '' };
    },
    // dove sono i pulsanti dello zoom di un grafico
    buttons(name) {
      const t = tools(named(name));
      return t ? [...t.querySelectorAll('button')].map((b) => ({ ...box(b), disabled: b.disabled })) : [];
    },
    // le parole di una sezione, senza quello che cambia da se' (l'etichetta sotto il puntatore, i
    // suggerimenti, i lettori delle animazioni) e senza i pulsanti (Play che diventa Pause non e' un
    // risultato)
    words(id) {
      return section(id).map((e) => {
        const copy = e.cloneNode(true);
        copy.querySelectorAll('.chart-tip, .kit-hint, .kit-busy, .kit-player, .kit-tools, button').forEach((x) => x.remove());
        return copy.textContent;
      }).join(' ').replace(/\s+/g, ' ').trim();
    },
    // un punto del grafico dove il cursore diventa uno di cursors (una linea o un punto da trascinare),
    // cercato con movimenti del mouse che vede solo la pagina, lungo le righe rows e le colonne cols
    // (frazioni dell'altezza e della larghezza); poi il mouse esce. Il punto e' il centro della zona con
    // quel cursore, in orizzontale e in verticale: sul bordo basterebbe un decimo di pixel per mancarla
    findCursor(name, cursors, { rows = [0.5, 0.3, 0.7], cols = [0.5, 0.3, 0.7] } = {}) {
      const c = named(name);
      const q = c.getBoundingClientRect();
      const over = (x, y) => {
        pointerOn(c, 'pointermove', q.left + x, q.top + y);
        return cursors.includes(c.style.cursor) ? c.style.cursor : null;
      };
      // da (x, y) lungo un asse, finche' il cursore resta quello: il centro del tratto
      const middle = (x, y, dx, dy) => {
        let [a, b] = [0, 0];
        while (a < 400 && over(x - (a + 1) * dx, y - (a + 1) * dy)) a++;
        while (b < 400 && over(x + (b + 1) * dx, y + (b + 1) * dy)) b++;
        return [x + ((b - a) / 2) * dx, y + ((b - a) / 2) * dy];
      };
      const first = () => {
        for (const fy of rows) for (let x = 2; x < q.width - 2; x += 2) if (over(x, q.height * fy)) return [x, q.height * fy, 'row'];
        for (const fx of cols) for (let y = 2; y < q.height - 2; y += 2) if (over(q.width * fx, y)) return [q.width * fx, y, 'col'];
        return null;
      };
      let found = first();
      if (found) {
        let [x, y] = found;
        if (found[2] === 'row') {
          [x, y] = middle(x, y, 1, 0);
          [x, y] = middle(x, y, 0, 1);
        } else {
          [x, y] = middle(x, y, 0, 1);
          [x, y] = middle(x, y, 1, 0);
        }
        found = { x: q.left + x, y: q.top + y, cursor: over(x, y) };
      }
      pointerOn(c, 'pointerleave', q.left - 5, q.top - 5);
      return found && found.cursor ? found : null;
    },
    // un punto del grafico dove compare l'etichetta sotto il puntatore; poi il mouse esce
    async findTip(name) {
      const c = named(name);
      const q = c.getBoundingClientRect();
      let found = null;
      for (const fy of [0.5, 0.4, 0.6, 0.3, 0.7]) {
        for (let fx = 0.2; fx <= 0.8 && !found; fx += 0.05) {
          const [x, y] = [q.left + q.width * fx, q.top + q.height * fy];
          pointerOn(c, 'pointermove', x, y);
          if (!tip(c)) await frames(1);
          if (tip(c)) found = { x, y };
        }
        if (found) break;
      }
      pointerOn(c, 'pointerleave', q.left - 5, q.top - 5);
      await frames(1);
      return found;
    },
    focus(name) {
      named(name).focus();
      return document.activeElement === named(name);
    },
    // uno slider di una sezione spostato di un passo verso il centro della sua corsa
    nudge(id, k = 0) {
      const s = find(id, 'input[type=range]').filter((x) => !x.classList.contains('kit-position'))[k];
      if (!s) return null;
      center(s);
      const [min, max, step] = [Number(s.min || 0), Number(s.max || 100), Number(s.step) || 1];
      const now = Number(s.value);
      const next = now < (min + max) / 2 ? Math.min(max, now + step) : Math.max(min, now - step);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(s, String(next));
      s.dispatchEvent(new Event('input', { bubbles: true }));
      return { from: now, to: Number(s.value) };
    },
    // il pulsante di una sezione con le parole che corrispondono a pattern
    press(id, pattern) {
      const re = new RegExp(pattern, 'i');
      const b = find(id, 'button').find((x) => x.offsetParent !== null && re.test(x.textContent.trim()));
      if (b) b.click();
      return b ? b.textContent.trim() : null;
    },
  };
}
