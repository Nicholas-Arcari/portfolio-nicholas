// src/pages/statistics/Homework6.jsx
// Homework #6 di Statistics: l'indipendenza statistica. Su un dataset vero
// di sicurezza informatica, le 22.544 connessioni del test set di NSL-KDD,
// chi legge sceglie due variabili X e F; la pagina ne costruisce la tabella
// di contingenza, le frequenze marginali e condizionate, le frequenze attese
// se fossero indipendenti, il chi quadrato con il suo p-value, e accanto il
// test G, i rimedi per le tabelle piccole (Fisher, Yates) e il test di
// permutazione. Poi la teoria dell'indipendenza, l'interpretazione (residui,
// V di Cramer, tutte le coppie), la differenza fra associazione e causalita'
// con il paradosso di Simpson sulle ammissioni di Berkeley, il riepilogo dei
// test, il contesto storico e le conclusioni. Quattro riquadri "Prova"
// lasciano mettere le mani sui numeri.
//
// Qui c'e' solo la pagina React. I dati, i calcoli, il generatore e i
// grafici sono in hw6/homework6.js (i record in hw6/nslkdd.js), i testi in
// hw6/texts.js e la logica di presentazione in hw6/view.js: sono gli stessi
// file da cui la build ricava il programma scaricabile
// (build/homework-standalone.js), cosi' la pagina e il download non possono
// raccontare due cose diverse. Ogni calcolo dura pochi millisecondi: niente
// worker, e il test di permutazione avanza un poco a ogni fotogramma.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/languageContext';
import { useTheme } from '../../contexts/themeContext';
import HomeworkShell from './HomeworkShell';
import { ChartLegend } from './ChartLegend';
import { hiddenParts, useHidden } from './legendState';
import * as hw from './hw6/homework6';
import * as view from './hw6/view';
import { HW6_TEXTS, originalAssignment } from './hw6/texts';

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
    series: ['#7986cb', '#ff6b81', '#4fb39c', '#ffca28', '#ba68c8', '#4dd0e1', '#9e9e9e', '#bcaaa4', '#d4e157', '#ffa726', '#64b5f6', '#f06292'],
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

const EMPTY_VALUES = new Float64Array(0);

// Un titolo di sezione: id per l'indice, tabIndex -1 perche' l'indice ci
// porti anche il focus della tastiera.
const Title = ({ id, level, children }) => {
  const Tag = HEADINGS[level];
  return <Tag id={id} tabIndex={-1} className="hw1-anchor">{children}</Tag>;
};

const Paras = ({ list }) => (Array.isArray(list) ? list : [list]).filter(Boolean).map((t, i) => <p key={i}>{t}</p>);

const Check = ({ ok, children }) => <p className={ok ? 'hw2-check is-ok' : 'hw2-check is-bad'}>{children}</p>;

const Formulas = ({ title = null, children }) => (
  <>
    {title && <p className="hw1-table-title"><strong>{title}</strong></p>}
    <pre className="hw1-formulas">{children}</pre>
  </>
);

const TableTitle = ({ children }) => <p className="hw1-table-title"><strong>{children}</strong></p>;

// Un grafico su canvas, ridisegnato quando cambia la larghezza, con i valori
// del pezzo sotto il puntatore e, con `link` (view.links), la riga della
// tabella legata: il disegno vero e' in homework6.js. Le voci della legenda
// nascondono e mostrano le loro parti; con `hidden` e `onToggle` lo stato
// sta nella sezione, che ne fa sparire anche le colonne della tabella
// annessa.
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
 * A two-way table: the levels of X on the rows, those of F on the columns,
 * with the totals when `totals` gives them ({ row(i), col(j), all }). `cell`
 * writes a cell, `cellClass` gives it a class (the residuals); `id` ties
 * the table to a chart.
 */
const Matrix = ({ id = null, title = null, corner = '', rows, cols, rowName, colName, cell, cellClass = null, totals = null, totalLabel = '', className = '' }) => (
  <>
    {title && <TableTitle>{title}</TableTitle>}
    <div className="hw1-scroll hw6-matrix-box">
      <table id={id || undefined} className={`hw1-table hw1-compact hw6-matrix ${className}`}>
        <thead>
          <tr>
            <th scope="col">{corner}</th>
            {cols.map((j) => <th key={j} scope="col">{colName(j)}</th>)}
            {totals && <th scope="col" className="hw6-total">{totalLabel}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i}>
              <th scope="row">{rowName(i)}</th>
              {cols.map((j) => <td key={j} className={cellClass ? cellClass(i, j) || undefined : undefined}>{cell(i, j)}</td>)}
              {totals && <td className="hw6-total">{totals.row(i)}</td>}
            </tr>
          ))}
        </tbody>
        {totals && totals.col && (
          <tfoot>
            <tr>
              <th scope="row">{totalLabel}</th>
              {cols.map((j) => <td key={j}>{totals.col(j)}</td>)}
              <td className="hw6-total">{totals.all}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  </>
);

const range = (n) => Array.from({ length: n }, (_, i) => i);

// --- 0. La consegna ------------------------------------------------------------

const Assignment = React.memo(function Assignment({ text }) {
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5 hw6">
      <Title id="hw6-assignment" level={0}>{text.sections.assignment}</Title>
      <Paras list={text.assignment.intro} />
      <details className="hw1-original" open>
        <summary>{text.assignment.originalTitle}</summary>
        <p className="hw1-note">{text.assignment.originalNote}</p>
        <blockquote lang="en">
          {originalAssignment().map((block, i) => {
            if (block.type === 'title') return <p key={i}><strong>{block.text}</strong></p>;
            return <p key={i}>{block.text}</p>;
          })}
        </blockquote>
      </details>
    </section>
  );
});

// --- 1.1 Il dataset e la scelta di X e F ----------------------------------------------

