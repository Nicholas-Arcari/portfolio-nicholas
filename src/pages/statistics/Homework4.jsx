// src/pages/statistics/Homework4.jsx
// Homework #4 di Statistics, in due parti con un solo indirizzo. La Part 1
// ricava le formule ricorsive di Welford per la somma dei quadrati e la
// varianza, con lo stesso procedimento della formula di Knuth per la media,
// le scrive in tre righe di codice, le anima passo per passo e ne misura la
// stabilita' numerica. La Part 2 estende l'Homework #3: m hacker su n
// sistemi, un punteggio da 0 a 10 per tentativo, media e varianza
// campionarie di ogni hacker con quelle tre righe, il confronto con μ e σ²,
// la variabilita' al crescere di n e il legame con l'inferenza; poi i test,
// il contesto storico e le conclusioni.
//
// Qui c'e' solo la pagina React. Le formule, la simulazione, la statistica,
// i grafici e l'animazione stanno in hw4/homework4.js, i testi in
// hw4/texts.js e la logica di presentazione in hw4/view.js: sono gli stessi
// file da cui la build ricava il programma scaricabile
// (build/homework-standalone.js), cosi' la pagina e il download non possono
// raccontare due cose diverse.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/languageContext';
import { useTheme } from '../../contexts/themeContext';
import HomeworkShell from './HomeworkShell';
import * as hw from './hw4/homework4';
import * as view from './hw4/view';
import { HW4_TEXTS, originalAssignment } from './hw4/texts';
import { useExplore, useSettled } from './hw4/useJob';

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
// del pezzo sotto il puntatore: il disegno vero e' in homework4.js.
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

// Il cursore sui passi o sui punti di osservazione (n = 2, 5, 10, ...)
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
 * `choose` moves it by hand and stops playing, choose(null) goes back to the
 * fallback.
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

// --- 0. La consegna ------------------------------------------------------------

const Assignment = React.memo(function Assignment({ text }) {
  return (
    <section className="hw1-section hw2 hw3 hw4">
      <Title id="hw4-assignment" level={0}>{text.sections.assignment}</Title>
      <Paras list={text.assignment.intro} />
      <details className="hw1-original" open>
        <summary>{text.assignment.originalTitle}</summary>
        <p className="hw1-note">{text.assignment.originalNote}</p>
        <blockquote lang="en">
          {originalAssignment().map((block, i) => (block.type === 'h' ? <p key={i}><strong>{block.text}</strong></p> : <p key={i}>{block.text}</p>))}
        </blockquote>
      </details>
    </section>
  );
});

// --- 1.1, 1.2, 1.3 e 1.4 Le formule e il codice ------------------------------------

const Derivation = ({ block, formulas }) => (
  <>
    <Paras list={block.intro} />
    <Formulas title={block.formulasTitle}>{formulas}</Formulas>
    <Paras list={block.after} />
  </>
);

const Code = React.memo(function Code({ text }) {
  const C = text.code;
  return (
    <>
      <Paras list={C.intro} />
      <p className="hw1-table-title"><strong>{C.coreTitle}</strong></p>
      <pre className="hw1-formulas hw4-core">{hw.WELFORD_LINES.join('\n')}</pre>
      <p className="hw1-table-title"><strong>{C.fullTitle}</strong></p>
      <pre className="hw1-formulas hw4-code">{view.welfordCode()}</pre>
      <Paras list={C.after} />
    </>
  );
});

// --- 1.5 Passo per passo -------------------------------------------------------------

