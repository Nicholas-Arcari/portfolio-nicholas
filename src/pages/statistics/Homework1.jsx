// src/pages/statistics/Homework1.jsx
// Homework #1 di Statistics: dalla chiave privata alla chiave pubblica con la
// moltiplicazione scalare su curva ellittica, come in Ethereum. La pagina
// segue la consegna punto per punto: TASK, OPTIONAL - GURU LEVEL,
// STATISTICAL EXPLORATION e discussione.
//
// Qui c'e' solo la pagina React. La matematica, le statistiche e i disegni
// stanno in hw1/homework1.js, i testi in hw1/texts.js e la logica di
// presentazione in hw1/view.js: sono gli stessi file da cui la build ricava
// il programma scaricabile (build/hw1-standalone.js), cosi' la pagina e il
// download non possono raccontare due cose diverse.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/languageContext';
import { useTheme } from '../../contexts/themeContext';
import HomeworkShell from './HomeworkShell';
import * as hw from './hw1/homework1';
import * as view from './hw1/view';
import { HW1_TEXTS, originalAssignment } from './hw1/texts';
import { exploreKey, useExplore } from './hw1/useExplore';

const DOWNLOADS = `${import.meta.env.BASE_URL}downloads/statistics/`;

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
    heatNegative: '#5b8def',
    heatZero: '#1e1e1e',
    heatPositive: '#ff6b81',
    heatNull: '#3a3a3a',
  },
};

const TASK = hw.TASK;
const TASK_CURVE = hw.explorationCurve(TASK.p);
const fmt = hw.formatPoint;
const pointKey = (P) => `${P.x},${P.y}`;
const HEADINGS = ['h3', 'h4', 'h5'];
const SPEEDS = [0.25, 0.5, 1, 2, 4];

// Un titolo di sezione: id per l'indice, tabIndex -1 perche' l'indice ci
// porti anche il focus della tastiera.
const Title = ({ id, level, children }) => {
  const Tag = HEADINGS[level];
  return <Tag id={id} tabIndex={-1} className="hw1-anchor">{children}</Tag>;
};

const Paras = ({ list }) => list.filter(Boolean).map((t, i) => <p key={i}>{t}</p>);

const Pending = ({ text }) => <p className="hw1-note hw1-pending" role="status">{text.ui.computing}</p>;

