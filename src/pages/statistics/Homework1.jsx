// src/pages/statistics/Homework1.jsx
// Homework #1 di Statistics: dalla chiave privata alla chiave pubblica con la
// moltiplicazione scalare su curva ellittica, come in Ethereum, su curve
// giocattolo. Matematica, statistiche e disegni stanno in hw1/homework1.js,
// JavaScript puro senza React: e' anche il file che si scarica dalla sidebar.
// Qui c'e' solo la pagina: controlli, tabelle e testi nelle due lingue.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/languageContext';
import { useTheme } from '../../contexts/themeContext';
import HomeworkShell from './HomeworkShell';
import * as hw from './hw1/homework1';
import homeworkFileUrl from './hw1/homework1.js?url';
import { HW1_TEXTS } from './hw1/texts';

const K_MAX = 999;
const LIST_LIMIT = 64;
const VIZ_PRIMES = [17, 97];

const PALETTES = {
  light: hw.DEFAULT_PALETTE,
  dark: {
    background: '#111111',
    text: '#d6d6d6',
    muted: '#4a4a4a',
    grid: '#262626',
    subgroup: '#7986cb',
    operandP: '#ff6b81',
    operandQ: '#f0a500',
    line: '#4fd1b5',
    third: '#9ccc65',
    result: '#ff6b81',
  },
};

const fmt = hw.formatPoint;
const pointKey = (P) => `${P.x},${P.y}`;
const parsePoint = (key) => {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
};
const defaultKey = (p) => pointKey(hw.defaultBasePoint(hw.makeCurve(p)));
const fixed = (v, digits = 3) => (Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v).toFixed(digits);

const choose = (n, k) => {
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c;
};

const Section = ({ title, children }) => (
  <section className="hw1-section">
    <h3>{title}</h3>
    {children}
  </section>
);

// Un grafico a barre su canvas, ridisegnato quando cambia la larghezza
const BarChart = ({ title, data, palette }) => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    let width = -1;
    const draw = () => {
      if (canvas.clientWidth === width) return;
      width = canvas.clientWidth;
      hw.drawBarChart(canvas, data, palette);
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [data, palette]);
  return (
    <figure className="hw1-figure">
      <canvas ref={ref} className="hw1-canvas" role="img" aria-label={title} />
      <figcaption>{title}</figcaption>
    </figure>
  );
};

// L'animazione al rallentatore: il disegno e' di homework1.js, qui i controlli
const Animation = ({ curve, G, k, Q, text, palette }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const speedRef = useRef(1);
  const paletteRef = useRef(palette);
  const [method, setMethod] = useState('double-and-add');
  const [speed, setSpeed] = useState(1);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const anim = hw.createAnimation(canvas, {
      curve, G, k, method, speed: speedRef.current, palette: paletteRef.current, onUpdate: setStatus,
    });
    animRef.current = anim;
    let width = canvas.clientWidth;
    const observer = new ResizeObserver(() => {
      if (canvas.clientWidth === width) return;
      width = canvas.clientWidth;
      anim.redraw();
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      anim.destroy();
      animRef.current = null;
    };
  }, [curve, G, k, method]);

  useEffect(() => {
    speedRef.current = speed;
    if (animRef.current) animRef.current.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    paletteRef.current = palette;
    if (animRef.current) animRef.current.setPalette(palette);
  }, [palette]);

  const bits = k.toString(2);
  const currentBit = method === 'double-and-add' && status && status.op ? status.op.bitIndex : null;
  let caption = '';
  if (status && status.done) caption = text.done(k, fmt(Q));
  else if (status && status.op) {
    caption = `${status.opIndex + 1}/${status.opCount} · ${text.phases[status.phase]}: ${text.caption(status.op, status.phase, fmt)}`;
  }

  return (
    <>
      <div className="hw1-controls">
        <label>
          {text.methodLabel}
          <select value={method} onChange={(e) => setMethod(e.target.value === 'repeated' ? 'repeated' : 'double-and-add')}>
            <option value="double-and-add">{text.methodDouble}</option>
            <option value="repeated">{text.methodRepeated}</option>
          </select>
        </label>
        <label>
          {text.speedLabel}
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            {[0.25, 0.5, 1, 2, 4].map((s) => <option key={s} value={s}>{s}×</option>)}
          </select>
        </label>
        <span className="hw1-buttons">
          <button
            type="button"
            className="button small"
            onClick={() => (status && status.playing ? animRef.current.pause() : animRef.current.play())}
          >
            {status && status.playing ? text.pause : text.play}
          </button>
          <button type="button" className="button alt small" onClick={() => animRef.current.step()}>{text.step}</button>
          <button type="button" className="button alt small" onClick={() => animRef.current.reset()}>{text.reset}</button>
        </span>
      </div>
      {method === 'double-and-add' && (
        <p className="hw1-bits" aria-label={`k = ${bits}`}>
          {bits.split('').map((b, i) => (
            <span key={i} className={i === currentBit ? 'hw1-bit is-current' : 'hw1-bit'}>{b}</span>
          ))}
        </p>
      )}
      <canvas ref={canvasRef} className="hw1-canvas hw1-anim" role="img" aria-label={text.guruTitle} />
      <p className="hw1-caption" aria-live="polite">{caption}</p>
    </>
  );
};

