// src/pages/statistics/Homework7.jsx
// Homework #7 di Statistics, nell'ordine della consegna. La prima parte
// spiega le forme di convergenza della probabilita' (in probabilita', quasi
// certa, in media quadratica, in distribuzione) con i controesempi e la
// mappa delle implicazioni, il loro ruolo nella legge dei grandi numeri, nel
// limite centrale e in altri risultati (Slutsky, metodo delta,
// Glivenko-Cantelli, MLE), perche' compare la radice di n (la varianza che
// si somma, gli allarmi a raffica senza indipendenza, le code pesanti) e la
// velocita' della convergenza. La seconda parte dalla probabilita'
// condizionata (la catena di un attacco, l'indipendenza condizionata, il
// p-value contro P(H0 | dati)), presenta il teorema di Bayes con prior,
// verosimiglianza e posterior e lo mette al lavoro su esempi di sicurezza:
// l'allarme dell'IDS e il tasso di base, una rete bayesiana per il triage,
// il test sequenziale di Wald, il tasso di click di un phishing con prior
// diversi e il confronto con gli intervalli frequentisti, due filtri naive
// Bayes su dati veri (gli SMS della SMS Spam Collection e le connessioni di
// NSL-KDD), i vantaggi, i limiti e l'influenza del prior, e il posterior
// che converge. Dodici riquadri "Prova" lasciano mettere le mani sui numeri.
//
// Qui c'e' solo la pagina React. I dati, i calcoli, il generatore e i
// grafici sono in hw7/homework7.js (i dati in hw7/smsspam.js e
// hw7/nslkdd.js), i testi in hw7/texts.js e la logica di presentazione in
// hw7/view.js: sono gli stessi file da cui la build ricava il programma
// scaricabile (build/homework-standalone.js). Le simulazioni lunghe girano
// nel worker (hw7/useJob.js); i riquadri calcolano i loro pochi numeri qui.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/languageContext';
import { useTheme } from '../../contexts/themeContext';
import HomeworkShell from './HomeworkShell';
import { ChartLegend } from './ChartLegend';
import { hiddenParts, useHidden } from './legendState';
import * as hw from './hw7/homework7';
import * as view from './hw7/view';
import { HW7_TEXTS, originalAssignment } from './hw7/texts';
import { useExplore } from './hw7/useJob';

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

// Un titolo di sezione: id per l'indice, tabIndex -1 perche' l'indice ci
// porti anche il focus della tastiera.
const Title = ({ id, level, children }) => {
  const Tag = HEADINGS[level];
  return <Tag id={id} tabIndex={-1} className="hw1-anchor">{children}</Tag>;
};

const Paras = ({ list }) => (Array.isArray(list) ? list : [list]).filter(Boolean).map((t, i) => <p key={i}>{t}</p>);

const Check = ({ ok, children }) => <p className={ok ? 'hw2-check is-ok' : 'hw2-check is-bad'}>{children}</p>;

const Formulas = ({ children }) => <pre className="hw1-formulas">{children}</pre>;

const TableTitle = ({ children }) => <p className="hw1-table-title"><strong>{children}</strong></p>;

const Pending = ({ text, result }) => (result && result.error ? <p className="hw1-note">{text.ui.error(result.error)}</p> : <p className="hw1-note hw1-pending" role="status">{text.ui.computing}</p>);

// Un riquadro "Prova": un'area con il bordo colorato e il suo titolo nell'indice
const Try = ({ id, title, children }) => (
  <div className="hw4-try hw7-try">
    <Title id={id} level={2}>{title}</Title>
    {children}
  </div>
);

// Un grafico su canvas, ridisegnato quando cambia la larghezza, con i valori
// del pezzo sotto il puntatore e, con `link` (view.links), la riga della
// tabella legata: il disegno vero e' in homework7.js. Le voci della legenda
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
      <button key={String(key)} type="button" className="button alt" aria-pressed={value === key} onClick={() => onChange(key)}>{name}</button>
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

// Una fila di pulsanti d'azione
const Actions = ({ children }) => <p className="hw7-actions">{children}</p>;
const Action = ({ onClick, children, disabled = false }) => <button type="button" className="button alt small" onClick={onClick} disabled={disabled}>{children}</button>;

/**
 * A table: `columns` [{ key, label, num?, hidden? }] and `rows` [{ key,
 * cells: { [column key]: content }, hidden?, className? }]; the first
 * column is the header of every row. `id` ties it to a chart; a hidden row
 * keeps its place, so the rows still match the points of the chart.
 */
