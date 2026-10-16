// src/pages/statistics/Homework2a.jsx
// Homework #2 di Statistics: uno schema giocattolo su curva ellittica e il
// cifrario di Cesare. La pagina segue la consegna punto per punto: lo schema
// (cifrare, decifrare, il ruolo delle chiavi), il cifrario di Cesare e il
// confronto, la crittanalisi statistica di Cesare su un corpus inglese,
// l'attacco allo schema giocattolo, i test, il contesto storico e le
// conclusioni.
//
// Qui c'e' solo la pagina React. La crittografia, gli attacchi, le
// statistiche e i disegni stanno in hw2a/homework2a.js, i testi in
// hw2a/texts.js e la logica di presentazione in hw2a/view.js: sono gli
// stessi file da cui la build ricava il programma scaricabile
// (build/homework-standalone.js), cosi' la pagina e il download non
// possono raccontare due cose diverse.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/languageContext';
import { useTheme } from '../../contexts/themeContext';
import HomeworkShell from './HomeworkShell';
import * as hw from './hw2a/homework2a';
import * as view from './hw2a/view';
import { HW2A_TEXTS, originalAssignment } from './hw2a/texts';
import { useJob, useSettled } from './hw2a/useJob';

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

// I campi non devono passare per correttori o completamenti: il messaggio e
// la chiave restano nel browser.
const PRIVATE_FIELD = {
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

// La nota "valori dell'ultimo input valido" c'e' sempre, nascosta: la mostra
// il CSS quando la sezione ha la classe is-stale.
const Stale = ({ children }) => <p className="hw2-stale hw2-stale-note">{children}</p>;

// Un valore lungo: va a capo dove serve, e si copia intero
const Value = ({ label, children, className = '' }) => (
  <div className={`hw2-value ${className}`}>
    <span className="hw2-value-label">{label}</span>
    <code>{children}</code>
  </div>
);

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
// del pezzo sotto il puntatore: il disegno vero e' in homework2a.js.
const Figure = ({ title, draw, data, palette, tip = null, wide = false, legend = null }) => {
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
      <figcaption>{title}</figcaption>
    </figure>
  );
};

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

const Tests = ({ group, keys, s, text }) => {
  const list = view.statTests(s)[group].filter(([key]) => !keys || keys.includes(key));
  return (
    <div className="hw2-tests">
      {list.map(([key, test]) => (
        <TestRow key={key} label={text.stats.labels[group][key]} test={test} text={text} expected={view.EXPECTED_VERDICTS[group][key]} />
      ))}
    </div>
  );
};

// --- 0. La consegna ------------------------------------------------------------

const Assignment = React.memo(function Assignment({ text }) {
  return (
    <section className="hw1-section hw2 hw2a">
      <Title id="hw2a-assignment" level={0}>{text.sections.assignment}</Title>
      <Paras list={text.assignment.intro} />
      <details className="hw1-original" open>
        <summary>{text.assignment.originalTitle}</summary>
        <p className="hw1-note">{text.assignment.originalNote}</p>
        <blockquote lang="en">
          {originalAssignment().map((block, i) => (block.type === 'title' ? <p key={i}><strong>{block.text}</strong></p> : <p key={i}>{block.text}</p>))}
        </blockquote>
      </details>
    </section>
  );
});

// --- 1.2 Le chiavi ---------------------------------------------------------------

const Keys = React.memo(function Keys({ scheme, text }) {
  const K = text.keys;
  const f = useMemo(() => view.keyFacts(scheme), [scheme]);
  return (
    <>
      <Paras list={K.intro} />
      <Stale>{text.scheme.stale}</Stale>
      <Value label={K.kLabel}>{f.k}</Value>
      <Value label={K.hexLabel}>{f.hex}</Value>
      <Value label={K.binaryLabel(f.bits)}>{f.binary}</Value>
      <Value label={K.xLabel}>{f.x}</Value>
      <Value label={K.yLabel}>{f.y}</Value>
      <Value label={K.compressedLabel(f.even)}>{f.compressed}</Value>
      <Check ok={f.onCurve}>{K.onCurve(f.onCurve)}</Check>
      {f.isDefault && <Check ok={f.matchesReference}>{K.reference(f.matchesReference)}</Check>}
      <Paras list={K.after} />
    </>
  );
});

// --- 1.3 Cifratura -------------------------------------------------------------

const Encryption = React.memo(function Encryption({ encryption, text }) {
  const E = text.encrypt;
  const rows = useMemo(() => view.blockRows(encryption.blocks), [encryption]);
  return (
    <>
      <Paras list={E.intro} />
      <p className="hw1-table-title"><strong>{E.tableTitle}</strong></p>
      <Stale>{text.scheme.stale}</Stale>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw2a-blocks">
          <thead>
            <tr><th>{E.cols.position}</th><th>{E.cols.byte}</th><th>{E.cols.r}</th><th>{E.cols.C1}</th><th>{E.cols.C2}</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.position}>
                <td>{r.position}</td>
                <td>{r.byte} {r.char}</td>
                <td>{r.r}</td>
                <td>{r.C1}</td>
                <td>{r.C2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hw1-note">{E.size(view.ciphertextSize(encryption.blocks))}</p>
      <Paras list={E.after} />
    </>
  );
});