const Homework1 = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const text = HW1_TEXTS[language] || HW1_TEXTS.en;
  const palette = PALETTES[theme === 'dark' ? 'dark' : 'light'];

  // --- 1-5: curva, punto base e chiave privata scelti dall'utente ---
  const [p, setP] = useState(17);
  const [gKey, setGKey] = useState(defaultKey(17));
  const [kInput, setKInput] = useState('6');
  const k = Math.min(K_MAX, Math.max(1, Number.parseInt(kInput, 10) || 1));

  const curve = useMemo(() => hw.makeCurve(p), [p]);
  const points = useMemo(() => hw.curvePoints(curve), [curve]);
  const G = useMemo(() => parsePoint(gKey), [gKey]);
  const pointOptions = useMemo(
    () => points.map((P) => ({ key: pointKey(P), label: `${fmt(P)} - ${text.orderWord} ${hw.pointOrder(P, curve)}` })),
    [points, curve, text.orderWord],
  );
  const n = useMemo(() => hw.pointOrder(G, curve), [G, curve]);
  const subgroup = useMemo(
    () => new Map(hw.multiples(Math.max(1, n - 1), G, curve).map((s) => [pointKey(s.point), s.i])),
    [n, G, curve],
  );
  const repeated = useMemo(() => (k <= LIST_LIMIT ? hw.multiples(k, G, curve) : null), [k, G, curve]);
  const daa = useMemo(() => hw.doubleAndAdd(k, G, curve), [k, G, curve]);
  const Q = daa.result;
  const brute = useMemo(() => (Q ? hw.bruteForceLog(Q, G, curve) : null), [Q, G, curve]);

  // --- 6: esplorazione statistica, con curva e punto base suoi ---
  const [statsP, setStatsP] = useState(991);
  const [statsGKey, setStatsGKey] = useState(defaultKey(991));
  const statsCurve = useMemo(() => hw.makeCurve(statsP), [statsP]);
  const statsOptions = useMemo(() => {
    const all = hw.curvePoints(statsCurve);
    const first = parsePoint(defaultKey(statsP));
    const list = statsP === 17 ? all : [first, ...all.filter((P) => !hw.samePoint(P, first)).slice(0, 7)];
    return list.map((P) => ({
      key: pointKey(P),
      label: `${fmt(P)} - ${text.orderWord} ${hw.pointOrder(P, statsCurve)}${hw.samePoint(P, first) ? ` (${text.statsBaseDefault})` : ''}`,
    }));
  }, [statsCurve, statsP, text.orderWord, text.statsBaseDefault]);
  const statsG = useMemo(() => parsePoint(statsGKey), [statsGKey]);
  const stats = useMemo(() => hw.explore(statsCurve, statsG), [statsCurve, statsG]);
  const charts = useMemo(() => {
    const labels = Array.from({ length: stats.bins }, (_, j) => String(Math.ceil((j * stats.p) / stats.bins)));
    const { outputBits, measurements, distances } = stats.avalanche;
    return {
      histX: { values: stats.histX, expected: stats.expected, labels },
      histY: { values: stats.histY, expected: stats.expected, labels },
      bitsX: { values: stats.bitsX, expected: stats.bitsExpected, labels: stats.bitsX.map((_, i) => String(i)), max: 1 },
      avalanche: {
        values: distances,
        expected: distances.map((_, d) => (measurements * choose(outputBits, d)) / 2 ** outputBits),
        labels: distances.map((_, d) => String(d)),
      },
    };
  }, [stats]);

  const changeP = (value) => {
    const next = VIZ_PRIMES.includes(Number(value)) ? Number(value) : 17;
    setP(next);
    setGKey(defaultKey(next));
  };
  const changeStatsP = (value) => {
    const next = hw.EXPLORATION_PRIMES.includes(Number(value)) ? Number(value) : 991;
    setStatsP(next);
    setStatsGKey(defaultKey(next));
  };

  const sidebar = (
    <section>
      <ul className="divided">
        <li>
          <article className="box highlight">
            <header><h3>{text.downloadTitle}</h3></header>
            <p>{text.downloadText}</p>
            <a href={homeworkFileUrl} download="homework1.js" className="button icon solid fa-download">{text.downloadBtn}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <HomeworkShell slug="homework-1" sidebar={sidebar}>
      <Section title={text.taskTitle}>
        {text.task.map((para, i) => <p key={i}>{para}</p>)}
      </Section>

      <Section title={text.setupTitle}>
        <div className="hw1-controls">
          <label>
            {text.fieldLabel}
            <select value={p} onChange={(e) => changeP(e.target.value)}>
              {VIZ_PRIMES.map((q) => <option key={q} value={q}>p = {q}</option>)}
            </select>
          </label>
          <label>
            {text.baseLabel}
            <select value={gKey} onChange={(e) => setGKey(pointOptions.some((o) => o.key === e.target.value) ? e.target.value : gKey)}>
              {pointOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </label>
          <label>
            {text.keyLabel}
            <input
              type="number"
              min="1"
              max={K_MAX}
              step="1"
              inputMode="numeric"
              value={kInput}
              onChange={(e) => setKInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              onBlur={() => setKInput(String(k))}
            />
          </label>
        </div>
        <p>{text.curveSummary(p, points.length + 1, n)}</p>
        <h4>{text.pointsTitle}</h4>
        <p className="hw1-chips">
          {points.map((P) => {
            const key = pointKey(P);
            const classes = ['hw1-chip'];
            if (subgroup.has(key)) classes.push('in-subgroup');
            if (hw.samePoint(P, G)) classes.push('is-g');
            if (Q && hw.samePoint(P, Q)) classes.push('is-q');
            return <span key={key} className={classes.join(' ')}>{fmt(P)}</span>;
          })}
        </p>
        <p className="hw1-note">{text.pointsLegend}</p>
      </Section>

      <Section title={text.repeatedTitle}>
        <p>{text.repeatedIntro}</p>
        {repeated ? (
          <table className="hw1-table">
            <thead>
              <tr><th>{text.colMultiple}</th><th>{text.colPoint}</th><th>{text.colOperation}</th><th>{text.colLambda}</th></tr>
            </thead>
            <tbody>
              {repeated.map((s) => (
                <tr key={s.i}>
                  <td>{s.i}G</td>
                  <td>{fmt(s.point)}</td>
                  <td>{text.kinds[s.kind]}</td>
                  <td>{s.lambda === null ? '' : s.lambda}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="hw1-note">{text.tooMany(k)}</p>
        )}
      </Section>

      <Section title={text.fastTitle}>
        <p>{text.fastIntro(daa.bits, daa.steps.length)}</p>
        <table className="hw1-table">
          <thead>
            <tr><th>{text.colBit}</th><th>{text.colOperation}</th><th>R</th><th>{text.colPoint}</th></tr>
          </thead>
          <tbody>
            {daa.steps.map((s, i) => (
              <tr key={i}>
                <td>{s.bitIndex} ({s.bit})</td>
                <td>{text.ops[s.op]}</td>
                <td>{s.multiple}G</td>
                <td>{fmt(s.result)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="hw1-key">
          <span>{text.publicKeyLabel}</span>
          <strong>Q = {k}G = {fmt(Q)}</strong>
          {Q === null && <small>{text.infinityKey}</small>}
        </div>
      </Section>

      <Section title={text.bruteTitle}>
        <p>{brute ? text.brute(brute.tries, n, k % n) : text.infinityKey}</p>
      </Section>

      <Section title={text.guruTitle}>
        <p>{text.guruIntro}</p>
        <p className="hw1-note">{text.vizNote}</p>
        <Animation curve={curve} G={G} k={k} Q={Q} text={text} palette={palette} />
      </Section>

      <Section title={text.statsTitle}>
        <p>{text.statsIntro}</p>
        <div className="hw1-controls">
          <label>
            {text.fieldLabel}
            <select value={statsP} onChange={(e) => changeStatsP(e.target.value)}>
              {hw.EXPLORATION_PRIMES.map((q) => <option key={q} value={q}>p = {q}</option>)}
            </select>
          </label>
          <label>
            {text.baseLabel}
            <select value={statsGKey} onChange={(e) => setStatsGKey(statsOptions.some((o) => o.key === e.target.value) ? e.target.value : statsGKey)}>
              {statsOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <table className="hw1-table hw1-summary">
          <tbody>
            <tr><th>{text.rows.sample}</th><td>{stats.N} (n = {stats.n})</td></tr>
            <tr><th>{text.rows.distinctX}</th><td>{stats.distinctX} / {stats.p}</td></tr>
            <tr><th>{text.rows.chiX}</th><td>{text.chi(stats.chiX)}</td></tr>
            <tr><th>{text.rows.chiY}</th><td>{text.chi(stats.chiY)}</td></tr>
            <tr><th>{text.rows.corrKX}</th><td>{fixed(stats.corrKX)}</td></tr>
            <tr><th>{text.rows.corrKY}</th><td>{fixed(stats.corrKY)}</td></tr>
            <tr><th>{text.rows.serial}</th><td>{fixed(stats.corrSerialX)}</td></tr>
            <tr><th>{text.rows.mirror}</th><td>{text.pairs(stats.mirrorMatches, stats.mirrorPairs)}</td></tr>
            <tr><th>{text.rows.avalanche}</th><td>{text.avalancheValue(stats.avalanche)}</td></tr>
            <tr><th>{text.rows.homomorphism}</th><td>{text.trials(stats.homomorphism.holds, stats.homomorphism.trials)}</td></tr>
          </tbody>
        </table>
        <h4>{text.multiplicityTitle}</h4>
        <p>
          {text.multiplicity('x', stats.multiplicityX)}<br />
          {text.multiplicity('y', stats.multiplicityY)}
        </p>
        <div className="hw1-charts">
          <BarChart title={text.charts.histX} data={charts.histX} palette={palette} />
          <BarChart title={text.charts.histY} data={charts.histY} palette={palette} />
          <BarChart title={text.charts.bitsX} data={charts.bitsX} palette={palette} />
          <BarChart title={text.charts.avalanche} data={charts.avalanche} palette={palette} />
        </div>
      </Section>

      <Section title={text.discussionTitle}>
        {text.discussion.map((para, i) => <p key={i}>{para}</p>)}
      </Section>
    </HomeworkShell>
  );
};

export default Homework1;