const DataTable = ({ id = null, title = null, className = '', columns, rows, note = null }) => {
  const cols = columns.filter((c) => !c.hidden);
  return (
    <>
      {title && <TableTitle>{title}</TableTitle>}
      <div className="hw1-scroll">
        <table id={id || undefined} className={`hw1-table hw1-compact hw7-table ${className}`}>
          <thead>
            <tr>{cols.map((c) => <th key={c.key} scope="col" className={c.num ? 'hw7-num' : undefined}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} hidden={r.hidden || undefined} className={r.className || undefined}>
                {cols.map((c, i) => (i === 0 ? <th key={c.key} scope="row">{r.cells[c.key]}</th> : <td key={c.key} className={c.num ? 'hw7-num' : undefined}>{r.cells[c.key]}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="hw1-note">{note}</p>}
    </>
  );
};

// Il prior da trascinare (attachPriorEditor in homework7.js): il canvas resta
// lo stesso, cambiano le altezze, la tavolozza e i decimali
const PriorEditor = ({ heights, onChange, palette, decimal, label, handleLabel }) => {
  const ref = useRef(null);
  const controls = useRef(null);
  const change = useRef(onChange);
  useEffect(() => {
    change.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const canvas = ref.current;
    const editor = hw.attachPriorEditor(canvas, { heights, onChange: (h) => change.current(h), palette, decimal, label: handleLabel });
    controls.current = editor;
    const observer = new ResizeObserver((entries) => {
      const width = Math.round(entries[entries.length - 1].contentRect.width);
      if (width > 0) editor.redraw(width);
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      editor.destroy();
      controls.current = null;
    };
    // the editor is created once; the effects below pass it the new values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (controls.current) controls.current.setHeights(heights);
  }, [heights]);
  useEffect(() => {
    if (controls.current) controls.current.setPalette(palette);
  }, [palette]);
  useEffect(() => {
    if (controls.current) controls.current.setDecimal(decimal);
  }, [decimal]);
  return <canvas ref={ref} className="hw1-canvas hw7-editor" tabIndex={0} role="slider" aria-label={label} aria-valuemin={0} aria-valuemax={1} />;
};

// La rete bayesiana del triage, disegnata: ogni nodo con la sua probabilita',
// scritta e come barra; gli indizi osservati con il bordo evidenziato
const NetworkDiagram = ({ q, evidence, text, palette, label }) => {
  const N = text.network.nodes;
  const box = { w: 22, h: 12 };
  const L = view.NETWORK_LAYOUT;
  return (
    <svg className="hw7-network" viewBox="0 0 100 64" role="img" aria-label={label}>
      <defs>
        <marker id="hw7-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={palette.text} />
        </marker>
      </defs>
      {view.NETWORK_EDGES.map(([a, b]) => {
        const from = L[a];
        const to = L[b];
        return <line key={`${a}-${b}`} x1={from.x} y1={from.y + box.h / 2} x2={to.x} y2={to.y - box.h / 2 - 0.6} stroke={palette.text} strokeWidth="0.35" markerEnd="url(#hw7-arrow)" />;
      })}
      {hw.NETWORK.nodes.map((node) => {
        const { x, y } = L[node];
        const p = q[node];
        const known = evidence[node] !== null && evidence[node] !== undefined;
        const left = x - box.w / 2;
        const top = y - box.h / 2;
        return (
          <g key={node}>
            <rect x={left} y={top} width={box.w} height={box.h} rx="1.6" fill={palette.background} stroke={known ? palette.highlight : palette.text} strokeWidth={known ? 0.8 : 0.3} />
            <rect x={left + 1.5} y={top + box.h - 3} width={box.w - 3} height="1.6" rx="0.5" fill={palette.grid} />
            <rect x={left + 1.5} y={top + box.h - 3} width={(box.w - 3) * Math.min(1, Math.max(0, p))} height="1.6" rx="0.5" fill={palette.highlight} />
            <text x={x} y={top + 3.6} textAnchor="middle" fontSize="2.7" fill={palette.text}>{N[node]}</text>
            <text x={x} y={top + 7.6} textAnchor="middle" fontSize="3.2" fontWeight="bold" fill={palette.text}>{text.fmt.pct(p)}</text>
          </g>
        );
      })}
    </svg>
  );
};

// La mappa delle implicazioni: i quattro modi, con le frecce che valgono sempre
const MapDiagram = ({ mode, text, palette, label }) => {
  const P = { as: { x: 18, y: 12 }, l2: { x: 18, y: 48 }, probability: { x: 52, y: 30 }, distribution: { x: 86, y: 30 } };
  const box = { w: 28, h: 12 };
  const state = (m) => {
    if (!mode) return 'idle';
    if (m === mode) return 'self';
    return hw.implication(mode, m).holds ? 'holds' : 'fails';
  };
  const fill = { idle: palette.background, self: palette.series[0], holds: palette.series[2], fails: palette.series[1] };
  return (
    <svg className="hw7-map" viewBox="0 0 104 60" role="img" aria-label={label}>
      <defs>
        <marker id="hw7-map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={palette.text} />
        </marker>
      </defs>
      {hw.IMPLICATIONS.map(([a, b]) => {
        const from = P[a];
        const to = P[b];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        const cut = (u) => Math.min(box.w / 2 / Math.max(1e-9, Math.abs(u.x)), box.h / 2 / Math.max(1e-9, Math.abs(u.y)));
        const start = cut({ x: ux, y: uy });
        return <line key={`${a}-${b}`} x1={from.x + ux * start} y1={from.y + uy * start} x2={to.x - ux * (start + 0.8)} y2={to.y - uy * (start + 0.8)} stroke={palette.text} strokeWidth="0.5" markerEnd="url(#hw7-map-arrow)" />;
      })}
      {hw.MODES.map((m) => {
        const s = state(m);
        return (
          <g key={m}>
            <rect x={P[m].x - box.w / 2} y={P[m].y - box.h / 2} width={box.w} height={box.h} rx="2" fill={fill[s]} fillOpacity={s === 'idle' ? 1 : 0.35} stroke={s === 'idle' ? palette.text : fill[s]} strokeWidth={s === 'self' ? 1 : 0.5} />
            <text x={P[m].x} y={P[m].y + 1.2} textAnchor="middle" fontSize="3.4" fill={palette.text}>{text.tryMap.modes[m]}</text>
          </g>
        );
      })}
    </svg>
  );
};

// --- 0. La consegna ------------------------------------------------------------

const Assignment = React.memo(function Assignment({ text }) {
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5 hw6 hw7">
      <Title id="hw7-assignment" level={0}>{text.sections.assignment}</Title>
      <Paras list={text.assignment.intro} />
      <details className="hw1-original" open>
        <summary>{text.assignment.originalTitle}</summary>
        <p className="hw1-note">{text.assignment.originalNote}</p>
        <blockquote lang="en">
          {originalAssignment().map((block, i) => {
            if (block.type === 'title') return <p key={i}><strong>{block.text}</strong></p>;
            if (block.type === 'list') return <ul key={i} className="hw7-plain-list">{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
            return <p key={i}>{block.text}</p>;
          })}
        </blockquote>
      </details>
    </section>
  );
});

// --- 2.3 L'allarme dell'IDS ------------------------------------------------------

const Alarm = ({ text, palette }) => {
  const A = text.alarm;
  const F = text.fmt;
  const facts = useMemo(() => hw.alarmFacts(hw.ALARM_DEFAULT), []);
  const chains = useMemo(() => view.alarmChains(), []);
  const data = useMemo(() => view.alarmIcons(facts), [facts]);
  const legend = useMemo(() => view.legends.alarm(text.legends), [text]);
  const tip = useMemo(() => view.tips.alarm(facts, text.tips), [facts, text]);
  const [hidden, toggle] = useHidden();
  return (
    <>
      <Title id="hw7-alarm" level={1}>{text.sections.alarm}</Title>
      <p>{A.intro(facts)}</p>
      <Paras list={A.paras(facts)} />
      <div className="hw1-charts">
        <Figure title={A.iconTitle} draw={hw.drawIconArray} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.alarm} />
      </div>
      <DataTable
        id={view.LINKED_TABLES.alarm}
        title={A.tableTitle}
        columns={[
          { key: 'category', label: A.cols.category },
          { key: 'truth', label: A.cols.truth },
          { key: 'alarm', label: A.cols.alarm },
          { key: 'count', label: A.cols.count, num: true },
          { key: 'share', label: A.cols.share, num: true },
        ]}
        rows={view.ALARM_CATEGORIES.map((c, k) => ({
          key: c,
          hidden: hidden.has(k),
          cells: { category: text.legends[c], truth: A.truth[c], alarm: A.alarmed[c], count: F.int(facts.counts[k]), share: F.pctSmall(facts.counts[k] / facts.population) },
        }))}
      />
      <p>{A.chainIntro(hw.SECOND_DETECTOR)}</p>
      <DataTable
        title={A.chainTitle}
        columns={[
          { key: 'order', label: A.chainCols.order },
          { key: 'step', label: A.chainCols.step },
          { key: 'lr', label: A.chainCols.lr, num: true },
          { key: 'weight', label: A.chainCols.weight, num: true },
          { key: 'prior', label: A.chainCols.prior, num: true },
          { key: 'posterior', label: A.chainCols.posterior, num: true },
        ]}
        rows={['forward', 'backward'].flatMap((o) => chains[o].map((st, i) => ({
          key: `${o}${i}`,
          cells: { order: i === 0 ? A.orders[o] : '', step: A.detectors[st.key], lr: F.num(st.lr, 1), weight: F.num(st.weight, 2), prior: F.pct(st.prior, 2), posterior: F.pct(st.posterior, 2) },
        })))}
      />
    </>
  );
};

const TryAlarm = ({ text, palette }) => {
  const T = text.tryAlarm;
  const [state, setState] = useState(view.ALARM_TRY_DEFAULT);
  const t = useMemo(() => view.alarmTry(state), [state]);
  const data = useMemo(() => view.alarmIcons(t.facts), [t]);
  const legend = useMemo(() => view.legends.alarm(text.legends), [text]);
  const tip = useMemo(() => view.tips.alarm(t.facts, text.tips), [t, text]);
  const set = (key) => (v) => setState((o) => ({ ...o, [key]: v }));
  return (
    <Try id="hw7-try-alarm" title={text.sections.tryAlarm}>
      <p>{T.intro}</p>
      <Slider id="hw7-base" label={T.base(t.settings.base)} valueText={T.base(t.settings.base)} max={hw.ALARM_BASES.length - 1} value={state.base} onChange={set('base')} />
      <Slider id="hw7-sensitivity" label={T.sensitivity(t.settings.sensitivity)} valueText={T.sensitivity(t.settings.sensitivity)} max={hw.ALARM_SENSITIVITIES.length - 1} value={state.sensitivity} onChange={set('sensitivity')} />
      <Slider id="hw7-fpr" label={T.fpr(t.settings.fpr)} valueText={T.fpr(t.settings.fpr)} max={hw.ALARM_FPRS.length - 1} value={state.fpr} onChange={set('fpr')} />
      <label className="hw7-check">
        <input type="checkbox" checked={state.second} onChange={(e) => setState((o) => ({ ...o, second: e.target.checked }))} />
        {` ${T.second}`}
      </label>
      <div className="hw1-charts">
        <Figure title={text.alarm.iconTitle} draw={hw.drawIconArray} data={data} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw4-line" aria-live="polite">{T.result(t)}{state.second ? ` ${T.secondResult(t)}` : ''}</p>
    </Try>
  );
};

// --- 2.4 La rete bayesiana ----------------------------------------------------------

const Network = ({ text, palette }) => {
  const N = text.network;
  const F = text.fmt;
  const rows = useMemo(() => view.networkRows(), []);
  const data = useMemo(() => view.networkChart(rows, N.stepsShort, F.decimal), [rows, N, F]);
  const legend = useMemo(() => view.legends.network(text.legends), [text]);
  const tip = useMemo(() => view.tips.network(rows, text.tips), [rows, text]);
  const [hidden, toggle] = useHidden();
  return (
    <>
      <Title id="hw7-network" level={1}>{text.sections.network}</Title>
      <Paras list={N.intro} />
      <div className="hw1-charts">
        <Figure title={N.chartTitle} draw={hw.drawGroupedBars} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.network} />
      </div>
      <DataTable
        id={view.LINKED_TABLES.network}
        title={N.tableTitle}
        columns={[
          { key: 'step', label: N.cols.step },
          { key: 'phishing', label: N.cols.phishing, num: true, hidden: hidden.has(0) },
          { key: 'exploit', label: N.cols.exploit, num: true, hidden: hidden.has(1) },
          { key: 'compromise', label: N.cols.compromise, num: true, hidden: hidden.has(2) },
          { key: 'evidence', label: N.cols.evidence, num: true },
        ]}
        rows={rows.map((r, i) => ({ key: i, cells: { step: N.steps[i], phishing: F.pct(r.phishing), exploit: F.pct(r.exploit), compromise: F.pct(r.compromise), evidence: F.pctSmall(r.pEvidence) } }))}
      />
      <Paras list={N.paras(rows)} />
    </>
  );
};

const TryNetwork = ({ text, palette }) => {
  const T = text.tryNetwork;
  const [evidence, setEvidence] = useState(view.NETWORK_TRY_DEFAULT);
  const q = useMemo(() => hw.networkPosterior(evidence), [evidence]);
  const options = [[null, T.states.unknown], [true, T.states.yes], [false, T.states.no]];
  return (
    <Try id="hw7-try-network" title={text.sections.tryNetwork}>
      <p>{T.intro}</p>
      {hw.CLUES.map((clue) => (
        <Choices key={clue} label={text.network.nodes[clue]} options={options} value={evidence[clue]} onChange={(v) => setEvidence((o) => ({ ...o, [clue]: v }))} />
      ))}
      <NetworkDiagram q={q} evidence={evidence} text={text} palette={palette} label={T.diagramLabel} />
      <p className="hw4-line" aria-live="polite">{T.result(q)}</p>
    </Try>
  );
};

// --- 2.5 Il test di Wald -------------------------------------------------------------

const Sprt = ({ s, job, text, palette }) => {
  const W = text.sprt;
  const F = text.fmt;
  const setup = useMemo(() => hw.sprtSetup(hw.SPRT_DEFAULT), []);
  const exact = useMemo(() => ({ legit: hw.sprtExact(setup, hw.SPRT_DEFAULT.p0), attacker: hw.sprtExact(setup, hw.SPRT_DEFAULT.p1) }), [setup]);
  const walks = useMemo(() => [
    { ...hw.sprtPath(setup, view.SPRT_EXAMPLES.legit), key: 'legit', color: 0 },
    { ...hw.sprtPath(setup, view.SPRT_EXAMPLES.attacker), key: 'attacker', color: 1 },
  ], [setup]);
  const data = useMemo(() => view.sprtChart(setup, walks, F.decimal), [setup, walks, F]);
  const legend = useMemo(() => view.legends.sprt(text.legends, walks), [text, walks]);
  const tip = useMemo(() => view.tips.sprt(setup, walks, text.tips), [setup, walks, text]);
  const sim = s ? s.sprt : null;
  const row = (who, ex, wald, simulated) => ({
    key: who,
    cells: {
      who: W.who[who],
      block: F.prob(ex.block),
      clear: F.prob(ex.clear),
      exact: F.num(ex.mean, 2),
      wald: F.num(wald, 2),
      simulated: simulated ? F.num(simulated.meanSteps, 2) : '-',
    },
  });
  return (
    <>
      <Title id="hw7-sprt" level={1}>{text.sections.sprt}</Title>
      <Paras list={W.intro} />
      <Formulas>{W.formulas(setup)}</Formulas>
      <div className="hw1-charts">
        <Figure title={W.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <Paras list={W.paras(setup, exact.legit, exact.attacker)} />
      <DataTable
        title={W.tableTitle}
        columns={[
          { key: 'who', label: W.cols.who },
          { key: 'block', label: W.cols.block, num: true },
          { key: 'clear', label: W.cols.clear, num: true },
          { key: 'exact', label: W.cols.exact, num: true },
          { key: 'wald', label: W.cols.wald, num: true },
          { key: 'simulated', label: W.cols.simulated, num: true },
        ]}
        rows={[row('legit', exact.legit, setup.waldLegit, sim && sim.legit), row('attacker', exact.attacker, setup.waldAttacker, sim && sim.attackers)]}
      />
      {sim ? <p>{W.simulation(sim)}</p> : <Pending text={text} result={job} />}
    </>
  );
};

const TrySprt = ({ text, palette }) => {
  const T = text.trySprt;
  const F = text.fmt;
  const [state, setState] = useState(view.SPRT_TRY_DEFAULT);
  const setup = useMemo(() => hw.sprtSetup({ ...hw.SPRT_DEFAULT, alpha: hw.SPRT_ALPHAS[state.alpha] }), [state.alpha]);
  const path = useMemo(() => hw.sprtPath(setup, state.attempts), [setup, state.attempts]);
  const walks = useMemo(() => [{ ...path, key: 'live', color: 4 }], [path]);
  const data = useMemo(() => view.sprtChart(setup, walks, F.decimal), [setup, walks, F]);
  const legend = useMemo(() => view.legends.sprt(text.legends, walks), [text, walks]);
  const tip = useMemo(() => view.tips.sprt(setup, walks, text.tips), [setup, walks, text]);
  const done = Boolean(path.decision);
  const add = (failed) => setState((o) => ({ ...o, attempts: [...o.attempts, failed] }));
  // a simulated address: one more attempt from the stream 'live', failing with p0 or p1
  const simulate = (pFail) => setState((o) => {
    const next = hw.generator(hw.DEFAULT_SEED, 'live', 2000000 + o.draws);
    return { ...o, attempts: [...o.attempts, hw.uniform53(next) < pFail], draws: o.draws + 1 };
  });
  return (
    <Try id="hw7-try-sprt" title={text.sections.trySprt}>
      <p>{T.intro}</p>
      <Choices label={T.alphaLabel} options={hw.SPRT_ALPHAS.map((a, i) => [i, T.alphaName(a)])} value={state.alpha} onChange={(v) => setState((o) => ({ ...o, alpha: v }))} />
      <Actions>
        <Action onClick={() => add(true)} disabled={done}>{T.fail}</Action>
        <Action onClick={() => add(false)} disabled={done}>{T.success}</Action>
        <Action onClick={() => simulate(hw.SPRT_DEFAULT.p0)} disabled={done}>{T.legit}</Action>
        <Action onClick={() => simulate(hw.SPRT_DEFAULT.p1)} disabled={done}>{T.attacker}</Action>
        <Action onClick={() => setState((o) => ({ ...o, attempts: [] }))}>{text.ui.reset}</Action>
      </Actions>
      <div className="hw1-charts">
        <Figure title={T.walk} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw4-line" aria-live="polite">{T.result(path, path.steps, path.decision)}</p>
    </Try>
  );
};

// --- 2.6 Il tasso del phishing ------------------------------------------------------

const Rate = ({ text, palette }) => {
  const R = text.rate;
  const F = text.fmt;
  const c = useMemo(() => view.campaignFacts(), []);
  const data = useMemo(() => view.campaignChart(c, F.decimal), [c, F]);
  const legend = useMemo(() => view.legends.campaign(text.legends), [text]);
  const tip = useMemo(() => view.tips.campaign(c, text.tips), [c, text]);
  const [hidden, toggle] = useHidden();
  return (
    <>
      <Title id="hw7-rate" level={1}>{text.sections.rate}</Title>
      <p>{R.intro(c)}</p>
      <Paras list={R.paras(c)} />
      <div className="hw1-charts">
        <Figure title={R.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.campaign} />
      </div>
      <DataTable
        id={view.LINKED_TABLES.campaign}
        title={R.tableTitle}
        columns={[
          { key: 'day', label: R.cols.day },
          { key: 'sent', label: R.cols.sent, num: true },
          { key: 'clicks', label: R.cols.clicks, num: true },
          { key: 'uniform', label: R.cols.uniform, num: true, hidden: hidden.has(0) },
          { key: 'informed', label: R.cols.informed, num: true, hidden: hidden.has(1) },
          { key: 'above', label: R.cols.above, num: true, hidden: hidden.has(0) },
        ]}
        rows={c.uniform.map((u, i) => ({ key: u.day, cells: { day: F.int(u.day), sent: F.int(u.sent), clicks: F.int(u.clicks), uniform: R.interval(u), informed: R.interval(c.informed[i]), above: F.pct(c.aboveUniform[i]) } }))}
      />
      <p>{R.after}</p>
    </>
  );
};

const TryBelief = ({ text, palette }) => {
  const T = text.tryBelief;
  const F = text.fmt;
  const [state, setState] = useState(view.BELIEF_TRY_DEFAULT);
  const curves = useMemo(() => view.beliefCurves(state), [state]);
  const data = useMemo(() => view.densityChart(curves, F.decimal, Math.min(40, Math.max(6, ...curves.posterior.filter(Number.isFinite), ...curves.likelihood.filter(Number.isFinite)) * 1.08)), [curves, F]);
  const legend = useMemo(() => view.legends.density(text.legends), [text]);
  const tip = useMemo(() => view.tips.density(curves, text.tips), [curves, text]);
  const add = (clicked) => setState((o) => ({ ...o, clicks: o.clicks + (clicked ? 1 : 0), sent: o.sent + 1 }));
  const addTen = () => setState((o) => ({ ...o, clicks: o.clicks + view.moreEmails(o.draws), sent: o.sent + 10, draws: o.draws + 1 }));
  return (
    <Try id="hw7-try-belief" title={text.sections.tryBelief}>
      <p>{T.intro}</p>
      <Choices label={T.priorLabel} options={hw.PRIOR_KEYS.map((k) => [k, T.priors[k]])} value={state.prior} onChange={(v) => setState((o) => ({ ...o, prior: v }))} />
      <Actions>
        <Action onClick={() => add(true)}>{T.click}</Action>
        <Action onClick={() => add(false)}>{T.noClick}</Action>
        <Action onClick={addTen}>{T.ten}</Action>
        <Action onClick={() => setState((o) => ({ ...o, clicks: 0, sent: 0 }))}>{text.ui.reset}</Action>
      </Actions>
      <div className="hw1-charts">
        <Figure title={T.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw4-line" aria-live="polite">{T.result(state, curves.post, curves.post.above(hw.TARGET_RATE))}</p>
    </Try>
  );
};

const TryPrior = ({ text, palette }) => {
  const T = text.tryPrior;
  const F = text.fmt;
  const [shape, setShape] = useState(view.PRIOR_TRY_DEFAULT.shape);
  const [heights, setHeights] = useState(() => [...hw.PRIOR_SHAPES[view.PRIOR_TRY_DEFAULT.shape]]);
  const [dataKey, setDataKey] = useState(view.PRIOR_TRY_DEFAULT.data);
  const counts = useMemo(() => view.priorData(dataKey), [dataKey]);
  const grid = useMemo(() => hw.gridPosterior(hw.priorFromHandles(heights), counts.clicks, counts.sent), [heights, counts]);
  const flat = useMemo(() => hw.gridPosterior(hw.priorFromHandles(hw.PRIOR_SHAPES.flat), counts.clicks, counts.sent), [counts]);
  const data = useMemo(() => view.densityChart(grid, F.decimal), [grid, F]);
  const legend = useMemo(() => view.legends.density(text.legends), [text]);
  const tip = useMemo(() => view.tips.density(grid, text.tips), [grid, text]);
  const choose = (key) => {
    setShape(key);
    setHeights([...hw.PRIOR_SHAPES[key]]);
  };
  return (
    <Try id="hw7-try-prior" title={text.sections.tryPrior}>
      <p>{T.intro}</p>
      <Choices label={T.shapeLabel} options={hw.PRIOR_SHAPE_KEYS.map((k) => [k, T.shapes[k]])} value={shape} onChange={choose} />
      <PriorEditor heights={heights} onChange={(h) => { setShape(null); setHeights(h); }} palette={palette} decimal={F.decimal} label={T.editorLabel} handleLabel={T.handle} />
      <Choices label={T.dataLabel} options={view.PRIOR_DATA.map((k) => [k, T.data[k]])} value={dataKey} onChange={setDataKey} />
      <div className="hw1-charts">
        <Figure title={T.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw4-line" aria-live="polite">{T.result(grid, flat)}</p>
    </Try>
  );
};

// --- 2.7 Bayes e frequentisti ---------------------------------------------------------

const Frequentist = ({ s, job, text, palette }) => {
  const Q = text.frequentist;
  const F = text.fmt;
  const cov = useMemo(() => hw.coverageCurves(), []);
  const data = useMemo(() => view.coverageChart(cov, F.decimal), [cov, F]);
  const legend = useMemo(() => view.legends.coverage(text.legends), [text]);
  const tip = useMemo(() => view.tips.coverage(cov, text.tips), [cov, text]);
  return (
    <>
      <Title id="hw7-frequentist" level={1}>{text.sections.frequentist}</Title>
      <Paras list={Q.intro} />
      <div className="hw1-charts">
        <Figure title={Q.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} note={Q.chartNote} />
      </div>
      <DataTable
        title={Q.tableTitle}
        columns={[
          { key: 'method', label: Q.cols.method },
          { key: 'mean', label: Q.cols.mean, num: true },
          { key: 'min', label: Q.cols.min, num: true },
          { key: 'at', label: Q.cols.at, num: true },
          { key: 'width', label: Q.cols.width, num: true },
        ]}
        rows={hw.INTERVAL_METHODS.map((m) => ({ key: m, cells: { method: text.names.methods[m], mean: F.pct(cov.summary[m].mean), min: F.pct(cov.summary[m].min), at: `p = ${F.pct(cov.summary[m].minAt, 1)}`, width: F.pct(cov.summary[m].width) } }))}
      />
      <Paras list={Q.paras(cov)} />
      {s ? <p>{Q.simulation(s.coverage)}</p> : <Pending text={text} result={job} />}
    </>
  );
};

// --- 2.8 Il filtro antispam -------------------------------------------------------------

const Spam = ({ sms, text, palette }) => {
  const M = text.spam;
  const F = text.fmt;
  const data = useMemo(() => view.logOddsChart(sms, F.decimal), [sms, F]);
  const legend = useMemo(() => view.legends.logOdds(text.legends), [text]);
  const tip = useMemo(() => view.tips.logOdds(sms, text.tips), [sms, text]);
  const [hidden, toggle] = useHidden();
  // null: the example, until the reader changes it
  const [message, setMessage] = useState(null);
  const [base, setBase] = useState('train');
  const textValue = message === null ? view.SPAM_EXAMPLE : message;
  const score = useMemo(() => hw.spamScore(sms.model, textValue, view.spamPrior(base, sms)), [sms, textValue, base]);
  const c = sms.matrix;
  const words = Array.from({ length: Math.max(sms.spamWords.length, sms.hamWords.length) }, (_, i) => i);
  const parts = [...score.parts].sort((a, b) => Math.abs(b.weight ?? 0) - Math.abs(a.weight ?? 0));
  return (
    <>
      <Title id="hw7-spam" level={1}>{text.sections.spam}</Title>
      <Paras list={M.intro} />
      <p>
        {M.source(hw.SMS_DATA)}{' '}
        <a href={hw.SMS_DATA.url} target="_blank" rel="noopener noreferrer">{M.links.dataset}</a>
        {' · '}
        <a href={hw.SMS_DATA.paperUrl} target="_blank" rel="noopener noreferrer">{M.links.paper}</a>
      </p>
      <Paras list={M.paras(sms)} />
      <DataTable
        title={M.matrixTitle}
        columns={[{ key: 'truth', label: M.matrixCols.truth }, { key: 'spam', label: M.matrixCols.spam, num: true }, { key: 'ham', label: M.matrixCols.ham, num: true }]}
        rows={[
          { key: 'spam', cells: { truth: M.matrixRows.spam, spam: F.int(c.tp), ham: F.int(c.fn) } },
          { key: 'ham', cells: { truth: M.matrixRows.ham, spam: F.int(c.fp), ham: F.int(c.tn) } },
        ]}
      />
      <DataTable
        title={M.wordsTitle}
        columns={[{ key: 'spam', label: M.wordsCols.spam }, { key: 'spamWeight', label: M.wordsCols.spamWeight, num: true }, { key: 'ham', label: M.wordsCols.ham }, { key: 'hamWeight', label: M.wordsCols.hamWeight, num: true }]}
        rows={words.map((i) => ({ key: i, cells: { spam: sms.spamWords[i].token, spamWeight: F.num(sms.spamWords[i].weight, 2), ham: sms.hamWords[i].token, hamWeight: F.num(sms.hamWords[i].weight, 2) } }))}
      />
      <div className="hw1-charts">
        <Figure title={M.chartTitle} draw={hw.drawGroupedBars} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.logOdds} />
      </div>
      <DataTable
        id={view.LINKED_TABLES.logOdds}
        title={M.tableTitle}
        columns={[{ key: 'bin', label: M.binCols.bin }, { key: 'spam', label: M.binCols.spam, num: true, hidden: hidden.has(0) }, { key: 'ham', label: M.binCols.ham, num: true, hidden: hidden.has(1) }]}
        rows={sms.bins.map((b, i) => ({ key: i, cells: { bin: M.bin(b), spam: F.int(b.spam), ham: F.int(b.ham) } }))}
      />
      <div className="hw7-field">
        <label htmlFor="hw7-message">{M.fieldLabel}</label>
        <textarea id="hw7-message" rows={3} {...FIELD} value={textValue} onChange={(e) => setMessage(e.target.value.slice(0, 2000))} />
      </div>
      <Choices label={M.baseLabel} options={view.SPAM_BASES.map((k) => [k, M.bases[k]])} value={base} onChange={setBase} />
      <p className="hw4-line" aria-live="polite">{M.result(score)}</p>
      {parts.length > 0 && (
        <DataTable
          title={M.partsTitle}
          columns={[{ key: 'token', label: M.partsCols.token }, { key: 'count', label: M.partsCols.count, num: true }, { key: 'weight', label: M.partsCols.weight, num: true }]}
          rows={parts.map((p) => ({ key: p.token, className: p.known ? (p.weight > 0 ? 'hw7-towards-spam' : 'hw7-towards-ham') : 'hw7-unknown', cells: { token: p.token, count: F.int(p.count), weight: p.known ? F.num(p.weight, 2) : M.unknown } }))}
        />
      )}
      <p>{M.after}</p>
    </>
  );
};

// --- 2.9 NSL-KDD ----------------------------------------------------------------------------

const Kdd = ({ kdd, text }) => {
  const K = text.kdd;
  const F = text.fmt;
  const [choice, setChoice] = useState(view.KDD_TRY_DEFAULT);
  const e = useMemo(() => kdd.explain(choice.protocol, choice.service, choice.flag), [kdd, choice]);
  const rows = ['naive', 'joint', 'majority'].map((m) => ({ key: m, cells: { model: K.models[m], accuracy: F.pct(kdd[m].accuracy), precision: F.pct(kdd[m].precision), recall: F.pct(kdd[m].recall), fpr: F.pct(kdd[m].fpr) } }));
  return (
    <>
      <Title id="hw7-kdd" level={1}>{text.sections.kdd}</Title>
      <p>
        {K.intro(hw.KDD_DATA)}{' '}
        <a href={hw.KDD_DATA.url} target="_blank" rel="noopener noreferrer">NSL-KDD</a>
        {' · '}
        <a href={hw.KDD_DATA.paperUrl} target="_blank" rel="noopener noreferrer">Tavallaee et al., 2009</a>
      </p>
      <Paras list={K.paras(kdd)} />
      <DataTable
        title={K.tableTitle}
        columns={[{ key: 'model', label: K.cols.model }, { key: 'accuracy', label: K.cols.accuracy, num: true }, { key: 'precision', label: K.cols.precision, num: true }, { key: 'recall', label: K.cols.recall, num: true }, { key: 'fpr', label: K.cols.fpr, num: true }]}
        rows={rows}
      />
      <TableTitle>{K.chooseTitle}</TableTitle>
      <div className="hw7-selects">
        {hw.KDD_FEATURES.map((f) => (
          <label key={f}>
            {K.labels[f]}
            <select value={choice[f]} onChange={(ev) => setChoice((o) => ({ ...o, [f]: Number(ev.target.value) }))}>
              {hw.KDD_LEVELS[f].map((v, i) => <option key={v} value={i}>{v}</option>)}
            </select>
          </label>
        ))}
      </div>
      <DataTable
        columns={[{ key: 'feature', label: K.partsCols.feature }, { key: 'value', label: K.partsCols.value }, { key: 'attacks', label: K.partsCols.attacks, num: true }, { key: 'normals', label: K.partsCols.normals, num: true }, { key: 'weight', label: K.partsCols.weight, num: true }]}
        rows={e.parts.map((p) => ({ key: p.feature, cells: { feature: K.features[p.feature], value: p.value, attacks: F.int(p.attacks), normals: F.int(p.normals), weight: F.num(p.weight, 2) } }))}
      />
      <p className="hw4-line" aria-live="polite">{K.result(e)}</p>
    </>
  );
};

// --- 2.1 La probabilita' condizionata ---------------------------------------------------------------

const Conditional = React.memo(function Conditional({ text }) {
  const C = text.conditional;
  const F = text.fmt;
  const chain = useMemo(() => hw.attackChain(), []);
  const indep = useMemo(() => hw.independenceFacts(), []);
  const pv = useMemo(() => hw.pvalueFacts(), []);
  const many = useMemo(() => hw.discoveryFacts(), []);
  return (
    <>
      <Title id="hw7-conditional" level={1}>{text.sections.conditional}</Title>
      <Paras list={C.paras} />
      <p>{C.chainIntro}</p>
      <DataTable
        title={C.chainTitle}
        columns={[{ key: 'stage', label: C.chainCols.stage }, { key: 'p', label: C.chainCols.p, num: true }, { key: 'cumulative', label: C.chainCols.cumulative, num: true }]}
        rows={chain.rows.map((r) => ({ key: r.key, cells: { stage: C.stages[r.key], p: F.pct(r.p, 0), cumulative: F.pctSmall(r.cumulative) } }))}
      />
      <p>{C.chainText(chain)}</p>
      <p>{C.indepIntro}</p>
      <DataTable
        title={C.indepTitle}
        columns={[{ key: 'when', label: C.indepCols.when }, { key: 'phishing', label: C.indepCols.phishing, num: true }, { key: 'exploit', label: C.indepCols.exploit, num: true }, { key: 'product', label: C.indepCols.product, num: true }, { key: 'both', label: C.indepCols.both, num: true }]}
        rows={[
          { key: 'before', cells: { when: C.indepRows.before, phishing: F.pct(indep.causes.phishing, 2), exploit: F.pct(indep.causes.exploit, 2), product: F.pct(indep.causes.phishing * indep.causes.exploit, 3), both: F.pct(indep.causes.both, 3) } },
          { key: 'after', cells: { when: C.indepRows.after, phishing: F.pct(indep.causesGivenEdr.phishing, 2), exploit: F.pct(indep.causesGivenEdr.exploit, 2), product: F.pct(indep.causesGivenEdr.phishing * indep.causesGivenEdr.exploit, 3), both: F.pct(indep.causesGivenEdr.both, 3) } },
        ]}
      />
      <p>{C.indepText(indep)}</p>
      <p>{C.pvalueIntro(pv)}</p>
      <p>{C.pvalueText(pv)}</p>
      <p>{C.manyText(many)}</p>
    </>
  );
});

const TryPvalue = ({ text, palette }) => {
  const T = text.tryPvalue;
  const F = text.fmt;
  const [state, setState] = useState(view.DISCOVERY_TRY_DEFAULT);
  const facts = useMemo(() => hw.discoveryFacts({ real: hw.DISCOVERY_REALS[state.real], power: hw.DISCOVERY_POWERS[state.power], alpha: hw.DISCOVERY_ALPHAS[state.alpha] }), [state]);
  const data = useMemo(() => view.discoveryIcons(facts), [facts]);
  const legend = useMemo(() => view.legends.discovery(text.legends), [text]);
  const tip = useMemo(() => view.tips.discovery(facts, text.tips), [facts, text]);
  const [hidden, toggle] = useHidden();
  const set = (key) => (v) => setState((o) => ({ ...o, [key]: v }));
  return (
    <Try id="hw7-try-pvalue" title={text.sections.tryPvalue}>
      <p>{T.intro}</p>
      <Slider id="hw7-real" label={T.real(facts.real)} valueText={T.real(facts.real)} max={hw.DISCOVERY_REALS.length - 1} value={state.real} onChange={set('real')} />
      <Slider id="hw7-power" label={T.power(facts.power)} valueText={T.power(facts.power)} max={hw.DISCOVERY_POWERS.length - 1} value={state.power} onChange={set('power')} />
      <Slider id="hw7-alpha-tests" label={T.alpha(facts.alpha)} valueText={T.alpha(facts.alpha)} max={hw.DISCOVERY_ALPHAS.length - 1} value={state.alpha} onChange={set('alpha')} />
      <div className="hw1-charts">
        <Figure title={T.iconTitle} draw={hw.drawIconArray} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.discovery} />
      </div>
      <DataTable
        id={view.LINKED_TABLES.discovery}
        title={T.tableTitle}
        columns={[{ key: 'category', label: T.cols.category }, { key: 'truth', label: T.cols.truth }, { key: 'decision', label: T.cols.decision }, { key: 'count', label: T.cols.count, num: true }, { key: 'share', label: T.cols.share, num: true }]}
        rows={view.DISCOVERY_CATEGORIES.map((c, k) => ({ key: c, hidden: hidden.has(k), cells: { category: text.legends[c], truth: T.truth[c], decision: T.decision[c], count: F.int(facts.counts[k]), share: F.pct(facts.counts[k] / facts.total, 1) } }))}
      />
      <p className="hw4-line" aria-live="polite">{T.result(facts)}</p>
    </Try>
  );
};

// --- 2.2 Il teorema di Bayes: le tre componenti ------------------------------------------------------

const Engine = ({ text, palette }) => {
  const E = text.engine;
  const F = text.fmt;
  const lik = useMemo(() => view.likelihoodChart(hw.DEFAULT_SEED, F.decimal), [F]);
  const legend = useMemo(() => view.legends.likelihood(text.legends), [text]);
  const tip = useMemo(() => view.tips.likelihood(lik.curves, text.tips), [lik, text]);
  const weights = useMemo(() => {
    const d1 = lik.curves.data.day1;
    const d10 = lik.curves.data.days10;
    return [hw.priorWeight(hw.PRIORS.informed, d1.clicks, d1.sent), hw.priorWeight(hw.PRIORS.informed, d10.clicks, d10.sent)];
  }, [lik]);
  return (
    <>
      <Title id="hw7-engine" level={1}>{text.sections.engine}</Title>
      <p>{E.components}</p>
      <div className="hw1-charts">
        <Figure title={E.likelihoodTitle} draw={hw.drawLineChart} data={lik.chart} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p>{E.likelihood(lik.curves)}</p>
      <p>{E.odds}</p>
      <Formulas>{E.formulas}</Formulas>
      <p>{E.weights(weights[0], weights[1])}</p>
      <p>{E.central}</p>
      <p>{E.after}</p>
    </>
  );
};

// --- 2.10 Vantaggi, limiti e influenza del prior ------------------------------------------------------

const Limits = React.memo(function Limits({ text }) {
  const L = text.limits;
  const rows = useMemo(() => hw.priorSensitivity(), []);
  return (
    <>
      <Title id="hw7-limits" level={1}>{text.sections.limits}</Title>
      <p>{L.intro}</p>
      <DataTable
        title={L.tableTitle(hw.DECISION_LEVEL)}
        columns={[{ key: 'prior', label: L.cols.prior }, { key: 'day1', label: L.cols.day1, num: true }, { key: 'days3', label: L.cols.days3, num: true }, { key: 'days10', label: L.cols.days10, num: true }]}
        rows={hw.PRIOR_KEYS.map((k) => ({ key: k, cells: { prior: text.tryBelief.priors[k], day1: L.cell(rows[0].priors[k]), days3: L.cell(rows[1].priors[k]), days10: L.cell(rows[2].priors[k]) } }))}
      />
      <Paras list={L.paras(rows)} />
    </>
  );
});

// --- 1.1 In probabilita' -----------------------------------------------------------------

const Probability = ({ s, job, text, palette }) => {
  const P = text.probability;
  const F = text.fmt;
  const rows = useMemo(() => hw.deviationTable(), []);
  const data = useMemo(() => (s ? view.outsideChart(s.paths, F.decimal) : null), [s, F]);
  const legend = useMemo(() => view.legends.outside(text.legends), [text]);
  const tip = useMemo(() => (s ? view.tips.outside(s.paths, text.tips) : null), [s, text]);
  const [hidden, toggle] = useHidden();
  return (
    <>
      <Title id="hw7-probability" level={1}>{text.sections.probability}</Title>
      <Paras list={P.paras(rows)} />
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <div className="hw1-charts">
            <Figure title={P.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.outside} />
          </div>
          <DataTable
            id={view.LINKED_TABLES.outside}
            title={P.tableTitle}
            columns={[{ key: 'n', label: P.cols.n }, { key: 'simulated', label: P.cols.simulated, num: true, hidden: hidden.has(0) }, { key: 'exact', label: P.cols.exact, num: true, hidden: hidden.has(1) }, { key: 'chebyshev', label: P.cols.chebyshev, num: true, hidden: hidden.has(2) }]}
            rows={s.paths.checks.map((c) => ({ key: c.n, cells: { n: F.int(c.n), simulated: F.pct(c.outside), exact: F.pct(c.exactOutside, 2), chebyshev: F.pct(hw.deviationBounds(c.n, s.paths.rate, s.paths.epsilon).chebyshev) } }))}
          />
        </>
      )}
      <p>{P.after}</p>
    </>
  );
};

// --- 1.2 Quasi certa ---------------------------------------------------------------------

const Almost = ({ s, job, text, palette }) => {
  const A = text.almost;
  const F = text.fmt;
  const paths = useMemo(() => (s ? view.pathsChart(s.paths, F.decimal) : null), [s, F]);
  const after = useMemo(() => (s ? view.afterChart(s.paths, F.decimal) : null), [s, F]);
  const pathsLegend = useMemo(() => view.legends.paths(text.legends), [text]);
  const afterLegend = useMemo(() => view.legends.after(text.legends), [text]);
  const pathsTip = useMemo(() => (s ? view.tips.paths(s.paths, text.tips) : null), [s, text]);
  const afterTip = useMemo(() => (s ? view.tips.after(s.paths, text.tips) : null), [s, text]);
  const [hidden, toggle] = useHidden();
  return (
    <>
      <Title id="hw7-almost" level={1}>{text.sections.almost}</Title>
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <Paras list={A.paras(s.paths)} />
          <div className="hw1-charts">
            <Figure title={A.chartTitle} draw={hw.drawLineChart} data={paths} palette={palette} tip={pathsTip} wide legend={pathsLegend} />
            <Figure title={A.chart2Title} draw={hw.drawLineChart} data={after} palette={palette} tip={afterTip} wide legend={afterLegend} hidden={hidden} onToggle={toggle} link={view.links.after} />
          </div>
          <DataTable
            id={view.LINKED_TABLES.after}
            title={A.tableTitle}
            columns={[{ key: 'n', label: A.cols.n }, { key: 'outside', label: A.cols.outside, num: true, hidden: hidden.has(0) }, { key: 'after', label: A.cols.after, num: true, hidden: hidden.has(1) }]}
            rows={s.paths.checks.map((c) => ({ key: c.n, cells: { n: F.int(c.n), outside: F.pct(c.outside), after: F.pct(c.after) } }))}
          />
        </>
      )}
      <p>{A.after}</p>
    </>
  );
};

