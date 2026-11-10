// src/pages/statistics/Homework5.jsx
// Homework #5 di Statistics, in due esercizi con un solo indirizzo.
// L'Esercizio 1 integra le funzioni della consegna (e due della pagina, piu'
// quella scritta da chi legge) alla Riemann e alla Lebesgue, ne mette i
// risultati fianco a fianco, misura convergenza e costo, calcola Dirichlet e
// Thomae con le frazioni esatte, e chiude con il traffico di un server e
// Monte Carlo. L'Esercizio 2 calcola la funzione di ripartizione della
// normale: Liouville, erf, integrazione numerica, serie, le formule dei
// manuali, un metodo efficiente, il confronto con il NIST e con mpmath, poi
// la tavola, i quantili, le soglie d'allarme e la prova contro dati
// simulati; poi verifiche, test, contesto storico e conclusioni.
//
// Qui c'e' solo la pagina React. Le regole, gli integrali, i generatori, la
// statistica e i grafici stanno in hw5/homework5.js, i testi in hw5/texts.js
// e la logica di presentazione in hw5/view.js: sono gli stessi file da cui la
// build ricava il programma scaricabile (build/homework-standalone.js), cosi'
// la pagina e il download non possono raccontare due cose diverse.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/languageContext';
import { useTheme } from '../../contexts/themeContext';
import HomeworkShell from './HomeworkShell';
import { ChartLegend } from './ChartLegend';
import { hiddenParts, useHidden } from './legendState';
import * as hw from './hw5/homework5';
import * as view from './hw5/view';
import { HW5_TEXTS, originalAssignment } from './hw5/texts';
import { useExplore, useSettled } from './hw5/useJob';

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

