// src/pages/statistics/Homework3.jsx
// Homework #3 di Statistics: il punteggio di penetrazione di m attaccanti su
// n sistemi come somma di incrementi i.i.d., nei modelli di Bernoulli e di
// Rademacher. La pagina segue la consegna punto per punto: il modello e le
// sue traiettorie animate, le distribuzioni delle tre grandezze al crescere
// di n, la legge dei grandi numeri, la varianza sotto le tre normalizzazioni,
// il teorema del limite centrale, l'interpretazione per sistemi e
// attaccanti, i test, il contesto storico e le conclusioni.
//
// Qui c'e' solo la pagina React. La simulazione, la statistica, i grafici e
// l'animazione stanno in hw3/homework3.js, i testi in hw3/texts.js e la
// logica di presentazione in hw3/view.js: sono gli stessi file da cui la
// build ricava il programma scaricabile (build/homework-standalone.js), cosi'
// la pagina e il download non possono raccontare due cose diverse.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/languageContext';
import { useTheme } from '../../contexts/themeContext';
import HomeworkShell from './HomeworkShell';
import * as hw from './hw3/homework3';
import * as view from './hw3/view';
import { HW3_TEXTS, originalAssignment } from './hw3/texts';
import { useExplore, useSettled } from './hw3/useJob';

const DOWNLOADS = `${import.meta.env.BASE_URL}downloads/statistics/`;

const PALETTES = {
  light: hw.DEFAULT_PALETTE,
  dark: {
    background: '#111111',
    text: '#d6d6d6',
    grid: '#262626',
    bars: '#7986cb',
    reference: '#ff6b81',
    highlight: '#ff6b81',
    series: ['#7986cb', '#ff6b81', '#4fb39c', '#ffca28', '#ba68c8', '#4dd0e1', '#9e9e9e'],
  },
};

const HEADINGS = ['h3', 'h4', 'h5'];

// I campi non devono passare per correttori o completamenti
const FIELD = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'none',
  spellCheck: false,
  'data-gramm': 'false',
  'data-lpignore': 'true',
};

// Un titolo di sezione: id per l'indice, tabIndex -1 perche' l'indice ci
// porti anche il focus della tastiera.
const Title = ({ id, level, children }) => {
  const Tag = HEADINGS[level];
  return <Tag id={id} tabIndex={-1} className="hw1-anchor">{children}</Tag>;
};

const Paras = ({ list }) => list.filter(Boolean).map((t, i) => <p key={i}>{t}</p>);

const Pending = ({ text, result }) => (result && result.error ? <p className="hw1-note">{text.ui.error(result.error)}</p> : <p className="hw1-note hw1-pending" role="status">{text.ui.computing}</p>);

const Check = ({ ok, children }) => <p className={ok ? 'hw2-check is-ok' : 'hw2-check is-bad'}>{children}</p>;

const Formulas = ({ title = null, children }) => (
  <>
    {title && <p className="hw1-table-title"><strong>{title}</strong></p>}
    <pre className="hw1-formulas">{children}</pre>
  </>
);

// La legenda di un grafico, nella pagina: si legge e si traduce
const Legend = ({ items, palette }) => (
  <ul className="hw2a-legend">
    {items.map((item, i) => (
      <li key={item.label}>
        <span className={item.dashed ? 'is-dashed' : ''} style={{ borderColor: palette.series[item.color ?? i], backgroundColor: item.dashed ? 'transparent' : palette.series[item.color ?? i] }} aria-hidden="true" />
        {item.label}
      </li>
    ))}
  </ul>
);

// Un grafico su canvas, ridisegnato quando cambia la larghezza, con i valori
// del pezzo sotto il puntatore: il disegno vero e' in homework3.js.
const Figure = ({ title, draw, data, palette, tip = null, wide = false, legend = null, note = null }) => {
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
    const detach = tip ? hw.attachChartTooltip(canvas, { draw, data, describe: tip }) : null;
    return () => {
      drawn = -2;
      observer.disconnect();
      if (detach) detach();
    };
  }, [draw, data, palette, tip]);
  return (
    <figure className={wide ? 'hw1-figure hw1-figure-wide' : 'hw1-figure'}>
      <canvas ref={ref} className="hw1-canvas" role="img" aria-label={title} />
      {legend && <Legend items={legend} palette={palette} />}
      {note && <p className="hw3-figure-note">{note}</p>}
      <figcaption>{title}</figcaption>
    </figure>
  );
};

// Una scelta fra pochi valori: il pulsante premuto e' quello attivo
const Choices = ({ label, options, value, onChange }) => (
  <div className="hw3-choices" role="group" aria-label={label}>
    <span className="hw3-choices-label">{label}</span>
    {options.map(([key, name]) => (
      <button key={key} type="button" className="button alt" aria-pressed={value === key} onClick={() => onChange(key)}>{name}</button>
    ))}
  </div>
);

// Il cursore sui punti di osservazione (n = 1, 2, 5, ...)
const Slider = ({ id, label, valueText, max, value, onChange }) => (
  <div className="hw3-slider">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="range" min={0} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={valueText} />
  </div>
);

/**
 * Plays an index from its current value to `last`, one step every `delay`
 * milliseconds: [index, playing, toggle, choose]. Until somebody moves it the
 * index is `fallback` (the results may arrive after the first render);
 * `choose` moves it by hand and stops playing.
 */