const TrySequences = ({ text, palette }) => {
  const T = text.trySequences;
  const F = text.fmt;
  const [key, setKey] = useState(view.SEQUENCE_TRY_DEFAULT.key);
  const result = useMemo(() => hw.sequencePaths(key, hw.DEFAULT_SEED), [key]);
  const data = useMemo(() => view.sequenceChart(result, F.decimal), [result, F]);
  const tip = useMemo(() => view.tips.sequence(result, text.tips), [result, text]);
  const modes = hw.SEQUENCE_MODES[key];
  const stillAway = (n) => result.last.filter((l) => l > n).length;
  return (
    <Try id="hw7-try-sequences" title={text.sections.trySequences}>
      <p>{T.intro}</p>
      <Choices label={T.chooseLabel} options={hw.SEQUENCES.map((k) => [k, T.names[k]])} value={key} onChange={setKey} />
      <p>{T.describe[key]}</p>
      <div className="hw1-charts">
        <Figure title={T.names[key]} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide />
      </div>
      <DataTable
        title={T.tableTitle}
        columns={[{ key: 'n', label: T.cols.n }, { key: 'deviation', label: T.cols.deviation, num: true }, { key: 'l2', label: T.cols.l2, num: true }, { key: 'afterwards', label: T.cols.afterwards, num: true }, { key: 'simulated', label: T.cols.simulated, num: true }]}
        rows={view.sequenceTableN(key).map((n) => {
          const f = hw.sequenceFacts(key, n);
          return {
            key: n,
            cells: {
              n: F.int(n),
              deviation: F.prob(f.deviation),
              l2: f.l2 >= 1 ? F.int(f.l2) : F.prob(f.l2),
              afterwards: f.afterwards === null ? '-' : f.afterwards === 1 ? T.never : F.prob(f.afterwards),
              simulated: n < hw.SEQUENCE_LENGTH ? `${F.int(stillAway(n))}/${F.int(result.last.length)}` : '-',
            },
          };
        })}
        note={T.simulatedNote}
      />
      <DataTable
        title={T.modesTitle}
        columns={[{ key: 'mode', label: '' }, { key: 'holds', label: T.names[key] }]}
        rows={['probability', 'as', 'l2', 'distribution'].map((m) => ({ key: m, className: modes[m] ? 'hw7-holds' : 'hw7-fails', cells: { mode: T.modes[m], holds: modes[m] ? T.holds : T.fails } }))}
      />
    </Try>
  );
};