// Un grafico su canvas, ridisegnato quando cambia la larghezza, con i valori
// del pezzo sotto il puntatore e, con `link` (view.links), la riga della
// tabella legata: il disegno vero e' in homework5.js. Le voci della legenda
// nascondono e mostrano le loro parti; con `hidden` e `onToggle` lo stato
// sta nella sezione, che ne fa sparire anche le colonne o le righe della
// tabella annessa.
const Figure = ({ title, draw, data, palette, tip = null, wide = false, legend = null, note = null, link = null, hidden: shared = null, onToggle = null }) => {
  const ref = useRef(null);
  const [own, toggleOwn] = useHidden();
  const hidden = shared || own;
  const off = hiddenParts(legend, hidden).join(' ');
  const shown = useMemo(() => (off ? { ...data, hidden: off.split(' ') } : data), [data, off]);
  const describe = useMemo(() => (tip ? (hit) => tip(hit, off ? off.split(' ') : []) : null), [tip, off]);
  useEffect(() => {
    const canvas = ref.current;
    let drawn = -1;
    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[entries.length - 1].contentRect.width);
      if (width <= 0 || width === drawn) return;
      drawn = width;
      canvas.style.height = `${hw.chartHeight(draw, shown, width)}px`;
      view.scheduleFrameJob(() => {
        if (canvas.isConnected && drawn === width) draw(canvas, { ...shown, width }, palette);
      });
    });
    observer.observe(canvas);
    const detach = describe ? hw.attachChartTooltip(canvas, { draw, data: shown, describe, link }) : null;
    return () => {
      drawn = -2;
      observer.disconnect();
      if (detach) detach();
    };
  }, [draw, shown, palette, describe, link]);
  return (
    <figure className={wide ? 'hw1-figure hw1-figure-wide' : 'hw1-figure'}>
      <canvas ref={ref} className="hw1-canvas" role="img" aria-label={title} />
      {legend && <ChartLegend items={legend} palette={palette} hidden={hidden} onToggle={onToggle || toggleOwn} />}
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

// Un cursore su indici interi da 0 a max
const Slider = ({ id, label, valueText, max, value, onChange }) => (
  <div className="hw3-slider">
    <label htmlFor={id}>{label}</label>
    <input id={id} type="range" min={0} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={valueText} />
  </div>
);

/**
 * Plays an index from its current value to `last`, one step every `delay`
 * milliseconds: [index, playing, toggle, choose]. Until somebody moves it the
 * index is `fallback`; `choose` moves it by hand and stops playing,
 * choose(null) goes back to the fallback.
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

// Il messaggio di un campo non valido: una frase fissa o costruita dal valore
const fieldError = (r, E, range) => {
  if (r.ok) return null;
  if (r.error === 'range') return E.range(...range);
  const m = E[r.error];
  return typeof m === 'function' ? m(r.text) : m;
};

const Field = ({ id, label, value, onChange, maxLength, inputMode, error, hint, wide = false, children = null }) => (
  <div className={wide ? 'hw3-field hw5-field-wide' : 'hw3-field'}>
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

// --- 0. La consegna ------------------------------------------------------------

const Assignment = React.memo(function Assignment({ text }) {
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5">
      <Title id="hw5-assignment" level={0}>{text.sections.assignment}</Title>
      <Paras list={text.assignment.intro} />
      <details className="hw1-original" open>
        <summary>{text.assignment.originalTitle}</summary>
        <p className="hw1-note">{text.assignment.originalNote}</p>
        <blockquote lang="en">
          {originalAssignment().map((block, i) => {
            if (block.type === 'title') return <p key={i}><strong>{block.text}</strong></p>;
            if (block.type === 'list') return <ul key={i}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
            if (block.type === 'link') return <p key={i}><a href={block.href} target="_blank" rel="noopener noreferrer">{block.text}</a></p>;
            return <p key={i}>{block.text}</p>;
          })}
        </blockquote>
      </details>
    </section>
  );
});

// --- 1.1 L'area e la prova ----------------------------------------------------------

const Area = React.memo(function Area({ text, palette }) {
  const A = text.area;
  const data = useMemo(() => view.bellChart(text.fmt.decimal), [text]);
  const tip = useMemo(() => view.tips.bell(data, text.tips), [data, text]);
  const legend = useMemo(() => view.legends.bell(text), [text]);
  return (
    <>
      <Paras list={A.intro} />
      <Formulas>{text.formulas.cdf}</Formulas>
      <div className="hw1-charts">
        <Figure title={A.chartTitle} draw={hw.drawQuadrature} data={data} palette={palette} tip={tip} wide legend={legend} />
      </div>
    </>
  );
});

const TryArea = ({ text, palette }) => {
  const T = text.tryArea;
  const F = text.fmt;
  const d = view.AREA.defaults;
  const [mu, setMu] = useState(d.mu);
  const [sigma, setSigma] = useState(d.sigma);
  const [zIndex, setZIndex] = useState(view.indexOfZ(d.z));
  const [rule, setRule] = useState(d.rule);
  const [n, setN] = useState(d.n);
  const [strategy, setStrategy] = useState(d.strategy);
  const z = view.zOfIndex(zIndex);
  const state = useMemo(() => view.areaState({ mu, sigma, z, rule, n, strategy }, F.decimal), [mu, sigma, z, rule, n, strategy, F]);
  const tip = useMemo(() => view.tips.area(state, text.tips), [state, text]);
  const legend = useMemo(() => view.legends.area(text), [text]);
  return (
    <div className="hw4-try">
      <Title id="hw5-try-area" level={2}>{text.sections.tryArea}</Title>
      <Paras list={T.intro} />
      <Choices label={T.muLabel} options={view.AREA.mus.map((m) => [m, F.plain(m)])} value={mu} onChange={setMu} />
      <Choices label={T.sigmaLabel} options={view.AREA.sigmas.map((v) => [v, F.plain(v)])} value={sigma} onChange={setSigma} />
      <Choices label={T.ruleLabel} options={hw.RULES.map((r) => [r, text.ruleNames[r]])} value={rule} onChange={setRule} />
      <Choices label={T.strategyLabel} options={view.AREA.strategies.map((s) => [s, T.strategies[s]])} value={strategy} onChange={setStrategy} />
      <div className="hw3-slider-row">
        <Slider id="hw5-area-z" label={T.zLabel(state.x, z)} valueText={T.zLabel(state.x, z)} max={view.Z_STEPS} value={zIndex} onChange={setZIndex} />
        <Slider id="hw5-area-n" label={T.nLabel(state.n, rule)} valueText={T.nLabel(state.n, rule)} max={view.AREA.nMax - 1} value={n - 1} onChange={(v) => setN(v + 1)} />
      </div>
      <div className="hw1-charts">
        <Figure title={T.chartTitle(state, rule)} draw={hw.drawQuadrature} data={state.chart} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw1-caption hw4-line" aria-live="polite">{T.result(state, rule)}</p>
    </div>
  );
};

// --- 1.2 Le regole, 1.3 il -infinito, 1.4 la convergenza ----------------------------------

const Rules = React.memo(function Rules({ text }) {
  const R = text.rules;
  const F = text.fmt;
  const rows = useMemo(() => view.ruleRows(), []);
  const nodes = useMemo(() => view.gaussRows(5), []);
  return (
    <>
      <Paras list={R.intro} />
      <Formulas title={R.formulasTitle}>{text.formulas.rules}</Formulas>
      <p className="hw1-table-title"><strong>{R.tableTitle(view.RULES_N)}</strong></p>
      <table className="hw1-table hw1-discussion-table hw5-rules">
        <thead>
          <tr><th>{R.cols.rule}</th><th>{R.cols.n}</th><th>{R.cols.evaluations}</th><th>{R.cols.value}</th><th>{R.cols.error}</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rule}>
              <th data-label={R.cols.rule}>{text.ruleNames[r.rule]}</th>
              <td data-label={R.cols.n}>{r.n}</td>
              <td data-label={R.cols.evaluations}>{r.evaluations}</td>
              <td data-label={R.cols.value}>{F.num(r.value, 15)}</td>
              <td data-label={R.cols.error}>{F.err(r.error)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hw1-table-title"><strong>{R.gaussTitle}</strong></p>
      <table className="hw1-table hw1-compact hw5-gauss">
        <thead>
          <tr><th>{R.gaussCols.i}</th><th>{R.gaussCols.node}</th><th>{R.gaussCols.weight}</th></tr>
        </thead>
        <tbody>
          {nodes.map((r) => (
            <tr key={r.i}><th>{r.i}</th><td>{F.num(r.node, 15)}</td><td>{F.num(r.weight, 15)}</td></tr>
          ))}
        </tbody>
      </table>
      <Paras list={R.after(rows)} />
    </>
  );
});

const MinusInfinity = React.memo(function MinusInfinity({ text }) {
  const I = text.infinity;
  const F = text.fmt;
  const [rule, setRule] = useState('gauss');
  const rows = useMemo(() => view.strategyTable(rule), [rule]);
  const facts = useMemo(() => view.strategyFacts(), []);
  const n = hw.STRATEGY_RULES.find((r) => r.rule === rule).n;
  const keys = ['symmetry', 'trunc4', 'trunc8', 'substitution'];
  return (
    <>
      <Paras list={I.intro} />
      <Formulas title={I.formulasTitle}>{text.formulas.strategies}</Formulas>
      <Choices label={I.chooseLabel} options={hw.STRATEGY_RULES.map((r) => [r.rule, text.ruleNames[r.rule]])} value={rule} onChange={setRule} />
      <p className="hw1-table-title"><strong>{I.tableTitle(rule, n)}</strong></p>
      <table className="hw1-table hw1-discussion-table hw5-strategies">
        <thead>
          <tr><th>{I.cols.z}</th><th>{I.cols.reference}</th>{keys.map((k) => <th key={k}>{I.cols[k]}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.z}>
              <th data-label={I.cols.z}>{F.plain(r.z)}</th>
              <td data-label={I.cols.reference}>{F.num(r.reference, 8)}</td>
              {r.errors.map((e, c) => <td key={keys[c]} data-label={I.cols[keys[c]]}>{F.err(e)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <Paras list={I.after(facts)} />
    </>
  );
});

const Convergence = React.memo(function Convergence({ text, palette }) {
  const C = text.convergence;
  const F = text.fmt;
  const study = useMemo(() => hw.convergenceStudy(), []);
  const data = useMemo(() => view.convergenceChart(study, F.decimal), [study, F]);
  const tip = useMemo(() => view.tips.convergence(study, text.tips), [study, text]);
  const facts = useMemo(() => view.convergenceFacts(study), [study]);
  // una regola nascosta nella legenda sparisce anche dalle colonne della tabella
  const [hidden, toggle] = useHidden();
  const legend = useMemo(() => view.legends.convergence(text), [text]);
  const rules = hw.RULES.filter((_, i) => !hidden.has(i));
  return (
    <>
      <Paras list={C.intro} />
      <div className="hw1-charts">
        <Figure title={C.chartTitle(study.z)} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} link={view.links.convergence} wide legend={legend} hidden={hidden} onToggle={toggle} />
      </div>
      <p className="hw1-table-title"><strong>{C.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table id={view.LINKED_TABLES.convergence} className="hw1-table hw1-compact hw5-convergence">
          <thead>
            <tr><th>{C.cols.n}</th>{rules.map((r) => <th key={r}>{text.ruleNames[r]}</th>)}</tr>
          </thead>
          <tbody>
            {study.rows.map((r) => (
              <tr key={r.n}>
                <th>{F.int(r.n)}</th>
                {rules.map((rule) => <td key={rule}>{r.errors[rule] === null ? '-' : F.err(r.errors[rule])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paras list={C.after(facts)} />
    </>
  );
});

// --- 1.5 La tavola, 1.6 i quantili, 1.7 le code --------------------------------------------------

const ZTableSection = React.memo(function ZTableSection({ text }) {
  const Z = text.table;
  const F = text.fmt;
  const zt = useMemo(() => hw.zTable(), []);
  return (
    <>
      <Paras list={Z.intro} />
      <p className="hw1-table-title"><strong>{Z.title(zt)}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw5-ztable">
          <thead>
            <tr><th>z</th>{Array.from({ length: hw.ZTABLE.cols }, (_, c) => <th key={c}>{`${F.decimal}0${c}`}</th>)}</tr>
          </thead>
          <tbody>
            {zt.table.map((row) => (
              <tr key={row.row}>
                <th>{F.num(row.row, 1)}</th>
                {row.cells.map((c) => (
                  <td key={c.z} className={view.isMarkedZ(c.z) ? 'is-mark' : null} title={view.isMarkedZ(c.z) ? `Φ(${F.num(c.z, 2)}) = ${F.num(c.value, 8)}` : undefined}>{F.num(c.value, 4)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paras list={Z.after(zt)} />
    </>
  );
});

const Quantiles = React.memo(function Quantiles({ text, palette }) {
  const Q = text.quantiles;
  const F = text.fmt;
  const rows = useMemo(() => view.quantileRows(), []);
  const steps = useMemo(() => view.newtonRows(), []);
  const data = useMemo(() => view.newtonChart(steps, F.decimal), [steps, F]);
  const tip = useMemo(() => view.tips.newton(steps, text.tips), [steps, text]);
  return (
    <>
      <Paras list={Q.intro} />
      <Formulas title={Q.formulasTitle}>{text.formulas.newton}</Formulas>
      <p className="hw1-table-title"><strong>{Q.tableTitle}</strong></p>
      <table className="hw1-table hw1-discussion-table hw5-quantiles">
        <thead>
          <tr><th>{Q.cols.p}</th><th>{Q.cols.z}</th><th>{Q.cols.steps}</th><th>{Q.cols.reference}</th><th>{Q.cols.difference}</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.p}>
              <th data-label={Q.cols.p}>{F.plain(r.p)}</th>
              <td data-label={Q.cols.z}>{F.num(r.z, 12)}</td>
              <td data-label={Q.cols.steps}>{r.steps}</td>
              <td data-label={Q.cols.reference}>{F.num(r.reference, 12)}</td>
              <td data-label={Q.cols.difference}>{F.err(r.difference)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hw1-table-title"><strong>{Q.newtonTitle(view.NEWTON_P)}</strong></p>
      <div className="hw5-table">
        <table id={view.LINKED_TABLES.newton} className="hw1-table hw1-compact hw5-newton">
          <thead>
            <tr><th>{Q.newtonCols.k}</th><th>{Q.newtonCols.z}</th><th>{Q.newtonCols.F}</th><th>{Q.newtonCols.dz}</th><th>{Q.newtonCols.error}</th></tr>
          </thead>
          <tbody>
            {steps.map((r) => (
              <tr key={r.k}><th>{r.k}</th><td>{F.num(r.z, 15)}</td><td>{F.num(r.F, 15)}</td><td>{F.sig(r.dz, 4)}</td><td>{F.err(r.error)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hw1-charts">
        <Figure title={Q.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} link={view.links.newton} wide />
      </div>
      <Paras list={Q.after(rows)} />
    </>
  );
});

const Tails = React.memo(function Tails({ text, palette }) {
  const T = text.tails;
  const F = text.fmt;
  const rows = useMemo(() => hw.tailRows(), []);
  const data = useMemo(() => view.tailChart(rows, F.decimal), [rows, F]);
  const tip = useMemo(() => view.tips.tails(rows, text.tips), [rows, text]);
  const facts = useMemo(() => view.tailFacts(rows), [rows]);
  const alarms = useMemo(() => view.alarmRows(), []);
  // nascondere una curva toglie dalla tabella il suo valore e il suo errore
  const [hidden, toggle] = useHidden();
  const legend = useMemo(() => view.legends.tails(text), [text]);
  const subtraction = !hidden.has(0);
  const direct = !hidden.has(1);
  return (
    <>
      <Paras list={T.intro} />
      <p className="hw1-table-title"><strong>{T.tableTitle}</strong></p>
      <div className="hw5-table">
        <table id={view.LINKED_TABLES.tails} className="hw1-table hw1-compact hw5-tails">
          <thead>
            <tr>
              <th>{T.cols.k}</th>
              <th>{T.cols.reference}</th>
              {subtraction && <th>{T.cols.subtraction}</th>}
              {subtraction && <th>{T.cols.subtractionError}</th>}
              {direct && <th>{T.cols.direct}</th>}
              {direct && <th>{T.cols.directError}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k}>
                <th>{r.k}</th>
                <td>{F.sci(r.reference, 2)}</td>
                {subtraction && <td>{F.sci(r.subtraction, 2)}</td>}
                {subtraction && <td className={r.subtractionError > 1e-6 ? 'hw3-over' : ''}>{F.err(r.subtractionError)}</td>}
                {direct && <td>{F.sci(r.direct, 2)}</td>}
                {direct && <td>{F.err(r.directError)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hw1-charts">
        <Figure title={T.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} link={view.links.tails} wide legend={legend} hidden={hidden} onToggle={toggle} />
      </div>
      <Paras list={T.after(facts)} />
      <Paras list={T.alarmIntro} />
      <p className="hw1-table-title"><strong>{T.alarmTitle}</strong></p>
      <table className="hw1-table hw1-discussion-table hw5-alarms">
        <thead>
          <tr><th>{T.alarmCols.k}</th><th>{T.alarmCols.normal}</th><th>{T.alarmCols.normalPerDay}</th><th>{T.alarmCols.heavy}</th><th>{T.alarmCols.heavyPerDay}</th><th>{T.alarmCols.ratio}</th></tr>
        </thead>
        <tbody>
          {alarms.map((r) => (
            <tr key={r.k}>
              <th data-label={T.alarmCols.k}>{r.k}</th>
              <td data-label={T.alarmCols.normal}>{F.sci(r.normal, 2)}</td>
              <td data-label={T.alarmCols.normalPerDay}>{F.sig(r.normalPerDay, 4)}</td>
              <td data-label={T.alarmCols.heavy}>{F.sci(r.heavy, 2)}</td>
              <td data-label={T.alarmCols.heavyPerDay}>{F.sig(r.heavyPerDay, 4)}</td>
              <td data-label={T.alarmCols.ratio}>{F.num(r.ratio, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paras list={T.alarmAfter(alarms)} />
    </>
  );
});

const TryAlarm = ({ text, palette }) => {
  const T = text.tryAlarm;
  const F = text.fmt;
  const [events, setEvents] = useState(view.ALARM_DEFAULT.events);
  const [rate, setRate] = useState(view.ALARM_DEFAULT.rate);
  const state = useMemo(() => view.alarmState(events, rate), [events, rate]);
  const data = useMemo(() => view.alarmChart(state, F.decimal), [state, F]);
  const tip = useMemo(() => view.tips.alarm(state, data, text.tips), [state, data, text]);
  return (
    <div className="hw4-try">
      <Title id="hw5-try-alarm" level={2}>{text.sections.tryAlarm}</Title>
      <Paras list={T.intro} />
      <Choices label={T.eventsLabel} options={view.ALARM_EVENTS.map((e) => [e, F.events(e)])} value={events} onChange={setEvents} />
      <Choices label={T.rateLabel} options={Object.keys(view.ALARM_RATES).map((r) => [r, T.rates[r]])} value={rate} onChange={setRate} />
      <div className="hw1-charts">
        <Figure title={T.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={view.legends.alarm(text)} />
      </div>
      <p className="hw1-caption hw4-line" aria-live="polite">{T.result(state)}</p>
    </div>
  );
};

// --- 1.8 I dati, con i campi; 1.9 le verifiche --------------------------------------------------------

// Lo stato dei campi e della simulazione: non validi, valori della pagina o vostri, in corso, fatto
const RunStatus = ({ run, text, badge = true }) => {
  const D = text.data;
  return (
    <>
      {!run.valid && <p className="hw2-stale" role="status">{D.stale}</p>}
      {badge && (
        <p className={run.badge.known ? 'hw1-badge-line is-task' : 'hw1-badge-line is-custom'}>
          <span>{run.badge.text}</span>
          {run.badge.restore && <button type="button" className="button alt hw1-restore" onClick={run.restore}>{D.restore}</button>}
        </p>
      )}
      {run.waiting && <p className="hw2-stale" role="status">{D.pending}</p>}
      {run.job.error && <p className="hw1-note">{text.ui.error(run.job.error)}</p>}
      {badge && run.s && !run.waiting && <p className="hw1-note" role="status">{D.run(run.s)}</p>}
    </>
  );
};

const DataSection = ({ run, text, palette }) => {
  const D = text.data;
  const F = text.fmt;
  const { s, fields, read, change } = run;
  const normal = useMemo(() => (s ? view.ecdfChart(s.normal, F.decimal) : null), [s, F]);
  const heavy = useMemo(() => (s ? view.ecdfChart(s.heavy, F.decimal) : null), [s, F]);
  const normalTip = useMemo(() => (normal ? view.tips.ecdf(normal, text.tips) : null), [normal, text]);
  const heavyTip = useMemo(() => (heavy ? view.tips.ecdf(heavy, text.tips) : null), [heavy, text]);
  const legend = useMemo(() => view.legends.ecdf(text), [text]);
  return (
    <>
      <Paras list={D.intro} />
      <p>{D.fieldsIntro}</p>
      <div className="hw3-fields">
        <Field id="hw5-seed" label={D.seedLabel} value={fields.seedText} onChange={(v) => change({ seedText: v })} maxLength={view.FIELD_LENGTH.seed} inputMode="numeric" error={fieldError(read.seed, D.errors, hw.LIMITS.seed)} hint={D.seedHint}>
          <button type="button" className="button alt" onClick={() => change({ seedText: String(hw.randomSeed()) })}>{D.randomSeed}</button>
        </Field>
        <Field id="hw5-sample" label={D.sampleLabel} value={fields.sampleText} onChange={(v) => change({ sampleText: v })} maxLength={view.FIELD_LENGTH.sample} inputMode="numeric" error={fieldError(read.sample, D.errors, hw.LIMITS.sample)} hint={D.sampleHint} />
      </div>
      <RunStatus run={run} text={text} />
      {!s ? (
        <Pending text={text} result={run.job} />
      ) : (
        <>
          <div className="hw1-charts">
            <Figure title={D.normalTitle(s.normal.n)} draw={hw.drawLineChart} data={normal} palette={palette} tip={normalTip} legend={legend} />
            <Figure title={D.heavyTitle(s.heavy.n)} draw={hw.drawLineChart} data={heavy} palette={palette} tip={heavyTip} legend={legend} />
          </div>
          <Tests group="model" s={s} text={text} />
          <Paras list={D.after(s)} />
        </>
      )}
    </>
  );
};

const Verify = React.memo(function Verify({ text }) {
  const V = text.checks;
  const rows = useMemo(() => hw.verifyAll(), []);
  const ok = rows.filter((r) => r.ok).length;
  const groups = ['quadrature', 'normal', 'cdf', 'integrals', 'generator'].map((group) => ({ group, rows: rows.filter((r) => r.group === group) }));
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

// --- 2.1 Le monete, 2.2 le funzioni ----------------------------------------------------------------------

const coinClass = (cents) => (cents < 10 ? 'is-copper' : cents < 100 ? 'is-gold' : 'is-bimetal');

const TryCoins = ({ seed, text }) => {
  const T = text.tryCoins;
  const F = text.fmt;
  const [draw, setDraw] = useState(0);
  const h = useMemo(() => hw.handful(seed, draw), [seed, draw]);
  return (
    <div className="hw4-try">
      <Title id="hw5-try-coins" level={2}>{text.sections.tryCoins}</Title>
      <Paras list={T.intro} />
      <p className="hw1-table-title"><strong>{T.orderTitle}</strong></p>
      <ol className="hw5-coins">
        {h.coins.map((c, i) => (
          <li key={i}>
            <span className={`hw5-coin ${coinClass(c)}`}>{T.coinLabel(c)}</span>
            <small>{F.euro(h.running[i])}</small>
          </li>
        ))}
      </ol>
      <p className="hw1-note">{T.running(h.total)}</p>
      <p className="hw1-table-title"><strong>{T.groupTitle}</strong></p>
      <ul className="hw5-coin-groups">
        {h.groups.map((g) => (
          <li key={g.value}>
            <span className={`hw5-coin ${coinClass(g.value)}`}>{T.coinLabel(g.value)}</span>
            <span>{T.groupLine(g)}</span>
          </li>
        ))}
      </ul>
      <p className="hw1-caption hw4-line" aria-live="polite">{T.total(h)}</p>
      <button type="button" className="button" onClick={() => setDraw((v) => v + 1)}>{T.another}</button>
    </div>
  );
};

// Il messaggio di un errore della formula: una frase fissa o costruita dall'errore
const formulaMessage = (E, result) => {
  const m = E[result.error];
  return typeof m === 'function' ? m(result) : m;
};

const Functions = ({ fnKey, setFnKey, custom, setCustom, customRead, text }) => {
  const Fn = text.functions;
  const F = text.fmt;
  const changed = custom.formula !== view.DEFAULT_CUSTOM.formula || custom.aText !== view.DEFAULT_CUSTOM.aText || custom.bText !== view.DEFAULT_CUSTOM.bText;
  const error = customRead.ok ? null : formulaMessage(Fn.errors, customRead);
  const note = customRead.ok ? Fn.customNote(customRead) : '';
  return (
    <>
      <Paras list={Fn.intro} />
      <p className="hw1-table-title"><strong>{Fn.tableTitle}</strong></p>
      <table className="hw1-table hw1-discussion-table hw5-functions">
        <thead>
          <tr><th>{Fn.cols.name}</th><th>{Fn.cols.interval}</th><th>{Fn.cols.formula}</th><th>{Fn.cols.integral}</th><th>{Fn.cols.feature}</th></tr>
        </thead>
        <tbody>
          {hw.FUNCTIONS.map((key) => {
            const d = hw.FUNCTION_DEFS[key];
            return (
              <tr key={key}>
                <th data-label={Fn.cols.name}>{text.functionNames[key]}</th>
                <td data-label={Fn.cols.interval}>{`[${F.plain(d.a)}, ${F.plain(d.b)}]`}</td>
                <td data-label={Fn.cols.formula}><code>{d.formula}</code></td>
                <td data-label={Fn.cols.integral}>{F.sig(d.exact, 12)}</td>
                <td data-label={Fn.cols.feature}>{Fn.features[key]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Choices label={Fn.chooseLabel} options={view.FUNCTION_KEYS.map((k) => [k, text.functionNames[k]])} value={fnKey} onChange={setFnKey} />
      {fnKey === hw.CUSTOM && (
        <div className="hw5-custom">
          <p className="hw1-table-title"><strong>{Fn.customTitle}</strong></p>
          <div className="hw3-fields">
            <Field id="hw5-formula" label={Fn.formulaLabel} value={custom.formula} onChange={(v) => setCustom({ ...custom, formula: v })} maxLength={hw.FORMULA_MAX} inputMode="text" error={customRead.field === 'formula' ? error : null} hint={Fn.formulaHint} wide />
            <Field id="hw5-a" label={Fn.aLabel} value={custom.aText} onChange={(v) => setCustom({ ...custom, aText: v })} maxLength={view.RANGE_LENGTH} inputMode="decimal" error={customRead.field === 'a' ? error : null} hint="" />
            <Field id="hw5-b" label={Fn.bLabel} value={custom.bText} onChange={(v) => setCustom({ ...custom, bText: v })} maxLength={view.RANGE_LENGTH} inputMode="decimal" error={customRead.field === 'b' ? error : null} hint="">
              {changed && <button type="button" className="button alt" onClick={() => setCustom(view.DEFAULT_CUSTOM)}>{Fn.restore}</button>}
            </Field>
          </div>
          {!customRead.ok && <p className="hw2-stale" role="status">{Fn.stale}</p>}
          {note && <p className="hw1-note">{note}</p>}
        </div>
      )}
    </>
  );
};

// --- 2.3 Riemann, 2.4 Lebesgue, la prova ----------------------------------------------------------------

const SumsTable = ({ rows, cols, keys, first, className }) => (
  <table className={`hw1-table hw1-discussion-table hw5-sums ${className}`}>
    <thead>
      <tr><th>{cols[first]}</th>{keys.map((k) => <th key={k}>{cols[k]}</th>)}</tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r[first]}>
          <th data-label={cols[first]}>{r[first]}</th>
          {keys.map((k) => <td key={k} data-label={cols[k]}>{r.format(r[k], k)}</td>)}
        </tr>
      ))}
    </tbody>
  </table>
);

const RiemannSection = ({ spec, reference, fnKey, text, palette }) => {
  const R = text.riemann;
  const F = text.fmt;
  const [kind, setKind] = useState('midpoint');
  const name = text.functionNames[fnKey];
  const chart = useMemo(() => view.integralChart(spec, 'riemann', { n: 10, kind }, F.decimal), [spec, kind, F]);
  const tip = useMemo(() => view.tips.strip(chart.chart, text.tips), [chart, text]);
  const rows = useMemo(() => view.riemannRows(spec), [spec]);
  const shown = useMemo(() => rows.map((r) => ({ ...r, format: (v, k) => (k === 'gap' ? F.err(v) : F.sig(v, 9)) })), [rows, F]);
  const legend = useMemo(() => view.legends.riemann(text), [text]);
  return (
    <>
      <Paras list={R.intro} />
      <Formulas title={R.formulasTitle}>{text.formulas.riemann}</Formulas>
      <Choices label={R.kindLabel} options={hw.RIEMANN_KINDS.map((k) => [k, R.kinds[k]])} value={kind} onChange={setKind} />
      <div className="hw1-charts">
        <Figure title={R.chartTitle(name, 10, kind)} draw={hw.drawIntegral} data={chart.chart} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw1-table-title"><strong>{R.tableTitle(reference)}</strong></p>
      <SumsTable rows={shown} cols={R.cols} first="n" keys={['left', 'right', 'midpoint', 'lower', 'upper', 'gap']} className="hw5-riemann" />
      <p className="hw1-note">{R.note}</p>
      <Paras list={R.after(rows, fnKey)} />
    </>
  );
};

const LebesgueSection = ({ spec, reference, fnKey, text, palette }) => {
  const L = text.lebesgue;
  const F = text.fmt;
  const name = text.functionNames[fnKey];
  const chart = useMemo(() => view.integralChart(spec, 'lebesgue', { K: 10 }, F.decimal), [spec, F]);
  const tip = useMemo(() => view.tips.level(chart.chart, text.tips), [chart, text]);
  const rows = useMemo(() => view.lebesgueRows(spec), [spec]);
  const shown = useMemo(() => rows.map((r) => ({ ...r, format: (v, k) => (k === 'gap' ? F.err(v) : F.sig(v, 9)) })), [rows, F]);
  const dist = useMemo(() => view.distributionChart(spec, F.decimal), [spec, F]);
  const distTip = useMemo(() => view.tips.distribution(dist, text.tips), [dist, text]);
  const rear = useMemo(() => view.rearrangementChart(spec, F.decimal), [spec, F]);
  const rearTip = useMemo(() => view.tips.rearrangement(rear.chart, text.tips), [rear, text]);
  const legend = useMemo(() => view.legends.lebesgue(text), [text]);
  const rearLegend = useMemo(() => view.legends.rearrangement(text), [text]);
  return (
    <>
      <Paras list={L.intro} />
      <Formulas title={L.formulasTitle}>{text.formulas.lebesgue}</Formulas>
      <div className="hw1-charts">
        <Figure title={L.chartTitle(name, 10)} draw={hw.drawIntegral} data={chart.chart} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw1-table-title"><strong>{L.tableTitle(reference)}</strong></p>
      <SumsTable rows={shown} cols={L.cols} first="K" keys={['lower', 'upper', 'midpoint', 'gap']} className="hw5-lebesgue" />
      {fnKey === 'unbounded' && <p className="hw1-note">{L.capNote(spec.cap, 2 - 1 / spec.cap)}</p>}
      <div className="hw1-charts">
        <Figure title={L.distributionTitle} draw={hw.drawLineChart} data={dist} palette={palette} tip={distTip} />
        <Figure title={L.rearrangementTitle} draw={hw.drawLineChart} data={rear.chart} palette={palette} tip={rearTip} legend={rearLegend} />
      </div>
      <Paras list={L.after(rows, fnKey)} />
    </>
  );
};

const SLICES_MAX = 64;

const TrySlices = ({ spec, reference, text, palette }) => {
  const T = text.trySlices;
  const F = text.fmt;
  const [n, setN] = useState(4);
  const [K, setK] = useState(4);
  const [playing, setPlaying] = useState(false);
  const done = n >= SLICES_MAX && K >= SLICES_MAX;
  useEffect(() => {
    if (!playing) return undefined;
    const timer = setTimeout(() => {
      if (done) setPlaying(false);
      else {
        setN((v) => Math.min(SLICES_MAX, v + 1));
        setK((v) => Math.min(SLICES_MAX, v + 1));
      }
    }, 380);
    return () => clearTimeout(timer);
  }, [playing, done, n, K]);
  const toggle = () => {
    if (!playing && done) {
      setN(1);
      setK(1);
    }
    setPlaying(!playing);
  };
  const r = useMemo(() => view.integralChart(spec, 'riemann', { n, kind: 'midpoint' }, F.decimal), [spec, n, F]);
  const l = useMemo(() => view.integralChart(spec, 'lebesgue', { K }, F.decimal), [spec, K, F]);
  const rTip = useMemo(() => view.tips.strip(r.chart, text.tips), [r, text]);
  const lTip = useMemo(() => view.tips.level(l.chart, text.tips), [l, text]);
  const rLegend = useMemo(() => view.legends.riemann(text), [text]);
  const lLegend = useMemo(() => view.legends.lebesgue(text), [text]);
  return (
    <div className="hw4-try">
      <Title id="hw5-try-slices" level={2}>{text.sections.trySlices}</Title>
      <Paras list={T.intro} />
      <div className="hw3-slider-row">
        <Slider id="hw5-slices-n" label={T.nLabel(n)} valueText={T.nLabel(n)} max={SLICES_MAX - 1} value={n - 1} onChange={(v) => { setPlaying(false); setN(v + 1); }} />
        <Slider id="hw5-slices-k" label={T.kLabel(K)} valueText={T.kLabel(K)} max={SLICES_MAX - 1} value={K - 1} onChange={(v) => { setPlaying(false); setK(v + 1); }} />
        <button type="button" className="button" onClick={toggle}>{playing ? T.pause : T.play}</button>
      </div>
      <div className="hw1-charts">
        <Figure title={T.riemannTitle(n)} draw={hw.drawIntegral} data={r.chart} palette={palette} tip={rTip} legend={rLegend} />
        <Figure title={T.lebesgueTitle(K)} draw={hw.drawIntegral} data={l.chart} palette={palette} tip={lTip} legend={lLegend} />
      </div>
      <p className="hw1-caption hw4-line" aria-live={playing ? 'off' : 'polite'}>{T.values(r.sums, l.sums, reference)}</p>
    </div>
  );
};

// --- 2.5 Il confronto -------------------------------------------------------------------------------

const Compare = ({ s, job, fnKey, customStudy, text, palette }) => {
  const C = text.compare;
  const F = text.fmt;
  const name = text.functionNames[fnKey];
  // le nove funzioni arrivano dal worker; quella scritta da chi legge si confronta nella pagina
  const study = fnKey === hw.CUSTOM ? customStudy : s ? s.compare[fnKey] : null;
  const data = useMemo(() => (study ? view.compareChart(study, F.decimal) : null), [study, F]);
  const tip = useMemo(() => (study ? view.tips.compare(study, text.tips) : null), [study, text]);
  const summary = useMemo(() => (s ? view.summaryRows(s) : null), [s]);
  // le quattro curve sono le quattro colonne della tabella, nello stesso ordine
  const [hidden, toggle] = useHidden();
  const legend = useMemo(() => view.legends.compare(text), [text]);
  const col = (i) => !hidden.has(i);
  return (
    <>
      <Paras list={C.intro} />
      {fnKey === hw.CUSTOM && <p className="hw1-note">{C.customPending}</p>}
      {!study ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <div className="hw1-charts">
            <Figure
              title={C.chartTitle(name)}
              draw={hw.drawLineChart}
              data={data}
              palette={palette}
              tip={tip}
              link={view.links.compare}
              wide
              legend={legend}
              hidden={hidden}
              onToggle={toggle}
            />
          </div>
          <p className="hw1-table-title"><strong>{C.tableTitle}</strong></p>
          <div className="hw1-scroll">
            <table id={view.LINKED_TABLES.compare} className="hw1-table hw1-compact hw5-compare">
              <thead>
                <tr>
                  <th>{C.cols.n}</th>
                  {col(0) && <th>{C.cols.riemann}</th>}
                  {col(1) && <th>{C.cols.lebesgue}</th>}
                  {col(2) && <th>{C.cols.riemannGap}</th>}
                  {col(3) && <th>{C.cols.lebesgueGap}</th>}
                </tr>
              </thead>
              <tbody>
                {study.rows.map((r) => (
                  <tr key={r.n}>
                    <th>{F.int(r.n)}</th>
                    {col(0) && <td className={r.errors.riemann < r.errors.lebesgue ? 'hw5-win' : ''}>{F.err(r.errors.riemann)}</td>}
                    {col(1) && <td className={r.errors.lebesgue < r.errors.riemann ? 'hw5-win' : ''}>{F.err(r.errors.lebesgue)}</td>}
                    {col(2) && <td>{F.err(r.gaps.riemann)}</td>}
                    {col(3) && <td>{F.err(r.gaps.lebesgue)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paras list={C.after(view.compareFacts(study), name)} />
        </>
      )}
      {summary && (
        <>
          <p className="hw1-table-title"><strong>{C.summaryTitle}</strong></p>
          <table className="hw1-table hw1-discussion-table hw5-summary">
            <thead>
              <tr><th>{C.summaryCols.name}</th><th>{C.summaryCols.riemannSmall}</th><th>{C.summaryCols.lebesgueSmall}</th><th>{C.summaryCols.riemannLarge}</th><th>{C.summaryCols.lebesgueLarge}</th><th>{C.summaryCols.orderRiemann}</th><th>{C.summaryCols.orderLebesgue}</th><th>{C.summaryCols.winner}</th></tr>
            </thead>
            <tbody>
              {summary.map((r) => (
                <tr key={r.key}>
                  <th data-label={C.summaryCols.name}>{text.functionNames[r.key]}</th>
                  <td data-label={C.summaryCols.riemannSmall}>{F.err(r.small.riemann)}</td>
                  <td data-label={C.summaryCols.lebesgueSmall}>{F.err(r.small.lebesgue)}</td>
                  <td data-label={C.summaryCols.riemannLarge}>{F.err(r.large.riemann)}</td>
                  <td data-label={C.summaryCols.lebesgueLarge}>{F.err(r.large.lebesgue)}</td>
                  <td data-label={C.summaryCols.orderRiemann}>{C.orderCell(r.orders.riemann)}</td>
                  <td data-label={C.summaryCols.orderLebesgue}>{C.orderCell(r.orders.lebesgue)}</td>
                  <td data-label={C.summaryCols.winner}>{r.winner === 'lebesgue' ? 'Lebesgue' : 'Riemann'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paras list={C.summaryAfter(summary)} />
        </>
      )}
    </>
  );
};

// --- 2.6 Il traffico ------------------------------------------------------------------------------------

const Traffic = React.memo(function Traffic({ text, palette }) {
  const T = text.traffic;
  const F = text.fmt;
  const report = useMemo(() => hw.trafficReport(), []);
  const chart = useMemo(() => view.trafficChart(report, F.decimal), [report, F]);
  const tip = useMemo(() => view.tips.traffic(chart, text.tips), [chart, text]);
  const duration = useMemo(() => view.durationChart(F.decimal), [F]);
  const durationTip = useMemo(() => view.tips.duration(duration, text.tips), [duration, text]);
  const legend = useMemo(() => view.legends.traffic(text), [text]);
  const durationLegend = useMemo(() => view.legends.duration(text, duration), [text, duration]);
  return (
    <>
      <Paras list={T.intro} />
      <div className="hw1-charts">
        <Figure title={T.chartTitle} draw={hw.drawIntegral} data={chart} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw1-table-title"><strong>{T.tableTitle}</strong></p>
      <table className="hw1-table hw1-discussion-table hw5-traffic">
        <thead>
          <tr><th>{T.cols.y}</th><th>{T.cols.hours}</th><th>{T.cols.minutes}</th><th>{T.cols.when}</th></tr>
        </thead>
        <tbody>
          {report.rows.map((r) => (
            <tr key={r.y}>
              <th data-label={T.cols.y}>{F.int(r.y)}</th>
              <td data-label={T.cols.hours}>{F.num(r.hours, 3)}</td>
              <td data-label={T.cols.minutes}>{F.num(r.hours * 60, 1)}</td>
              <td data-label={T.cols.when}>{r.intervals.map(([a, b]) => `${view.clock(a)}-${view.clock(b)}`).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="hw1-charts">
        <Figure title={T.durationTitle} draw={hw.drawLineChart} data={duration} palette={palette} tip={durationTip} wide legend={durationLegend} />
      </div>
      <Paras list={T.after(report)} />
    </>
  );
});

// --- 2.7 Monte Carlo, la prova dal vivo, 2.8 Dirichlet --------------------------------------------------------

const MonteCarlo = ({ run, text, palette }) => {
  const M = text.montecarlo;
  const D = text.data;
  const F = text.fmt;
  const { s, fields, read, change } = run;
  const [histKey, setHistKey] = useState('unbounded');
  const hist = useMemo(() => (s ? view.mcHistogram(s, histKey, F.decimal) : null), [s, histKey, F]);
  const tip = useMemo(() => (hist ? view.tips.histogram(hist, text.tips) : null), [hist, text]);
  return (
    <>
      <Paras list={M.intro} />
      <Formulas title={M.formulasTitle}>{text.formulas.montecarlo}</Formulas>
      <p>{M.fieldsIntro}</p>
      <div className="hw3-fields">
        <Field id="hw5-points" label={M.pointsLabel} value={fields.pointsText} onChange={(v) => change({ pointsText: v })} maxLength={view.FIELD_LENGTH.points} inputMode="numeric" error={fieldError(read.points, D.errors, hw.LIMITS.points)} hint={M.pointsHint} />
        <Field id="hw5-reps" label={M.repsLabel} value={fields.repsText} onChange={(v) => change({ repsText: v })} maxLength={view.FIELD_LENGTH.reps} inputMode="numeric" error={fieldError(read.reps, D.errors, hw.LIMITS.reps)} hint={M.repsHint} />
      </div>
      <RunStatus run={run} text={text} badge={false} />
      {!s ? (
        <Pending text={text} result={run.job} />
      ) : (
        <>
          <p className="hw1-table-title"><strong>{M.tableTitle(s)}</strong></p>
          <table className="hw1-table hw1-discussion-table hw5-mc">
            <thead>
              <tr><th>{M.cols.name}</th><th>{M.cols.exact}</th><th>{M.cols.mean}</th><th>{M.cols.sd}</th><th>{M.cols.se}</th><th>{M.cols.coverage}</th></tr>
            </thead>
            <tbody>
              {view.mcRows(s).map((r) => (
                <tr key={r.key}>
                  <th data-label={M.cols.name}>{text.functionNames[r.key]}</th>
                  <td data-label={M.cols.exact}>{F.sig(r.exact, 8)}</td>
                  <td data-label={M.cols.mean}>{F.sig(r.mean, 8)}</td>
                  <td data-label={M.cols.sd}>{F.sig(r.sd, 4)}</td>
                  <td data-label={M.cols.se}>{F.sig(r.meanSe, 4)}</td>
                  <td data-label={M.cols.coverage} className={r.coverageTest.verdict === 'reject' ? 'hw3-over' : ''}>{F.pct(r.coverage, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Choices label={M.chooseLabel} options={hw.FUNCTIONS.map((k) => [k, text.functionNames[k]])} value={histKey} onChange={setHistKey} />
          <div className="hw1-charts">
            <Figure title={M.histogramTitle(text.functionNames[histKey], s)} draw={hw.drawHistogram} data={hist} palette={palette} tip={tip} wide legend={view.legends.estimates(text)} />
          </div>
          <Tests group="coverage" s={s} text={text} />
          <Paras list={M.after(s)} />
        </>
      )}
    </>
  );
};

const TryMc = ({ seed, text, palette }) => {
  const T = text.tryMc;
  const F = text.fmt;
  const [key, setKey] = useState('unbounded');
  const [draw, setDraw] = useState(0);
  const run = useMemo(() => view.mcPath(seed, key, draw), [seed, key, draw]);
  const last = run.path.length;
  const [shown, playing, toggle, choose] = usePlayer(last, 0, 160);
  const data = useMemo(() => view.mcPathChart(run, shown, F.decimal), [run, shown, F]);
  const tip = useMemo(() => view.tips.mcPath(run, text.tips), [run, text]);
  const restart = (next) => {
    choose(0);
    next();
  };
  return (
    <div className="hw4-try">
      <Title id="hw5-try-mc" level={2}>{text.sections.tryMc}</Title>
      <Paras list={T.intro} />
      <Choices label={T.chooseLabel} options={hw.FUNCTIONS.map((k) => [k, text.functionNames[k]])} value={key} onChange={(k) => restart(() => setKey(k))} />
      <div className="hw3-slider-row">
        <span className="hw1-buttons">
          <button type="button" className="button" onClick={toggle}>{playing ? T.pause : T.play}</button>
          <button type="button" className="button alt" onClick={() => restart(() => setDraw((v) => v + 1))}>{T.again}</button>
        </span>
      </div>
      <div className="hw1-charts">
        <Figure title={T.chartTitle(text.functionNames[key])} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={view.legends.mcPath(text)} />
      </div>
      <p className="hw1-caption hw4-line" aria-live={playing ? 'off' : 'polite'}>{T.status(shown > 0 ? run.path[shown - 1] : null, run.exact)}</p>
    </div>
  );
};

// --- 1.5 I risultati fianco a fianco ---------------------------------------------------------

const Results = ({ s, job, customStudy, text }) => {
  const R = text.results;
  const rows = useMemo(() => view.resultsRows(s, customStudy, view.pathological()), [s, customStudy]);
  return (
    <>
      <Paras list={R.intro} />
      {!s && <Pending text={text} result={job} />}
      <p className="hw1-table-title"><strong>{R.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw5-results">
          <thead>
            <tr><th>{R.cols.name}</th><th>{R.cols.integral}</th><th>{R.cols.riemann}</th><th>{R.cols.lebesgue}</th><th>{R.cols.riemannError}</th><th>{R.cols.lebesgueError}</th><th>{R.cols.verdict}</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th>{text.functionNames[r.key]}</th>
                <td>{R.integralCell(r)}</td>
                <td>{R.riemannCell(r)}</td>
                <td>{R.lebesgueCell(r)}</td>
                <td>{R.errorCell(r.errors.riemann)}</td>
                <td>{R.errorCell(r.errors.lebesgue)}</td>
                <td>{R.verdicts[r.verdict]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {s && <Paras list={R.after(rows)} />}
    </>
  );
};

// --- 1.7 Quanto costano --------------------------------------------------------------------

const Efficiency = ({ s, job, spec, fnKey, customStudy, text, palette }) => {
  const E = text.efficiency;
  const F = text.fmt;
  // le nove funzioni arrivano dal worker; quella scritta da chi legge si misura qui
  const study = useMemo(() => {
    if (fnKey === hw.CUSTOM) return customStudy ? hw.efficiencyStudy(spec, customStudy.reference) : null;
    return s ? s.efficiency[fnKey] : null;
  }, [fnKey, spec, customStudy, s]);
  const data = useMemo(() => (study ? view.efficiencyChart(study, F.decimal) : null), [study, F]);
  const tip = useMemo(() => (data ? view.tips.cost(data, text.tips) : null), [data, text]);
  const rows = useMemo(() => (s ? view.efficiencyRows(s) : null), [s]);
  const facts = useMemo(() => (s ? view.efficiencyFacts(s) : null), [s]);
  // le due curve sono le colonne Riemann e Lebesgue della tabella
  const [hidden, toggle] = useHidden();
  const legend = useMemo(() => view.legends.cost(text), [text]);
  const riemann = !hidden.has(0);
  const lebesgue = !hidden.has(1);
  return (
    <>
      <Paras list={E.intro} />
      {!study ? (
        <Pending text={text} result={job} />
      ) : (
        <div className="hw1-charts">
          <Figure title={E.chartTitle(text.functionNames[fnKey])} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} />
        </div>
      )}
      {rows && (
        <>
          <p className="hw1-table-title"><strong>{E.tableTitle}</strong></p>
          <div className="hw1-scroll">
            <table className="hw1-table hw1-compact hw5-efficiency">
              <thead>
                <tr>
                  <th>{E.cols.name}</th>
                  <th>{E.cols.target}</th>
                  {riemann && <th>{E.cols.riemann}</th>}
                  {lebesgue && <th>{E.cols.lebesgue}</th>}
                </tr>
              </thead>
              <tbody>
                {rows.flatMap((r) =>
                  r.targets.map((t, i) => (
                    <tr key={`${r.key}-${i}`}>
                      {i === 0 && <th rowSpan={r.targets.length}>{text.functionNames[r.key]}</th>}
                      <td>{F.pow(Math.round(Math.log10(t.target)))}</td>
                      {riemann && <td>{E.cell(t.riemann, 'riemann')}</td>}
                      {lebesgue && <td>{E.cell(t.lebesgue, 'lebesgue')}</td>}
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
          <Paras list={E.after(facts)} />
        </>
      )}
    </>
  );
};

// --- 1.8 Dirichlet e Thomae -----------------------------------------------------------------

const Pathological = React.memo(function Pathological({ text, palette }) {
  const P = text.pathological;
  const F = text.fmt;
  const numbers = useMemo(() => view.DIRICHLET_NUMBERS.map((d) => ({ ...d, fraction: hw.exactFraction(d.value) })), []);
  const study = useMemo(() => view.pathological(), []);
  const data = useMemo(() => view.thomaeChart(F.decimal), [F]);
  const tip = useMemo(() => view.tips.thomae(data, text.tips), [data, text]);
  const upper = useMemo(() => view.thomaeUpper(), []);
  const legend = useMemo(() => view.legends.thomae(text), [text]);
  return (
    <>
      <Paras list={P.intro} />
      <table className="hw1-table hw1-discussion-table hw5-dirichlet">
        <thead>
          <tr><th>{P.cols.number}</th><th>{P.cols.fraction}</th><th>{P.cols.value}</th></tr>
        </thead>
        <tbody>
          {numbers.map((r) => (
            <tr key={r.key}>
              <th data-label={P.cols.number}>{P.numbers[r.key]}</th>
              <td data-label={P.cols.fraction}><code>{`${r.fraction.numerator}/2^${r.fraction.power}`}</code></td>
              <td data-label={P.cols.value}>1</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{P.thomaeIntro}</p>
      <div className="hw1-charts">
        <Figure title={P.chartTitle(upper)} draw={hw.drawHistogram} data={data} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw1-table-title"><strong>{P.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw5-thomae">
          <thead>
            <tr><th>{P.thomaeCols.n}</th><th>{P.thomaeCols.rational}</th><th>{P.thomaeCols.irrational}</th><th>{P.thomaeCols.lower}</th><th>{P.thomaeCols.upper}</th><th>{P.thomaeCols.doubles}</th></tr>
          </thead>
          <tbody>
            {study.thomae.map((r) => (
              <tr key={r.n}>
                <th>{F.int(r.n)}</th>
                <td>{F.sig(r.rational, 4)}</td>
                <td>{F.int(r.irrational)}</td>
                <td>{F.int(r.lower)}</td>
                <td>{F.sig(r.upper, 4)}</td>
                <td>{F.sig(r.doubles, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paras list={P.after(study)} />
    </>
  );
});

// --- 2.1 Liouville e 2.2 erf -----------------------------------------------------------------

const Liouville = React.memo(function Liouville({ text }) {
  const L = text.liouville;
  const F = text.fmt;
  const rows = useMemo(() => hw.liouvilleRows(), []);
  return (
    <>
      <Paras list={L.intro} />
      <Formulas>{L.formulas}</Formulas>
      <p className="hw1-table-title"><strong>{L.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw5-liouville">
          <thead>
            <tr><th>{L.cols.x}</th><th>{L.cols.S}</th><th>{L.cols.ratio}</th><th>{L.cols.degree}</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.x}><th>{F.int(r.x)}</th><td>{r.S >= 1e5 ? F.sci(r.S, 6) : F.sig(r.S, 7)}</td><td>{F.num(r.ratio, 6)}</td><td>{F.num(r.degree, 2)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paras list={L.after(rows)} />
    </>
  );
});

const Erf = React.memo(function Erf({ text }) {
  const E = text.erf;
  const F = text.fmt;
  const rows = useMemo(() => hw.empiricalRuleRows(), []);
  return (
    <>
      <Paras list={E.intro} />
      <Formulas>{E.formulas}</Formulas>
      <p className="hw1-table-title"><strong>{E.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw5-erf">
          <thead>
            <tr><th>{E.cols.k}</th><th>{E.cols.value}</th><th>{E.cols.reference}</th><th>{E.cols.rounded}</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k}><th>{r.k}</th><td>{F.num(r.value, 16)}</td><td>{F.num(r.reference, 16)}</td><td>{F.num(r.rounded, 4)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paras list={E.after(rows)} />
    </>
  );
});

// --- 2.7 - 2.11 Le serie, le approssimazioni, il metodo, il riferimento, il confronto -------------

const Series = React.memo(function Series({ text, palette }) {
  const S = text.series;
  const F = text.fmt;
  const rows = useMemo(() => hw.seriesRows(), []);
  const [z, setZ] = useState(view.SERIES_CHOICES[2]);
  const data = useMemo(() => view.seriesChart(z, F.decimal), [z, F]);
  // la serie degli appunti ha quattro colonne, quella a termini positivi due; il limite non ne ha
  const [hidden, toggle] = useHidden();
  const legend = useMemo(() => view.legends.series(text), [text]);
  const alt = !hidden.has(0);
  const pos = !hidden.has(2);
  const tip = useMemo(() => view.tips.series(data, text.tips), [data, text]);
  return (
    <>
      <Paras list={S.intro} />
      <Formulas>{S.formulas}</Formulas>
      <p className="hw1-table-title"><strong>{S.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw5-series">
          <thead>
            <tr>
              <th>{S.cols.z}</th>
              {alt && <th>{S.cols.altTerms}</th>}
              {alt && <th>{S.cols.largest}</th>}
              {alt && <th>{S.cols.lost}</th>}
              {alt && <th>{S.cols.altError}</th>}
              {pos && <th>{S.cols.posTerms}</th>}
              {pos && <th>{S.cols.posError}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.z}>
                <th>{r.z}</th>
                {alt && <td>{r.alternating.terms}</td>}
                {alt && <td>{F.sci(r.alternating.largest)}</td>}
                {alt && <td>{F.num(r.alternating.lost, 1)}</td>}
                {alt && <td>{F.err(r.alternating.error)}</td>}
                {pos && <td>{r.positive.terms}</td>}
                {pos && <td>{F.err(r.positive.error)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Choices label={S.chooseLabel} options={view.SERIES_CHOICES.map((v) => [v, F.plain(v)])} value={z} onChange={setZ} />
      <div className="hw1-charts">
        <Figure title={S.chartTitle(z)} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} />
      </div>
      <Paras list={S.after(rows)} />
    </>
  );
});

const Approximations = React.memo(function Approximations({ text, palette }) {
  const A = text.approximations;
  const F = text.fmt;
  const data = useMemo(() => view.approximationChart(F.decimal), [F]);
  const tip = useMemo(() => view.tips.approximation(data, text.tips), [data, text]);
  const facts = useMemo(() => view.approximationFacts(), []);
  return (
    <>
      <Paras list={A.intro} />
      <div className="hw1-charts">
        <Figure title={A.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={view.legends.approximation(text)} />
      </div>
      <Paras list={A.after(facts)} />
    </>
  );
});

const Ours = ({ s, text }) => {
  const O = text.ours;
  const facts = useMemo(() => view.methodsFacts(s), [s]);
  return (
    <>
      <Paras list={O.intro(facts)} />
      <Formulas>{O.formulas}</Formulas>
      <Paras list={O.after(facts)} />
    </>
  );
};

const Reference = React.memo(function Reference({ text }) {
  const R = text.reference;
  const F = text.fmt;
  const { rows, nist } = useMemo(() => view.referenceFacts(), []);
  return (
    <>
      <Paras list={R.intro} />
      <p><a href={hw.NIST_URL} target="_blank" rel="noopener noreferrer">{R.link}</a></p>
      <p className="hw1-table-title"><strong>{R.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw5-reference">
          <thead>
            <tr><th>{R.cols.z}</th><th>{R.cols.nist}</th><th>{R.cols.mpmath}</th><th>{R.cols.ours}</th><th>{R.cols.error}</th><th>{R.cols.nistError}</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.z} className={nist.mismatches.some((m) => m.z === r.z) ? 'hw5-misprint' : undefined}>
                <th>{F.plain(r.z)}</th>
                <td>{r.nist === null ? '-' : F.num(r.nist, 5)}</td>
                <td>{F.sig(r.mpmath, 16)}</td>
                <td>{F.sig(r.value, 16)}</td>
                <td>{F.err(r.error)}</td>
                <td>{r.nistError === null ? '-' : F.err(r.nistError)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>{R.nist(nist)}</p>
      {nist.mismatches.map((m) => <p key={m.z}>{R.mismatch(m)}</p>)}
      <Paras list={R.after(rows)} />
    </>
  );
});

const Methods = ({ s, job, text, palette }) => {
  const M = text.methods;
  const F = text.fmt;
  const rows = useMemo(() => view.methodsRows(s), [s]);
  const data = useMemo(() => view.methodsChart(F.decimal), [F]);
  const tip = useMemo(() => view.tips.methods(data, text.tips, text.methodNames), [data, text]);
  const facts = useMemo(() => view.methodsFacts(s), [s]);
  const legend = useMemo(() => view.legends.methods(text), [text]);
  // ogni metodo e' una curva del grafico e una riga della tabella: nascosto nella legenda, sparisce da entrambi
  const [hidden, toggle] = useHidden();
  const visible = rows.filter((r) => !hidden.has(hw.CDF_METHODS.indexOf(r.key)));
  return (
    <>
      <Paras list={M.intro} />
      <p className="hw1-table-title"><strong>{M.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw5-methods">
          <thead>
            <tr><th>{M.cols.method}</th><th>{M.cols.absolute}</th><th>{M.cols.relative}</th><th>{M.cols.exp}</th><th>{M.cols.terms}</th><th>{M.cols.time}</th></tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.key} className={r.key === 'ours' ? 'hw5-ours' : undefined}>
                <th>{text.methodNames[r.key]}</th>
                <td>{F.err(r.absolute)}</td>
                <td>{M.relativeCell(r.relative)}</td>
                <td>{F.int(r.exp)}</td>
                <td>{r.terms ? F.int(r.terms) : '-'}</td>
                <td>{M.timeCell(r.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!s && <Pending text={text} result={job} />}
      <div className="hw1-charts">
        <Figure title={M.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} />
      </div>
      <Paras list={M.after(facts)} />
    </>
  );
};

// --- 3, 4 e 5 --------------------------------------------------------------------------------------------------

const TestsSummary = React.memo(function TestsSummary({ s, job, text }) {
  const T = text.tests;
  const F = text.fmt;
  const summary = useMemo(() => (s ? view.testSummary(s) : null), [s]);
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5 hw2-far">
      <Title id="hw5-tests" level={0}>{text.sections.tests}</Title>
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
          <Paras list={T.after(summary)} />
        </>
      )}
    </section>
  );
});

const History = React.memo(function History({ text }) {
  const H = text.history;
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5 hw2-far">
      <Title id="hw5-history" level={0}>{text.sections.history}</Title>
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

const Conclusion = React.memo(function Conclusion({ s, facts, text }) {
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5 hw2-far">
      <Title id="hw5-conclusion" level={0}>{text.sections.conclusion}</Title>
      <Paras list={text.conclusion(s, facts)} />
    </section>
  );
});

// --- La pagina --------------------------------------------------------------------------------------------------

const Homework5 = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const text = HW5_TEXTS[language] || HW5_TEXTS.en;
  const palette = PALETTES[theme === 'dark' ? 'dark' : 'light'];
  const S = text.sections;

  // --- i campi delle sezioni 1.8 e 2.7, e l'ultimo valore valido di ognuno ---
  const [fields, setFields] = useState(view.DEFAULT_INPUTS);
  const [params, setParams] = useState(view.DEFAULT_PARAMS);
  const read = useMemo(() => view.readInputs(fields), [fields]);
  const change = (patch) => {
    const next = { ...fields, ...patch };
    setFields(next);
    setParams((prev) => view.applyInputs(view.readInputs(next), prev));
  };
  const restore = () => {
    setFields(view.DEFAULT_INPUTS);
    setParams(view.DEFAULT_PARAMS);
  };

  // i calcoli partono quando i campi smettono di cambiare; intanto restano i risultati di prima
  const key = useSettled(view.paramsKey(params));
  const settled = useMemo(() => view.parseParamsKey(key), [key]);
  const job = useExplore(key);
  const [previous, setPrevious] = useState(null);
  if (job.value && previous !== job.value) setPrevious(job.value);
  const s = job.value || previous;
  const waiting = s !== null && !job.error && (view.paramsKey(params) !== key || !job.value);
  const run = { s, job, fields, read, change, restore, waiting, valid: view.allValid(read), badge: view.inputBadge(params, text.data) };

  // --- la funzione dell'Esercizio 1: una delle nove, o quella scritta da chi legge (l'ultima valida) ---
  const [fnKey, setFnKey] = useState('square');
  const [custom, setCustom] = useState(view.DEFAULT_CUSTOM);
  const customRead = useMemo(() => view.readCustom(custom), [custom]);
  const [validCustom, setValidCustom] = useState(customRead);
  if (customRead.ok && customRead !== validCustom) setValidCustom(customRead);
  const spec = useMemo(() => view.specOf(fnKey, validCustom), [fnKey, validCustom]);
  const reference = useMemo(() => view.referenceOf(spec), [spec]);
  // il confronto della funzione scritta da chi legge si calcola qui, una volta, per le sezioni 1.5 - 1.7
  const customStudy = useMemo(() => (fnKey === hw.CUSTOM ? hw.comparisonStudy(spec) : null), [fnKey, spec]);

  // i fatti delle conclusioni che non dipendono dalle simulazioni
  const facts = useMemo(() => ({ ...view.convergenceFacts(hw.convergenceStudy()), tailTotal: view.tailFacts(hw.tailRows()).total, nist: view.referenceFacts().nist }), []);

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
            <a href={`${DOWNLOADS}homework5.zip`} download="homework5.zip" className="button icon solid fa-download">{text.download.zip}</a>
            <a href={`${DOWNLOADS}homework5/index.html?lang=${language === 'en' ? 'en' : 'it'}`} target="_blank" rel="noopener noreferrer" className="button alt icon solid fa-external-link-alt">{text.download.online}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <HomeworkShell slug="homework-5" sidebar={sidebar} toc={toc}>
      <Assignment text={text} />

      {/* ESERCIZIO 1: Riemann e Lebesgue */}
      <section className="hw1-section hw2 hw3 hw4 hw5">
        <Title id="hw5-exercise1" level={0}>{S.exercise1}</Title>
        <Paras list={text.exercise1.intro} />

        <Title id="hw5-idea" level={1}>{S.idea}</Title>
        <Paras list={text.idea.intro} />
        <TryCoins seed={settled.seed} text={text} />

        <Title id="hw5-functions" level={1}>{S.functions}</Title>
        <Functions fnKey={fnKey} setFnKey={setFnKey} custom={custom} setCustom={setCustom} customRead={customRead} text={text} />

        <Title id="hw5-riemann" level={1}>{S.riemann}</Title>
        <RiemannSection spec={spec} reference={reference} fnKey={fnKey} text={text} palette={palette} />

        <Title id="hw5-lebesgue" level={1}>{S.lebesgue}</Title>
        <LebesgueSection spec={spec} reference={reference} fnKey={fnKey} text={text} palette={palette} />
        <TrySlices spec={spec} reference={reference} text={text} palette={palette} />

        <Title id="hw5-results" level={1}>{S.results}</Title>
        <Results s={s} job={job} customStudy={customStudy} text={text} />

        <Title id="hw5-compare" level={1}>{S.compare}</Title>
        <Compare s={s} job={job} fnKey={fnKey} customStudy={customStudy} text={text} palette={palette} />

        <Title id="hw5-efficiency" level={1}>{S.efficiency}</Title>
        <Efficiency s={s} job={job} spec={spec} fnKey={fnKey} customStudy={customStudy} text={text} palette={palette} />

        <Title id="hw5-pathological" level={1}>{S.pathological}</Title>
        <Pathological text={text} palette={palette} />

        <Title id="hw5-traffic" level={1}>{S.traffic}</Title>
        <Traffic text={text} palette={palette} />

        <Title id="hw5-montecarlo" level={1}>{S.montecarlo}</Title>
        <MonteCarlo run={run} text={text} palette={palette} />
        <TryMc seed={settled.seed} text={text} palette={palette} />
      </section>

      {/* ESERCIZIO 2: la funzione di ripartizione della normale */}
      <section className="hw1-section hw2 hw3 hw4 hw5">
        <Title id="hw5-exercise2" level={0}>{S.exercise2}</Title>
        <Paras list={text.exercise2.intro} />

        <Title id="hw5-liouville" level={1}>{S.liouville}</Title>
        <Liouville text={text} />

        <Title id="hw5-erf" level={1}>{S.erf}</Title>
        <Erf text={text} />

        <Title id="hw5-area" level={1}>{S.area}</Title>
        <Area text={text} palette={palette} />
        <TryArea text={text} palette={palette} />

        <Title id="hw5-rules" level={1}>{S.rules}</Title>
        <Rules text={text} />

        <Title id="hw5-infinity" level={1}>{S.infinity}</Title>
        <MinusInfinity text={text} />

        <Title id="hw5-convergence" level={1}>{S.convergence}</Title>
        <Convergence text={text} palette={palette} />

        <Title id="hw5-series" level={1}>{S.series}</Title>
        <Series text={text} palette={palette} />

        <Title id="hw5-approximations" level={1}>{S.approximations}</Title>
        <Approximations text={text} palette={palette} />

        <Title id="hw5-ours" level={1}>{S.ours}</Title>
        <Ours s={s} text={text} />

        <Title id="hw5-reference" level={1}>{S.reference}</Title>
        <Reference text={text} />

        <Title id="hw5-methods" level={1}>{S.methods}</Title>
        <Methods s={s} job={job} text={text} palette={palette} />

        <Title id="hw5-table" level={1}>{S.table}</Title>
        <ZTableSection text={text} />

        <Title id="hw5-quantiles" level={1}>{S.quantiles}</Title>
        <Quantiles text={text} palette={palette} />

        <Title id="hw5-tails" level={1}>{S.tails}</Title>
        <Tails text={text} palette={palette} />
        <TryAlarm text={text} palette={palette} />

        <Title id="hw5-data" level={1}>{S.data}</Title>
        <DataSection run={run} text={text} palette={palette} />
      </section>

      <section className="hw1-section hw2 hw3 hw4 hw5">
        <Title id="hw5-checks" level={0}>{S.checks}</Title>
        <Verify text={text} />
      </section>

      <TestsSummary s={s} job={job} text={text} />

      <History text={text} />

      <Conclusion s={s} facts={facts} text={text} />
    </HomeworkShell>
  );
};

export default Homework5;