function usePlayer(last, fallback, delay = 1100) {
  const [chosen, setChosen] = useState(null);
  const [playing, setPlaying] = useState(false);
  const index = Math.min(chosen === null ? fallback : chosen, last);
  const active = playing && index < last;
  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => {
      setChosen(index + 1);
      if (index + 1 >= last) setPlaying(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [active, index, last, delay]);
  const toggle = () => {
    if (active) {
      setPlaying(false);
      return;
    }
    if (index >= last) setChosen(0);
    setPlaying(true);
  };
  const choose = (value) => {
    setPlaying(false);
    setChosen(value);
  };
  return [index, active, toggle, choose];
}

// Un test d'ipotesi: l'ipotesi nulla, i numeri, l'esito e come leggerlo
const TestRow = ({ label, test, text, expected = null }) => {
  const rejected = test.verdict === 'reject';
  return (
    <div className={`hw1-test ${rejected ? 'is-invalid' : 'is-valid'}`}>
      <p className="hw1-test-head">
        <strong>{label}</strong>{' '}
        <span className={`hw1-badge ${rejected ? 'is-invalid' : 'is-valid'}`}>{text.stats.verdict[rejected ? 'reject' : 'notReject']}</span>
        {expected && <span className="hw1-note"> ({text.stats.expected[expected]})</span>}
      </p>
      <p>{text.stats.testLine(test)}</p>
    </div>
  );
};

const Tests = ({ group, s, text }) => {
  const expected = useMemo(() => view.expectedVerdicts(s), [s]);
  return (
    <div className="hw2-tests">
      {view.statTests(s)[group].map(([key, test]) => (
        <TestRow key={key} label={text.stats.labels[group][key]} test={test} text={text} expected={expected[group][key]} />
      ))}
    </div>
  );
};

const modelOptions = (text) => hw.MODELS.map((m) => [m, text.modelNames[m]]);

// --- 0. La consegna ------------------------------------------------------------

const Assignment = React.memo(function Assignment({ text }) {
  return (
    <section className="hw1-section hw2 hw3">
      <Title id="hw3-assignment" level={0}>{text.sections.assignment}</Title>
      <Paras list={text.assignment.intro} />
      <details className="hw1-original" open>
        <summary>{text.assignment.originalTitle}</summary>
        <p className="hw1-note">{text.assignment.originalNote}</p>
        <blockquote lang="en">
          {originalAssignment().map((block, i) => <p key={i}>{block.text}</p>)}
        </blockquote>
      </details>
    </section>
  );
});

// --- 1.1 e 1.2 I modelli e le grandezze ------------------------------------------

const Models = React.memo(function Models({ p, text }) {
  const M = text.models;
  const F = text.fmt;
  return (
    <>
      <Paras list={M.intro} />
      <p className="hw1-table-title"><strong>{M.tableTitle(p)}</strong></p>
      <table className="hw1-table hw1-discussion-table hw3-models">
        <thead>
          <tr><th>{M.cols.model}</th><th>{M.cols.values}</th><th>{M.cols.mu}</th><th>{M.cols.variance}</th><th>{M.cols.rho}</th><th>{M.cols.skewness}</th></tr>
        </thead>
        <tbody>
          {hw.MODELS.map((model) => {
            const mom = hw.modelMoments(model, p);
            return (
              <tr key={model}>
                <th>{text.modelNames[model]}</th>
                <td data-label={M.cols.values}>{model === 'bernoulli' ? '{0, 1}' : '{-1, +1}'}</td>
                <td data-label={M.cols.mu}>{F.num(mom.mu, 4)}</td>
                <td data-label={M.cols.variance}>{F.num(mom.variance, 4)}</td>
                <td data-label={M.cols.rho}>{F.num(mom.rho, 4)}</td>
                <td data-label={M.cols.skewness}>{F.num(mom.skewness, 4)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Paras list={M.after} />
    </>
  );
});

const Quantities = React.memo(function Quantities({ text }) {
  const Q = text.quantities;
  return (
    <>
      <Paras list={Q.intro} />
      <p className="hw1-table-title"><strong>{Q.tableTitle}</strong></p>
      <table className="hw1-table hw1-discussion-table hw3-quantities">
        <thead>
          <tr><th>{Q.cols.quantity}</th><th>{Q.cols.mean}</th><th>{Q.cols.variance}</th><th>{Q.cols.sd}</th><th>{Q.cols.trend}</th></tr>
        </thead>
        <tbody>
          {Q.rows.map((row) => (
            <tr key={row[0]}>
              <th>{row[0]}</th>
              <td data-label={Q.cols.mean}>{row[1]}</td>
              <td data-label={Q.cols.variance}>{row[2]}</td>
              <td data-label={Q.cols.sd}>{row[3]}</td>
              <td data-label={Q.cols.trend}>{row[4]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paras list={Q.after} />
    </>
  );
});

// --- 1.3 I campi ---------------------------------------------------------------------

const fieldError = (r, I, field) => {
  if (r.ok) return null;
  if (r.error === 'range') return I.errors.range(...I.limits[field]);
  return I.errors[r.error](r.text);
};

const Field = ({ id, label, value, onChange, maxLength, inputMode, error, hint, children = null }) => (
  <div className="hw3-field">
    <label htmlFor={id}>{label}</label>
    <span className="hw3-field-row">
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        {...FIELD}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-help`}
      />
      {children}
    </span>
    <p id={`${id}-help`} className={error ? 'hw1-field-error' : 'hw1-note'} role={error ? 'alert' : undefined}>{error || hint}</p>
  </div>
);

// --- 1.4 Le traiettorie ------------------------------------------------------------

// L'animazione: il disegno e la simulazione passo per passo sono di
// homework3.js, qui i controlli. Si ricrea quando cambiano i parametri o il
// modello; grandezza, velocita', colori e lingua le arrivano senza ricrearla.
const Trajectories = ({ params, text, palette }) => {
  const T = text.trajectories;
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [model, setModel] = useState('rademacher');
  const [quantity, setQuantity] = useState('sum');
  const [speed, setSpeed] = useState(1);
  const [status, setStatus] = useState(null);
  const settingsRef = useRef({ quantity, speed: view.ANIMATION.speeds[speed], palette, decimal: text.fmt.decimal, describe: view.tips.trajectory(text) });

  useEffect(() => {
    settingsRef.current = { quantity, speed: view.ANIMATION.speeds[speed], palette, decimal: text.fmt.decimal, describe: view.tips.trajectory(text) };
  }, [quantity, speed, palette, text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const settings = settingsRef.current;
    const anim = hw.createTrajectoryAnimation(canvas, { ...view.animationOptions(params, model), ...settings, onUpdate: setStatus });
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
  }, [params, model]);

  useEffect(() => {
    if (animRef.current) animRef.current.setQuantity(quantity);
  }, [quantity]);
  useEffect(() => {
    if (animRef.current) animRef.current.setSpeed(view.ANIMATION.speeds[speed]);
  }, [speed]);
  useEffect(() => {
    if (animRef.current) animRef.current.setPalette(palette);
  }, [palette]);
  useEffect(() => {
    if (!animRef.current) return;
    animRef.current.setDescribe(view.tips.trajectory(text));
    animRef.current.setDecimal(text.fmt.decimal);
  }, [text]);

  const sizes = view.animationOptions(params, model);
  const playing = Boolean(status && status.playing);
  let playLabel = T.play;
  if (playing) playLabel = T.pause;
  else if (status && status.k > 0 && !status.done) playLabel = T.resume;
  return (
    <>
      <Paras list={T.intro(sizes.shown, sizes.sample)} />
      <div className="hw3-anim-controls">
        <Choices label={T.modelLabel} options={modelOptions(text)} value={model} onChange={setModel} />
        <Choices label={T.quantityLabel} options={hw.QUANTITIES.map((q) => [q, text.trajectoryNames[q]])} value={quantity} onChange={setQuantity} />
        <div className="hw1-controls hw3-anim-buttons">
          <label>
            {T.speedLabel}
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
              {T.speeds.map((name, i) => <option key={name} value={i}>{name}</option>)}
            </select>
          </label>
          <span className="hw1-buttons">
            <button type="button" className="button" onClick={() => (playing ? animRef.current.pause() : animRef.current.play())}>{playLabel}</button>
            <button type="button" className="button alt" onClick={() => animRef.current.step()}>{T.step}</button>
            <button type="button" className="button alt" onClick={() => animRef.current.reset()}>{T.reset}</button>
            <button type="button" className="button alt" onClick={() => animRef.current.toEnd()}>{T.end}</button>
          </span>
        </div>
      </div>
      {/* posizionato: ci stanno dentro l'evidenziazione e l'etichetta sotto il puntatore */}
      <div className="hw1-figure">
        <canvas ref={canvasRef} className="hw1-canvas hw3-anim" role="img" aria-label={text.sections.trajectories} />
      </div>
      <Legend
        items={[
          { label: T.legend[0], color: 0 },
          { label: T.legend[1], color: 1 },
          { label: T.legend[2], color: 2, dashed: true },
          { label: T.legend[3], color: 3, dashed: true },
        ]}
        palette={palette}
      />
      <p className="hw1-caption" aria-live={playing ? 'off' : 'polite'}>{status ? T.caption(status, text.trajectoryNames[status.quantity]) : ''}</p>
      <Paras list={T.after} />
    </>
  );
};

// --- 1.5 Verifiche -------------------------------------------------------------------

const Verify = React.memo(function Verify({ text }) {
  const V = text.verify;
  const rows = useMemo(() => hw.verifyAll(), []);
  const ok = rows.filter((r) => r.ok).length;
  const groups = ['generator', 'functions'].map((group) => ({ group, rows: rows.filter((r) => r.group === group) }));
  return (
    <>
      <p>{V.intro}</p>
      <Check ok={ok === rows.length}><strong>{V.summary(ok, rows.length)}</strong></Check>
      <details className="hw2-details">
        <summary>{V.details(rows.length)}</summary>
        {groups.map((g) => (
          <React.Fragment key={g.group}>
            <p className="hw1-table-title"><strong>{V.groups[g.group]}</strong></p>
            <table className="hw1-table hw1-discussion-table hw2-vectors hw3-checks">
              <thead>
                <tr><th>{V.cols.check}</th><th>{V.cols.expected}</th><th>{V.cols.result}</th></tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.name}>
                    <th data-label={V.cols.check}>{r.name}</th>
                    <td data-label={V.cols.expected}><code>{r.expected}</code></td>
                    <td data-label={V.cols.result} className={r.ok ? 'is-ok' : 'is-bad'}>
                      <span aria-label={r.ok ? V.ok : V.failed}>{r.ok ? '✓' : '✗'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </React.Fragment>
        ))}
      </details>
    </>
  );
});

// --- 2.1 Gli istogrammi n per n ---------------------------------------------------------

const Sweep = React.memo(function Sweep({ s, job, text, palette }) {
  const W = text.sweep;
  const F = text.fmt;
  const [quantity, setQuantity] = useState('mean');
  const last = s ? s.models.bernoulli.points.length - 1 : 0;
  const [g, playing, toggle, choose] = usePlayer(last, last);
  const charts = useMemo(() => {
    if (!s) return null;
    return hw.MODELS.map((model) => {
      const M = s.models[model];
      const data = view.sweepChart(M, g, quantity, F.decimal);
      return { model, data, tip: view.tips.histogram(data, text.tips), stats: view.quantityStats(M, g, quantity) };
    });
  }, [s, g, quantity, F, text]);
  if (!s) return <Pending text={text} result={job} />;
  const n = s.models.bernoulli.points[g].n;
  return (
    <>
      <Paras list={W.intro} />
      <div className="hw3-sweep-controls">
        <Choices label={W.quantityLabel} options={hw.QUANTITIES.map((q) => [q, text.quantityNames[q]])} value={quantity} onChange={setQuantity} />
        <div className="hw3-slider-row">
          <Slider id="hw3-sweep-n" label={W.nLabel(n)} valueText={W.nLabel(n)} max={last} value={g} onChange={choose} />
          <button type="button" className="button alt" onClick={toggle}>{playing ? W.pause : W.play}</button>
        </div>
      </div>
      <div className="hw1-charts">
        {charts.map((c) => (
          <Figure
            key={c.model}
            title={W.chart(text.modelNames[c.model], text.quantityNames[quantity], n, s.params.m)}
            draw={hw.drawHistogram}
            data={c.data}
            palette={palette}
            tip={c.tip}
            note={W.stats(text.modelNames[c.model], c.stats, quantity)}
          />
        ))}
      </div>
      <Legend items={[{ label: W.legend[0], color: 0 }, { label: W.legend[1], color: 1, dashed: true }, { label: W.legend[2], color: 2 }]} palette={palette} />
      <Paras list={W.after} />
    </>
  );
});

// --- 2.2 Medie e varianze -------------------------------------------------------------

const Moments = React.memo(function Moments({ s, job, text }) {
  const M = text.moments;
  const F = text.fmt;
  if (!s) return <Pending text={text} result={job} />;
  const B = s.models.bernoulli.mom;
  const R = s.models.rademacher.mom;
  return (
    <>
      <p>{M.intro}</p>
      <p className="hw1-table-title"><strong>{M.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw3-moments">
          <thead>
            <tr>
              <th>{M.cols.n}</th>
              <th>{M.cols.bMean} ({F.num(B.mu, 4)})</th>
              <th>{M.cols.bVar} ({F.num(B.variance, 4)})</th>
              <th>{M.cols.rMean} ({F.num(R.mu, 4)})</th>
              <th>{M.cols.rVar} ({F.num(R.variance, 4)})</th>
            </tr>
          </thead>
          <tbody>
            {view.momentRows(s).map((r) => (
              <tr key={r.n}>
                <td>{F.int(r.n)}</td>
                <td>{F.num(r.bMean, 4)}</td>
                <td>{F.num(r.bVar, 4)}</td>
                <td>{F.num(r.rMean, 4)}</td>
                <td>{F.num(r.rVar, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paras list={M.after(s)} />
    </>
  );
});

// --- 2.3 Quanti attaccanti servono ---------------------------------------------------------

const Choice = React.memo(function Choice({ s, job, epsilon, text }) {
  const C = text.choice;
  const F = text.fmt;
  if (!s) return <Pending text={text} result={job} />;
  const m = s.params.m;
  // in rosso gli attaccanti necessari che superano quelli simulati
  const need = (v) => <td className={v > m ? 'hw3-over' : undefined}>{C.count(v)}</td>;
  return (
    <>
      <Paras list={C.intro} />
      <Formulas title={C.formulasTitle}>{C.formulas}</Formulas>
      <p className="hw1-table-title"><strong>{C.tableTitle(epsilon, m)}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw3-choice">
          <thead>
            <tr>{['n', 'pB', 'mB', 'pR', 'mR', 'd', 'mD'].map((k) => <th key={k}>{C.cols[k]}</th>)}</tr>
          </thead>
          <tbody>
            {view.choiceRows(s, epsilon).map((r) => (
              <tr key={r.n}>
                <td>{F.int(r.n)}</td>
                <td>{F.small(r.pB)}</td>
                {need(r.mB)}
                <td>{F.small(r.pR)}</td>
                {need(r.mR)}
                <td>{F.num(r.d, 4)}</td>
                {need(r.mD)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paras list={C.after(s, epsilon)} />
    </>
  );
});

// --- 3. La legge dei grandi numeri ------------------------------------------------------

const Convergence = React.memo(function Convergence({ s, job, epsilon, setEpsilon, text, palette }) {
  const C = text.convergence;
  const F = text.fmt;
  const rows = useMemo(() => (s ? view.llnRows(s, epsilon) : null), [s, epsilon]);
  const charts = useMemo(
    () => (rows ? hw.MODELS.map((model) => ({ model, data: view.llnChart(rows[model], F.decimal), tip: view.tips.lln(rows[model], text.tips) })) : null),
    [rows, F, text],
  );
  if (!s) return <Pending text={text} result={job} />;
  const percent = Math.round(epsilon * 100);
  const [lo, hi] = hw.EPSILON_RANGE;
  return (
    <>
      <p>{C.intro}</p>
      <div className="hw3-slider-row">
        <div className="hw3-slider">
          <label htmlFor="hw3-epsilon">{C.epsilonLabel(epsilon)}</label>
          <input id="hw3-epsilon" type="range" min={Math.round(lo * 100)} max={Math.round(hi * 100)} step={1} value={percent} onChange={(e) => setEpsilon(Number(e.target.value) / 100)} aria-valuetext={C.epsilonLabel(epsilon)} />
        </div>
      </div>
      <div className="hw1-charts">
        {charts.map((c) => (
          <Figure key={c.model} title={C.chart(text.modelNames[c.model], epsilon)} draw={hw.drawLineChart} data={c.data} palette={palette} tip={c.tip} />
        ))}
      </div>
      <Legend items={[{ label: C.legend[0], color: 0 }, { label: C.legend[1], color: 2 }, { label: C.legend[2], color: 3, dashed: true }, { label: C.legend[3], color: 4, dashed: true }]} palette={palette} />
      <p className="hw1-table-title"><strong>{C.tableTitle(epsilon)}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw3-lln">
          <thead>
            <tr>
              <th rowSpan={2}>{C.cols.n}</th>
              <th colSpan={2}>{text.modelNames.bernoulli}</th>
              <th colSpan={2}>{text.modelNames.rademacher}</th>
            </tr>
            <tr><th>{C.cols.simulated}</th><th>{C.cols.exact}</th><th>{C.cols.simulated}</th><th>{C.cols.exact}</th></tr>
          </thead>
          <tbody>
            {rows.bernoulli.map((b, i) => {
              const r = rows.rademacher[i];
              // la frazione, e sotto il suo intervallo al 95%
              const cell = (x) => (
                <>
                  {F.num(x.rate, 4)}
                  <span className="hw3-interval">{F.num(x.interval[0], 4)}-{F.num(x.interval[1], 4)}</span>
                </>
              );
              return (
                <tr key={b.n}>
                  <td>{F.int(b.n)}</td>
                  <td>{cell(b)}</td>
                  <td>{F.small(b.exact)}</td>
                  <td>{cell(r)}</td>
                  <td>{F.small(r.exact)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Paras list={C.after(s, epsilon)} />
      <Tests group="lln" s={s} text={text} />
    </>
  );
});

// --- 4. La varianza ----------------------------------------------------------------------

const Variance = React.memo(function Variance({ s, job, text, palette }) {
  const V = text.variance;
  const F = text.fmt;
  const charts = useMemo(
    () => (s ? hw.MODELS.map((model) => ({ model, data: view.varianceChart(s.models[model], F.decimal), tip: view.tips.variance(s.models[model], text.tips) })) : null),
    [s, F, text],
  );
  if (!s) return <Pending text={text} result={job} />;
  const fits = view.varianceFits(s);
  return (
    <>
      <p>{V.intro}</p>
      <div className="hw1-charts">
        {charts.map((c) => (
          <Figure key={c.model} title={V.chart(text.modelNames[c.model])} draw={hw.drawLineChart} data={c.data} palette={palette} tip={c.tip} />
        ))}
      </div>
      <Legend items={[{ label: V.legend[0], color: 0 }, { label: V.legend[1], color: 1 }, { label: V.legend[2], color: 2 }, { label: V.legend[3], color: 6, dashed: true }]} palette={palette} />
      <p className="hw1-table-title"><strong>{V.fitTitle}</strong></p>
      <table className="hw1-table hw1-discussion-table hw3-fits">
        <thead>
          <tr><th>{V.fitCols.quantity}</th><th>{V.fitCols.bernoulli}</th><th>{V.fitCols.rademacher}</th><th>{V.fitCols.theory}</th></tr>
        </thead>
        <tbody>
          {hw.QUANTITIES.map((q) => (
            <tr key={q}>
              <th>{text.quantityNames[q]}</th>
              <td data-label={V.fitCols.bernoulli}>{F.num(fits.bernoulli[q], 4)} ± {F.num(fits.bernoulli.error, 4)}</td>
              <td data-label={V.fitCols.rademacher}>{F.num(fits.rademacher[q], 4)} ± {F.num(fits.rademacher.error, 4)}</td>
              <td data-label={V.fitCols.theory}>{F.int(view.VARIANCE_SLOPES[q])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paras list={V.after(s)} />
    </>
  );
});

// --- 5. Il teorema del limite centrale ------------------------------------------------------

const Normal = React.memo(function Normal({ s, job, text, palette }) {
  const N = text.normal;
  const F = text.fmt;
  const [model, setModel] = useState('rademacher');
  const points = s ? s.models[model].points : [];
  const last = Math.max(0, points.length - 1);
  // si parte da n = 100: abbastanza grande per la campana, abbastanza piccolo per vedere i gradini
  const [g, playing, toggle, choose] = usePlayer(last, s ? view.pointIndex(s.models.rademacher, 100) : 0);
  const charts = useMemo(() => {
    if (!s) return null;
    const M = s.models[model];
    const hist = view.cltHistogram(M, g, F.decimal);
    const qq = view.qqData(M, g, F.decimal);
    return { hist, qq, histTip: view.tips.histogram(hist, text.tips), qqTip: view.tips.qq(qq, text.tips), shape: view.shapeAt(M, g) };
  }, [s, model, g, F, text]);
  if (!s) return <Pending text={text} result={job} />;
  const n = points[g].n;
  const label = N.models[model];
  return (
    <>
      <p>{N.intro}</p>
      <div className="hw3-sweep-controls">
        <Choices label={N.modelLabel} options={['rademacher', 'bernoulli'].map((m) => [m, N.models[m]])} value={model} onChange={setModel} />
        <div className="hw3-slider-row">
          <Slider id="hw3-clt-n" label={N.nLabel(n)} valueText={N.nLabel(n)} max={last} value={g} onChange={choose} />
          <button type="button" className="button alt" onClick={toggle}>{playing ? text.sweep.pause : text.sweep.play}</button>
        </div>
      </div>
      <div className="hw1-charts">
        <Figure
          title={N.histChart(label, n)}
          draw={hw.drawHistogram}
          data={charts.hist}
          palette={palette}
          tip={charts.histTip}
          legend={[{ label: N.legend[0], color: 0 }, { label: N.legend[1], color: 1, dashed: true }, { label: N.legend[2], color: 2 }]}
        />
        <Figure title={N.qqChart(label, n)} draw={hw.drawQQ} data={charts.qq} palette={palette} tip={charts.qqTip} legend={[{ label: N.qqLegend[0], color: 0 }, { label: N.qqLegend[1], color: 1, dashed: true }]} />
      </div>
      <p className="hw3-stats">{N.stats(charts.shape)}</p>
      <Paras list={N.after} />
      <Tests group="clt" s={s} text={text} />
    </>
  );
});

const Speed = React.memo(function Speed({ s, job, text, palette }) {
  const P = text.speed;
  const F = text.fmt;
  const charts = useMemo(
    () => (s ? ['rademacher', 'bernoulli'].map((model) => ({ model, data: view.distanceChart(s.models[model], s.params.m, F.decimal), tip: view.tips.distance(s.models[model], text.tips) })) : null),
    [s, F, text],
  );
  if (!s) return <Pending text={text} result={job} />;
  return (
    <>
      <p>{P.intro}</p>
      <div className="hw1-charts">
        {charts.map((c) => (
          <Figure key={c.model} title={P.chart(text.modelNames[c.model])} draw={hw.drawLineChart} data={c.data} palette={palette} tip={c.tip} />
        ))}
      </div>
      <Legend items={[{ label: P.legend[0], color: 1 }, { label: P.legend[1], color: 2 }, { label: P.legend[2], color: 3, dashed: true }, { label: P.legend[3], color: 0 }, { label: P.legend[4], color: 6, dashed: true }]} palette={palette} />
      <Paras list={P.after(s)} />
    </>
  );
});

const Drift = React.memo(function Drift({ s, job, text }) {
  const D = text.bernoulli;
  const F = text.fmt;
  if (!s) return <Pending text={text} result={job} />;
  return (
    <>
      <p>{D.intro}</p>
      <p className="hw1-table-title"><strong>{D.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw3-drift">
          <thead>
            <tr>{['n', 'mean', 'sampleMean', 'skewness', 'sampleSkewness', 'distance'].map((k) => <th key={k}>{D.cols[k]}</th>)}</tr>
          </thead>
          <tbody>
            {view.driftRows(s.models.bernoulli).map((r) => (
              <tr key={r.n}>
                <td>{F.int(r.n)}</td>
                <td>{F.num(r.mean, 3)}</td>
                <td>{F.num(r.sampleMean, 3)}</td>
                <td>{F.num(r.skewness, 4)}</td>
                <td>{F.num(r.sampleSkewness, 4)}</td>
                <td>{F.num(r.distance, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paras list={D.after(s)} />
    </>
  );
});

// --- 6. Sistemi e attaccanti ------------------------------------------------------------------

const Size = React.memo(function Size({ s, job, text, palette }) {
  const Z = text.size;
  const F = text.fmt;
  const chart = useMemo(() => (s ? view.arcsineChart(s.models.rademacher.walk, F.decimal) : null), [s, F]);
  const tip = useMemo(() => (chart ? view.tips.arcsine(chart, text.tips) : null), [chart, text]);
  if (!s) return <Pending text={text} result={job} />;
  const W = s.models.rademacher.walk;
  return (
    <>
      <Paras list={Z.paras(s)} />
      <Figure
        wide
        title={Z.arcsineChart(W.even, s.params.m)}
        draw={hw.drawHistogram}
        data={chart}
        palette={palette}
        tip={tip}
        legend={[{ label: Z.arcsineLegend[0], color: 0 }, { label: Z.arcsineLegend[1], color: 1, dashed: true }, { label: Z.arcsineLegend[2], color: 2 }]}
      />
      <Paras list={Z.after} />
      <Tests group="walk" s={s} text={text} />
    </>
  );
});

const Attackers = React.memo(function Attackers({ s, job, text, palette }) {
  const A = text.attackers;
  const F = text.fmt;
  const charts = useMemo(() => {
    if (!s) return null;
    const G = s.models.bernoulli.groups;
    return {
      best: view.bestChart(G, F.decimal),
      probability: view.probabilityChart(G, F.decimal),
      bestTip: view.tips.best(G, text.tips),
      probabilityTip: view.tips.probability(G, text.tips),
    };
  }, [s, F, text]);
  if (!s) return <Pending text={text} result={job} />;
  const n = s.params.n;
  return (
    <>
      <p>{A.intro}</p>
      <div className="hw1-charts">
        <Figure
          title={A.bestChart(n)}
          draw={hw.drawLineChart}
          data={charts.best}
          palette={palette}
          tip={charts.bestTip}
          legend={[{ label: A.bestLegend[0], color: 0 }, { label: A.bestLegend[1], color: 1 }, { label: A.bestLegend[2], color: 2, dashed: true }, { label: A.bestLegend[3], color: 3, dashed: true }]}
        />
        <Figure
          title={A.probabilityChart(n)}
          draw={hw.drawLineChart}
          data={charts.probability}
          palette={palette}
          tip={charts.probabilityTip}
          legend={[{ label: A.probabilityLegend[0], color: 0 }, { label: A.probabilityLegend[1], color: 0, dashed: true }, { label: A.probabilityLegend[2], color: 2 }, { label: A.probabilityLegend[3], color: 2, dashed: true }]}
        />
      </div>
      <Paras list={A.after(s)} />
    </>
  );
});

const Aggregate = React.memo(function Aggregate({ s, job, text, palette }) {
  const G = text.aggregate;
  const F = text.fmt;
  const chart = useMemo(() => (s ? view.systemsChart(s.models.bernoulli, F.decimal) : null), [s, F]);
  const tip = useMemo(() => (chart ? view.tips.histogram(chart, text.tips) : null), [chart, text]);
  if (!s) return <Pending text={text} result={job} />;
  return (
    <>
      <Paras list={G.paras(s)} />
      <Figure
        wide
        title={G.systemsChart(s.params.n, s.params.m)}
        draw={hw.drawHistogram}
        data={chart}
        palette={palette}
        tip={tip}
        legend={[{ label: G.systemsLegend[0], color: 0 }, { label: G.systemsLegend[1], color: 1, dashed: true }, { label: G.systemsLegend[2], color: 2 }]}
      />
      <Paras list={G.after} />
    </>
  );
});

// --- 7, 8 e 9 ------------------------------------------------------------------------------

const TestsSummary = React.memo(function TestsSummary({ s, job, text }) {
  const T = text.tests;
  const F = text.fmt;
  const summary = useMemo(() => (s ? view.testSummary(s) : null), [s]);
  return (
    <section className="hw1-section hw2 hw3 hw2-far">
      <Title id="hw3-tests" level={0}>{text.sections.tests}</Title>
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <p>{T.intro(s)}</p>
          <table className="hw1-table hw1-discussion-table hw2-summary hw3-summary">
            <thead>
              <tr><th>{T.cols.subject}</th><th>{T.cols.hypothesis}</th><th>{T.cols.p}</th><th>{T.cols.verdict}</th><th>{T.cols.expected}</th></tr>
            </thead>
            <tbody>
              {summary.all.map((t) => {
                const rejected = t.result.verdict === 'reject';
                return (
                  <tr key={`${t.group}|${t.key}`} className={rejected ? 'is-rejected' : ''}>
                    <th data-label={T.cols.subject}>{text.stats.groups[t.group]}</th>
                    <td data-label={T.cols.hypothesis}>{text.stats.labels[t.group][t.key]}</td>
                    <td data-label={T.cols.p}>{F.pval(t.result.pValue)}</td>
                    <td data-label={T.cols.verdict}>{text.stats.verdict[rejected ? 'reject' : 'notReject']}</td>
                    <td data-label={T.cols.expected}>{text.stats.expected[t.expected]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Paras list={T.after(summary, s)} />
        </>
      )}
    </section>
  );
});

const History = React.memo(function History({ text }) {
  const H = text.history;
  return (
    <section className="hw1-section hw2 hw3 hw2-far">
      <Title id="hw3-history" level={0}>{text.sections.history}</Title>
      <p>{H.intro}</p>
      <p className="hw2-legend">
        <span className="hw2-legend-task">{H.legend.task}</span>
        <span className="hw2-legend-context">{H.legend.context}</span>
      </p>
      <ol className="hw2-timeline">
        {H.events.map((e) => (
          <li key={`${e.year}-${e.title}`} className={e.task ? 'is-task' : 'is-context'}>
            <span className="hw2-year">{e.year}</span>
            <div>
              <strong>{e.title}</strong>
              <p>{e.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p>{H.after}</p>
    </section>
  );
});

const Conclusion = React.memo(function Conclusion({ s, text }) {
  return (
    <section className="hw1-section hw2 hw3 hw2-far">
      <Title id="hw3-conclusion" level={0}>{text.sections.conclusion}</Title>
      <Paras list={text.conclusion(s)} />
    </section>
  );
});

// --- La pagina --------------------------------------------------------------------------------

const Homework3 = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const text = HW3_TEXTS[language] || HW3_TEXTS.en;
  const palette = PALETTES[theme === 'dark' ? 'dark' : 'light'];
  const S = text.sections;
  const I = text.input;

  // --- 1.3 i campi, e l'ultimo valore valido di ognuno ---
  const [fields, setFields] = useState(view.DEFAULT_INPUTS);
  const [params, setParams] = useState(view.DEFAULT_PARAMS);
  const read = useMemo(() => view.readInputs(fields), [fields]);
  const change = (patch) => {
    const next = { ...fields, ...patch };
    setFields(next);
    setParams((prev) => view.applyInputs(view.readInputs(next), prev));
  };
  const restore = () => change(view.DEFAULT_INPUTS);

  // la simulazione parte quando i campi smettono di cambiare; intanto restano i risultati di prima
  const key = useSettled(view.paramsKey(params));
  const settled = useMemo(() => view.parseParamsKey(key), [key]);
  const job = useExplore(key);
  const [previous, setPrevious] = useState(null);
  if (job.value && previous !== job.value) setPrevious(job.value);
  const s = job.value || previous;
  // una simulazione nuova e' in arrivo: i campi sono cambiati, o quella partita non ha ancora finito
  const waiting = s !== null && !job.error && (view.paramsKey(params) !== key || !job.value);
  const [epsilon, setEpsilon] = useState(hw.DEFAULT_EPSILON);

  const badge = view.inputBadge(params, I);
  const valid = view.allValid(read);

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
            <a href={`${DOWNLOADS}homework3.zip`} download="homework3.zip" className="button icon solid fa-download">{text.download.zip}</a>
            <a href={`${DOWNLOADS}homework3/index.html?lang=${language === 'en' ? 'en' : 'it'}`} target="_blank" rel="noopener noreferrer" className="button alt icon solid fa-external-link-alt">{text.download.online}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <HomeworkShell slug="homework-3" sidebar={sidebar} toc={toc}>
      <Assignment text={text} />

      {/* 1. TASK: il modello */}
      <section className="hw1-section hw2 hw3">
        <Title id="hw3-model" level={0}>{S.model}</Title>
        <Paras list={text.model.intro} />
        <Formulas title={text.model.formulasTitle}>{text.model.formulas}</Formulas>

        <Title id="hw3-models" level={1}>{S.models}</Title>
        <Models p={params.p} text={text} />

        <Title id="hw3-quantities" level={1}>{S.quantities}</Title>
        <Quantities text={text} />

        <Title id="hw3-input" level={1}>{S.input}</Title>
        <p>{I.intro}</p>
        <div className="hw3-fields">
          <Field id="hw3-p" label={I.pLabel} value={fields.pText} onChange={(v) => change({ pText: v })} maxLength={view.FIELD_LENGTH.p} inputMode="decimal" error={fieldError(read.p, I, 'p')} hint={I.pHint} />
          <Field id="hw3-n" label={I.nLabel} value={fields.nText} onChange={(v) => change({ nText: v })} maxLength={view.FIELD_LENGTH.n} inputMode="numeric" error={fieldError(read.n, I, 'n')} hint={I.nHint} />
          <Field id="hw3-m" label={I.mLabel} value={fields.mText} onChange={(v) => change({ mText: v })} maxLength={view.FIELD_LENGTH.m} inputMode="numeric" error={fieldError(read.m, I, 'm')} hint={I.mHint} />
          <Field id="hw3-seed" label={I.seedLabel} value={fields.seedText} onChange={(v) => change({ seedText: v })} maxLength={view.FIELD_LENGTH.seed} inputMode="numeric" error={fieldError(read.seed, I, 'seed')} hint={I.seedHint}>
            <button type="button" className="button alt" onClick={() => change({ seedText: String(hw.randomSeed()) })}>{I.randomSeed}</button>
          </Field>
        </div>
        {!valid && <p className="hw2-stale" role="status">{I.stale}</p>}
        <p className={badge.known ? 'hw1-badge-line is-task' : 'hw1-badge-line is-custom'}>
          <span>{badge.text}</span>
          {badge.restore && <button type="button" className="button alt hw1-restore" onClick={restore}>{I.restore}</button>}
        </p>
        {waiting && <p className="hw2-stale" role="status">{I.pending}</p>}
        {job.error && <p className="hw1-note">{text.ui.error(job.error)}</p>}
        {s && !waiting && <p className="hw1-note" role="status">{I.run(s)}</p>}

        <Title id="hw3-trajectories" level={1}>{S.trajectories}</Title>
        <Trajectories params={settled} text={text} palette={palette} />

        <Title id="hw3-verify" level={1}>{S.verify}</Title>
        <Verify text={text} />
        {s && <Tests group="sim" s={s} text={text} />}
      </section>

      {/* 2. Le distribuzioni */}
      <section className="hw1-section hw2 hw3">
        <Title id="hw3-distributions" level={0}>{S.distributions}</Title>
        <Paras list={text.distributions.intro} />

        <Title id="hw3-sweep" level={1}>{S.sweep}</Title>
        <Sweep s={s} job={job} text={text} palette={palette} />

        <Title id="hw3-moments" level={1}>{S.moments}</Title>
        <Moments s={s} job={job} text={text} />

        <Title id="hw3-choice" level={1}>{S.choice}</Title>
        <Choice s={s} job={job} epsilon={epsilon} text={text} />
      </section>

      {/* 3. La legge dei grandi numeri */}
      <section className="hw1-section hw2 hw3 hw2-far">
        <Title id="hw3-lln" level={0}>{S.lln}</Title>
        <Paras list={text.lln.intro} />

        <Title id="hw3-convergence" level={1}>{S.convergence}</Title>
        <Convergence s={s} job={job} epsilon={epsilon} setEpsilon={setEpsilon} text={text} palette={palette} />

        <Title id="hw3-bounds" level={1}>{S.bounds}</Title>
        {s ? <Paras list={text.bounds.paras(s, epsilon)} /> : <Pending text={text} result={job} />}

        <Title id="hw3-strong" level={1}>{S.strong}</Title>
        <Paras list={text.strong.paras} />
      </section>

      {/* 4. La varianza */}
      <section className="hw1-section hw2 hw3 hw2-far">
        <Title id="hw3-variance" level={0}>{S.variance}</Title>
        <Variance s={s} job={job} text={text} palette={palette} />
      </section>

      {/* 5. Il teorema del limite centrale */}
      <section className="hw1-section hw2 hw3 hw2-far">
        <Title id="hw3-clt" level={0}>{S.clt}</Title>
        <Paras list={text.clt.intro} />

        <Title id="hw3-normal" level={1}>{S.normal}</Title>
        <Normal s={s} job={job} text={text} palette={palette} />

        <Title id="hw3-speed" level={1}>{S.speed}</Title>
        <Speed s={s} job={job} text={text} palette={palette} />

        <Title id="hw3-bernoulli" level={1}>{S.bernoulli}</Title>
        <Drift s={s} job={job} text={text} />
      </section>

      {/* 6. Sistemi e attaccanti */}
      <section className="hw1-section hw2 hw3 hw2-far">
        <Title id="hw3-interpretation" level={0}>{S.interpretation}</Title>
        <Paras list={text.interpretation.intro} />

        <Title id="hw3-size" level={1}>{S.size}</Title>
        <Size s={s} job={job} text={text} palette={palette} />

        <Title id="hw3-attackers" level={1}>{S.attackers}</Title>
        <Attackers s={s} job={job} text={text} palette={palette} />

        <Title id="hw3-aggregate" level={1}>{S.aggregate}</Title>
        <Aggregate s={s} job={job} text={text} palette={palette} />

        <Title id="hw3-limits" level={1}>{S.limits}</Title>
        <Paras list={text.limits.paras} />
      </section>

      <TestsSummary s={s} job={job} text={text} />

      <History text={text} />

      <Conclusion s={s} text={text} />
    </HomeworkShell>
  );
};

export default Homework3;