// --- 1.3 In media quadratica ---------------------------------------------------------------

const L2 = ({ s, job, text, palette }) => {
  const Q = text.l2;
  const F = text.fmt;
  const data = useMemo(() => (s ? view.mseChart(s.paths, F.decimal) : null), [s, F]);
  const legend = useMemo(() => view.legends.mse(text.legends), [text]);
  const tip = useMemo(() => (s ? view.tips.mse(s.paths, text.tips) : null), [s, text]);
  const [hidden, toggle] = useHidden();
  return (
    <>
      <Title id="hw7-l2" level={1}>{text.sections.l2}</Title>
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <Paras list={Q.paras(s.paths)} />
          <div className="hw1-charts">
            <Figure title={Q.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.mse} />
          </div>
          <DataTable
            id={view.LINKED_TABLES.mse}
            title={Q.tableTitle}
            columns={[{ key: 'n', label: Q.cols.n }, { key: 'simulated', label: Q.cols.simulated, num: true, hidden: hidden.has(0) }, { key: 'exact', label: Q.cols.exact, num: true, hidden: hidden.has(1) }]}
            rows={s.paths.checks.map((c) => ({ key: c.n, cells: { n: F.int(c.n), simulated: F.sci(c.mse, 2), exact: F.sci(c.exactMse, 2) } }))}
          />
        </>
      )}
      <DataTable
        title={Q.counterTitle}
        columns={[{ key: 'n', label: Q.counterCols.n }, { key: 'spikeP', label: Q.counterCols.spikeP, num: true }, { key: 'spikeL2', label: Q.counterCols.spikeL2, num: true }, { key: 'bernP', label: Q.counterCols.bernP, num: true }, { key: 'bernL2', label: Q.counterCols.bernL2, num: true }]}
        rows={view.SEQUENCE_TABLE_N.map((n) => {
          const spike = hw.sequenceFacts('spike', n);
          const bern = hw.sequenceFacts('bern1', n);
          return { key: n, cells: { n: F.int(n), spikeP: F.prob(spike.deviation), spikeL2: F.int(spike.l2), bernP: F.prob(bern.deviation), bernL2: F.prob(bern.l2) } };
        })}
      />
    </>
  );
};