const Dataset = React.memo(function Dataset({ choice, setChoice, text }) {
  const D = text.dataset;
  const F = text.fmt;
  const records = useMemo(() => hw.firstRecords(8), []);
  const labels = useMemo(() => hw.labelCounts(), []);
  const flags = useMemo(() => {
    const counts = new Array(hw.variableLevels('flag').length).fill(0);
    for (const v of hw.variableCodes('flag')) counts[v]++;
    return hw.variableLevels('flag').map((flag, i) => ({ flag, count: counts[i] }));
  }, []);
  const variables = hw.VARIABLES.map((v) => [v, text.names.variables[v]]);
  // X e F devono essere diverse: scegliere per X la variabile di F le scambia
  const choose = (axis) => (v) => {
    const other = axis === 'x' ? 'f' : 'x';
    setChoice((c) => (v === c[other] ? { ...c, [axis]: v, [other]: c[axis] } : { ...c, [axis]: v }));
  };
  return (
    <>
      <p>{D.intro}</p>
      <Choices label={D.xLabel} options={variables} value={choice.x} onChange={choose('x')} />
      <Choices label={D.fLabel} options={variables} value={choice.f} onChange={choose('f')} />
      <div className="hw3-choices" role="group" aria-label={D.levelsLabel}>
        <span className="hw3-choices-label">{D.levelsLabel}</span>
        <button type="button" className="button alt" aria-pressed={choice.merge} onClick={() => setChoice((c) => ({ ...c, merge: !c.merge }))}>{D.mergeLabel}</button>
      </div>
      <TableTitle>{D.sampleTitle}</TableTitle>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw6-records">
          <thead>
            <tr>{['n', 'protocol', 'service', 'flag', 'label', 'class'].map((k) => <th key={k} scope="col">{D.sampleCols[k]}</th>)}</tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i}>
                <th scope="row">{i + 1}</th>
                <td>{r.protocol}</td>
                <td>{r.service}</td>
                <td>{r.flag}</td>
                <td>{r.label}</td>
                <td>{text.names.classes[r.class]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="hw2-details">
        <summary>{D.categoriesTitle}</summary>
        <p>{D.categoriesIntro}</p>
        <div className="hw1-scroll">
          <table className="hw1-table hw1-compact hw6-labels">
            <thead>
              <tr>{['label', 'count', 'category', 'source'].map((k) => <th key={k} scope="col">{D.categoryCols[k]}</th>)}</tr>
            </thead>
            <tbody>
              {labels.map((l) => (
                <tr key={l.label}>
                  <th scope="row">{l.label}</th>
                  <td>{F.int(l.count)}</td>
                  <td>{text.names.classes[l.category]}</td>
                  <td>{D.sources[l.source]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <details className="hw2-details">
        <summary>{D.flagsTitle}</summary>
        <div className="hw1-scroll">
          <table className="hw1-table hw1-compact hw6-flags">
            <thead>
              <tr><th scope="col">{D.sampleCols.flag}</th><th scope="col">{D.categoryCols.count}</th><th scope="col" /></tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.flag}>
                  <th scope="row">{f.flag}</th>
                  <td>{F.int(f.count)}</td>
                  <td>{D.flags[f.flag]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="hw1-note">{D.citation}</p>
      <p className="hw1-buttons">
        <a href={hw.DATA_SOURCE.url} target="_blank" rel="noopener noreferrer">{D.datasetLink}</a>
        <a href={hw.DATA_SOURCE.paperUrl} target="_blank" rel="noopener noreferrer">{D.paperLink}</a>
      </p>
    </>
  );
});

// --- 1.2 La tabella di contingenza ------------------------------------------------------

const Contingency = React.memo(function Contingency({ s, names, varNames, text }) {
  const T = text.table;
  const F = text.fmt;
  const empty = [];
  for (const i of s.rows) for (const j of s.cols) if (s.counts[i][j] === 0) empty.push(`${names.x[i]} / ${names.f[j]}`);
  return (
    <>
      <p>{T.intro}</p>
      <Formulas>{T.formulas}</Formulas>
      <Matrix
        title={T.title(varNames.x, varNames.f)}
        corner={`${varNames.x} \\ ${varNames.f}`}
        rows={range(s.counts.length)}
        cols={range(s.counts[0].length)}
        rowName={(i) => names.x[i]}
        colName={(j) => names.f[j]}
        cell={(i, j) => F.int(s.counts[i][j])}
        cellClass={(i, j) => (s.counts[i][j] === 0 ? 'is-zero' : '')}
        totals={{ row: (i) => F.int(s.rowTotals[i]), col: (j) => F.int(s.colTotals[j]), all: F.int(s.N) }}
        totalLabel={text.ui.total}
      />
      {empty.length > 0 && <p>{T.empty(empty.slice(0, 8).join(', ') + (empty.length > 8 ? ', ...' : ''))}</p>}
    </>
  );
});

// --- 1.3 Frequenze marginali e condizionate ----------------------------------------------

const Marginal = ({ title, levels, totals, shares, text }) => {
  const C = text.frequencies.marginalCols;
  const F = text.fmt;
  return (
    <div>
      <TableTitle>{title}</TableTitle>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw6-marginal">
          <thead>
            <tr><th scope="col">{C.level}</th><th scope="col">{C.count}</th><th scope="col">{C.share}</th></tr>
          </thead>
          <tbody>
            {levels.map((name, i) => (
              <tr key={i}>
                <th scope="row">{name}</th>
                <td>{F.int(totals[i])}</td>
                <td>{F.pct(shares[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Frequencies = ({ s, names, varNames, text, palette }) => {
  const Q = text.frequencies;
  const F = text.fmt;
  const [profile, setProfile] = useState('rows');
  const data = useMemo(() => view.conditionalChart(s, names, text), [s, names, text]);
  const legend = useMemo(() => view.legends.conditional(s, names), [s, names]);
  const tip = useMemo(() => view.tips.conditional(s, names, text.tips), [s, names, text]);
  // ogni modalita' di F e' un colore delle barre e una colonna delle tabelle: nascosta nella legenda, sparisce da entrambe
  const [hidden, toggle] = useHidden();
  const cols = s.cols.filter((_, k) => !hidden.has(k));
  const gap = useMemo(() => view.profileGap(s), [s]);
  return (
    <>
      <p>{Q.intro}</p>
      <Formulas>{Q.formulas}</Formulas>
      <div className="hw6-pair">
        <Marginal title={Q.marginalTitle(varNames.x)} levels={s.rows.map((i) => names.x[i])} totals={s.rows.map((i) => s.rowTotals[i])} shares={s.rows.map((i) => s.rowShares[i])} text={text} />
        <Marginal title={Q.marginalTitle(varNames.f)} levels={s.cols.map((j) => names.f[j])} totals={s.cols.map((j) => s.colTotals[j])} shares={s.cols.map((j) => s.colShares[j])} text={text} />
      </div>
      <Choices label={Q.profileLabel} options={[['rows', Q.profiles.rows], ['cols', Q.profiles.cols]]} value={profile} onChange={setProfile} />
      {profile === 'rows' ? (
        <>
          <TableTitle>{Q.rowsTitle}</TableTitle>
          <div className="hw1-scroll hw6-matrix-box">
            <table id={view.LINKED_TABLES.profiles} className="hw1-table hw1-compact hw6-matrix">
              <thead>
                <tr>
                  <th scope="col">{`${varNames.x} \\ ${varNames.f}`}</th>
                  {cols.map((j) => <th key={j} scope="col">{names.f[j]}</th>)}
                  <th scope="col" className="hw6-total">{Q.marginalCols.count}</th>
                </tr>
              </thead>
              <tbody>
                {s.rows.map((i) => (
                  <tr key={i}>
                    <th scope="row">{names.x[i]}</th>
                    {cols.map((j) => <td key={j}>{F.pct(s.rowProfiles[i][j])}</td>)}
                    <td className="hw6-total">{F.int(s.rowTotals[i])}</td>
                  </tr>
                ))}
                <tr className="hw6-margin-row">
                  <th scope="row">{text.names.all}</th>
                  {cols.map((j) => <td key={j}>{F.pct(s.colShares[j])}</td>)}
                  <td className="hw6-total">{F.int(s.N)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <Matrix
          title={Q.colsTitle}
          corner={`${varNames.x} \\ ${varNames.f}`}
          rows={s.rows}
          cols={cols}
          rowName={(i) => names.x[i]}
          colName={(j) => names.f[j]}
          cell={(i, j) => F.pct(s.colProfiles[i][j])}
          totals={{ row: (i) => F.pct(s.rowShares[i]), col: (j) => F.int(s.colTotals[j]), all: F.int(s.N) }}
          totalLabel={text.names.all}
        />
      )}
      <div className="hw1-charts">
        <Figure title={Q.chartTitle} draw={hw.drawStackedBars} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.profiles} />
      </div>
      {gap && <p>{Q.after({ x: names.x[gap.i], f: names.f[gap.j], share: gap.share, marginal: gap.marginal })}</p>}
    </>
  );
};

// --- 1.4 Le frequenze attese ------------------------------------------------------------------

const Expected = ({ s, names, varNames, text, palette }) => {
  const E = text.expected;
  const F = text.fmt;
  const extreme = useMemo(() => view.extremeCell(s), [s]);
  const [row, setRow] = useState(extreme ? extreme.i : s.rows[0]);
  const data = useMemo(() => view.expectedChart(s, row, names, F.decimal), [s, row, names, F]);
  const legend = useMemo(() => view.legends.expected(text), [text]);
  const tip = useMemo(() => view.tips.expected(s, row, names, text.tips), [s, row, names, text]);
  const [hidden, toggle] = useHidden();
  const showObserved = !hidden.has(0);
  const showExpected = !hidden.has(1);
  return (
    <>
      <p>{E.intro}</p>
      <Formulas>{E.formulas}</Formulas>
      <Matrix
        title={E.tableTitle}
        corner={`${varNames.x} \\ ${varNames.f}`}
        rows={range(s.counts.length)}
        cols={range(s.counts[0].length)}
        rowName={(i) => names.x[i]}
        colName={(j) => names.f[j]}
        cell={(i, j) => F.num(s.expected[i][j], 1)}
        totals={{ row: (i) => F.int(s.rowTotals[i]), col: (j) => F.int(s.colTotals[j]), all: F.int(s.N) }}
        totalLabel={text.ui.total}
      />
      <p className="hw1-note">{E.note}</p>
      <Choices label={E.chooseLabel} options={s.rows.map((i) => [i, names.x[i]])} value={row} onChange={setRow} />
      <div className="hw1-scroll">
        <table id={view.LINKED_TABLES.expected} className="hw1-table hw1-compact hw6-compare">
          <thead>
            <tr>
              <th scope="col">{E.cols.level}</th>
              {showObserved && <th scope="col">{E.cols.observed}</th>}
              {showExpected && <th scope="col">{E.cols.expected}</th>}
              {showObserved && showExpected && <th scope="col">{E.cols.difference}</th>}
            </tr>
          </thead>
          <tbody>
            {s.cols.map((j) => (
              <tr key={j}>
                <th scope="row">{names.f[j]}</th>
                {showObserved && <td>{F.int(s.counts[row][j])}</td>}
                {showExpected && <td>{F.num(s.expected[row][j], 1)}</td>}
                {showObserved && showExpected && <td>{F.num(s.counts[row][j] - s.expected[row][j], 1)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hw1-charts">
        <Figure title={E.chartTitle(names.x[row])} draw={hw.drawGroupedBars} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.expected} />
      </div>
      {extreme && <p>{E.after({ x: names.x[extreme.i], f: names.f[extreme.j], o: extreme.o, e: extreme.e })}</p>}
    </>
  );
};

// --- 1.5 Il chi quadrato -------------------------------------------------------------------------

const Chi2 = React.memo(function Chi2({ s, names, varNames, text }) {
  const C = text.chi2;
  const F = text.fmt;
  if (!s.testable) return <p>{C.notTestable}</p>;
  return (
    <>
      <p>{C.intro}</p>
      <Formulas>{C.formulas}</Formulas>
      <Matrix
        title={C.contributionsTitle}
        corner={`${varNames.x} \\ ${varNames.f}`}
        rows={s.rows}
        cols={s.cols}
        rowName={(i) => names.x[i]}
        colName={(j) => names.f[j]}
        cell={(i, j) => F.num(s.contributions[i][j], 2)}
        totals={{
          row: (i) => F.num(s.cols.reduce((a, j) => a + s.contributions[i][j], 0), 2),
          col: (j) => F.num(s.rows.reduce((a, i) => a + s.contributions[i][j], 0), 2),
          all: F.num(s.chi2, 2),
        }}
        totalLabel={text.ui.total}
      />
      <p className="hw1-caption hw4-line"><strong>{C.result(s)}</strong></p>
      <p>{C.decision(s)}</p>
      <p>{C.after}</p>
    </>
  );
});

// --- Prova: la vostra tabella -------------------------------------------------------------------

const startCells = () => view.TRY_COUNTS.map((row) => row.map(String));

const TryTable = ({ text }) => {
  const T = text.tryTable;
  const F = text.fmt;
  const [mode, setMode] = useState('grid');
  const [cells, setCells] = useState(startCells);
  // null: l'esempio, nella lingua della pagina, finche' chi legge non lo cambia
  const [pairs, setPairs] = useState(null);
  const [header, setHeader] = useState(false);
  const pairsText = pairs === null ? T.examplePairs : pairs;
  const read = useMemo(() => (mode === 'grid' ? view.readGrid(cells) : view.readPairs(pairsText, header)), [mode, cells, pairsText, header]);
  const rowName = (i) => (i < T.exampleNames.x.length ? T.exampleNames.x[i] : T.rowName(i));
  const colName = (j) => (j < T.exampleNames.f.length ? T.exampleNames.f[j] : T.colName(j));
  const names = read.ok && read.xLevels ? { x: read.xLevels, f: read.fLevels } : { x: cells.map((_, i) => rowName(i)), f: cells[0].map((_, j) => colName(j)) };
  const setCell = (i, j, value) => setCells((old) => old.map((row, a) => (a === i ? row.map((v, b) => (b === j ? value : v)) : row)));
  const addRow = () => setCells((old) => (old.length < view.GRID.max ? [...old, old[0].map(() => '0')] : old));
  const removeRow = () => setCells((old) => (old.length > view.GRID.min ? old.slice(0, -1) : old));
  const addCol = () => setCells((old) => (old[0].length < view.GRID.max ? old.map((row) => [...row, '0']) : old));
  const removeCol = () => setCells((old) => (old[0].length > view.GRID.min ? old.map((row) => row.slice(0, -1)) : old));
  const reset = () => {
    setCells(startCells());
    setPairs(null);
    setHeader(false);
  };
  let error = null;
  if (!read.ok) {
    const m = T.errors[read.error];
    error = typeof m === 'function' ? m(read.line, read.text) : m;
  }
  const s = read.ok ? read.s : null;
  return (
    <div className="hw4-try">
      <Title id="hw6-try-table" level={2}>{text.sections.tryTable}</Title>
      <p>{T.intro}</p>
      <Choices label={T.modeLabel} options={[['grid', T.modes.grid], ['pairs', T.modes.pairs]]} value={mode} onChange={setMode} />
      {mode === 'grid' ? (
        <>
          <div className="hw1-scroll hw6-grid-box">
            <table className="hw1-table hw1-compact hw6-grid">
              <thead>
                <tr>
                  <th scope="col">{`${T.xName} \\ ${T.fName}`}</th>
                  {cells[0].map((_, j) => <th key={j} scope="col">{colName(j)}</th>)}
                </tr>
              </thead>
              <tbody>
                {cells.map((row, i) => (
                  <tr key={i}>
                    <th scope="row">{rowName(i)}</th>
                    {row.map((v, j) => {
                      const bad = !hw.parseInteger(v, hw.LIMITS.cell).ok;
                      return (
                        <td key={j}>
                          <input type="text" inputMode="numeric" {...FIELD} maxLength={7} value={v} aria-label={T.cellLabel(rowName(i), colName(j))} aria-invalid={bad} onChange={(e) => setCell(i, j, e.target.value.slice(0, 7))} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hw1-buttons">
            <button type="button" className="button alt" onClick={addRow} disabled={cells.length >= view.GRID.max}>{T.addRow}</button>
            <button type="button" className="button alt" onClick={removeRow} disabled={cells.length <= view.GRID.min}>{T.removeRow}</button>
            <button type="button" className="button alt" onClick={addCol} disabled={cells[0].length >= view.GRID.max}>{T.addCol}</button>
            <button type="button" className="button alt" onClick={removeCol} disabled={cells[0].length <= view.GRID.min}>{T.removeCol}</button>
            <button type="button" className="button" onClick={reset}>{T.reset}</button>
          </p>
        </>
      ) : (
        <div className="hw6-pairs">
          <label htmlFor="hw6-pairs-input">{T.pairsLabel}</label>
          <textarea id="hw6-pairs-input" rows={8} {...FIELD} value={pairsText} onChange={(e) => setPairs(e.target.value.slice(0, 2000000))} aria-invalid={Boolean(error)} aria-describedby="hw6-pairs-help" />
          <label className="hw6-check">
            <input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} /> {T.headerLabel}
          </label>
          <p id="hw6-pairs-help" className="hw1-note">{read.ok ? T.records(read.records) : ''}</p>
          <p className="hw1-buttons">
            <button type="button" className="button" onClick={reset}>{T.reset}</button>
          </p>
        </div>
      )}
      {error && <p className="hw1-field-error" role="alert">{error}</p>}
      {s && (
        <>
          {mode === 'pairs' && (
            <Matrix
              corner={`X \\ F`}
              rows={range(s.counts.length)}
              cols={range(s.counts[0].length)}
              rowName={(i) => names.x[i]}
              colName={(j) => names.f[j]}
              cell={(i, j) => F.int(s.counts[i][j])}
              totals={{ row: (i) => F.int(s.rowTotals[i]), col: (j) => F.int(s.colTotals[j]), all: F.int(s.N) }}
              totalLabel={text.ui.total}
            />
          )}
          <Matrix
            title={text.expected.tableTitle}
            corner={mode === 'grid' ? `${T.xName} \\ ${T.fName}` : 'X \\ F'}
            rows={range(s.counts.length)}
            cols={range(s.counts[0].length)}
            rowName={(i) => names.x[i]}
            colName={(j) => names.f[j]}
            cell={(i, j) => (s.rowTotals[i] > 0 && s.colTotals[j] > 0 ? F.num(s.expected[i][j], 2) : '-')}
            cellClass={(i, j) => (s.rowTotals[i] > 0 && s.colTotals[j] > 0 && s.expected[i][j] < 5 ? 'is-small' : '')}
          />
          <div className="hw1-caption hw4-line" aria-live="polite">
            <p><strong>{T.result(s)}</strong> {T.verdict(s)}</p>
            {!s.small.cochran && <p>{T.small(s)}</p>}
            {s.two && <p>{T.twoByTwo(s)}</p>}
          </div>
        </>
      )}
    </div>
  );
};

// --- 1.6 Il test G ------------------------------------------------------------------------------

const GTest = React.memo(function GTest({ s, text }) {
  const G = text.gtest;
  if (!s.testable) return <p>{text.chi2.notTestable}</p>;
  return (
    <>
      <p>{G.intro}</p>
      <Formulas>{G.formulas}</Formulas>
      <p className="hw1-caption hw4-line"><strong>{G.result(s)}</strong></p>
      <p>{G.compare(s)}</p>
    </>
  );
});

// --- 1.7 Tabelle piccole -----------------------------------------------------------------------

const Small = ({ s, small, setSmall, smallCounts, text }) => {
  const M = text.small;
  const F = text.fmt;
  const st = useMemo(() => hw.tableStats(smallCounts), [smallCounts]);
  const cols = [text.names.outcomes.normal, text.names.outcomes.attack];
  return (
    <>
      <p>{M.intro}</p>
      {s.testable && <p>{M.rule(s)}</p>}
      <p>{M.exactIntro}</p>
      <Choices label={M.sizeLabel} options={hw.SMALL_SIZES.map((v) => [v, F.int(v)])} value={small.n} onChange={(n) => setSmall((o) => ({ ...o, n }))} />
      <p className="hw1-buttons">
        <button type="button" className="button alt" onClick={() => setSmall((o) => ({ ...o, draw: o.draw + 1 }))}>{M.newSample}</button>
      </p>
      <Matrix
        title={M.tableTitle(small.n)}
        corner=""
        rows={[0, 1]}
        cols={[0, 1]}
        rowName={(i) => M.rows[i]}
        colName={(j) => cols[j]}
        cell={(i, j) => F.int(smallCounts[i][j])}
        totals={{ row: (i) => F.int(st.rowTotals[i]), col: (j) => F.int(st.colTotals[j]), all: F.int(st.N) }}
        totalLabel={text.ui.total}
      />
      <div className="hw1-caption hw4-line" aria-live="polite">
        {st.testable && st.two ? (
          <>
            <p><strong>{M.result(st)}</strong></p>
            <p>{M.cochran(st)}</p>
          </>
        ) : (
          <p>{text.chi2.notTestable}</p>
        )}
      </div>
      <p>{M.after}</p>
    </>
  );
};

// --- 1.8 Il test di permutazione ----------------------------------------------------------------

const TryPermutation = ({ codes, pairKey, params, setParams, onResult, text, palette }) => {
  const T = text.tryPermutation;
  const F = text.fmt;
  const { n, B, draw } = params;
  const [replay, setReplay] = useState(0);
  const sample = useMemo(() => view.permutationSample(codes, n, draw), [codes, n, draw]);
  const resultKey = `${pairKey}|${n}|${B}|${draw}`;
  const runKey = `${resultKey}|${replay}`;
  const [progress, setProgress] = useState({ key: null });
  // il test riparte da solo quando cambiano la coppia, il campione o i rimescolamenti, e a ogni
  // fotogramma fa un pezzo di lavoro: l'istogramma cresce sotto gli occhi (tutto insieme se chi
  // legge ha chiesto meno movimento)
  useEffect(() => {
    if (!sample.s.testable) return undefined;
    const slice = view.permutationSlice(B, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const steps = hw.permutationSteps(sample.x, sample.f, sample.r, sample.c, B, hw.DEFAULT_SEED, { slice, j: draw });
    let frame = 0;
    const tick = () => {
      const step = steps.next();
      if (step.done) {
        const result = { ...step.value, n };
        setProgress({ key: runKey, done: B, values: result.values, result });
        onResult({ key: resultKey, ...result });
      } else {
        setProgress({ key: runKey, done: step.value.done, values: step.value.values, result: null });
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [sample, B, n, draw, runKey, resultKey, onResult]);
  const current = progress.key === runKey ? progress : { done: 0, values: EMPTY_VALUES, result: null };
  const chart = useMemo(() => view.permutationChart({ done: current.done, values: current.values, df: sample.s.df, observed: sample.s.chi2 }, F.decimal), [current.done, current.values, sample, F]);
  const legend = useMemo(() => view.legends.permutation(text), [text]);
  const tip = useMemo(() => view.tips.permutation(chart, text.tips), [chart, text]);
  const r = current.result;
  return (
    <div className="hw4-try">
      <Title id="hw6-try-permutation" level={2}>{text.sections.tryPermutation}</Title>
      <p>{T.intro}</p>
      <Choices label={T.sizeLabel} options={hw.PERMUTATION_SIZES.map((v) => [v, F.int(v)])} value={n} onChange={(v) => setParams((o) => ({ ...o, n: v }))} />
      <Choices label={T.countLabel} options={hw.PERMUTATION_COUNTS.map((v) => [v, F.int(v)])} value={B} onChange={(v) => setParams((o) => ({ ...o, B: v }))} />
      <p className="hw1-buttons">
        <button type="button" className="button" onClick={() => setReplay((v) => v + 1)}>{T.run}</button>
        <button type="button" className="button alt" onClick={() => setParams((o) => ({ ...o, draw: o.draw + 1 }))}>{T.again}</button>
      </p>
      {sample.s.testable ? (
        <>
          <div className="hw1-charts">
            <Figure title={T.chartTitle(F.int(n), sample.s.df)} draw={hw.drawHistogram} data={chart} palette={palette} tip={tip} wide legend={legend} note={chart.beyond ? T.beyond(sample.s.chi2) : null} />
          </div>
          <div className="hw1-caption hw4-line" aria-live={r ? 'polite' : 'off'}>
            {r ? (
              <>
                <p><strong>{T.result(r)}</strong></p>
                <p>{T.agreement(r)} {T.cochran(sample.s)}</p>
              </>
            ) : (
              <p>{T.running(current.done, B)}</p>
            )}
          </div>
        </>
      ) : (
        <p>{text.chi2.notTestable}</p>
      )}
    </div>
  );
};

// --- 1.9 Le verifiche --------------------------------------------------------------------------

const Verify = React.memo(function Verify({ text }) {
  const V = text.checks;
  const rows = useMemo(() => hw.verifyAll(), []);
  const ok = rows.filter((r) => r.ok).length;
  const groups = hw.CHECK_GROUPS.map((group) => ({ group, rows: rows.filter((r) => r.group === group) }));
  return (
    <>
      <p>{V.intro}</p>
      <Check ok={ok === rows.length}><strong>{V.summary(ok, rows.length)}</strong></Check>
      <details className="hw2-details">
        <summary>{V.details(rows.length)}</summary>
        {groups.map((g) => (
          <React.Fragment key={g.group}>
            <TableTitle>{V.groups[g.group]}</TableTitle>
            <table className="hw1-table hw1-discussion-table hw2-vectors hw3-checks">
              <thead>
                <tr><th>{V.cols.check}</th><th>{V.cols.expected}</th><th>{V.cols.actual}</th><th>{V.cols.result}</th></tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.name}>
                    <th data-label={V.cols.check}>{r.name}</th>
                    <td data-label={V.cols.expected}><code>{r.expected}</code></td>
                    <td data-label={V.cols.actual}><code>{r.actual}</code></td>
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

// --- 2. La teoria ---------------------------------------------------------------------------------

const Theory = React.memo(function Theory({ text }) {
  const T = text.theory;
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5 hw6">
      <Title id="hw6-theory" level={0}>{text.sections.theory}</Title>
      <Paras list={T.paras} />
      <Formulas>{T.formulas}</Formulas>
      <Paras list={T.after} />
    </section>
  );
});

// --- 3. L'interpretazione ----------------------------------------------------------------------------

const Residuals = React.memo(function Residuals({ s, names, varNames, choice, text }) {
  const R = text.residuals;
  const F = text.fmt;
  const cells = useMemo(() => view.strongestCells(s), [s]);
  const protocolClass = (choice.x === 'protocol' && choice.f === 'class') || (choice.x === 'class' && choice.f === 'protocol');
  const facts = useMemo(() => (protocolClass ? view.labelProtocols() : null), [protocolClass]);
  if (!s.testable) return <p>{text.chi2.notTestable}</p>;
  return (
    <>
      <p>{R.intro}</p>
      <Formulas>{R.formulas}</Formulas>
      <Matrix
        title={R.title}
        corner={`${varNames.x} \\ ${varNames.f}`}
        rows={s.rows}
        cols={s.cols}
        rowName={(i) => names.x[i]}
        colName={(j) => names.f[j]}
        cell={(i, j) => (s.adjusted[i][j] === null ? '-' : F.num(s.adjusted[i][j], 2))}
        cellClass={(i, j) => view.residualClass(s.adjusted[i][j])}
        className="hw6-residuals"
      />
      <p className="hw1-note">{R.scale}</p>
      <p>{R.after(cells, names)}</p>
      {facts && <p>{R.protocolClass(facts)}</p>}
    </>
  );
});

const Strength = React.memo(function Strength({ s, varNames, text }) {
  const S = text.strength;
  return (
    <>
      <p>{S.intro}</p>
      <Formulas>{S.formulas}</Formulas>
      {s.testable && <p className="hw1-caption hw4-line"><strong>{S.result(s, varNames)}</strong></p>}
    </>
  );
});

const TryDependence = ({ dependence, setDependence, text, palette }) => {
  const T = text.tryDependence;
  const F = text.fmt;
  const theta = hw.THETAS[dependence.theta];
  const n = hw.DEPENDENCE_SIZES[dependence.n];
  const counts = useMemo(() => hw.dependenceTable(n, theta, hw.DEFAULT_SEED), [n, theta]);
  const st = useMemo(() => hw.tableStats(counts), [counts]);
  const series = useMemo(() => hw.dependenceSeries(theta, hw.DEFAULT_SEED), [theta]);
  const data = useMemo(() => view.dependenceChart(series, F.decimal), [series, F]);
  const legend = useMemo(() => view.legends.dependence(text), [text]);
  const tip = useMemo(() => view.tips.dependence(series, text.tips), [series, text]);
  const [hidden, toggle] = useHidden();
  const showP = !hidden.has(0);
  const showAlpha = !hidden.has(1);
  return (
    <div className="hw4-try">
      <Title id="hw6-try-dependence" level={2}>{text.sections.tryDependence}</Title>
      <p>{T.intro}</p>
      <div className="hw3-slider-row">
        <Slider id="hw6-theta" label={T.thetaLabel(theta)} valueText={T.thetaLabel(theta)} max={hw.THETAS.length - 1} value={dependence.theta} onChange={(v) => setDependence((o) => ({ ...o, theta: v }))} />
        <Slider id="hw6-logins" label={T.nLabel(n)} valueText={T.nLabel(n)} max={hw.DEPENDENCE_SIZES.length - 1} value={dependence.n} onChange={(v) => setDependence((o) => ({ ...o, n: v }))} />
      </div>
      <Matrix
        corner={`${T.xName} \\ ${T.fName}`}
        rows={[0, 1, 2]}
        cols={[0, 1, 2]}
        rowName={(i) => T.names.x[i]}
        colName={(j) => T.names.f[j]}
        cell={(i, j) => F.int(counts[i][j])}
        cellClass={(i, j) => view.residualClass(st.adjusted[i][j])}
        totals={{ row: (i) => F.int(st.rowTotals[i]), col: (j) => F.int(st.colTotals[j]), all: F.int(st.N) }}
        totalLabel={text.ui.total}
        className="hw6-residuals"
      />
      <p className="hw1-caption hw4-line" aria-live="polite"><strong>{T.result(st, n, theta)}</strong></p>
      <TableTitle>{T.tableTitle}</TableTitle>
      <div className="hw1-scroll">
        <table id={view.LINKED_TABLES.series} className="hw1-table hw1-compact hw6-series">
          <thead>
            <tr>
              <th scope="col">{T.cols.n}</th>
              <th scope="col">{T.cols.chi2}</th>
              {showP && <th scope="col">{T.cols.p}</th>}
              <th scope="col">{T.cols.V}</th>
              {showAlpha && <th scope="col">{T.cols.verdict}</th>}
            </tr>
          </thead>
          <tbody>
            {series.map((r) => (
              <tr key={r.n} className={r.n === n ? 'is-current' : undefined}>
                <th scope="row">{F.int(r.n)}</th>
                <td>{F.num(r.chi2, 2)}</td>
                {showP && <td>{F.p(r.p, r.log10p)}</td>}
                <td>{F.num(r.V, 3)}</td>
                {showAlpha && <td>{T.verdicts[r.p < hw.SIGNIFICANCE ? 'reject' : 'accept']}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hw1-charts">
        <Figure title={T.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.series} />
      </div>
      <p>{T.after}</p>
    </div>
  );
};

const Pairs = React.memo(function Pairs({ merge, text }) {
  const P = text.pairs;
  const F = text.fmt;
  const pairs = useMemo(() => hw.allPairs({ merge }), [merge]);
  const { top } = view.pairsFacts(pairs);
  const name = (v) => text.names.variables[v];
  return (
    <>
      <p>{P.intro}</p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw6-pairs-table">
          <thead>
            <tr>{['pair', 'cells', 'chi2', 'df', 'p', 'V', 'effect', 'cochran'].map((k) => <th key={k} scope="col">{P.cols[k]}</th>)}</tr>
          </thead>
          <tbody>
            {pairs.map((p) => (
              <tr key={`${p.x}|${p.f}`}>
                <th scope="row">{`${name(p.x)} × ${name(p.f)}`}</th>
                <td>{`${p.r} × ${p.c}`}</td>
                <td>{F.num(p.chi2, 1)}</td>
                <td>{p.df}</td>
                <td>{F.p(p.p, p.log10p)}</td>
                <td>{F.num(p.V, 3)}</td>
                <td>{text.effects[p.effect]}</td>
                <td>{p.cochran ? P.yes : P.no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hw1-note">{P.note}</p>
      <p>{P.after({ x: name(top.x), f: name(top.f), V: top.V })}</p>
    </>
  );
});

// --- 4. Associazione e causalita' -------------------------------------------------------------------

const Simpson = React.memo(function Simpson({ facts, text, palette }) {
  const S = text.simpson;
  const F = text.fmt;
  const rows = useMemo(() => view.simpsonRows(), []);
  const data = useMemo(() => view.simpsonChart(text, F.decimal), [text, F]);
  const legend = useMemo(() => view.legends.simpson(text), [text]);
  const tip = useMemo(() => view.tips.simpson(rows, text.tips), [rows, text]);
  const [hidden, toggle] = useHidden();
  const men = !hidden.has(0);
  const women = !hidden.has(1);
  return (
    <>
      <Paras list={S.intro(facts)} />
      <TableTitle>{S.tableTitle}</TableTitle>
      <div className="hw1-scroll">
        <table id={view.LINKED_TABLES.departments} className="hw1-table hw1-compact hw6-departments">
          <thead>
            <tr>
              <th scope="col">{S.cols.department}</th>
              {men && <th scope="col">{S.cols.men}</th>}
              {men && <th scope="col">{S.cols.menRate}</th>}
              {women && <th scope="col">{S.cols.women}</th>}
              {women && <th scope="col">{S.cols.womenRate}</th>}
              <th scope="col">{S.cols.p}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className={r.key === 'all' ? 'hw6-margin-row' : undefined}>
                <th scope="row">{r.key === 'all' ? S.all : r.key}</th>
                {men && <td>{F.int(r.men)}</td>}
                {men && <td>{F.pct(r.menRate)}</td>}
                {women && <td>{F.int(r.women)}</td>}
                {women && <td>{F.pct(r.womenRate)}</td>}
                <td>{F.p(r.fisher)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hw1-charts">
        <Figure title={S.chartTitle} draw={hw.drawGroupedBars} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.departments} />
      </div>
      <p className="hw1-note">{S.source}</p>
    </>
  );
});

const TrySimpson = ({ text }) => {
  const T = text.trySimpson;
  const F = text.fmt;
  const [choice, setChoice] = useState('all');
  const table = useMemo(() => hw.ucbTable(choice === 'all' ? null : hw.UCB.departments.indexOf(choice)), [choice]);
  const st = useMemo(() => hw.tableStats(table), [table]);
  const rates = table.map(([a, r]) => a / (a + r));
  return (
    <div className="hw4-try">
      <Title id="hw6-try-simpson" level={2}>{text.sections.trySimpson}</Title>
      <p>{T.intro}</p>
      <Choices label={T.chooseLabel} options={[['all', T.all], ...hw.UCB.departments.map((d) => [d, T.department(d)])]} value={choice} onChange={setChoice} />
      <Matrix
        corner=""
        rows={[0, 1]}
        cols={[0, 1]}
        rowName={(i) => T.rows[i]}
        colName={(j) => T.cols[j]}
        cell={(i, j) => F.int(table[i][j])}
        totals={{ row: (i) => F.int(st.rowTotals[i]), col: (j) => F.int(st.colTotals[j]), all: F.int(st.N) }}
        totalLabel={text.ui.total}
      />
      <p className="hw1-caption hw4-line" aria-live="polite"><strong>{T.result(st, rates)}</strong></p>
    </div>
  );
};

// --- 5, 6 e 7 -----------------------------------------------------------------------------------------

const TestsSummary = ({ rows, varNames, text }) => {
  const T = text.tests;
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5 hw6 hw2-far">
      <Title id="hw6-tests" level={0}>{text.sections.tests}</Title>
      <p>{T.intro}</p>
      <table className="hw1-table hw1-discussion-table hw2-summary hw3-summary">
        <thead>
          <tr><th>{T.cols.subject}</th><th>{T.cols.hypothesis}</th><th>{T.cols.statistic}</th><th>{T.cols.p}</th><th>{T.cols.verdict}</th><th>{T.cols.expected}</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const c = view.testCells(r, text, varNames);
            return (
              <tr key={r.key} className={c.rejected ? 'is-rejected' : ''}>
                <th data-label={T.cols.subject}>{c.subject}</th>
                <td data-label={T.cols.hypothesis}>{c.hypothesis}</td>
                <td data-label={T.cols.statistic}>{c.statistic}</td>
                <td data-label={T.cols.p}>{c.p}</td>
                <td data-label={T.cols.verdict}>{c.verdict}</td>
                <td data-label={T.cols.expected}>{c.expected}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};

const History = React.memo(function History({ text }) {
  const H = text.history;
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5 hw6 hw2-far">
      <Title id="hw6-history" level={0}>{text.sections.history}</Title>
      <p>{H.intro}</p>
      <ol className="hw2-timeline">
        {H.items.map((e) => (
          <li key={`${e.year}-${e.title}`} className="is-context">
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

const Conclusion = React.memo(function Conclusion({ facts, text }) {
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5 hw6 hw2-far">
      <Title id="hw6-conclusion" level={0}>{text.sections.conclusion}</Title>
      <Paras list={text.conclusion.paras(facts)} />
    </section>
  );
});

// --- La pagina --------------------------------------------------------------------------------------

const Homework6 = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const text = HW6_TEXTS[language] || HW6_TEXTS.en;
  const palette = PALETTES[theme === 'dark' ? 'dark' : 'light'];
  const S = text.sections;

  // --- la coppia (X, F) della sezione 1 e i suoi numeri ---
  const [choice, setChoice] = useState({ x: hw.DEFAULT_PAIR.x, f: hw.DEFAULT_PAIR.f, merge: false });
  const pairKey = `${choice.x}|${choice.f}|${choice.merge ? 1 : 0}`;
  const codes = useMemo(() => hw.pairCodes(choice.x, choice.f, { merge: choice.merge }), [choice]);
  const s = useMemo(() => hw.tableStats(hw.contingency(codes.x, codes.f, codes.xLevels.length, codes.fLevels.length)), [codes]);
  const names = useMemo(() => view.pairNames(codes, text), [codes, text]);
  const varNames = useMemo(() => ({ x: text.names.variables[choice.x], f: text.names.variables[choice.f] }), [choice, text]);

  // --- gli esempi i cui risultati entrano nel riepilogo dei test ---
  const [small, setSmall] = useState({ n: view.SMALL_DEFAULT, draw: 0 });
  const smallCounts = useMemo(() => hw.smallTable(small.n, hw.DEFAULT_SEED, small.draw), [small]);
  const [permParams, setPermParams] = useState({ n: view.PERMUTATION_DEFAULT.n, B: view.PERMUTATION_DEFAULT.B, draw: 0 });
  const [permResult, setPermResult] = useState(null);
  const permKey = `${pairKey}|${permParams.n}|${permParams.B}|${permParams.draw}`;
  const perm = permResult && permResult.key === permKey ? permResult : null;
  const [dependence, setDependence] = useState({ theta: hw.THETAS.indexOf(view.DEPENDENCE_DEFAULT.theta), n: hw.DEPENDENCE_SIZES.indexOf(view.DEPENDENCE_DEFAULT.n) });
  const theta = hw.THETAS[dependence.theta];
  const dependenceStats = useMemo(() => hw.tableStats(hw.dependenceTable(hw.DEPENDENCE_SIZES[dependence.n], theta, hw.DEFAULT_SEED)), [dependence.n, theta]);
  const testRows = useMemo(() => view.testRows({ s, perm, small: smallCounts, dependence: dependenceStats, theta }), [s, perm, smallCounts, dependenceStats, theta]);

  // i fatti di Berkeley e delle conclusioni
  const berkeley = useMemo(() => view.berkeleyFacts(), []);
  const conclusion = useMemo(
    () => ({
      N: s.N,
      pair: varNames,
      chi2: s.chi2,
      df: s.df,
      p: s.p,
      log10p: s.log10p,
      cochran: s.small.cochran,
      effect: s.effect,
      V: s.V,
      where: s.testable ? text.conclusion.where(view.strongestCells(s, 1), names) : '',
      berkeley: { p: berkeley.p, log10p: berkeley.log10p },
      cmh: { p: berkeley.cmh.p },
    }),
    [s, varNames, names, text, berkeley],
  );

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
            <a href={`${DOWNLOADS}homework6.zip`} download="homework6.zip" className="button icon solid fa-download">{text.download.zip}</a>
            <a href={`${DOWNLOADS}homework6/index.html?lang=${language === 'en' ? 'en' : 'it'}`} target="_blank" rel="noopener noreferrer" className="button alt icon solid fa-external-link-alt">{text.download.online}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <HomeworkShell slug="homework-6" sidebar={sidebar} toc={toc}>
      <Assignment text={text} />

      {/* 1. TASK: la tabella, le frequenze, le attese, il chi quadrato */}
      <section className="hw1-section hw2 hw3 hw4 hw5 hw6">
        <Title id="hw6-task" level={0}>{S.task}</Title>
        <Paras list={text.task.intro} />

        <Title id="hw6-dataset" level={1}>{S.dataset}</Title>
        <Dataset choice={choice} setChoice={setChoice} text={text} />

        <Title id="hw6-table" level={1}>{S.table}</Title>
        <Contingency s={s} names={names} varNames={varNames} text={text} />

        <Title id="hw6-frequencies" level={1}>{S.frequencies}</Title>
        <Frequencies key={`frequencies|${pairKey}`} s={s} names={names} varNames={varNames} text={text} palette={palette} />

        <Title id="hw6-expected" level={1}>{S.expected}</Title>
        <Expected key={`expected|${pairKey}`} s={s} names={names} varNames={varNames} text={text} palette={palette} />

        <Title id="hw6-chi2" level={1}>{S.chi2}</Title>
        <Chi2 s={s} names={names} varNames={varNames} text={text} />
        <TryTable text={text} />

        <Title id="hw6-gtest" level={1}>{S.gtest}</Title>
        <GTest s={s} text={text} />

        <Title id="hw6-small" level={1}>{S.small}</Title>
        <Small s={s} small={small} setSmall={setSmall} smallCounts={smallCounts} text={text} />

        <Title id="hw6-permutation" level={1}>{S.permutation}</Title>
        <Paras list={text.permutation.intro} />
        <Formulas>{text.permutation.formulas}</Formulas>
        <TryPermutation codes={codes} pairKey={pairKey} params={permParams} setParams={setPermParams} onResult={setPermResult} text={text} palette={palette} />

        <Title id="hw6-checks" level={1}>{S.checks}</Title>
        <Verify text={text} />
      </section>

      <Theory text={text} />

      {/* 3. L'interpretazione */}
      <section className="hw1-section hw2 hw3 hw4 hw5 hw6">
        <Title id="hw6-interpretation" level={0}>{S.interpretation}</Title>
        <p>{text.interpretation.intro}</p>

        <Title id="hw6-decision" level={1}>{S.decision}</Title>
        {s.testable ? <Paras list={text.decision.paras(s, varNames)} /> : <p>{text.chi2.notTestable}</p>}

        <Title id="hw6-residuals" level={1}>{S.residuals}</Title>
        <Residuals s={s} names={names} varNames={varNames} choice={choice} text={text} />

        <Title id="hw6-strength" level={1}>{S.strength}</Title>
        <Strength s={s} varNames={varNames} text={text} />
        <TryDependence dependence={dependence} setDependence={setDependence} text={text} palette={palette} />

        <Title id="hw6-pairs" level={1}>{S.pairs}</Title>
        <Pairs merge={choice.merge} text={text} />
      </section>

      {/* 4. Associazione non e' causalita' */}
      <section className="hw1-section hw2 hw3 hw4 hw5 hw6">
        <Title id="hw6-causality" level={0}>{S.causality}</Title>
        <Paras list={text.causality.intro} />

        <Title id="hw6-simpson" level={1}>{S.simpson}</Title>
        <Simpson facts={berkeley} text={text} palette={palette} />
        <TrySimpson text={text} />

        <Title id="hw6-security" level={1}>{S.security}</Title>
        <Paras list={text.security.paras} />
      </section>

      <TestsSummary rows={testRows} varNames={varNames} text={text} />

      <History text={text} />

      <Conclusion facts={conclusion} text={text} />
    </HomeworkShell>
  );
};

export default Homework6;