// --- 1.4 Decifratura -----------------------------------------------------------

const Decryption = React.memo(function Decryption({ encryption, decryption, text }) {
  const D = text.decrypt;
  const first = useMemo(() => view.firstBlock(encryption.blocks, decryption), [encryption, decryption]);
  const ok = decryption.ok && decryption.text === encryption.text;
  return (
    <>
      <Paras list={D.intro} />
      {first && (
        <>
          <p className="hw1-table-title"><strong>{D.firstTitle}</strong></p>
          <Stale>{text.scheme.stale}</Stale>
          <Value label={D.labels.C1}>{first.C1}</Value>
          <Value label={D.labels.C2}>{first.C2}</Value>
          <Value label={D.labels.S}>{first.S}</Value>
          <Check ok={first.sameS}>{D.sameS(first.sameS)}</Check>
          <Value label={D.labels.M}>{first.M}</Value>
          <Check ok={first.decoded >= 0}>{D.decoded(first.decoded, first.char)}</Check>
        </>
      )}
      <Value label={D.resultLabel}>{decryption.text ?? ''}</Value>
      <Check ok={ok}>{D.check(ok)}</Check>
    </>
  );
});

// --- 1.5 e 1.6 -------------------------------------------------------------------

const Roles = React.memo(function Roles({ text }) {
  const R = text.roles;
  return (
    <>
      <p>{R.intro}</p>
      <table className="hw1-table hw1-discussion-table hw2a-roles">
        <thead>
          <tr><th>{R.cols.value}</th><th>{R.cols.who}</th><th>{R.cols.purpose}</th><th>{R.cols.leak}</th></tr>
        </thead>
        <tbody>
          {R.rows.map((row) => (
            <tr key={row.value}>
              <th data-label={R.cols.value}>{row.value}</th>
              <td data-label={R.cols.who}>{row.who}</td>
              <td data-label={R.cols.purpose}>{row.purpose}</td>
              <td data-label={R.cols.leak}>{row.leak}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{R.after}</p>
    </>
  );
});

const Verify = React.memo(function Verify({ result, text }) {
  const V = text.verify;
  if (!result.value) return <Pending text={text} result={result} />;
  const rows = result.value;
  const ok = rows.filter((r) => r.ok).length;
  return (
    <>
      <Check ok={ok === rows.length}><strong>{V.summary(ok, rows.length)}</strong></Check>
      <details className="hw2-details">
        <summary>{V.details(rows.length)}</summary>
        {view.checkGroups(rows).map((g) => (
          <React.Fragment key={g.group}>
            <p className="hw1-table-title"><strong>{V.groups[g.group]}</strong></p>
            <table className="hw1-table hw1-discussion-table hw2-vectors">
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

// --- 2.1 Il cifrario di Cesare -------------------------------------------------

const Substitution = ({ shift, text }) => {
  const table = view.substitution(shift);
  const C = text.caesarCipher;
  return (
    <>
      <p className="hw1-table-title"><strong>{C.tableTitle}</strong></p>
      <div className="hw2a-subst" role="table" aria-label={C.tableTitle}>
        <div className="hw2a-subst-row" role="row">
          <span className="hw2a-subst-head" role="rowheader">{C.plainRow}</span>
          {table.plain.map((l) => <span key={l} role="cell">{l}</span>)}
        </div>
        <div className="hw2a-subst-row is-cipher" role="row">
          <span className="hw2a-subst-head" role="rowheader">{C.cipherRow}</span>
          {table.cipher.map((l, i) => <span key={table.plain[i]} role="cell">{l}</span>)}
        </div>
      </div>
    </>
  );
};

// --- 2.2 Il confronto -------------------------------------------------------------

const Compare = React.memo(function Compare({ size, text }) {
  const C = text.compare;
  const rows = C.rows(size);
  return (
    <>
      <p>{C.intro}</p>
      <table className="hw1-table hw1-discussion-table hw2a-compare">
        <thead>
          <tr>{C.cols.map((c, i) => <th key={i}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              <th>{row[0]}</th>
              {row.slice(1).map((cell, i) => <td key={i} data-label={C.cols[i + 1]}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <Paras list={C.after} />
    </>
  );
});

// --- 2.3 Le proprieta' statistiche ------------------------------------------------

const Properties = React.memo(function Properties({ message, shift, cipher, stats, text, palette }) {
  const P = text.properties;
  const F = text.fmt;
  const s = stats.value || null;
  const letters = useMemo(() => view.letterChart(message, F.decimal), [message, F]);
  const cipherLetters = useMemo(() => view.letterChart(cipher, F.decimal), [cipher, F]);
  const lettersTip = useMemo(() => view.tips.letters(letters, text.tips), [letters, text]);
  const cipherTip = useMemo(() => view.tips.letters(cipherLetters, text.tips), [cipherLetters, text]);
  const bytes = useMemo(() => (s ? view.ecBytesChart(s, F.decimal) : null), [s, F]);
  const bytesTip = useMemo(() => (bytes ? view.tips.ecBytes(bytes, text.tips) : null), [bytes, text]);
  return (
    <>
      <Paras list={P.intro} />
      <div className="hw1-charts">
        <Figure title={P.lettersChart} draw={hw.drawBarChart} data={letters} palette={palette} tip={lettersTip} />
        <Figure title={P.cipherChart(shift)} draw={hw.drawBarChart} data={cipherLetters} palette={palette} tip={cipherTip} />
      </div>
      {!s ? (
        <Pending text={text} result={stats} />
      ) : (
        <>
          <p>{P.sampleIntro(s)}</p>
          <Figure wide title={P.bytesChart(s)} draw={hw.drawBarChart} data={bytes} palette={palette} tip={bytesTip} />
          <p className="hw1-table-title"><strong>{P.tableTitle}</strong></p>
          <table className="hw1-table hw1-discussion-table hw2a-ciphers">
            <thead>
              <tr><th>{P.cols.text}</th><th>{P.cols.symbols}</th><th>{P.cols.entropy}</th><th>{P.cols.ic}</th></tr>
            </thead>
            <tbody>
              {view.cipherRows(s).map((r) => (
                <tr key={r.key}>
                  <th>{P.rowNames[r.key]}</th>
                  <td data-label={P.cols.symbols}>{F.int(r.symbols)}</td>
                  <td data-label={P.cols.entropy}>{P.entropyCell(r.entropy, r.max)}</td>
                  <td data-label={P.cols.ic}>{P.icCell(r.ic, r.uniformIc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>{P.repeated(s)}</p>
          <Tests group="caesar" s={s} text={text} />
          <Tests group="ec" s={s} text={text} />
          <Paras list={P.explain(s)} />
        </>
      )}
    </>
  );
});

// --- 3.1 Il corpus ---------------------------------------------------------------

const Corpus = React.memo(function Corpus({ stats, text, palette }) {
  const C = text.corpus;
  const F = text.fmt;
  const s = stats.value || null;
  const chart = useMemo(() => (s ? view.corpusChart(s, F.decimal) : null), [s, F]);
  const tip = useMemo(() => (chart ? view.tips.corpus(chart, text.tips) : null), [chart, text]);
  return (
    <>
      <Paras list={C.intro} />
      {!s ? (
        <Pending text={text} result={stats} />
      ) : (
        <>
          <p className="hw1-table-title"><strong>{C.chaptersTitle}</strong></p>
          <table className="hw1-table hw1-discussion-table hw2a-chapters">
            <thead>
              <tr><th>{C.cols.number}</th><th>{C.cols.title}</th><th>{C.cols.letters}</th><th>{C.cols.role}</th></tr>
            </thead>
            <tbody>
              {view.chapterRows(s).map((c) => (
                <tr key={c.number} className={`is-${c.role}`}>
                  <th>{c.number}</th>
                  <td data-label={C.cols.title}>{c.title}</td>
                  <td data-label={C.cols.letters}>{F.int(c.letters)}</td>
                  <td data-label={C.cols.role}>{C.roles[c.role]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Figure wide title={C.chart(s)} draw={hw.drawBarChart} data={chart} palette={palette} tip={tip} />
          <Paras list={C.facts(s)} />
          <Tests group="corpus" s={s} text={text} />
          <Paras list={C.modelsIntro} />
          <Formulas>{C.formula}</Formulas>
          <p className="hw1-table-title"><strong>{C.modelsTitle}</strong></p>
          <table className="hw1-table hw1-discussion-table hw2a-models">
            <thead>
              <tr>{['order', 'beta', 'crossEntropy', 'redundancy', 'unicity'].map((k) => <th key={k}>{C.modelCols[k]}</th>)}</tr>
            </thead>
            <tbody>
              {view.modelRows(s).map((r) => (
                <tr key={r.order}>
                  <th>{r.order} ({C.orderName(r.order)})</th>
                  <td data-label={C.modelCols.beta}>{F.num(r.beta, r.beta < 1 ? 1 : 0)}</td>
                  <td data-label={C.modelCols.crossEntropy}>{F.num(r.crossEntropy, 3)}</td>
                  <td data-label={C.modelCols.redundancy}>{F.num(r.redundancy, 3)}</td>
                  <td data-label={C.modelCols.unicity}>{F.num(r.unicity, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paras list={C.after(s)} />
        </>
      )}
    </>
  );
});

// --- 3.2 L'algoritmo -------------------------------------------------------------

const Algorithm = React.memo(function Algorithm({ crack, models, shift, stats, text, palette }) {
  const A = text.algorithm;
  const F = text.fmt;
  const chart = useMemo(() => (crack ? view.posteriorChart(crack, F.decimal) : null), [crack, F]);
  const tip = useMemo(() => (crack ? view.tips.posterior(crack, text.tips) : null), [crack, text]);
  const checks = useMemo(() => (crack && models ? view.fitChecks(crack, models) : null), [crack, models]);
  return (
    <>
      <Paras list={A.intro} />
      <Formulas>{A.formula}</Formulas>
      <p className="hw1-table-title"><strong>{A.liveTitle}</strong></p>
      {!crack ? (
        stats.error ? <Pending text={text} result={stats} /> : <p className="hw1-note hw1-pending" role="status">{A.pending}</p>
      ) : (
        <>
          <Check ok={crack.key === shift}>{A.live(crack, shift)}</Check>
          <Figure wide title={A.posteriorChart} draw={hw.drawBarChart} data={chart} palette={palette} tip={tip} />
          <p className="hw1-table-title"><strong>{A.candidatesTitle}</strong></p>
          <table className="hw1-table hw1-discussion-table hw2a-candidates">
            <thead>
              <tr><th>{A.candidateCols.shift}</th><th>{A.candidateCols.perLetter}</th><th>{A.candidateCols.posterior}</th><th>{A.candidateCols.text}</th></tr>
            </thead>
            <tbody>
              {view.candidateRows(crack).map((c) => (
                <tr key={c.shift} className={c.shift === crack.key ? 'is-current' : ''}>
                  <th>{c.shift}</th>
                  <td data-label={A.candidateCols.perLetter}>{F.num(c.perLetter, 3)}</td>
                  <td data-label={A.candidateCols.posterior}>{F.prob(c.posterior)}</td>
                  <td data-label={A.candidateCols.text}><code>{c.text.length > 60 ? `${c.text.slice(0, 60)}...` : c.text}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Paras list={A.fit(checks)} />
        </>
      )}
      <Paras list={A.after} />
    </>
  );
});

// --- 3.3 e 3.4 Le lunghezze e i metodi --------------------------------------------

const Lengths = React.memo(function Lengths({ stats, text, palette }) {
  const L = text.lengths;
  const F = text.fmt;
  const s = stats.value || null;
  const chart = useMemo(() => (s ? view.successChart(s, F.decimal) : null), [s, F]);
  const tip = useMemo(() => (s ? view.tips.success(s, text.tips) : null), [s, text]);
  if (!s) return <Pending text={text} result={stats} />;
  return (
    <>
      <Paras list={L.intro(s)} />
      <Figure wide title={L.chart} draw={hw.drawLineChart} data={chart} palette={palette} tip={tip} legend={[{ label: L.legend[0] }, { label: L.legend[1], dashed: true }]} />
      <p className="hw1-table-title"><strong>{L.tableTitle}</strong></p>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-compact hw2a-lengths">
          <thead>
            <tr><th>{L.cols.length}</th><th>{L.cols.trials}</th><th>{L.cols.rate}</th><th>{L.cols.interval}</th><th>{L.cols.bound}</th></tr>
          </thead>
          <tbody>
            {view.lengthRows(s).map((r) => (
              <tr key={r.length}>
                <td>{r.length}</td>
                <td>{F.int(r.trials)}</td>
                <td>{F.pct(r.rates.unigram)}</td>
                <td>{F.pct(r.interval[0])} - {F.pct(r.interval[1])}</td>
                <td>{F.pct(r.bound)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paras list={L.explain(s)} />
    </>
  );
});

const Methods = React.memo(function Methods({ stats, text, palette }) {
  const M = text.methods;
  const F = text.fmt;
  const s = stats.value || null;
  const chart = useMemo(() => (s ? view.methodsChart(s, F.decimal) : null), [s, F]);
  const tip = useMemo(() => (s ? view.tips.methods(s, text.tips) : null), [s, text]);
  return (
    <>
      <Paras list={M.intro} />
      <ul className="hw2-roles">
        {M.list.map((item) => (
          <li key={item.method}><strong>{text.methodNames[item.method]}</strong>: {item.text}</li>
        ))}
      </ul>
      {!s ? (
        <Pending text={text} result={stats} />
      ) : (
        <>
          <Figure wide title={M.chart} draw={hw.drawLineChart} data={chart} palette={palette} tip={tip} legend={hw.METHODS.map((m) => ({ label: text.methodNames[m] }))} />
          <p className="hw1-table-title"><strong>{M.tableTitle}</strong></p>
          <table className="hw1-table hw1-discussion-table hw2a-thresholds">
            <thead>
              <tr><th>{M.cols.method}</th>{M.cols.levels.map((l) => <th key={l}>{l}</th>)}</tr>
            </thead>
            <tbody>
              {view.thresholds(s).map((row) => (
                <tr key={row.method}>
                  <th>{text.methodNames[row.method]}</th>
                  {row.levels.map((v, i) => <td key={i} data-label={M.cols.levels[i]}>{v === null ? M.never : v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <Paras list={M.explain(s)} />
        </>
      )}
    </>
  );
});

// --- 4. Gli attacchi ---------------------------------------------------------------

const Exhaustive = ({ result, keyValue, text }) => {
  const X = text.exhaustive;
  if (!result.value) return <Pending text={text} result={result} />;
  const r = view.exhaustiveSummary(result.value, keyValue);
  return r.found ? <Check ok>{X.found(r)}</Check> : <p>{X.notFound(r, keyValue)}</p>;
};

const Bsgs = ({ result, recovered, text }) => {
  const B = text.bsgs;
  if (!result.value) return <Pending text={text} result={result} />;
  const r = view.bsgsSummary(result.value);
  return (
    <>
      <Check ok={r.found}>{B.result(r)}</Check>
      {recovered && (
        <>
          <Value label={B.decryptedLabel}>{recovered.text ?? ''}</Value>
          <Check ok={recovered.ok}>{B.check(recovered.ok)}</Check>
        </>
      )}
    </>
  );
};

const Kangaroo = ({ result, text }) => {
  if (!result.value) return <Pending text={text} result={result} />;
  return <Check ok={result.value.found}>{text.kangaroo.result(result.value)}</Check>;
};

const Scaling = React.memo(function Scaling({ result, text, palette }) {
  const C = text.scaling;
  const F = text.fmt;
  const sc = result.value || null;
  const chart = useMemo(() => (sc ? view.scalingChart(sc, F.decimal) : null), [sc, F]);
  const tip = useMemo(() => (sc ? view.tips.scaling(sc, text.tips) : null), [sc, text]);
  if (!sc) return <Pending text={text} result={result} />;
  return (
    <>
      <Paras list={C.intro(sc)} />
      <Figure
        wide
        title={C.chart}
        draw={hw.drawLineChart}
        data={chart}
        palette={palette}
        tip={tip}
        legend={C.legend.map((label, i) => ({ label, color: i }))}
      />
      <p className="hw1-table-title"><strong>{C.fitsTitle}</strong></p>
      <table className="hw1-table hw1-discussion-table hw2a-fits">
        <thead>
          <tr><th>{C.fitCols.method}</th><th>{C.fitCols.slope}</th><th>{C.fitCols.theory}</th><th>{C.fitCols.constant}</th></tr>
        </thead>
        <tbody>
          {view.ATTACKS.map((m) => (
            <tr key={m}>
              <th>{text.attackNames[m]}</th>
              <td data-label={C.fitCols.slope}>{F.num(sc.fits[m].slope, 3)} ± {F.num(sc.fits[m].slopeError, 3)}</td>
              <td data-label={C.fitCols.theory}>{F.num(sc.fits[m].exponent, 1)}</td>
              <td data-label={C.fitCols.constant}>{F.num(sc.fits[m].constant, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hw1-table-title"><strong>{C.extrapolationTitle}</strong></p>
      <table className="hw1-table hw1-discussion-table hw2a-extrapolation">
        <thead>
          <tr>{['bits', 'exhaustive', 'best', 'here', 'fast', 'memory'].map((k) => <th key={k}>{C.extrapolationCols[k]}</th>)}</tr>
        </thead>
        <tbody>
          {view.extrapolationRows(sc).map((r) => (
            <tr key={r.bits}>
              <th>{r.bits}</th>
              <td data-label={C.extrapolationCols.exhaustive}>{F.pow2(r.log2.exhaustive)}</td>
              <td data-label={C.extrapolationCols.best}>{F.pow2(r.best)}</td>
              <td data-label={C.extrapolationCols.here}>{F.duration(r.here)}</td>
              <td data-label={C.extrapolationCols.fast}>{F.duration(r.fast)}</td>
              <td data-label={C.extrapolationCols.memory}>{C.memory(r.memory)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paras list={C.explain(sc)} />
    </>
  );
});

const Differences = React.memo(function Differences({ text }) {
  const D = text.differences;
  return (
    <>
      <p>{D.intro}</p>
      <table className="hw1-table hw1-discussion-table hw2a-differences">
        <thead>
          <tr>{D.cols.map((c, i) => <th key={i}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {D.rows.map((row) => (
            <tr key={row[0]}>
              <th>{row[0]}</th>
              <td data-label={D.cols[1]}>{row[1]}</td>
              <td data-label={D.cols[2]}>{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paras list={D.after} />
    </>
  );
});

const Weaknesses = React.memo(function Weaknesses({ reuse, augustus, message, text }) {
  const W = text.weaknesses;
  const best = reuse.attack && reuse.attack.candidates.length ? reuse.attack.candidates[0] : null;
  return (
    <>
      <p>{W.intro}</p>
      <table className="hw1-table hw1-discussion-table hw2a-weaknesses">
        <thead>
          <tr><th>{W.cols.weakness}</th><th>{W.cols.origin}</th><th>{W.cols.attack}</th><th>{W.cols.fix}</th></tr>
        </thead>
        <tbody>
          {W.rows.map((row) => (
            <tr key={row[0]}>
              <th>{row[0]}</th>
              <td data-label={W.cols.origin}>{row[1]}</td>
              <td data-label={W.cols.attack}>{row[2]}</td>
              <td data-label={W.cols.fix}>{row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hw1-table-title"><strong>{W.reuseTitle}</strong></p>
      <Stale>{text.scheme.stale}</Stale>
      <Paras list={W.reuse(reuse)} />
      {best && (
        <>
          <Value label={W.reuseResult}>{best.text}</Value>
          <Check ok={best.text === message}>{W.reuseCheck(best.text === message)}</Check>
        </>
      )}
      <p className="hw1-table-title"><strong>{W.augustusTitle}</strong></p>
      <p>{W.augustus}</p>
      {augustus.ok ? <Value label="">{augustus.text ?? ''}</Value> : <p className="hw1-note">{W.augustusFail}</p>}
      <p>{W.augustusAfter}</p>
      <Paras list={W.after} />
    </>
  );
});

// --- 5, 6 e 7 ------------------------------------------------------------------------

const TestsSummary = React.memo(function TestsSummary({ stats, text }) {
  const T = text.tests;
  const F = text.fmt;
  const s = stats.value || null;
  const summary = useMemo(() => (s ? view.testSummary(s) : null), [s]);
  return (
    <section className="hw1-section hw2 hw2a hw2-far">
      <Title id="hw2a-tests" level={0}>{text.sections.tests}</Title>
      <p>{T.intro}</p>
      {!s ? (
        <Pending text={text} result={stats} />
      ) : (
        <>
          <p>{T.keysIntro(s)}</p>
          <Tests group="keys" s={s} text={text} />
          <table className="hw1-table hw1-discussion-table hw2-summary hw2a-summary">
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
    <section className="hw1-section hw2 hw2a hw2-far">
      <Title id="hw2a-history" level={0}>{text.sections.history}</Title>
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

const Conclusion = React.memo(function Conclusion({ stats, text }) {
  return (
    <section className="hw1-section hw2 hw2a hw2-far">
      <Title id="hw2a-conclusion" level={0}>{text.sections.conclusion}</Title>
      <Paras list={text.conclusion(stats.value || null)} />
    </section>
  );
});

// --- La pagina --------------------------------------------------------------------

const Homework2a = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const text = HW2A_TEXTS[language] || HW2A_TEXTS.it;
  const palette = PALETTES[theme === 'dark' ? 'dark' : 'light'];
  const S = text.sections;
  const I = text.input;
  const C = text.caesarCipher;

  // --- 1.1 i campi, e l'ultimo valore valido di ognuno ---
  const [fields, setFields] = useState(view.DEFAULT_INPUTS);
  const [applied, setApplied] = useState({ key: hw.DEFAULT_KEY, message: hw.DEFAULT_MESSAGE, shift: hw.DEFAULT_SHIFT });
  // round cambia a ogni scelta sui nonce e ricrea lo schema; draw conta le
  // estrazioni casuali, compresa quella che fa da sola una chiave nuova
  const [nonces, setNonces] = useState({ mode: 'seeded', round: 0, draw: 0 });
  const read = useMemo(() => view.readInputs(fields), [fields]);
  const change = (patch) => {
    const next = { ...fields, ...patch };
    setFields(next);
    const r = view.readInputs(next);
    if (r.key.ok && r.key.value !== applied.key) setNonces((n) => (n.mode === 'random' ? { ...n, draw: n.draw + 1 } : n));
    setApplied((prev) => {
      const key = r.key.ok ? r.key.value : prev.key;
      const message = r.message.ok ? r.message.value : prev.message;
      const shift = r.shift.ok ? r.shift.value : prev.shift;
      return key === prev.key && message === prev.message && shift === prev.shift ? prev : { key, message, shift };
    });
  };
  const restore = () => {
    // prima i nonce riproducibili, cosi' la chiave di partenza non conta come estrazione
    setNonces((n) => (n.mode === 'seeded' ? n : { ...n, mode: 'seeded', round: n.round + 1 }));
    change(view.DEFAULT_INPUTS);
  };
  const chooseNonces = (mode) => setNonces((n) => (n.mode === mode ? n : { mode, round: n.round + 1, draw: mode === 'random' ? n.draw + 1 : n.draw }));
  const reroll = () => setNonces((n) => ({ mode: 'random', round: n.round + 1, draw: n.draw + 1 }));

  // lo schema: ogni chiave e ogni estrazione di nonce ne crea uno nuovo, con le sue tabelle
  const scheme = useMemo(() => hw.toyScheme(applied.key, { nonces: nonces.mode }), [applied.key, nonces]);
  const encryption = useMemo(() => scheme.encrypt(applied.message), [scheme, applied.message]);
  const decryption = useMemo(() => scheme.decrypt(encryption.blocks), [scheme, encryption]);
  const publicKey = useMemo(() => hw.pointHex(scheme.K), [scheme]);
  const caesar = useMemo(() => view.caesarFacts(applied.message, applied.shift), [applied.message, applied.shift]);
  const size = useMemo(() => view.ciphertextSize(encryption.blocks), [encryption]);
  const cipherNow = useMemo(() => view.cipherSummary(encryption, decryption, nonces.mode, nonces.draw), [encryption, decryption, nonces.mode, nonces.draw]);

  // i calcoli lunghi, nei worker
  const verify = useJob('verify');
  const stats = useJob('explore');
  const scaling = useJob('scaling');
  const attackKey = useSettled(publicKey);
  const settled = attackKey === publicKey;
  const exhaustive = useJob('exhaustive', settled ? attackKey : undefined);
  const bsgs = useJob('bsgs', settled ? attackKey : undefined);
  const kangaroo = useJob('kangaroo', settled ? attackKey : undefined);

  // l'attacco statistico dal vivo, con i modelli scelti dall'esplorazione
  const s = stats.value || null;
  const models = useMemo(() => (s ? hw.languageModels(s.models.betas) : null), [s]);
  const crack = useMemo(() => (models ? hw.crackCaesar(caesar.cipher, models) : null), [models, caesar.cipher]);
  const recovered = useMemo(
    () => (bsgs.value && bsgs.value.found ? hw.toyScheme(BigInt(bsgs.value.key)).decrypt(encryption.blocks) : null),
    [bsgs.value, encryption],
  );
  const reuse = useMemo(() => view.reuseDemo(applied.key, applied.message), [applied.key, applied.message]);
  const augustus = useMemo(() => view.augustusDemo(scheme, encryption.blocks), [scheme, encryption]);

  const schemeStale = !read.key.ok || !read.message.ok;
  const caesarStale = !read.shift.ok || !read.message.ok;
  const badge = view.inputBadge(fields, nonces.mode, I);

  let keyError = null;
  if (!read.key.ok) keyError = read.key.error === 'notInteger' ? I.keyError.notInteger(read.key.text) : I.keyError[read.key.error];
  let messageError = null;
  if (!read.message.ok) messageError = read.message.error === 'tooLong' ? I.messageError.tooLong(read.message.bytes) : I.messageError.empty;
  let shiftError = null;
  if (!read.shift.ok) shiftError = read.shift.error === 'notInteger' ? C.shiftError.notInteger(read.shift.text) : C.shiftError[read.shift.error];

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
            <a href={`${DOWNLOADS}homework2a.zip`} download="homework2a.zip" className="button icon solid fa-download">{text.download.zip}</a>
            <a href={`${DOWNLOADS}homework2a/index.html?lang=${language === 'en' ? 'en' : 'it'}`} target="_blank" rel="noopener noreferrer" className="button alt icon solid fa-external-link-alt">{text.download.online}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <HomeworkShell slug="homework-2a" sidebar={sidebar} toc={toc}>
      <Assignment text={text} />

      {/* 1. TASK: lo schema giocattolo */}
      <section className={schemeStale ? 'hw1-section hw2 hw2a is-stale' : 'hw1-section hw2 hw2a'}>
        <Title id="hw2a-scheme" level={0}>{S.scheme}</Title>
        <Paras list={text.scheme.intro} />
        <Formulas title={text.scheme.formulasTitle}>{text.scheme.formulas}</Formulas>

        <Title id="hw2a-input" level={1}>{S.input}</Title>
        <p>{I.intro}</p>
        <div className="hw2-fields">
          <div className="hw1-controls">
            <label className="hw2a-key">
              {I.keyLabel}
              <input
                type="text"
                inputMode="numeric"
                {...PRIVATE_FIELD}
                maxLength={view.KEY_MAX_LENGTH}
                value={fields.keyText}
                onChange={(e) => change({ keyText: e.target.value.slice(0, view.KEY_MAX_LENGTH) })}
                aria-invalid={!read.key.ok}
                aria-describedby="hw2a-key-help"
              />
            </label>
            <span className="hw1-buttons">
              <button type="button" className="button alt" onClick={() => change({ keyText: hw.randomPrivateKey().toString() })}>{I.randomKey}</button>
            </span>
          </div>
          <p id="hw2a-key-help" className={keyError ? 'hw1-field-error' : 'hw1-note'} role={keyError ? 'alert' : undefined}>{keyError || I.keyHint}</p>
          <label className="hw2-mnemonic hw2a-message">
            {I.messageLabel}
            <textarea
              rows={3}
              {...PRIVATE_FIELD}
              maxLength={view.MESSAGE_MAX_LENGTH}
              value={fields.message}
              onChange={(e) => change({ message: e.target.value.slice(0, view.MESSAGE_MAX_LENGTH) })}
              aria-invalid={!read.message.ok}
              aria-describedby="hw2a-message-help"
            />
          </label>
          <p id="hw2a-message-help" className={messageError ? 'hw1-field-error' : 'hw1-note'} role={messageError ? 'alert' : undefined}>
            {messageError || I.messageHint(read.message.bytes)}
          </p>
          <div className="hw2a-nonces" role="group" aria-label={I.noncesLabel}>
            <span className="hw2a-nonces-label">{I.noncesLabel}</span>
            {['seeded', 'random'].map((mode) => (
              <button key={mode} type="button" className="button alt" aria-pressed={nonces.mode === mode} onClick={() => chooseNonces(mode)}>{I.nonces[mode]}</button>
            ))}
            {nonces.mode === 'random' && <button type="button" className="button alt" onClick={reroll}>{I.reroll}</button>}
          </div>
          {/* il cifrato di adesso accanto ai pulsanti, perche' la tabella e' in 1.3,
              piu' in basso: a ogni scelta sui nonce la riga si illumina per un attimo */}
          <p className="hw2a-cipher-now">
            <span key={`${nonces.round}:${nonces.draw}`} className={nonces.round + nonces.draw > 0 ? 'hw2a-flash' : undefined}>{I.cipherNow(cipherNow)}</span>
          </p>
          <p className="hw1-note">{I.noncesHint}</p>
        </div>
        {(schemeStale || caesarStale) && <p className="hw2-stale" role="status">{I.stale}</p>}
        <p className={badge.known ? 'hw1-badge-line is-task' : 'hw1-badge-line is-custom'}>
          <span>{badge.text}</span>
          {badge.restore && <button type="button" className="button alt hw1-restore" onClick={restore}>{I.restore}</button>}
        </p>

        <Title id="hw2a-keys" level={1}>{S.keys}</Title>
        <Keys scheme={scheme} text={text} />

        <Title id="hw2a-encrypt" level={1}>{S.encrypt}</Title>
        <Encryption encryption={encryption} text={text} />

        <Title id="hw2a-decrypt" level={1}>{S.decrypt}</Title>
        <Decryption encryption={encryption} decryption={decryption} text={text} />

        <Title id="hw2a-roles" level={1}>{S.roles}</Title>
        <Roles text={text} />

        <Title id="hw2a-verify" level={1}>{S.verify}</Title>
        <p>{text.verify.intro}</p>
        <Verify result={verify} text={text} />
      </section>

      {/* 2. Il cifrario di Cesare */}
      <section className={caesarStale ? 'hw1-section hw2 hw2a is-stale' : 'hw1-section hw2 hw2a'}>
        <Title id="hw2a-caesar" level={0}>{S.caesar}</Title>
        <Paras list={text.caesar.intro} />

        <Title id="hw2a-caesar-cipher" level={1}>{S.caesarCipher}</Title>
        <Paras list={C.intro} />
        <div className="hw1-controls">
          <label className="hw2a-shift">
            {C.shiftLabel}
            <input
              type="text"
              inputMode="numeric"
              {...PRIVATE_FIELD}
              maxLength={view.SHIFT_MAX_LENGTH}
              value={fields.shiftText}
              onChange={(e) => change({ shiftText: e.target.value.slice(0, view.SHIFT_MAX_LENGTH) })}
              aria-invalid={!read.shift.ok}
              aria-describedby="hw2a-shift-help"
            />
          </label>
        </div>
        <p id="hw2a-shift-help" className={shiftError ? 'hw1-field-error' : 'hw1-note'} role={shiftError ? 'alert' : undefined}>{shiftError || C.shiftHint}</p>
        <Substitution shift={applied.shift} text={text} />
        <Stale>{C.stale}</Stale>
        <Value label={C.cipherLabel}>{caesar.cipher}</Value>
        <Value label={C.decryptedLabel}>{caesar.decrypted}</Value>
        <Check ok={caesar.ok}>{C.check(caesar.ok)}</Check>
        <p>{C.top(caesar)}</p>

        <Title id="hw2a-compare" level={1}>{S.compare}</Title>
        <Compare size={size} text={text} />

        <Title id="hw2a-properties" level={1}>{S.properties}</Title>
        <Properties message={applied.message} shift={applied.shift} cipher={caesar.cipher} stats={stats} text={text} palette={palette} />
      </section>

      {/* 3. Crittanalisi statistica */}
      <section className={caesarStale ? 'hw1-section hw2 hw2a is-stale' : 'hw1-section hw2 hw2a'}>
        <Title id="hw2a-cryptanalysis" level={0}>{S.cryptanalysis}</Title>
        <Paras list={text.cryptanalysis.intro} />

        <Title id="hw2a-corpus" level={1}>{S.corpus}</Title>
        <Corpus stats={stats} text={text} palette={palette} />

        <Title id="hw2a-algorithm" level={1}>{S.algorithm}</Title>
        <Algorithm crack={crack} models={models} shift={applied.shift} stats={stats} text={text} palette={palette} />

        <Title id="hw2a-lengths" level={1}>{S.lengths}</Title>
        <Lengths stats={stats} text={text} palette={palette} />

        <Title id="hw2a-methods" level={1}>{S.methods}</Title>
        <Methods stats={stats} text={text} palette={palette} />

        <Title id="hw2a-limits" level={1}>{S.limits}</Title>
        <Paras list={text.limits.paras} />
      </section>

      {/* 4. L'attacco allo schema giocattolo */}
      <section className={schemeStale ? 'hw1-section hw2 hw2a is-stale' : 'hw1-section hw2 hw2a'}>
        <Title id="hw2a-attack" level={0}>{S.attack}</Title>
        <Paras list={text.attack.intro} />

        <Title id="hw2a-exhaustive" level={1}>{S.exhaustive}</Title>
        <Paras list={text.exhaustive.intro} />
        <Exhaustive result={settled ? exhaustive : { pending: true }} keyValue={applied.key} text={text} />
        <Paras list={text.exhaustive.after} />

        <Title id="hw2a-bsgs" level={1}>{S.bsgs}</Title>
        <Paras list={text.bsgs.intro} />
        <Formulas>{text.bsgs.formula}</Formulas>
        <Bsgs result={settled ? bsgs : { pending: true }} recovered={settled ? recovered : null} text={text} />
        <Paras list={text.bsgs.after} />

        <Title id="hw2a-kangaroo" level={1}>{S.kangaroo}</Title>
        <Paras list={text.kangaroo.intro} />
        <Kangaroo result={settled ? kangaroo : { pending: true }} text={text} />
        <Paras list={text.kangaroo.after} />

        <Title id="hw2a-scaling" level={1}>{S.scaling}</Title>
        <Scaling result={scaling} text={text} palette={palette} />

        <Title id="hw2a-differences" level={1}>{S.differences}</Title>
        <Differences text={text} />

        <Title id="hw2a-real" level={1}>{S.real}</Title>
        <Paras list={text.real.paras} />

        <Title id="hw2a-weaknesses" level={1}>{S.weaknesses}</Title>
        <Weaknesses reuse={reuse} augustus={augustus} message={applied.message} text={text} />
      </section>

      <TestsSummary stats={stats} text={text} />

      <History text={text} />

      <Conclusion stats={stats} text={text} />
    </HomeworkShell>
  );
};

export default Homework2a;