// --- 1.4 In distribuzione ------------------------------------------------------------------

const Distribution = ({ s, job, text, palette }) => {
  const D = text.distribution;
  const F = text.fmt;
  const data = useMemo(() => (s ? view.cltChart(s.clt.rows, F.decimal) : null), [s, F]);
  const legend = useMemo(() => view.legends.clt(text.legends), [text]);
  const tip = useMemo(() => (s ? view.tips.clt(s.clt.rows, text.tips) : null), [s, text]);
  const [hidden, toggle] = useHidden();
  return (
    <>
      <Title id="hw7-distribution" level={1}>{text.sections.distribution}</Title>
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <Paras list={D.paras(s.clt.rows)} />
          <div className="hw1-charts">
            <Figure title={D.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.clt} />
          </div>
          <DataTable
            id={view.LINKED_TABLES.clt}
            title={D.tableTitle}
            columns={[
              { key: 'n', label: D.cols.n },
              { key: 'bernoulli', label: D.cols.bernoulli, num: true, hidden: hidden.has(0) },
              { key: 'bernoulliBound', label: D.cols.bernoulliBound, num: true, hidden: hidden.has(1) },
              { key: 'exponential', label: D.cols.exponential, num: true, hidden: hidden.has(2) },
              { key: 'exponentialBound', label: D.cols.exponentialBound, num: true, hidden: hidden.has(3) },
            ]}
            rows={s.clt.rows.map((r) => ({ key: r.n, cells: { n: F.int(r.n), bernoulli: F.num(r.bernoulli, 4), bernoulliBound: F.num(r.bernoulliBound, 4), exponential: F.num(r.exponential, 4), exponentialBound: F.num(r.exponentialBound, 4) } }))}
          />
          <p>{D.tests(s.clt)}</p>
        </>
      )}
    </>
  );
};