// Un grafico su canvas (barre o mappa di calore), ridisegnato quando cambia
// la larghezza: il disegno vero e' in homework1.js. La larghezza arriva dal
// ResizeObserver, che la misura dopo il layout: leggerla da clientWidth dopo
// che un altro grafico si e' appena ridimensionato costringerebbe il browser
// a ricalcolare l'intera pagina, una volta per grafico. L'altezza e' fissata
// subito, il disegno avviene qualche millisecondo per fotogramma.
const Figure = ({ title, draw, data, palette, wide = false }) => {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    let drawn = -1;
    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[entries.length - 1].contentRect.width);
      if (width <= 0 || width === drawn) return;
      drawn = width;
      canvas.style.height = `${hw.chartHeight(draw, data, width)}px`;
      view.scheduleFrameJob(() => {
        if (canvas.isConnected && drawn === width) draw(canvas, { ...data, width }, palette);
      });
    });
    observer.observe(canvas);
    return () => {
      drawn = -2;
      observer.disconnect();
    };
  }, [draw, data, palette]);
  return (
    <figure className={wide ? 'hw1-figure hw1-figure-wide' : 'hw1-figure'}>
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

  const g = text.guru;
  const bits = k.toString(2);
  const currentBit = method === 'double-and-add' && status && status.op ? status.op.bitIndex : null;
  let caption = '';
  if (status && status.done) caption = g.done(k, Q);
  else if (status && status.op) caption = `${g.progress(status.opIndex + 1, status.opCount, g.phases[status.phase])}. ${g.caption(status.op, status.phase)}`;

  return (
    <>
      <div className="hw1-controls">
        <label>
          {g.methodLabel}
          <select value={method} onChange={(e) => setMethod(e.target.value === 'repeated' ? 'repeated' : 'double-and-add')}>
            <option value="double-and-add">{g.methodDouble}</option>
            <option value="repeated">{g.methodRepeated}</option>
          </select>
        </label>
        <label>
          {g.speedLabel}
          <select value={speed} onChange={(e) => setSpeed(SPEEDS.includes(Number(e.target.value)) ? Number(e.target.value) : 1)}>
            {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
          </select>
        </label>
        <span className="hw1-buttons">
          <button
            type="button"
            className="button"
            onClick={() => (status && status.playing ? animRef.current.pause() : animRef.current.play())}
          >
            {status && status.playing ? g.pause : g.play}
          </button>
          <button type="button" className="button alt" onClick={() => animRef.current.step()}>{g.step}</button>
          <button type="button" className="button alt" onClick={() => animRef.current.reset()}>{g.reset}</button>
        </span>
      </div>
      {method === 'double-and-add' && (
        <p className="hw1-bits" aria-label={`${g.bitsLabel}: ${bits}`}>
          {bits.split('').map((b, i) => (
            <span key={i} className={i === currentBit ? 'hw1-bit is-current' : 'hw1-bit'}>{b}</span>
          ))}
        </p>
      )}
      <canvas ref={canvasRef} className="hw1-canvas hw1-anim" role="img" aria-label={text.sections.guru} />
      <p className="hw1-caption" aria-live="polite">{caption}</p>
    </>
  );
};

// Il risultato di un test (uniformita' o valanga): stato, numeri, motivi e lettura
const TestResult = ({ block }) => (
  <div className={`hw1-test is-${block.status}`}>
    <p className="hw1-test-head">
      <strong>{block.label}</strong> <span className={`hw1-badge is-${block.status}`}>{block.statusLabel}</span>
    </p>
    <p className="hw1-note">{block.help}</p>
    {block.line && <p>{block.line}</p>}
    {block.reasons.length > 0 && (
      <ul className="hw1-reasons">
        {block.reasons.map((r) => <li key={r}>{r}</li>)}
      </ul>
    )}
    {block.verdict && <p>{block.verdict}</p>}
  </div>
);

// Le sei analisi della consegna (a-f) su una curva e un punto base
const Analyses = ({ prefix, result, text, palette }) => {
  const s = result.stats || null;
  const T = text.stats;
  const F = text.fmt;
  const charts = useMemo(
    () => (s ? view.chartData(s, { kBits: T.correlation.kBits, flipBits: T.avalanche.kBits, decimal: F.decimal }) : null),
    [s, T, F],
  );
  const titles = view.ANALYSES.map((key) => (
    <Title key={key} id={`${prefix}-${key}`} level={2}>{text.sections[key]}</Title>
  ));
  if (!s) {
    // i titoli ci sono sempre, cosi' l'indice trova le sezioni anche durante il calcolo
    return view.ANALYSES.map((key, i) => (
      <React.Fragment key={key}>
        {titles[i]}
        {result.error ? <p className="hw1-note">{text.ui.error(result.error)}</p> : <Pending text={text} />}
      </React.Fragment>
    ));
  }
  const C = T.correlation;
  const A = T.avalanche;
  const hasUndefined = ['pearsonKX', 'pearsonKY', 'spearmanKX', 'spearmanKY'].some((key) => s.correlation[key] === null);
  return (
    <>
      {titles[0]}
      <p>{T.distribution.intro}</p>
      <div className="hw1-charts">
        <Figure title={T.distribution.chartX} draw={hw.drawBarChart} data={charts.histX} palette={palette} />
        <Figure title={T.distribution.chartY} draw={hw.drawBarChart} data={charts.histY} palette={palette} />
      </div>
      <Paras list={T.distribution.explain(s)} />

      {titles[1]}
      <p>{T.frequency.intro}</p>
      <div className="hw1-charts">
        <Figure title={T.frequency.chartX} draw={hw.drawBarChart} data={charts.freqX} palette={palette} />
        <Figure title={T.frequency.chartY} draw={hw.drawBarChart} data={charts.freqY} palette={palette} />
      </div>
      {s.p <= view.FREQUENCY_TABLE_MAX_P ? (
        <>
          <p className="hw1-table-title"><strong>{T.frequency.tableTitle}</strong> <span className="hw1-note">{T.frequency.tableNote(s.p)}</span></p>
          <div className="hw1-scroll">
            <table className="hw1-table hw1-compact">
              <thead>
                <tr><th>{T.frequency.colValue}</th><th>{T.frequency.colX}</th><th>{T.frequency.colY}</th></tr>
              </thead>
              <tbody>
                {view.frequencyRows(s).map((r) => (
                  <tr key={r.v} className={r.x || r.y ? '' : 'is-empty'}>
                    <td>{r.v}</td><td>{r.x}</td><td>{r.y}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="hw1-note">{T.frequency.bigNote(s.p)}</p>
      )}
      <p>
        <strong>{T.frequency.summaryTitle}</strong><br />
        {T.frequency.summary('x', s.multiplicityX)}<br />
        {T.frequency.summary('y', s.multiplicityY)}
      </p>
      <Paras list={T.frequency.explain(s)} />

      {titles[2]}
      <p>{T.bits.intro}</p>
      <div className="hw1-charts">
        <Figure title={T.bits.chartX} draw={hw.drawBarChart} data={charts.bitsX} palette={palette} />
        <Figure title={T.bits.chartY} draw={hw.drawBarChart} data={charts.bitsY} palette={palette} />
      </div>
      <Paras list={T.bits.explain(s)} />

      {titles[3]}
      <p>{T.uniformity.intro}</p>
      <div className="hw1-uniformity">
        {['x', 'y'].map((coord) => {
          const u = s.uniformity[coord];
          const why = T.uniformity.why(s, coord);
          return (
            <section key={coord} className="hw1-coord">
              <h6>{T.uniformity.coordTitle(coord)}</h6>
              <TestResult block={view.uniformityBlock(u.naive, u, s, T.uniformity.naiveLabel, T.uniformity)} />
              <TestResult block={view.uniformityBlock(u.distinct, u, s, T.uniformity.distinctLabel, T.uniformity)} />
              {why && <p>{why}</p>}
            </section>
          );
        })}
      </div>

      {titles[4]}
      <p>{C.intro}</p>
      <table className="hw1-table hw1-summary">
        <thead>
          <tr><th>{C.colMeasure}</th><th>{C.colValue}</th></tr>
        </thead>
        <tbody>
          {['pearsonKX', 'pearsonKY', 'spearmanKX', 'spearmanKY'].map((key) => (
            <tr key={key}><th>{C.rows[key]}</th><td>{F.num(s.correlation[key])}</td></tr>
          ))}
          <tr><th>{C.rows.mirror}</th><td>{C.pairsValue(s.correlation.mirror)}</td></tr>
          <tr><th>{C.rows.homomorphism}</th><td>{C.trialsValue(s.homomorphism)}</td></tr>
        </tbody>
      </table>
      {hasUndefined && <p className="hw1-note">{C.undefinedWhy}</p>}
      <Figure wide title={C.heatmapTitle(charts.correlation.range)} draw={hw.drawHeatmap} data={charts.correlation} palette={palette} />
      <Paras list={C.explain(s)} />

      {titles[5]}
      <p>{A.intro}</p>
      {s.avalanche.measurements > 0 && (
        <>
          <Figure title={A.chartTitle} draw={hw.drawBarChart} data={charts.distances} palette={palette} />
          <Figure wide title={A.heatmapTitle()} draw={hw.drawHeatmap} data={charts.sac} palette={palette} />
          <div className="hw1-uniformity">
            {view.avalancheBlocks(s, A, T.uniformity).map((block) => (
              <section key={block.label} className="hw1-coord">
                <TestResult block={block} />
              </section>
            ))}
          </div>
        </>
      )}
      <Paras list={A.explain(s)} />
    </>
  );
};

// Il selettore del punto base di una sezione statistica
const BaseSelect = ({ label, value, options, onChange, text, taskPoint = null }) => {
  const T = text.stats;
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(options.some((o) => o.value === e.target.value) ? e.target.value : value)}>
        {options.map((o) => {
          if (o.value === 'pooled') return <option key={o.value} value={o.value}>{T.pooled}</option>;
          let tag = '';
          if (taskPoint && hw.samePoint(o.point, taskPoint)) tag = ` (${T.taskTag})`;
          else if (!taskPoint && o.isDefault) tag = ` (${T.defaultTag})`;
          return <option key={o.value} value={o.value}>{`${fmt(o.point)}, ${T.orderWord} ${o.order}${tag}`}</option>;
        })}
      </select>
    </label>
  );
};

const Homework1 = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const text = HW1_TEXTS[language] || HW1_TEXTS.it;
  const palette = PALETTES[theme === 'dark' ? 'dark' : 'light'];
  const S = text.sections;
  const D = text.discussion;

  // --- 1. TASK: curva, punto base e chiave privata scelti dall'utente ---
  const [p, setP] = useState(TASK.p);
  const [gKey, setGKey] = useState(pointKey(TASK.G));
  const [kText, setKText] = useState(String(TASK.k));
  const [k, setK] = useState(TASK.k);
  const parsedK = view.parseK(kText);

  const curve = useMemo(() => hw.explorationCurve(p), [p]);
  const points = useMemo(() => hw.curvePoints(curve), [curve]);
  const G = useMemo(() => view.parseBase(gKey), [gKey]);
  const pointOptions = useMemo(() => view.basePointOptions(curve), [curve]);
  const n = useMemo(() => hw.pointOrder(G, curve), [G, curve]);
  const subgroup = useMemo(() => new Set(hw.multiples(n - 1, G, curve).map((s) => pointKey(s.point))), [n, G, curve]);
  const repeated = useMemo(() => (k <= view.LIST_LIMIT ? hw.multiples(k, G, curve) : null), [k, G, curve]);
  const daa = useMemo(() => hw.doubleAndAdd(k, G, curve), [k, G, curve]);
  const report = useMemo(() => hw.reportLines(k, G, curve).join('\n'), [k, G, curve]);
  const Q = daa.result;
  const isTask = p === TASK.p && hw.samePoint(G, TASK.G) && k === TASK.k;

  const inversion = useMemo(() => {
    if (Q === null) return null;
    const bf = hw.bruteForceLog(Q, G, curve);
    const factors = view.factorize(n);
    return {
      tries: bf.tries,
      n,
      kmod: k % n,
      nPrime: hw.isPrime(n),
      nFactors: view.formatFactors(n),
      nLargest: factors[factors.length - 1][0],
      facts: view.curveFacts(curve),
    };
  }, [Q, G, curve, n, k]);

  const changeP = (value) => {
    const next = view.VIZ_PRIMES.includes(Number(value)) ? Number(value) : TASK.p;
    setP(next);
    setGKey(pointKey(hw.defaultBasePoint(hw.explorationCurve(next))));
  };
  const changeK = (value) => {
    const next = value.slice(0, view.K_INPUT_MAX_LENGTH);
    setKText(next);
    const r = view.parseK(next);
    if (r.ok) setK(r.value);
  };
  const restore = () => {
    setP(TASK.p);
    setGKey(pointKey(TASK.G));
    setKText(String(TASK.k));
    setK(TASK.k);
  };
  let kError = null;
  if (!parsedK.ok) {
    if (parsedK.error === 'notInteger') kError = text.setup.kError.notInteger(kText.trim());
    else if (parsedK.error === 'range') kError = text.setup.kError.range(view.K_MAX);
    else kError = text.setup.kError.empty;
  }

  // --- 3. STATISTICAL EXPLORATION: curva della consegna ed estensione ---
  const taskFacts = useMemo(() => ({ ...view.curveFacts(TASK_CURVE), pooledN: view.pooledSize(TASK_CURVE) }), []);
  const taskOptions = useMemo(() => view.basePointOptions(TASK_CURVE, { pooled: true }), []);
  const extFacts = useMemo(() => hw.EXTENSION_PRIMES.map((q) => view.curveFacts(hw.explorationCurve(q))), []);
  const taskOrder = useMemo(() => hw.pointOrder(TASK.G, TASK_CURVE), []);
  const [taskBase, setTaskBase] = useState('pooled');
  const lastExtension = hw.EXTENSION_PRIMES[hw.EXTENSION_PRIMES.length - 1];
  const [extP, setExtP] = useState(lastExtension);
  const [extBase, setExtBase] = useState(() => pointKey(hw.defaultBasePoint(hw.explorationCurve(lastExtension))));
  const extCurve = useMemo(() => hw.explorationCurve(extP), [extP]);
  const extOptions = useMemo(() => view.basePointOptions(extCurve, { pooled: extP <= hw.POOLED_MAX_P }), [extCurve, extP]);
  const extPointCount = useMemo(() => hw.curvePoints(extCurve).length, [extCurve]);
  const extListed = extOptions.filter((o) => o.value !== 'pooled').length;
  const changeExtP = (value) => {
    const next = hw.EXTENSION_PRIMES.includes(Number(value)) ? Number(value) : lastExtension;
    setExtP(next);
    setExtBase(pointKey(hw.defaultBasePoint(hw.explorationCurve(next))));
  };

  const taskResult = useExplore(exploreKey(TASK.p, taskBase));
  const extResult = useExplore(exploreKey(extP, extBase));
  const pooledTask = useExplore(exploreKey(TASK.p, 'pooled'));
  const taskStats = taskResult.stats;
  const discussionT = pooledTask.stats;
  const discussionE = extResult.stats;

  const toc = useMemo(
    () => ({
      sections: view.tocEntries(S),
      labels: { button: text.ui.index, title: text.ui.indexTitle, close: text.ui.close },
    }),
    [S, text.ui],
  );

  const sidebar = (
    <section>
      <ul className="divided">
        <li>
          <article className="box highlight hw1-download">
            <header><h3>{text.download.title}</h3></header>
            <p>{text.download.text}</p>
            <p className="hw1-note">{text.download.contents}</p>
            <a href={`${DOWNLOADS}homework1.zip`} download="homework1.zip" className="button icon solid fa-download">{text.download.zip}</a>
            <a href={`${DOWNLOADS}homework1/index.html?lang=${language === 'en' ? 'en' : 'it'}`} target="_blank" rel="noopener noreferrer" className="button alt icon solid fa-external-link-alt">{text.download.online}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <HomeworkShell slug="homework-1" sidebar={sidebar} toc={toc}>
      {/* 0. La consegna */}
      <section className="hw1-section">
        <Title id="hw1-assignment" level={0}>{S.assignment}</Title>
        <Paras list={text.assignment.intro(TASK)} />
        <details className="hw1-original" open>
          <summary>{text.assignment.originalTitle}</summary>
          <p className="hw1-note">{text.assignment.originalNote}</p>
          <blockquote lang="en">
            {originalAssignment(TASK).map((block, i) => {
              if (block.type === 'title' || block.type === 'heading') return <p key={i}><strong>{block.text}</strong></p>;
              if (block.type === 'list') return <ul key={i}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
              if (block.type === 'lines') {
                return (
                  <p key={i}>
                    {block.lines.map((line, j) => (
                      <React.Fragment key={j}>{j > 0 && <br />}{line}</React.Fragment>
                    ))}
                  </p>
                );
              }
              return <p key={i}>{block.text}</p>;
            })}
          </blockquote>
        </details>
      </section>

      {/* 1. TASK */}
      <section className="hw1-section">
        <Title id="hw1-task" level={0}>{S.task}</Title>

        <Title id="hw1-setup" level={1}>{S.setup}</Title>
        <div className="hw1-controls">
          <label>
            {text.setup.fieldLabel}
            <select value={p} onChange={(e) => changeP(e.target.value)}>
              {view.VIZ_PRIMES.map((q) => <option key={q} value={q}>p = {q}</option>)}
            </select>
          </label>
          <label>
            {text.setup.baseLabel}
            <select value={gKey} onChange={(e) => setGKey(pointOptions.some((o) => o.value === e.target.value) ? e.target.value : gKey)}>
              {pointOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {`${fmt(o.point)}, ${text.setup.orderWord} ${o.order}${p === TASK.p && hw.samePoint(o.point, TASK.G) ? ` (${text.setup.taskTag})` : ''}`}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text.setup.keyLabel}
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              maxLength={view.K_INPUT_MAX_LENGTH}
              value={kText}
              onChange={(e) => changeK(e.target.value)}
              aria-invalid={!parsedK.ok}
              aria-describedby="hw1-k-help"
            />
          </label>
        </div>
        <p id="hw1-k-help" className={kError ? 'hw1-field-error' : 'hw1-note'} role={kError ? 'alert' : undefined}>
          {kError ? `${kError} ${text.setup.kError.fallback(k)}` : text.setup.kHint(view.K_MAX)}
        </p>
        <p className={isTask ? 'hw1-badge-line is-task' : 'hw1-badge-line is-custom'}>
          <span>{isTask ? text.setup.taskBadge(TASK) : text.setup.customBadge(TASK)}</span>
          {!isTask && (
            <button type="button" className="button alt hw1-restore" onClick={restore}>{text.setup.restore}</button>
          )}
        </p>
        <p>{text.setup.curveSummary(p, curve.b, points.length + 1, n)}</p>
        <p className="hw1-table-title"><strong>{text.setup.pointsTitle}</strong></p>
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
        <p className="hw1-note">{text.setup.pointsLegend}</p>

        <Title id="hw1-addition" level={1}>{S.addition}</Title>
        <p>{text.addition.intro}</p>
        <pre className="hw1-formulas">{text.addition.formulas(TASK).join('\n')}</pre>
        <p>{text.addition.note}</p>

        <Title id="hw1-multiples" level={1}>{S.multiples}</Title>
        <p>{text.multiples.intro}</p>
        {repeated ? (
          <table className="hw1-table">
            <thead>
              <tr>
                <th>{text.multiples.colMultiple}</th><th>{text.multiples.colPoint}</th>
                <th>{text.multiples.colOperation}</th><th>{text.multiples.colLambda}</th>
              </tr>
            </thead>
            <tbody>
              {repeated.map((s) => (
                <tr key={s.i}>
                  <td>{s.i}G</td>
                  <td>{fmt(s.point)}</td>
                  <td>{text.multiples.kinds[s.vertical ? 'inverse' : s.kind]}</td>
                  <td>{s.lambda === null ? '' : s.lambda}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="hw1-note">{text.multiples.tooMany(k, view.LIST_LIMIT)}</p>
        )}
        <p className="hw1-table-title"><strong>{text.multiples.printedTitle}</strong></p>
        <pre className="hw1-output">{report}</pre>

        <Title id="hw1-fast" level={1}>{S.fast}</Title>
        <p>{text.fast.intro(k, daa.bits, daa.steps.length)}</p>
        <table className="hw1-table">
          <thead>
            <tr>
              <th>{text.fast.colBit}</th><th>{text.fast.colOperation}</th>
              <th>{text.fast.colR}</th><th>{text.fast.colPoint}</th>
            </tr>
          </thead>
          <tbody>
            {daa.steps.map((s, i) => (
              <tr key={i}>
                <td>{s.bitIndex} ({s.bit})</td>
                <td>{text.fast.ops[s.op]}</td>
                <td>{s.multiple}G</td>
                <td>{fmt(s.result)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Title id="hw1-public-key" level={1}>{S.publicKey}</Title>
        <p>{text.publicKey.intro}</p>
        <div className="hw1-key">
          <span>{text.publicKey.label}</span>
          <strong>Q = {k}G = {fmt(Q)}</strong>
          {Q === null && <small>{text.publicKey.infinity}</small>}
        </div>
        <p>{text.publicKey.ethereum}</p>
      </section>

      {/* 2. OPTIONAL - GURU LEVEL */}
      <section className="hw1-section">
        <Title id="hw1-guru" level={0}>{S.guru}</Title>
        <p>{text.guru.intro}</p>
        <p className="hw1-note">{text.guru.vizNote(view.VIZ_PRIMES)}</p>
        <Animation curve={curve} G={G} k={k} Q={Q} text={text} palette={palette} />
      </section>

      {/* 3. STATISTICAL EXPLORATION */}
      <section className="hw1-section">
        <Title id="hw1-stats" level={0}>{S.stats}</Title>
        <Paras list={text.stats.intro(TASK, taskFacts)} />

        <Title id="hw1-stats-task" level={1}>{S.statsTask}</Title>
        <p>{text.stats.taskIntro(TASK, taskOrder)}</p>
        <div className="hw1-controls">
          <BaseSelect
            label={text.stats.baseLabel}
            value={taskBase}
            options={taskOptions}
            onChange={setTaskBase}
            text={text}
            taskPoint={TASK.G}
          />
        </div>
        {taskStats && (
          <p>
            {text.stats.summary(taskStats)}
            {taskStats.orders && <> {text.stats.ordersLine(taskStats.orders)}</>}
            {taskStats.smallSample && <> {text.stats.smallSample(taskStats.N)}</>}
          </p>
        )}
        <Analyses prefix="hw1-stats-task" result={taskResult} text={text} palette={palette} />

        <Title id="hw1-stats-ext" level={1}>{S.statsExt}</Title>
        <p>{text.stats.extIntro(extFacts)}</p>
        <div className="hw1-controls">
          <label>
            {text.stats.fieldLabel}
            <select value={extP} onChange={(e) => changeExtP(e.target.value)}>
              {hw.EXTENSION_PRIMES.map((q) => <option key={q} value={q}>p = {q}</option>)}
            </select>
          </label>
          <BaseSelect label={text.stats.baseLabel} value={extBase} options={extOptions} onChange={setExtBase} text={text} />
        </div>
        {extListed < extPointCount && <p className="hw1-note">{text.stats.pointsShown(extListed, extPointCount)}</p>}
        {discussionE && (
          <p>
            {text.stats.summary(discussionE)}
            {discussionE.smallSample && <> {text.stats.smallSample(discussionE.N)}</>}
          </p>
        )}
        <Analyses prefix="hw1-stats-ext" result={extResult} text={text} palette={palette} />
      </section>

      {/* 4. Discussione */}
      <section className="hw1-section">
        <Title id="hw1-discussion" level={0}>{S.discussion}</Title>

        <Title id="hw1-discussion-definitions" level={1}>{S.definitions}</Title>
        {D.definitions.map((d) => <p key={d.term}><strong>{d.term}</strong> {d.body}</p>)}

        <Title id="hw1-discussion-properties" level={1}>{S.properties}</Title>
        {discussionT && discussionE ? (
          <>
            <p>{D.propertiesIntro(discussionT, discussionE)}</p>
            <table className="hw1-table hw1-discussion-table">
              <thead>
                <tr><th>{D.colProperty}</th><th>{D.colOwf}</th><th>{D.colHash}</th><th>{D.colObserved}</th></tr>
              </thead>
              <tbody>
                {D.rows.map((row) => (
                  <tr key={row.key}>
                    <th data-label={D.colProperty}>{row.name}</th>
                    <td data-label={D.colOwf}>{row.owf}</td>
                    <td data-label={D.colHash}>{row.hash}</td>
                    <td data-label={D.colObserved}>{D.observed[row.key](discussionT, discussionE)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <Pending text={text} />
        )}
        <Paras list={D.propertiesAfter} />

        <Title id="hw1-discussion-inversion" level={1}>{S.inversion}</Title>
        <Paras list={inversion ? D.inversion(inversion) : [D.inversionInfinity]} />

        <Title id="hw1-discussion-conclusion" level={1}>{S.conclusion}</Title>
        <Paras list={D.conclusion} />
      </section>
    </HomeworkShell>
  );
};

export default Homework1;