const Steps = ({ text, palette }) => {
  const S = text.steps;
  const F = text.fmt;
  const [dataText, setDataText] = useState(view.DEFAULT_DATA_TEXT);
  const [values, setValues] = useState(hw.DEFAULT_DATA);
  const read = useMemo(() => hw.parseData(dataText), [dataText]);
  const rows = useMemo(() => hw.welfordSteps(values), [values]);
  const last = rows.length - 1;
  const [index, playing, toggle, choose] = usePlayer(last, last, 1000);
  const change = (t) => {
    const next = t.slice(0, view.DATA_LENGTH);
    setDataText(next);
    const r = hw.parseData(next);
    if (r.ok) {
      setValues(r.value);
      choose(null);
    }
  };
  const data = useMemo(() => view.stepsChart(rows, index + 1, F.decimal), [rows, index, F]);
  const tip = useMemo(() => view.tips.steps(rows, text.tips), [rows, text]);
  const check = useMemo(() => view.stepsCheck(values), [values]);
  const error = read.ok ? null : S.errors[read.error](read.text);
  const row = rows[index];
  let playLabel = S.play;
  if (playing) playLabel = S.pause;
  else if (index > 0 && index < last) playLabel = S.resume;
  return (
    <>
      <Paras list={S.intro} />
      <div className="hw3-field hw4-data">
        <label htmlFor="hw4-data">{S.dataLabel}</label>
        <span className="hw3-field-row">
          <input id="hw4-data" type="text" inputMode="decimal" {...FIELD} maxLength={view.DATA_LENGTH} value={dataText} onChange={(e) => change(e.target.value)} aria-invalid={Boolean(error)} aria-describedby="hw4-data-help" />
          {dataText !== view.DEFAULT_DATA_TEXT && <button type="button" className="button alt" onClick={() => change(view.DEFAULT_DATA_TEXT)}>{S.restore}</button>}
        </span>
        <p id="hw4-data-help" className={error ? 'hw1-field-error' : 'hw1-note'} role={error ? 'alert' : undefined}>{error || S.dataHint}</p>
      </div>
      {error && <p className="hw2-stale" role="status">{S.stale}</p>}
      <div className="hw3-slider-row">
        <Slider id="hw4-step" label={S.chart(index + 1, rows.length)} valueText={S.chart(index + 1, rows.length)} max={last} value={index} onChange={choose} />
        <span className="hw1-buttons">
          <button type="button" className="button" onClick={toggle}>{playLabel}</button>
          <button type="button" className="button alt" onClick={() => choose(index >= last ? 0 : index + 1)}>{S.step}</button>
          <button type="button" className="button alt" onClick={() => choose(0)}>{S.reset}</button>
          <button type="button" className="button alt" onClick={() => choose(last)}>{S.end}</button>
        </span>
      </div>
      <Figure
        title={S.chart(index + 1, rows.length)}
        draw={hw.drawWelfordChart}
        data={data}
        palette={palette}
        tip={tip}
        wide
        legend={[
          { label: S.legend[0], color: 0 },
          { label: S.legend[1], color: 1 },
          { label: S.legend[2], color: 2 },
          { label: S.legend[3], color: 3 },
          { label: S.legend[4], color: 4 },
        ]}
      />
      <p className="hw1-caption hw4-line" aria-live={playing ? 'off' : 'polite'}>{S.line(row, rows[index - 1])}</p>
      <p className="hw1-table-title"><strong>{S.tableTitle}</strong></p>
      <div className={rows.length > 16 ? 'hw1-scroll' : 'hw4-table'}>
        <table className="hw1-table hw1-compact hw4-steps">
          <thead>
            <tr>{['k', 'x', 'delta', 'mean', 'after', 'increment', 'ss', 'variance'].map((key) => <th key={key}>{S.cols[key]}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.k} className={i === index ? 'is-current' : i > index ? 'is-future' : ''}>
                <th>{r.k}</th>
                <td data-label={S.cols.x}>{F.sig(r.x)}</td>
                <td data-label={S.cols.delta}>{F.sig(r.delta)}</td>
                <td data-label={S.cols.mean}>{F.sig(r.mean)}</td>
                <td data-label={S.cols.after}>{F.sig(r.after)}</td>
                <td data-label={S.cols.increment}>{F.sig(r.increment)}</td>
                <td data-label={S.cols.ss}>{F.sig(r.ss)}</td>
                <td data-label={S.cols.variance}>{r.k > 1 ? F.sig(r.variance) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Check ok={check.welfordError < 1e-9}>{S.check(check)}</Check>
      <Paras list={S.after} />
    </>
  );
};

// --- 1.6 La stabilita' numerica --------------------------------------------------------

const Stability = React.memo(function Stability({ text, palette }) {
  const S = text.stability;
  const F = text.fmt;
  const rows = useMemo(() => hw.cancellationRows(), []);
  const curve = useMemo(() => hw.stabilityCurve(), []);
  const data = useMemo(() => view.stabilityChart(curve, F.decimal), [curve, F]);
  const tip = useMemo(() => view.tips.stability(curve, text.tips), [curve, text]);
  const offset = (c) => (c === 0 ? '0' : F.pow(Math.round(Math.log10(c))));
  return (
    <>
      <Paras list={S.intro} />
      <p className="hw1-table-title"><strong>{S.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw4-cancellation">
          <thead>
            <tr><th>{S.cols.offset}</th><th>{S.cols.naive}</th><th>{S.cols.twoPass}</th><th>{S.cols.welford}</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.offset}>
                <th>{offset(r.offset)}</th>
                <td data-label={S.cols.naive} className={Math.abs(r.naive - 30) > 1e-9 ? 'hw3-over' : ''}>{F.sig(r.naive, 17)}</td>
                <td data-label={S.cols.twoPass}>{F.sig(r.twoPass, 17)}</td>
                <td data-label={S.cols.welford}>{F.sig(r.welford, 17)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hw1-charts">
        <Figure
          title={S.chartTitle(text.fmt.int(curve.size))}
          draw={hw.drawLineChart}
          data={data}
          palette={palette}
          tip={tip}
          wide
          legend={[
            { label: S.legend[0], color: 1 },
            { label: S.legend[1], color: 3 },
            { label: S.legend[2], color: 0 },
          ]}
        />
      </div>
      <Paras list={S.facts(view.stabilityFacts(curve))} />
      <Paras list={S.after} />
    </>
  );
});

// --- 1.7 Verifiche -------------------------------------------------------------------------

const Verify = React.memo(function Verify({ text }) {
  const V = text.checks;
  const rows = useMemo(() => hw.verifyAll(), []);
  const ok = rows.filter((r) => r.ok).length;
  const groups = ['welford', 'generator', 'functions'].map((group) => ({ group, rows: rows.filter((r) => r.group === group) }));
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

// --- 2.1 La distribuzione dei punteggi ------------------------------------------------------

const Scores = ({ params, setDist, s, text, palette }) => {
  const S = text.scores;
  const F = text.fmt;
  const law = useMemo(() => hw.scoreLaw(params.dist, params.p), [params.dist, params.p]);
  const laws = useMemo(() => view.lawRows(params.p), [params.p]);
  const data = useMemo(() => view.scoresChart(law, s, F.decimal), [law, s, F]);
  const tip = useMemo(() => view.tips.scores(data, law.discrete, text.tips), [data, law, text]);
  const simulated = Boolean(data.expected);
  const legend = S.legend(law.discrete, simulated)
    .map((label, i) => label && { label, color: i, dashed: i === 1 })
    .filter(Boolean);
  return (
    <>
      <Paras list={S.intro(params.p)} />
      <Choices label={S.chooseLabel} options={hw.DISTRIBUTIONS.map((d) => [d, text.distNames[d]])} value={params.dist} onChange={setDist} />
      <p className="hw1-table-title"><strong>{S.tableTitle(params.p)}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw4-laws">
          <thead>
            <tr><th>{S.cols.law}</th><th>{S.cols.values}</th><th>{S.cols.mu}</th><th>{S.cols.variance}</th><th>{S.cols.skewness}</th><th>{S.cols.kurtosis}</th><th>{S.cols.mu4}</th></tr>
          </thead>
          <tbody>
            {laws.map((L) => (
              <tr key={L.dist} className={L.dist === params.dist ? 'is-current' : ''}>
                <th>{text.distNames[L.dist]}</th>
                <td data-label={S.cols.values}>{S.values[L.dist]}</td>
                <td data-label={S.cols.mu}>{F.num(L.mu, 4)}</td>
                <td data-label={S.cols.variance}>{F.num(L.variance, 4)}</td>
                <td data-label={S.cols.skewness}>{F.num(L.skewness, 4)}</td>
                <td data-label={S.cols.kurtosis}>{F.num(L.kurtosis, 4)}</td>
                <td data-label={S.cols.mu4}>{F.num(L.mu4, 3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paras list={S.after} />
      <div className="hw1-charts">
        <Figure title={S.chartTitle(text.distNames[params.dist], simulated)} draw={hw.drawHistogram} data={data} palette={palette} tip={tip} wide legend={legend} />
      </div>
      {s && simulated && <Tests group="sim" s={s} text={text} />}
    </>
  );
};

// --- 2.2 I campi --------------------------------------------------------------------------------

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

// --- 2.3 Le traiettorie ---------------------------------------------------------------------------

// L'animazione: il disegno e i calcoli passo per passo sono di homework4.js,
// qui i controlli. Si ricrea quando cambiano i parametri; grandezza,
// velocita', colori e lingua le arrivano senza ricrearla.
const Trajectories = ({ params, text, palette }) => {
  const T = text.trajectories;
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [quantity, setQuantity] = useState('mean');
  const [speed, setSpeed] = useState(1);
  const [status, setStatus] = useState(null);
  const settingsRef = useRef({ quantity, speed: view.ANIMATION.speeds[speed], palette, decimal: text.fmt.decimal, describe: view.tips.trajectory(text) });

  useEffect(() => {
    settingsRef.current = { quantity, speed: view.ANIMATION.speeds[speed], palette, decimal: text.fmt.decimal, describe: view.tips.trajectory(text) };
  }, [quantity, speed, palette, text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const settings = settingsRef.current;
    const anim = hw.createScoreAnimation(canvas, { ...view.animationOptions(params), ...settings, onUpdate: setStatus });
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
  }, [params]);

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

  const sizes = view.animationOptions(params);
  const playing = Boolean(status && status.playing);
  let playLabel = T.play;
  if (playing) playLabel = T.pause;
  else if (status && status.k > 0 && !status.done) playLabel = T.resume;
  return (
    <>
      <Paras list={T.intro(sizes.shown, sizes.sample)} />
      <div className="hw3-anim-controls">
        <Choices label={T.quantityLabel} options={hw.QUANTITIES.map((q) => [q, text.quantityNames[q]])} value={quantity} onChange={setQuantity} />
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
      <p className="hw1-caption" aria-live={playing ? 'off' : 'polite'}>{status ? T.caption(status, text.quantityNames[status.quantity]) : ''}</p>
      <Paras list={T.after} />
    </>
  );
};

// --- 2.4 e 2.5 Le medie e il confronto ----------------------------------------------------------------

const zClass = (z) => (Math.abs(z) > 1.959963984540054 ? 'hw3-over' : '');

const Averages = React.memo(function Averages({ s, job, text, palette }) {
  const A = text.averages;
  const F = text.fmt;
  const rows = useMemo(() => (s ? view.averageRows(s) : null), [s]);
  const charts = useMemo(() => {
    if (!s) return null;
    return {
      means: { data: view.meansChart(s, F.decimal), tip: view.tips.means(s, text.tips) },
      variances: { data: view.variancesChart(s, F.decimal), tip: view.tips.variances(s, text.tips) },
    };
  }, [s, F, text]);
  return (
    <>
      <Paras list={A.intro(s)} />
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <p className="hw1-table-title"><strong>{A.tableTitle(s.m)}</strong></p>
          <div className="hw1-scroll">
            <table className="hw1-table hw1-compact hw4-averages">
              <thead>
                <tr>{['n', 'mean', 'meanZ', 'variance', 'varianceZ', 'biased', 'biasedTheory'].map((key) => <th key={key}>{A.cols[key]}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.n}>
                    <th>{F.int(r.n)}</th>
                    <td data-label={A.cols.mean}>{F.num(r.mean, 4)}</td>
                    <td data-label={A.cols.meanZ} className={zClass(r.meanZ)}>{F.num(r.meanZ, 2)}</td>
                    <td data-label={A.cols.variance}>{F.num(r.variance, 4)}</td>
                    <td data-label={A.cols.varianceZ} className={zClass(r.varianceZ)}>{F.num(r.varianceZ, 2)}</td>
                    <td data-label={A.cols.biased}>{F.num(r.biased, 4)}</td>
                    <td data-label={A.cols.biasedTheory}>{F.num(r.biasedTheory, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hw1-charts">
            <Figure title={A.meansChart(s.m)} draw={hw.drawLineChart} data={charts.means.data} palette={palette} tip={charts.means.tip} legend={[{ label: A.legendMeans[0], color: 2, dashed: true }, { label: A.legendMeans[1], color: 0 }]} />
            <Figure
              title={A.variancesChart(s.m)}
              draw={hw.drawLineChart}
              data={charts.variances.data}
              palette={palette}
              tip={charts.variances.tip}
              legend={[{ label: A.legendVariances[0], color: 2, dashed: true }, { label: A.legendVariances[1], color: 0 }, { label: A.legendVariances[2], color: 1, dashed: true }, { label: A.legendVariances[3], color: 1 }]}
            />
          </div>
          <Paras list={A.facts(s)} />
          <Tests group="averages" s={s} text={text} />
        </>
      )}
    </>
  );
});

const Comparison = React.memo(function Comparison({ s, text }) {
  const C = text.comparison.paras(s);
  return (
    <>
      <Paras list={C.before} />
      <Formulas title={text.comparison.formulasTitle}>{text.formulas.unbiased}</Formulas>
      <Paras list={C.after} />
    </>
  );
});

// --- 2.6 La variabilita' al crescere di n ---------------------------------------------------------------

const Spread = React.memo(function Spread({ s, job, text, palette }) {
  const S = text.spread;
  const F = text.fmt;
  const [mode, setMode] = useState('fixed');
  const last = s ? s.points.length - 1 : 0;
  const [g, playing, toggle, choose] = usePlayer(last, 0);
  const charts = useMemo(() => {
    if (!s) return null;
    const mean = view.spreadHistogram(s, g, 'mean', mode, F.decimal);
    const variance = view.spreadHistogram(s, g, 'variance', mode, F.decimal);
    return {
      mean: { data: mean, tip: view.tips.histogram(mean, text.tips) },
      variance: { data: variance, tip: view.tips.histogram(variance, text.tips) },
      spread: { data: view.spreadChart(s, F.decimal), tip: view.tips.spread(s, text.tips) },
    };
  }, [s, g, mode, F, text]);
  const rows = useMemo(() => (s ? view.spreadRows(s) : null), [s]);
  return (
    <>
      <Paras list={S.intro} />
      <Formulas title={S.formulasTitle}>{text.formulas.spread}</Formulas>
      <Paras list={S.afterFormulas} />
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <div className="hw3-sweep-controls">
            <Choices label={S.axisLabel} options={view.AXIS_MODES.map((m) => [m, S.axisNames[m]])} value={mode} onChange={setMode} />
            <div className="hw3-slider-row">
              <Slider id="hw4-spread-n" label={S.nLabel(s.points[g].n)} valueText={S.nLabel(s.points[g].n)} max={last} value={g} onChange={choose} />
              <button type="button" className="button alt" onClick={toggle}>{playing ? S.pause : S.play}</button>
            </div>
          </div>
          <div className="hw1-charts">
            <Figure title={S.histMean(s.points[g].n, s.m)} draw={hw.drawHistogram} data={charts.mean.data} palette={palette} tip={charts.mean.tip} note={S.histNote(s.points[g].meanStats, s.points[g].theory, 'mean')} />
            <Figure title={S.histVariance(s.points[g].n, s.m)} draw={hw.drawHistogram} data={charts.variance.data} palette={palette} tip={charts.variance.tip} note={S.histNote(s.points[g].varStats, s.points[g].theory, 'variance')} />
          </div>
          <Legend items={[{ label: S.legendHist[0], color: 0 }, { label: S.legendHist[1], color: 2 }]} palette={palette} />
          <div className="hw1-charts">
            <Figure
              title={S.chartTitle}
              draw={hw.drawLineChart}
              data={charts.spread.data}
              palette={palette}
              tip={charts.spread.tip}
              wide
              legend={[
                { label: S.legend[0], color: 0 },
                { label: S.legend[1], color: 0, dashed: true },
                { label: S.legend[2], color: 1 },
                { label: S.legend[3], color: 1, dashed: true },
                { label: S.legend[4], color: 3, dashed: true },
              ]}
            />
          </div>
          <p className="hw1-table-title"><strong>{S.tableTitle}</strong></p>
          <div className="hw1-scroll">
            <table className="hw1-table hw1-compact hw4-spread">
              <thead>
                <tr>{['n', 'varMean', 'varMeanTheory', 'varVariance', 'varVarianceTheory', 'normalVariance', 'skewMean'].map((key) => <th key={key}>{S.cols[key]}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.n}>
                    <th>{F.int(r.n)}</th>
                    <td data-label={S.cols.varMean}>{F.sig(r.varMean, 4)}</td>
                    <td data-label={S.cols.varMeanTheory}>{F.sig(r.varMeanTheory, 4)}</td>
                    <td data-label={S.cols.varVariance}>{F.sig(r.varVariance, 4)}</td>
                    <td data-label={S.cols.varVarianceTheory}>{F.sig(r.varVarianceTheory, 4)}</td>
                    <td data-label={S.cols.normalVariance}>{F.sig(r.normalVariance, 4)}</td>
                    <td data-label={S.cols.skewMean}>{`${F.num(r.skewMean, 3)} (${F.num(r.skewMeanTheory, 3)})`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paras list={S.facts(s)} />
          <Tests group="spread" s={s} text={text} />
        </>
      )}
    </>
  );
});

// --- 2.7 Statistica inferenziale ---------------------------------------------------------------------------

const Inference = React.memo(function Inference({ s, job, text, palette }) {
  const I = text.inference;
  const F = text.fmt;
  const last = s ? s.points.length - 1 : 0;
  const [chosen, setChosen] = useState(null);
  const g = Math.min(chosen === null ? last : chosen, last);
  const charts = useMemo(() => {
    if (!s) return null;
    const scatter = view.scatterData(s, g, F.decimal);
    return {
      coverage: { data: view.coverageChart(s, F.decimal), tip: view.tips.coverage(s, text.tips) },
      scatter: { data: scatter, tip: view.tips.scatter(scatter, text.tips) },
    };
  }, [s, g, F, text]);
  const rows = useMemo(() => (s ? view.inferenceRows(s) : null), [s]);
  return (
    <>
      <Paras list={I.intro} />
      <ul className="hw4-list">
        {I.list.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <Paras list={I.afterList} />
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <div className="hw3-slider-row">
            <Slider id="hw4-scatter-n" label={I.nLabel(s.points[g].n)} valueText={I.nLabel(s.points[g].n)} max={last} value={g} onChange={setChosen} />
          </div>
          <div className="hw1-charts">
            <Figure
              title={I.coverageTitle}
              draw={hw.drawLineChart}
              data={charts.coverage.data}
              palette={palette}
              tip={charts.coverage.tip}
              legend={[{ label: I.coverageLegend[0], color: 2, dashed: true }, { label: I.coverageLegend[1], color: 1, dashed: true }, { label: I.coverageLegend[2], color: 0 }, { label: I.coverageLegend[3], color: 1 }]}
            />
            <Figure title={I.scatterTitle(s.points[g].n, s.m)} draw={hw.drawScatter} data={charts.scatter.data} palette={palette} tip={charts.scatter.tip} legend={[{ label: I.scatterLegend[0], color: 0 }, { label: I.scatterLegend[1], color: 1, dashed: true }, { label: I.scatterLegend[2], color: 2, dashed: true }]} />
          </div>
          <p className="hw1-table-title"><strong>{I.tableTitle}</strong></p>
          <div className="hw1-scroll">
            <table className="hw1-table hw1-compact hw4-inference">
              <thead>
                <tr>{['n', 't', 'tQuantile', 'chi2', 'corr', 'corrTheory'].map((key) => <th key={key}>{I.cols[key]}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.n}>
                    <th>{F.int(r.n)}</th>
                    <td data-label={I.cols.t}>{F.pct(r.t, 2)}</td>
                    <td data-label={I.cols.tQuantile}>{F.num(r.tQuantile, 3)}</td>
                    <td data-label={I.cols.chi2}>{F.pct(r.chi2, 2)}</td>
                    <td data-label={I.cols.corr}>{F.num(r.corr, 3)}</td>
                    <td data-label={I.cols.corrTheory}>{F.num(r.corrTheory, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paras list={I.facts(s)} />
          <Tests group="inference" s={s} text={text} />
        </>
      )}
    </>
  );
});

// --- Gli esempi interattivi ("Prova") -----------------------------------------------------

// 1.2: i dati da trascinare. Il disegno e i conti sono di homework4.js
// (createWelfordDrag), qui i pulsanti, il cursore e la didascalia.
const TryDrag = ({ text, palette }) => {
  const D = text.tryDrag;
  const F = text.fmt;
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const [stats, setStats] = useState(null);
  const settingsRef = useRef({ palette, decimal: F.decimal });
  useEffect(() => {
    settingsRef.current = { palette, decimal: F.decimal };
  }, [palette, F]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const drag = hw.createWelfordDrag(canvas, { ...view.DRAG, ...settingsRef.current, onChange: setStats });
    dragRef.current = drag;
    let width = canvas.clientWidth;
    const observer = new ResizeObserver(() => {
      if (canvas.clientWidth === width) return;
      width = canvas.clientWidth;
      drag.redraw();
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      drag.destroy();
      dragRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (dragRef.current) dragRef.current.setPalette(palette);
  }, [palette]);
  useEffect(() => {
    if (dragRef.current) dragRef.current.setDecimal(F.decimal);
  }, [F]);
  const k = stats ? stats.k : view.DRAG.values.length;
  const x = stats ? stats.x : view.DRAG.values[view.DRAG.values.length - 1];
  const call = (action, ...args) => dragRef.current && dragRef.current[action](...args);
  return (
    <div className="hw4-try">
      <Title id="hw4-try-drag" level={2}>{text.sections.tryDrag}</Title>
      <Paras list={D.intro} />
      <div className="hw3-slider-row">
        <Slider id="hw4-drag-x" label={D.sliderLabel(k, F.sig(x, 3))} valueText={D.sliderLabel(k, F.sig(x, 3))} max={10 * (view.DRAG.hi - view.DRAG.lo)} value={Math.round(10 * (x - view.DRAG.lo))} onChange={(v) => call('setValue', k - 1, view.DRAG.lo + v / 10)} />
        <span className="hw1-buttons">
          <button type="button" className="button alt" onClick={() => call('add', view.DRAG.lo + Math.round(Math.random() * 10 * (view.DRAG.hi - view.DRAG.lo)) / 10)} disabled={k >= hw.DATA_MAX}>{D.add}</button>
          <button type="button" className="button alt" onClick={() => call('removeLast')} disabled={k <= 2}>{D.remove}</button>
          <button type="button" className="button alt" onClick={() => call('reset')}>{D.reset}</button>
        </span>
      </div>
      {/* posizionato, come gli altri grafici */}
      <div className="hw1-figure">
        <canvas ref={canvasRef} className="hw1-canvas hw4-drag" role="img" aria-label={text.sections.tryDrag} />
      </div>
      <Legend
        items={[
          { label: D.legend[0], color: 0 },
          { label: D.legend[1], color: 1 },
          { label: D.legend[2], color: 1, dashed: true },
          { label: D.legend[3], color: 3 },
          { label: D.legend[4], color: 4 },
          { label: D.legend[5], color: 0 },
          { label: D.legend[6], color: 2 },
        ]}
        palette={palette}
      />
      <p className="hw1-caption hw4-line" aria-live="polite">{stats ? D.caption(stats) : ''}</p>
      <Paras list={D.after} />
    </div>
  );
};

// 1.6: la cancellazione dal vivo, cifra per cifra
const TryDigits = ({ text }) => {
  const D = text.tryDigits;
  const [power, setPower] = useState(8);
  const [dataset, setDataset] = useState('classic');
  const report = useMemo(() => view.digitsReport(power, dataset), [power, dataset]);
  return (
    <div className="hw4-try">
      <Title id="hw4-try-digits" level={2}>{text.sections.tryDigits}</Title>
      <Paras list={D.intro} />
      <Choices label={D.datasetLabel} options={view.DIGIT_DATASETS.map((d) => [d, D.datasets[d]])} value={dataset} onChange={setDataset} />
      <div className="hw3-slider-row">
        <Slider id="hw4-digits-c" label={D.powerLabel(power)} valueText={D.powerLabel(power)} max={view.DIGIT_POWERS[1]} value={power} onChange={setPower} />
      </div>
      <p className="hw1-note">{D.exact(report.exact)}</p>
      <div className="hw4-digits">
        {report.rows.map((r) => (
          <div key={r.formula} className="hw4-digit-row">
            <span className="hw4-digit-name">{D.rows[r.formula]}</span>
            <span className="hw4-digit-value">
              {r.parts.map((part, i) => <span key={i} className={part.ok ? 'hw4-digit-ok' : 'hw4-digit-bad'}>{part.text}</span>)}
            </span>
            <span className="hw4-digit-note">{`${D.right(r.right)}, ${D.error(r.error)}`}</span>
          </div>
        ))}
      </div>
      <p className="hw1-table-title"><strong>{D.sumsTitle}</strong></p>
      <div className="hw4-digits">
        {[report.sums.a, report.sums.b].map((num, i) => (
          <div key={D.sumLabels[i]} className="hw4-digit-row">
            <span className="hw4-digit-name">{D.sumLabels[i]}</span>
            <span className="hw4-digit-value">
              <span className="hw4-digit-common">{num.slice(0, report.sums.common)}</span>
              <span className="hw4-digit-bad">{num.slice(report.sums.common)}</span>
              <span className="hw4-digit-common">{report.sums.exponents[i]}</span>
            </span>
          </div>
        ))}
      </div>
      <p>{D.common(report.sums.commonDigits, report.sums.total)}</p>
    </div>
  );
};

// 2.5: Bessel in diretta. Ogni campione e' un hacker della simulazione (stesso seme, stessa legge).
const TryBessel = ({ params, text, palette }) => {
  const B = text.tryBessel;
  const F = text.fmt;
  const [n, setN] = useState(5);
  const key = `${params.dist}|${params.p}|${params.seed}|${n}`;
  const [run, setRun] = useState(() => ({ key, state: view.besselStart(params, n), playing: false }));
  // una legge, un seme o un n diversi: l'esperimento ricomincia
  if (run.key !== key) setRun({ key, state: view.besselStart(params, n), playing: false });
  const { state, playing } = run;
  const advance = (count) => setRun((r) => ({ ...r, state: view.besselAdvance(r.state, count) }));
  useEffect(() => {
    if (!playing) return undefined;
    const timer = setTimeout(() => {
      setRun((r) => {
        if (r.state.count >= view.BESSEL_MAX) return { ...r, playing: false };
        return { ...r, state: view.besselAdvance(r.state, Math.max(1, Math.ceil(r.state.count * 0.06))) };
      });
    }, 70);
    return () => clearTimeout(timer);
  }, [playing, state]);
  const law = useMemo(() => hw.scoreLaw(params.dist, params.p), [params.dist, params.p]);
  const data = useMemo(() => view.besselChart(state, F.decimal), [state, F]);
  const tip = useMemo(() => view.tips.bessel(state, data, text.tips), [state, data, text]);
  const full = state.count >= view.BESSEL_MAX;
  return (
    <div className="hw4-try">
      <Title id="hw4-try-bessel" level={2}>{text.sections.tryBessel}</Title>
      <Paras list={B.intro} />
      <div className="hw3-slider-row">
        <Slider id="hw4-bessel-n" label={B.nLabel(n)} valueText={B.nLabel(n)} max={view.BESSEL_N[1] - view.BESSEL_N[0]} value={n - view.BESSEL_N[0]} onChange={(v) => setN(view.BESSEL_N[0] + v)} />
        <span className="hw1-buttons">
          <button type="button" className="button" onClick={() => setRun((r) => ({ ...r, playing: !r.playing }))} disabled={full}>{playing ? B.pause : B.play}</button>
          <button type="button" className="button alt" onClick={() => advance(1)} disabled={full}>{B.one}</button>
          <button type="button" className="button alt" onClick={() => advance(100)} disabled={full}>{B.hundred}</button>
          <button type="button" className="button alt" onClick={() => advance(1000)} disabled={full}>{B.thousand}</button>
          <button type="button" className="button alt" onClick={() => setRun({ key, state: view.besselStart(params, n), playing: false })}>{B.reset}</button>
        </span>
      </div>
      <div className="hw1-charts">
        <Figure
          title={B.chartTitle(n)}
          draw={hw.drawLineChart}
          data={data}
          palette={palette}
          tip={tip}
          wide
          legend={[
            { label: B.legend[0], color: 2, dashed: true },
            { label: B.legend[1], color: 1, dashed: true },
            { label: B.legend[2], color: 0 },
            { label: B.legend[3], color: 1 },
          ]}
        />
      </div>
      <p className="hw1-caption hw4-line" aria-live={playing ? 'off' : 'polite'}>{B.status(state, law)}</p>
      {state.last && <p className="hw1-note hw4-line">{B.last(state.last)}</p>}
      {full && <p className="hw1-note">{B.limit}</p>}
    </div>
  );
};

// 2.7: cento intervalli di confidenza, verdi o rossi
const TryIntervals = ({ params, text, palette }) => {
  const I = text.tryIntervals;
  const F = text.fmt;
  const [g, setG] = useState(3);
  const [level, setLevel] = useState(0.95);
  const [param, setParam] = useState('mean');
  const [chosenLaw, setChosenLaw] = useState(null);
  const dist = chosenLaw || params.dist;
  const n = view.INTERVAL_NS[g];
  const key = `${dist}|${params.p}|${params.seed}|${n}|${level}|${param}`;
  const [draws, setDraws] = useState({ key, batch: 0 });
  if (draws.key !== key) setDraws({ key, batch: 0 });
  const batch = draws.key === key ? draws.batch : 0;
  const settings = useMemo(() => ({ seed: params.seed, dist, p: params.p, n, level, param }), [params.seed, dist, params.p, n, level, param]);
  const current = useMemo(() => view.intervalBatch({ ...settings, batch }), [settings, batch]);
  // i conteggi di tutte le estrazioni con queste impostazioni
  const totalMisses = useMemo(() => {
    let total = 0;
    for (let b = 0; b < batch; b++) total += view.intervalBatch({ ...settings, batch: b }).misses;
    return total + current.misses;
  }, [settings, batch, current]);
  const data = useMemo(() => view.intervalChart(current, F.decimal), [current, F]);
  const tip = useMemo(() => view.tips.intervals(current, text.tips), [current, text]);
  return (
    <div className="hw4-try">
      <Title id="hw4-try-intervals" level={2}>{text.sections.tryIntervals}</Title>
      <Paras list={I.intro} />
      <Choices label={I.paramLabel} options={['mean', 'variance'].map((v) => [v, I.params[v]])} value={param} onChange={setParam} />
      <Choices label={I.levelLabel} options={view.LEVELS.map((l) => [l, F.pct(l, 0)])} value={level} onChange={setLevel} />
      <Choices label={I.lawLabel} options={hw.DISTRIBUTIONS.map((d) => [d, text.distNames[d]])} value={dist} onChange={setChosenLaw} />
      <div className="hw3-slider-row">
        <Slider id="hw4-intervals-n" label={I.nLabel(n)} valueText={I.nLabel(n)} max={view.INTERVAL_NS.length - 1} value={g} onChange={setG} />
        <button type="button" className="button" onClick={() => setDraws({ key, batch: batch + 1 })} disabled={batch >= 99}>{I.newBatch}</button>
      </div>
      <div className="hw1-charts">
        <Figure
          title={I.chartTitle(current, text.distNames[dist])}
          draw={hw.drawIntervals}
          data={data}
          palette={palette}
          tip={tip}
          wide
          legend={[
            { label: I.legend[0], color: 2 },
            { label: I.legend[1], color: 1 },
            { label: I.legend[2], color: 6, dashed: true },
          ]}
        />
      </div>
      <p className="hw1-caption hw4-line" aria-live="polite">{I.counts(current.misses, level, (batch + 1) * view.INTERVAL_SIZE, totalMisses)}</p>
    </div>
  );
};

// --- 3, 4 e 5 --------------------------------------------------------------------------------------------------

const TestsSummary = React.memo(function TestsSummary({ s, job, text }) {
  const T = text.tests;
  const F = text.fmt;
  const summary = useMemo(() => (s ? view.testSummary(s) : null), [s]);
  return (
    <section className="hw1-section hw2 hw3 hw4 hw2-far">
      <Title id="hw4-tests" level={0}>{text.sections.tests}</Title>
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
    <section className="hw1-section hw2 hw3 hw4 hw2-far">
      <Title id="hw4-history" level={0}>{text.sections.history}</Title>
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
    <section className="hw1-section hw2 hw3 hw4 hw2-far">
      <Title id="hw4-conclusion" level={0}>{text.sections.conclusion}</Title>
      <Paras list={text.conclusion(s)} />
    </section>
  );
});

// --- La pagina --------------------------------------------------------------------------------------------------

const Homework4 = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const text = HW4_TEXTS[language] || HW4_TEXTS.en;
  const palette = PALETTES[theme === 'dark' ? 'dark' : 'light'];
  const S = text.sections;
  const I = text.input;

  // --- 2.2 i campi, e l'ultimo valore valido di ognuno; la legge si sceglie in 2.1 ---
  const [fields, setFields] = useState(view.DEFAULT_INPUTS);
  const [params, setParams] = useState(view.DEFAULT_PARAMS);
  const read = useMemo(() => view.readInputs(fields), [fields]);
  const change = (patch) => {
    const next = { ...fields, ...patch };
    setFields(next);
    setParams((prev) => view.applyInputs(view.readInputs(next), prev));
  };
  const setDist = (dist) => setParams((prev) => view.applyInputs(view.readInputs(fields), prev, dist));
  const restore = () => {
    setFields(view.DEFAULT_INPUTS);
    setParams(view.DEFAULT_PARAMS);
  };

  // la simulazione parte quando i campi smettono di cambiare; intanto restano i risultati di prima
  const key = useSettled(view.paramsKey(params));
  const settled = useMemo(() => view.parseParamsKey(key), [key]);
  const job = useExplore(key);
  const [previous, setPrevious] = useState(null);
  if (job.value && previous !== job.value) setPrevious(job.value);
  const s = job.value || previous;
  // una simulazione nuova e' in arrivo: i campi sono cambiati, o quella partita non ha ancora finito
  const waiting = s !== null && !job.error && (view.paramsKey(params) !== key || !job.value);

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
            <a href={`${DOWNLOADS}homework4.zip`} download="homework4.zip" className="button icon solid fa-download">{text.download.zip}</a>
            <a href={`${DOWNLOADS}homework4/index.html?lang=${language === 'en' ? 'en' : 'it'}`} target="_blank" rel="noopener noreferrer" className="button alt icon solid fa-external-link-alt">{text.download.online}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <HomeworkShell slug="homework-4" sidebar={sidebar} toc={toc}>
      <Assignment text={text} />

      {/* PART 1: le formule ricorsive di Welford */}
      <section className="hw1-section hw2 hw3 hw4">
        <Title id="hw4-part1" level={0}>{S.part1}</Title>
        <Paras list={text.part1.intro} />

        <Title id="hw4-knuth" level={1}>{S.knuth}</Title>
        <Derivation block={text.knuth} formulas={text.formulas.knuth} />

        <Title id="hw4-ss" level={1}>{S.ss}</Title>
        <Derivation block={text.ss} formulas={text.formulas.ss} />
        <TryDrag text={text} palette={palette} />

        <Title id="hw4-variance" level={1}>{S.variance}</Title>
        <Derivation block={text.variance} formulas={text.formulas.variance} />

        <Title id="hw4-code" level={1}>{S.code}</Title>
        <Code text={text} />

        <Title id="hw4-steps" level={1}>{S.steps}</Title>
        <Steps text={text} palette={palette} />

        <Title id="hw4-stability" level={1}>{S.stability}</Title>
        <Stability text={text} palette={palette} />
        <TryDigits text={text} />

        <Title id="hw4-checks" level={1}>{S.checks}</Title>
        <Verify text={text} />
      </section>

      {/* PART 2: media e varianza campionarie */}
      <section className="hw1-section hw2 hw3 hw4">
        <Title id="hw4-part2" level={0}>{S.part2}</Title>
        <Paras list={text.part2.intro} />

        <Title id="hw4-scores" level={1}>{S.scores}</Title>
        <Scores params={params} setDist={setDist} s={s} text={text} palette={palette} />

        <Title id="hw4-input" level={1}>{S.input}</Title>
        <p>{I.intro}</p>
        <div className="hw3-fields">
          <Field id="hw4-p" label={I.pLabel} value={fields.pText} onChange={(v) => change({ pText: v })} maxLength={view.FIELD_LENGTH.p} inputMode="decimal" error={fieldError(read.p, I, 'p')} hint={I.pHint} />
          <Field id="hw4-n" label={I.nLabel} value={fields.nText} onChange={(v) => change({ nText: v })} maxLength={view.FIELD_LENGTH.n} inputMode="numeric" error={fieldError(read.n, I, 'n')} hint={I.nHint} />
          <Field id="hw4-m" label={I.mLabel} value={fields.mText} onChange={(v) => change({ mText: v })} maxLength={view.FIELD_LENGTH.m} inputMode="numeric" error={fieldError(read.m, I, 'm')} hint={I.mHint} />
          <Field id="hw4-seed" label={I.seedLabel} value={fields.seedText} onChange={(v) => change({ seedText: v })} maxLength={view.FIELD_LENGTH.seed} inputMode="numeric" error={fieldError(read.seed, I, 'seed')} hint={I.seedHint}>
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

        <Title id="hw4-trajectories" level={1}>{S.trajectories}</Title>
        <Trajectories params={settled} text={text} palette={palette} />

        <Title id="hw4-averages" level={1}>{S.averages}</Title>
        <Averages s={s} job={job} text={text} palette={palette} />

        <Title id="hw4-comparison" level={1}>{S.comparison}</Title>
        <Comparison s={s} text={text} />
        <TryBessel params={settled} text={text} palette={palette} />

        <Title id="hw4-spread" level={1}>{S.spread}</Title>
        <Spread s={s} job={job} text={text} palette={palette} />

        <Title id="hw4-inference" level={1}>{S.inference}</Title>
        <Inference s={s} job={job} text={text} palette={palette} />
        <TryIntervals params={settled} text={text} palette={palette} />
      </section>

      <TestsSummary s={s} job={job} text={text} />

      <History text={text} />

      <Conclusion s={s} text={text} />
    </HomeworkShell>
  );
};

export default Homework4;