const TryClt = ({ text, palette }) => {
  const T = text.tryClt;
  const F = text.fmt;
  const [state, setState] = useState(view.CLT_TRY_DEFAULT);
  const t = useMemo(() => view.cltTry(state, F.decimal), [state, F]);
  const legend = useMemo(() => view.legends.cltTry(text.legends, t.cauchy), [text, t.cauchy]);
  const tip = useMemo(() => view.tips.histogram(t.chart, text.tips, view.CLT_TRY_REPS), [t, text]);
  return (
    <Try id="hw7-try-clt" title={text.sections.tryClt}>
      <p>{T.intro}</p>
      <Choices label={T.lawLabel} options={hw.CLT_LAWS.map((k) => [k, T.laws[k]])} value={state.law} onChange={(v) => setState((o) => ({ ...o, law: v }))} />
      <Choices label={T.nLabel} options={view.CLT_TRY_SIZES.map((n) => [n, F.int(n)])} value={state.n} onChange={(v) => setState((o) => ({ ...o, n: v }))} />
      <Actions>
        <Action onClick={() => setState((o) => ({ ...o, draw: o.draw + 1 }))}>{text.ui.another}</Action>
      </Actions>
      <div className="hw1-charts">
        <Figure title={T.chartTitle} draw={hw.drawHistogram} data={t.chart} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw4-line" aria-live="polite">{T.result(t, state)}</p>
    </Try>
  );
};

const TryHash = ({ text, palette }) => {
  const T = text.tryHash;
  const F = text.fmt;
  const [config, setConfig] = useState({ bits: view.HASH_TRY_DEFAULT.bits, factor: view.HASH_TRY_DEFAULT.factor });
  const [run, setRun] = useState({ trials: 0, hits: 0, history: [] });
  const m = view.hashCount(config.bits, config.factor);
  const exact = useMemo(() => hw.collisionExact(config.bits, m), [config.bits, m]);
  const state = { ...config, ...run };
  const data = useMemo(() => view.hashChart({ history: run.history }, exact, F.decimal), [run.history, exact, F]);
  const legend = useMemo(() => view.legends.hash(text.legends), [text]);
  const tip = useMemo(() => view.tips.hash({ history: run.history }, exact, text.tips), [run.history, exact, text]);
  const median32 = useMemo(() => hw.collisionMedian(32), []);
  const change = (key) => (v) => {
    setConfig((o) => ({ ...o, [key]: v }));
    setRun({ trials: 0, hits: 0, history: [] });
  };
  // more trials, from the stream 'hash' after the ones of the test (repetitions from 10^6)
  const add = (count) => setRun((o) => {
    const hits = o.hits + hw.collisionRun(config.bits, m, count, hw.DEFAULT_SEED, 1000000 + o.trials);
    const trials = o.trials + count;
    return { trials, hits, history: [...o.history, { trials, hits }].slice(-60) };
  });
  return (
    <Try id="hw7-try-hash" title={text.sections.tryHash}>
      <p>{T.intro}</p>
      <Choices label={T.bitsLabel} options={hw.HASH_TRY_BITS.map((b) => [b, String(b)])} value={config.bits} onChange={change('bits')} />
      <Choices label={T.factorLabel} options={view.HASH_FACTORS.map((f) => [f, T.factors(view.hashCount(config.bits, f))])} value={config.factor} onChange={change('factor')} />
      <Actions>
        <Action onClick={() => add(100)}>{T.add100}</Action>
        <Action onClick={() => add(1000)}>{T.add1000}</Action>
        <Action onClick={() => setRun({ trials: 0, hits: 0, history: [] })}>{text.ui.reset}</Action>
      </Actions>
      <div className="hw1-charts">
        <Figure title={T.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw4-line" aria-live="polite">{T.result(state, exact, m, config.bits)}</p>
      <p className="hw1-note">{T.thirtyTwo(median32)}</p>
    </Try>
  );
};

// --- 1.5 La mappa delle implicazioni ----------------------------------------------------------

const MapSection = React.memo(function MapSection({ text }) {
  const M = text.map;
  const pairs = hw.MODES.flatMap((a) => hw.MODES.filter((b) => b !== a).map((b) => ({ a, b, ...hw.implication(a, b) })));
  return (
    <>
      <Title id="hw7-map" level={1}>{text.sections.map}</Title>
      <Paras list={M.paras} />
      <DataTable
        title={M.tableTitle}
        columns={[{ key: 'from', label: M.cols.from }, { key: 'to', label: M.cols.to }, { key: 'holds', label: M.cols.holds }, { key: 'counter', label: M.cols.counter }]}
        rows={pairs.map((x) => ({ key: `${x.a}-${x.b}`, className: x.holds ? 'hw7-holds' : 'hw7-fails', cells: { from: text.tryMap.modes[x.a], to: text.tryMap.modes[x.b], holds: x.holds ? text.trySequences.holds : text.trySequences.fails, counter: x.holds ? '' : text.trySequences.names[x.counter] } }))}
      />
    </>
  );
});

const TryMap = ({ text, palette }) => {
  const T = text.tryMap;
  const [mode, setMode] = useState(null);
  const list = mode ? {
    holds: hw.MODES.filter((m) => m !== mode && hw.implication(mode, m).holds),
    fails: hw.MODES.filter((m) => m !== mode && !hw.implication(mode, m).holds).map((m) => ({ mode: m, counter: hw.implication(mode, m).counter })),
  } : null;
  return (
    <Try id="hw7-try-map" title={text.sections.tryMap}>
      <p>{T.intro}</p>
      <Choices label={text.sections.tryMap} options={hw.MODES.map((m) => [m, T.modes[m]])} value={mode} onChange={setMode} />
      <MapDiagram mode={mode} text={text} palette={palette} label={T.diagramLabel} />
      <p className="hw4-line" aria-live="polite">{mode ? T.result(mode, list) : T.pick}</p>
    </Try>
  );
};

// --- 1.10 Le code pesanti -----------------------------------------------------------------------

const Heavy = ({ s, job, text, palette }) => {
  const H = text.heavy;
  const F = text.fmt;
  const b = useMemo(() => hw.bytesFacts(), []);
  const cauchy = useMemo(() => (s ? view.cauchyChart(s.cauchy, F.decimal) : null), [s, F]);
  const cauchyTip = useMemo(() => (s ? view.tips.cauchy(s.cauchy, text.tips) : null), [s, text]);
  const hist = useMemo(() => (s ? view.bytesChart(s.bytes[s.bytes.length - 1], F.decimal) : null), [s, F]);
  const histLegend = useMemo(() => view.legends.bytes(text.legends), [text]);
  const histTip = useMemo(() => (hist ? view.tips.histogram(hist, text.tips, hw.BYTES_REPS) : null), [hist, text]);
  const facts = [
    ['mean', F.int(b.mean)],
    ['median', F.int(b.median)],
    ['sd', F.int(b.sd)],
    ['max', F.int(b.max)],
    ['zeros', F.int(b.zeros)],
    ['top10', F.pct(b.top10)],
    ['skewness', F.num(b.skewness, 1)],
    ['ratio', F.num(b.ratio, 1)],
    ['needed', F.int(b.needed)],
  ];
  return (
    <>
      <Title id="hw7-heavy" level={1}>{text.sections.heavy}</Title>
      <Paras list={H.paras(b)} />
      <DataTable title={H.factsTitle} columns={[{ key: 'what', label: '' }, { key: 'value', label: '', num: true }]} rows={facts.map(([k, v]) => ({ key: k, cells: { what: H.facts[k], value: v } }))} />
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <div className="hw1-charts">
            <Figure title={H.cauchyTitle} draw={hw.drawLineChart} data={cauchy} palette={palette} tip={cauchyTip} wide />
            <Figure title={H.histTitle} draw={hw.drawHistogram} data={hist} palette={palette} tip={histTip} wide legend={histLegend} />
          </div>
          <DataTable
            title={H.tableTitle}
            columns={[{ key: 'n', label: H.cols.n }, { key: 'D', label: H.cols.D, num: true }, { key: 'p', label: H.cols.p, num: true }, { key: 'below', label: H.cols.below, num: true }, { key: 'median', label: H.cols.median, num: true }]}
            rows={s.bytes.map((x) => ({ key: x.n, cells: { n: F.int(x.n), D: F.num(x.D, 3), p: F.p(x.p, x.log10p), below: F.pct(x.below), median: F.num(x.median, 3) } }))}
          />
          <p>{H.bytes(s.bytes)}</p>
        </>
      )}
    </>
  );
};

// --- 1.11 La velocita' --------------------------------------------------------------------------

const Speed = ({ text, palette }) => {
  const V = text.speed;
  const F = text.fmt;
  const rows = useMemo(() => hw.deviationTable(), []);
  const data = useMemo(() => view.speedChart(rows, F.decimal), [rows, F]);
  const legend = useMemo(() => view.legends.speed(text.legends), [text]);
  const tip = useMemo(() => view.tips.speed(rows, text.tips), [rows, text]);
  const [hidden, toggle] = useHidden();
  return (
    <>
      <Title id="hw7-speed" level={1}>{text.sections.speed}</Title>
      <Paras list={V.paras(rows)} />
      <div className="hw1-charts">
        <Figure title={V.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.speed} />
      </div>
      <DataTable
        id={view.LINKED_TABLES.speed}
        title={V.tableTitle}
        columns={[
          { key: 'n', label: V.cols.n },
          { key: 'exact', label: V.cols.exact, num: true, hidden: hidden.has(0) },
          { key: 'chebyshev', label: V.cols.chebyshev, num: true, hidden: hidden.has(1) },
          { key: 'hoeffding', label: V.cols.hoeffding, num: true, hidden: hidden.has(2) },
          { key: 'normal', label: V.cols.normal, num: true, hidden: hidden.has(3) },
        ]}
        rows={rows.map((r) => ({ key: r.n, cells: { n: F.int(r.n), exact: F.prob(r.exact), chebyshev: F.prob(r.chebyshev), hoeffding: F.prob(r.hoeffding), normal: F.prob(r.normal) } }))}
      />
    </>
  );
};

// --- 2.11 Il posterior converge -----------------------------------------------------------------

const Bvm = ({ s, job, text, palette }) => {
  const B = text.bvm;
  const F = text.fmt;
  const means = useMemo(() => (s ? view.bvmChart(s.bvm, F.decimal) : null), [s, F]);
  const distances = useMemo(() => (s ? view.bvmDistanceChart(s.bvm, F.decimal) : null), [s, F]);
  const legend = useMemo(() => view.legends.bvm(text.legends), [text]);
  const legend2 = useMemo(() => view.legends.bvmDistance(text.legends), [text]);
  const tip = useMemo(() => (s ? view.tips.bvm(s.bvm, text.tips) : null), [s, text]);
  const tip2 = useMemo(() => (s ? view.tips.bvmDistance(s.bvm, text.tips) : null), [s, text]);
  const [hidden, toggle] = useHidden();
  return (
    <>
      <Title id="hw7-bvm" level={1}>{text.sections.bvm}</Title>
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <Paras list={B.paras(s.bvm)} />
          <div className="hw1-charts">
            <Figure title={B.chartTitle} draw={hw.drawLineChart} data={means} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.bvm} />
            <Figure title={B.chart2Title} draw={hw.drawLineChart} data={distances} palette={palette} tip={tip2} wide legend={legend2} link={view.links.bvmDistance} />
          </div>
          <DataTable
            id={view.LINKED_TABLES.bvm}
            title={B.tableTitle}
            columns={[
              { key: 'n', label: B.cols.n },
              { key: 'clicks', label: B.cols.clicks, num: true },
              { key: 'uniform', label: B.cols.uniform, num: true, hidden: hidden.has(0) },
              { key: 'wrong', label: B.cols.wrong, num: true, hidden: hidden.has(1) },
              { key: 'dUniform', label: B.cols.dUniform, num: true },
              { key: 'dWrong', label: B.cols.dWrong, num: true },
            ]}
            rows={s.bvm.map((r) => ({ key: r.n, cells: { n: F.int(r.n), clicks: F.int(r.clicks), uniform: B.pair(r.uniform), wrong: B.pair(r.wrong), dUniform: F.num(r.uniform.distance, 4), dWrong: F.num(r.wrong.distance, 4) } }))}
          />
        </>
      )}
    </>
  );
};

// --- 3. Le verifiche -------------------------------------------------------------------------

const Verify = ({ s, text }) => {
  const V = text.checks;
  const rows = useMemo(() => hw.verifyAll(s && s.params.seed === hw.DEFAULT_SEED ? s : null), [s]);
  const done = rows.filter((r) => r.ok !== null);
  const ok = done.filter((r) => r.ok).length;
  const groups = hw.CHECK_GROUPS.map((group) => ({ group, rows: rows.filter((r) => r.group === group) }));
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5 hw6 hw7">
      <Title id="hw7-checks" level={0}>{text.sections.checks}</Title>
      <p>{V.intro}</p>
      {done.length < rows.length ? (
        <p className="hw1-note hw1-pending" role="status">{`${V.summary(ok, done.length)}; ${rows.length - done.length} ${V.pending}`}</p>
      ) : (
        <Check ok={ok === rows.length}><strong>{V.summary(ok, rows.length)}</strong></Check>
      )}
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
                    <td data-label={V.cols.actual}><code>{r.ok === null ? '-' : r.actual}</code></td>
                    <td data-label={V.cols.result} className={r.ok === null ? '' : r.ok ? 'is-ok' : 'is-bad'}>
                      {r.ok === null ? V.pending : <span aria-label={r.ok ? V.ok : V.failed}>{r.ok ? '✓' : '✗'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </React.Fragment>
        ))}
      </details>
    </section>
  );
};

// --- 4, 5 e 6 -------------------------------------------------------------------------------

const TestsSummary = ({ s, sms, kdd, text }) => {
  const T = text.tests;
  const rows = useMemo(() => view.testRows(s, sms, kdd), [s, sms, kdd]);
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5 hw6 hw7 hw2-far">
      <Title id="hw7-tests" level={0}>{text.sections.tests}</Title>
      <p>{T.intro}</p>
      <table className="hw1-table hw1-discussion-table hw2-summary hw3-summary">
        <thead>
          <tr><th>{T.cols.subject}</th><th>{T.cols.hypothesis}</th><th>{T.cols.statistic}</th><th>{T.cols.p}</th><th>{T.cols.verdict}</th><th>{T.cols.expected}</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const c = view.testCells(r, text);
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
    <section className="hw1-section hw2 hw3 hw4 hw5 hw6 hw7 hw2-far">
      <Title id="hw7-history" level={0}>{text.sections.history}</Title>
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
    <section className="hw1-section hw2 hw3 hw4 hw5 hw6 hw7">
      <Title id="hw7-conclusion" level={0}>{text.sections.conclusion}</Title>
      <Paras list={text.conclusion.paras(facts)} />
    </section>
  );
});

// --- 1.6 Il ruolo nei teoremi limite ------------------------------------------------------------

const Roles = React.memo(function Roles({ text }) {
  const R = text.roles;
  return (
    <>
      <Title id="hw7-roles" level={1}>{text.sections.roles}</Title>
      <p>{R.intro}</p>
      <DataTable
        title={R.tableTitle}
        columns={[{ key: 'theorem', label: R.cols.theorem }, { key: 'statement', label: R.cols.statement }, { key: 'mode', label: R.cols.mode }, { key: 'condition', label: R.cols.condition }, { key: 'where', label: R.cols.where }]}
        rows={R.rows.map((r, i) => ({ key: i, cells: r }))}
      />
      <p>{R.after}</p>
    </>
  );
});

// --- 1.7 Altri risultati della statistica ---------------------------------------------------------

const Results = ({ s, job, text, palette }) => {
  const R = text.results;
  const F = text.fmt;
  const rows = useMemo(() => view.resultsRows(), []);
  const delta = useMemo(() => [100, 1000, 10000].map((n) => hw.deltaLogOdds(n)), []);
  const data = useMemo(() => view.resultsChart(rows, F.decimal), [rows, F]);
  const legend = useMemo(() => view.legends.results(text.legends), [text]);
  const tip = useMemo(() => view.tips.results(rows, text.tips), [rows, text]);
  const [hidden, toggle] = useHidden();
  return (
    <>
      <Title id="hw7-results" level={1}>{text.sections.results}</Title>
      <p>{R.intro}</p>
      <p>{R.consistency}</p>
      <p>{R.slutsky(rows)}</p>
      <div className="hw1-charts">
        <Figure title={R.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.results} />
      </div>
      <DataTable
        id={view.LINKED_TABLES.results}
        title={R.tableTitle}
        columns={[
          { key: 'n', label: R.cols.n },
          { key: 'z', label: R.cols.z, num: true, hidden: hidden.has(0) },
          { key: 't', label: R.cols.t, num: true, hidden: hidden.has(1) },
          { key: 'mle', label: R.cols.mle, num: true, hidden: hidden.has(2) },
          { key: 'bias', label: R.cols.bias, num: true, hidden: hidden.has(2) },
          { key: 'efficiency', label: R.cols.efficiency, num: true, hidden: hidden.has(2) },
        ]}
        rows={rows.map((r) => ({ key: r.n, cells: { n: F.int(r.n), z: F.num(r.z, 4), t: F.num(r.t, 4), mle: F.num(r.mle.distance, 4), bias: F.pct(r.mle.bias, 2), efficiency: F.num(r.mle.efficiency, 4) } }))}
      />
      <p>{R.delta(delta[0], delta[1])}</p>
      <DataTable
        title={R.deltaTitle}
        columns={[{ key: 'n', label: R.deltaCols.n }, { key: 'exact', label: R.deltaCols.exact, num: true }, { key: 'delta', label: R.deltaCols.delta, num: true }, { key: 'excluded', label: R.deltaCols.excluded, num: true }]}
        rows={delta.map((d) => ({ key: d.n, cells: { n: F.int(d.n), exact: F.num(d.exact, 4), delta: F.num(d.delta, 4), excluded: F.prob(d.excluded) } }))}
      />
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <p>{R.gc(s.gc.rows)}</p>
          <DataTable
            title={R.gcTitle}
            columns={[{ key: 'n', label: R.gcCols.n }, { key: 'meanD', label: R.gcCols.meanD, num: true }, { key: 'meanScaled', label: R.gcCols.meanScaled, num: true }, { key: 'over', label: R.gcCols.over, num: true }]}
            rows={s.gc.rows.map((r) => ({ key: r.n, cells: { n: F.int(r.n), meanD: F.num(r.meanD, 4), meanScaled: F.num(r.meanScaled, 3), over: F.pct(r.over, 1) } }))}
          />
        </>
      )}
      <p>{R.mle(rows)}</p>
    </>
  );
};

// --- 1.8 Perche' radice di n ------------------------------------------------------------------------

const Root = ({ s, job, text, palette }) => {
  const R = text.root;
  const F = text.fmt;
  const sizes = useMemo(() => [hw.sampleSizeFor(0.01), hw.sampleSizeFor(0.005), hw.sampleSizeFor(0.001)], []);
  const inference = useMemo(() => hw.rootTable(), []);
  const data = useMemo(() => (s ? view.rootChart(s.paths, F.decimal) : null), [s, F]);
  const legend = useMemo(() => view.legends.root(text.legends), [text]);
  const tip = useMemo(() => (s ? view.tips.root(s.paths, text.tips) : null), [s, text]);
  const [hidden, toggle] = useHidden();
  const sigma = Math.sqrt(hw.FALSE_ALARMS.rate * (1 - hw.FALSE_ALARMS.rate));
  return (
    <>
      <Title id="hw7-root" level={1}>{text.sections.root}</Title>
      <Paras list={R.paras(sizes)} />
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <div className="hw1-charts">
            <Figure title={R.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} hidden={hidden} onToggle={toggle} link={view.links.root} />
          </div>
          <DataTable
            id={view.LINKED_TABLES.root}
            title={R.tableTitle}
            columns={[
              { key: 'n', label: R.cols.n },
              { key: 'sdCount', label: R.cols.sdCount, num: true, hidden: hidden.has(0) },
              { key: 'exactCount', label: R.cols.exactCount, num: true, hidden: hidden.has(0) },
              { key: 'sdShare', label: R.cols.sdShare, num: true, hidden: hidden.has(1) },
              { key: 'exactShare', label: R.cols.exactShare, num: true, hidden: hidden.has(1) },
            ]}
            rows={s.paths.checks.map((c) => ({ key: c.n, cells: { n: F.int(c.n), sdCount: F.num(c.n * Math.sqrt(c.mse), 2), exactCount: F.num(sigma * Math.sqrt(c.n), 2), sdShare: F.num(Math.sqrt(c.mse), 5), exactShare: F.num(sigma / Math.sqrt(c.n), 5) } }))}
          />
        </>
      )}
      <DataTable
        title={R.inferenceTitle}
        columns={[{ key: 'n', label: R.inferenceCols.n }, { key: 'variance', label: R.inferenceCols.variance, num: true }, { key: 'se', label: R.inferenceCols.se, num: true }, { key: 'half', label: R.inferenceCols.half, num: true }]}
        rows={inference.map((r) => ({ key: r.n, cells: { n: F.int(r.n), variance: F.num(r.variance, 2), se: F.num(r.se, 5), half: `± ${F.pct(r.half, 2)}` } }))}
      />
    </>
  );
};

const TryScale = ({ text, palette }) => {
  const T = text.tryScale;
  const F = text.fmt;
  const [state, setState] = useState(view.SCALE_TRY_DEFAULT);
  // the means are drawn once; alpha only rescales them
  const samples = useMemo(() => hw.scaleSamples(), []);
  const alpha = hw.SCALE_ALPHAS[state.alpha];
  const charts = useMemo(() => view.scaleCharts(samples, alpha, F.decimal), [samples, alpha, F]);
  const legend = useMemo(() => view.legends.scale(text.legends), [text]);
  const tips = useMemo(() => charts.map((c) => view.tips.histogram(c.chart, text.tips, hw.SCALE_REPS)), [charts, text]);
  return (
    <Try id="hw7-try-scale" title={text.sections.tryScale}>
      <p>{T.intro}</p>
      <Slider id="hw7-alpha" label={T.alphaLabel(alpha)} valueText={T.alphaLabel(alpha)} max={hw.SCALE_ALPHAS.length - 1} value={state.alpha} onChange={(v) => setState({ alpha: v })} />
      <div className="hw1-charts hw7-three">
        {charts.map((c, i) => <Figure key={c.n} title={T.chartTitle(c.n)} draw={hw.drawHistogram} data={c.chart} palette={palette} tip={tips[i]} legend={i === 0 ? legend : null} />)}
      </div>
      <p className="hw4-line" aria-live="polite">{T.result(charts, alpha)}</p>
    </Try>
  );
};

// --- 1.9 Allarmi a raffica ----------------------------------------------------------------------------

// Due strisce di connessioni, una cella per connessione: rossa se c'e' un allarme
const BurstStrip = ({ cells, label, palette }) => {
  const perRow = 50;
  const rows = Math.ceil(cells.length / perRow);
  return (
    <svg className="hw7-strip" viewBox={`0 0 ${perRow * 2} ${rows * 2}`} style={{ aspectRatio: `${perRow * 2} / ${rows * 2}` }} role="img" aria-label={label} preserveAspectRatio="none">
      {Array.from(cells, (v, i) => (
        <rect key={i} x={(i % perRow) * 2 + 0.15} y={Math.floor(i / perRow) * 2 + 0.15} width="1.7" height="1.7" fill={v ? palette.series[1] : palette.grid} />
      ))}
    </svg>
  );
};

const Bursts = ({ s, job, text }) => {
  const B = text.bursts;
  const F = text.fmt;
  const f05 = useMemo(() => hw.burstFacts(1000, hw.FALSE_ALARMS.rate, 0.5), []);
  const f09 = useMemo(() => hw.burstFacts(1000, hw.FALSE_ALARMS.rate, 0.9), []);
  return (
    <>
      <Title id="hw7-bursts" level={1}>{text.sections.bursts}</Title>
      <Paras list={B.paras(f05, f09)} />
      {!s ? (
        <Pending text={text} result={job} />
      ) : (
        <>
          <DataTable
            title={B.tableTitle}
            columns={[
              { key: 'rho', label: B.cols.rho },
              { key: 'variance', label: B.cols.variance, num: true },
              { key: 'exact', label: B.cols.exact, num: true },
              { key: 'factor', label: B.cols.factor, num: true },
              { key: 'effective', label: B.cols.effective, num: true },
              { key: 'coverage', label: B.cols.coverage, num: true },
              { key: 'predicted', label: B.cols.predicted, num: true },
            ]}
            rows={s.bursts.map((b) => ({ key: b.rho, cells: { rho: F.plain(b.rho), variance: F.num(b.variance, 1), exact: F.num(b.exact.variance, 1), factor: F.num(b.exact.factor, 2), effective: F.int(b.exact.effective), coverage: F.pct(b.coverage, 1), predicted: F.pct(b.exact.coverage, 1) } }))}
          />
          <p>{B.simulation(s.bursts)}</p>
        </>
      )}
      <p>{B.after}</p>
    </>
  );
};

const TryBursts = ({ text, palette }) => {
  const T = text.tryBursts;
  const F = text.fmt;
  const [state, setState] = useState(view.BURST_TRY_DEFAULT);
  const rho = hw.BURST_RHOS[state.rho];
  const facts = useMemo(() => hw.burstFacts(1000, hw.FALSE_ALARMS.rate, rho), [rho]);
  const independent = useMemo(() => hw.burstPath(view.BURST_STRIP, hw.FALSE_ALARMS.rate, 0), []);
  const bursty = useMemo(() => hw.burstPath(view.BURST_STRIP, hw.FALSE_ALARMS.rate, rho), [rho]);
  const data = useMemo(() => view.burstChart(rho, F.decimal), [rho, F]);
  const legend = useMemo(() => view.legends.burst(text.legends), [text]);
  const tip = useMemo(() => view.tips.burst(rho, text.tips), [rho, text]);
  const count = (cells) => cells.reduce((a, v) => a + v, 0);
  return (
    <Try id="hw7-try-bursts" title={text.sections.tryBursts}>
      <p>{T.intro}</p>
      <Slider id="hw7-rho" label={T.rhoLabel(rho)} valueText={T.rhoLabel(rho)} max={hw.BURST_RHOS.length - 1} value={state.rho} onChange={(v) => setState({ rho: v })} />
      <p className="hw1-note">{T.stripLabel(T.strips.independent, count(independent), view.BURST_STRIP)}</p>
      <BurstStrip cells={independent} label={T.stripLabel(T.strips.independent, count(independent), view.BURST_STRIP)} palette={palette} />
      <p className="hw1-note">{T.stripLabel(T.strips.bursts, count(bursty), view.BURST_STRIP)}</p>
      <BurstStrip cells={bursty} label={T.stripLabel(T.strips.bursts, count(bursty), view.BURST_STRIP)} palette={palette} />
      <div className="hw1-charts">
        <Figure title={T.chartTitle} draw={hw.drawLineChart} data={data} palette={palette} tip={tip} wide legend={legend} />
      </div>
      <p className="hw4-line" aria-live="polite">{T.result(facts)}</p>
    </Try>
  );
};
// --- La pagina --------------------------------------------------------------------------------------

const Homework7 = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const text = HW7_TEXTS[language] || HW7_TEXTS.en;
  const palette = PALETTES[theme === 'dark' ? 'dark' : 'light'];
  const S = text.sections;
  // le simulazioni lunghe, nel worker
  const job = useExplore(view.paramsKey(view.DEFAULT_PARAMS));
  const s = job.value || null;
  // i due filtri: servono anche ai campi della pagina, quindi stanno qui
  const sms = useMemo(() => hw.smsModel(), []);
  const kdd = useMemo(() => hw.kddModel(), []);
  const conclusion = useMemo(() => {
    const c = view.campaignFacts();
    const pv = hw.pvalueFacts();
    return {
      alarm: hw.alarmFacts(hw.ALARM_DEFAULT).posterior,
      rate: c.uniform[c.uniform.length - 1],
      sms: sms.matrix.accuracy,
      kdd: kdd.naive.accuracy,
      half: hw.sampleSizeFor(0.005),
      burstFactor: hw.burstFacts(1000, hw.FALSE_ALARMS.rate, 0.5).factor,
      pValue: pv.pValue,
      posteriorH0: pv.posteriorH0,
    };
  }, [sms, kdd]);
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
            <a href={`${DOWNLOADS}homework7.zip`} download="homework7.zip" className="button icon solid fa-download">{text.download.zip}</a>
            <a href={`${DOWNLOADS}homework7/index.html?lang=${language === 'en' ? 'en' : 'it'}`} target="_blank" rel="noopener noreferrer" className="button alt icon solid fa-external-link-alt">{text.download.online}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <HomeworkShell slug="homework-7" sidebar={sidebar} toc={toc}>
      <Assignment text={text} />

      {/* 1. Le forme di convergenza */}
      <section className="hw1-section hw2 hw3 hw4 hw5 hw6 hw7">
        <Title id="hw7-convergence" level={0}>{S.convergence}</Title>
        <Paras list={text.convergence.intro} />
        <Formulas>{text.convergence.formulas}</Formulas>
        <Paras list={text.convergence.after} />
        <Probability s={s} job={job} text={text} palette={palette} />
        <Almost s={s} job={job} text={text} palette={palette} />
        <TrySequences text={text} palette={palette} />
        <L2 s={s} job={job} text={text} palette={palette} />
        <Distribution s={s} job={job} text={text} palette={palette} />
        <TryClt text={text} palette={palette} />
        <TryHash text={text} palette={palette} />
        <MapSection text={text} />
        <TryMap text={text} palette={palette} />
        <Roles text={text} />
        <Results s={s} job={job} text={text} palette={palette} />
        <Root s={s} job={job} text={text} palette={palette} />
        <TryScale text={text} palette={palette} />
        <Bursts s={s} job={job} text={text} />
        <TryBursts text={text} palette={palette} />
        <Heavy s={s} job={job} text={text} palette={palette} />
        <Speed text={text} palette={palette} />
      </section>

      {/* 2. Probabilita' condizionata, Bayes e inferenza */}
      <section className="hw1-section hw2 hw3 hw4 hw5 hw6 hw7">
        <Title id="hw7-bayes" level={0}>{S.bayes}</Title>
        <Paras list={text.bayes.intro} />
        <Conditional text={text} />
        <TryPvalue text={text} palette={palette} />
        <Engine text={text} palette={palette} />
        <Alarm text={text} palette={palette} />
        <TryAlarm text={text} palette={palette} />
        <Network text={text} palette={palette} />
        <TryNetwork text={text} palette={palette} />
        <Sprt s={s} job={job} text={text} palette={palette} />
        <TrySprt text={text} palette={palette} />
        <Rate text={text} palette={palette} />
        <TryBelief text={text} palette={palette} />
        <TryPrior text={text} palette={palette} />
        <Frequentist s={s} job={job} text={text} palette={palette} />
        <Spam sms={sms} text={text} palette={palette} />
        <Kdd kdd={kdd} text={text} />
        <Limits text={text} />
        <Bvm s={s} job={job} text={text} palette={palette} />
      </section>

      <Verify s={s} text={text} />
      <TestsSummary s={s} sms={sms} kdd={kdd} text={text} />
      <History text={text} />
      <Conclusion facts={conclusion} text={text} />
    </HomeworkShell>
  );
};

export default Homework7;
