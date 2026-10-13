// src/pages/statistics/Homework2.jsx
// Homework #2 di Statistics: dalla frase mnemonica all'indirizzo Ethereum.
// La pagina segue la consegna punto per punto: la pipeline (BIP-39, BIP-32,
// BIP-44, secp256k1, Keccak-256, EIP-55) con i valori calcolati dal vivo, le
// cinque categorie, le proprieta' statistiche, il contesto storico e la
// discussione.
//
// Qui c'e' solo la pagina React. La crittografia, le statistiche e i disegni
// stanno in hw2/homework2.js, i testi in hw2/texts.js e la logica di
// presentazione in hw2/view.js: sono gli stessi file da cui la build ricava
// il programma scaricabile (build/homework-standalone.js), cosi' la pagina e
// il download non possono raccontare due cose diverse.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/languageContext';
import { useTheme } from '../../contexts/themeContext';
import HomeworkShell from './HomeworkShell';
import { goToSection } from './goToSection';
import * as hw from './hw2/homework2';
import * as view from './hw2/view';
import { HW2_TEXTS, originalAssignment } from './hw2/texts';
import { useComputed } from './hw2/useComputed';

const DOWNLOADS = `${import.meta.env.BASE_URL}downloads/statistics/`;

const PALETTES = {
  light: hw.DEFAULT_PALETTE,
  dark: {
    background: '#111111',
    text: '#d6d6d6',
    grid: '#262626',
    bars: '#7986cb',
    reference: '#ff6b81',
    heatNegative: '#5b8def',
    heatZero: '#1e1e1e',
    heatPositive: '#ff6b81',
    heatNull: '#3a3a3a',
  },
};

const HEADINGS = ['h3', 'h4', 'h5'];
const hex = hw.toHex;

// I campi di testo non devono passare per correttori, completamenti o
// gestori di password: una frase mnemonica non deve uscire dal browser.
const PRIVATE_FIELD = {
  autoComplete: 'off',
  autoCorrect: 'off',
  autoCapitalize: 'none',
  spellCheck: false,
  'data-gramm': 'false',
  'data-lpignore': 'true',
};

const sameApplied = (a, b) => a.mnemonic === b.mnemonic && a.passphrase === b.passphrase && a.path === b.path;

// Un titolo di sezione: id per l'indice, tabIndex -1 perche' l'indice ci
// porti anche il focus della tastiera.
const Title = ({ id, level, children }) => {
  const Tag = HEADINGS[level];
  return <Tag id={id} tabIndex={-1} className="hw1-anchor">{children}</Tag>;
};

const Paras = ({ list }) => list.filter(Boolean).map((t, i) => <p key={i}>{t}</p>);

const Pending = ({ text }) => <p className="hw1-note hw1-pending" role="status">{text.ui.computing}</p>;

// La nota "valori dell'ultimo input valido" c'e' sempre, nascosta: la mostra
// il CSS quando la sezione della pipeline ha la classe is-stale. Cosi' un
// errore in un campo non ridisegna tutte le sezioni, ma cambia una classe.
const Stale = ({ text }) => <p className="hw2-stale hw2-stale-note">{text.pipeline.stale}</p>;

// Un valore esadecimale lungo: va a capo dove serve, e si copia intero
const Value = ({ label, children, className = '' }) => (
  <div className={`hw2-value ${className}`}>
    <span className="hw2-value-label">{label}</span>
    <code>{children}</code>
  </div>
);

// Un grafico su canvas (barre o mappa di calore), ridisegnato quando cambia
// la larghezza, con i valori del pezzo sotto il puntatore: il disegno vero
// e' in homework2.js. La larghezza arriva dal
// ResizeObserver, misurata dopo il layout; l'altezza e' fissata subito, il
// disegno avviene qualche millisecondo per fotogramma.
const Figure = ({ title, draw, data, palette, tip = null, wide = false }) => {
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
    // il riquadro con i valori della barra o della cella sotto il puntatore
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
      <figcaption>{title}</figcaption>
    </figure>
  );
};

// Un test d'ipotesi: l'ipotesi nulla, i numeri e l'esito
const TestRow = ({ label, test, text }) => {
  const rejected = test.verdict === 'reject';
  return (
    <div className={`hw1-test ${rejected ? 'is-invalid' : 'is-valid'}`}>
      <p className="hw1-test-head">
        <strong>{label}</strong>{' '}
        <span className={`hw1-badge ${rejected ? 'is-invalid' : 'is-valid'}`}>{text.stats.verdict[rejected ? 'reject' : 'notReject']}</span>
      </p>
      <p>{text.stats.testLine(test)}</p>
    </div>
  );
};

const Tests = ({ section, s, text }) => (
  <div className="hw2-tests">
    {view.statTests(s)[section].map(([key, test]) => (
      <TestRow key={key} label={text.stats.labels[section][key]} test={test} text={text} />
    ))}
  </div>
);

// --- 1. La pipeline: il diagramma -------------------------------------------

const Flow = React.memo(function Flow({ pipeline, text }) {
  const P = text.pipeline;
  return (
    <figure className="hw2-flow">
      <figcaption>{P.flowTitle}</figcaption>
      <Stale text={text} />
      <ol>
        {view.flowNodes(pipeline).map((item) =>
          item.arrow ? (
            <li key={item.arrow} className="hw2-flow-arrow">
              <button type="button" onClick={() => goToSection(item.target)}>
                <span aria-hidden="true">↓</span> {P.arrows[item.arrow]}
              </button>
            </li>
          ) : (
            <li key={item.key} className="hw2-flow-node">
              <span>{P.nodes[item.key]}</span>
              <code>{item.value}</code>
            </li>
          ),
        )}
      </ol>
    </figure>
  );
});

// --- 1.2 BIP-39 ---------------------------------------------------------------

const Bip39 = ({ analysis, pipeline, text }) => {
  const B = text.bip39;
  const rows = view.wordRows(analysis);
  const groups = view.bitGroups(analysis);
  const hidden = analysis.count - rows.length;
  return (
    <>
      <Paras list={B.intro} />
      <p className="hw1-table-title"><strong>{B.wordsTitle}</strong></p>
      {rows.length > 0 && (
        <div className="hw1-scroll">
          <table className="hw1-table hw1-compact hw2-words">
            <thead>
              <tr><th>{B.cols.position}</th><th>{B.cols.word}</th><th>{B.cols.index}</th><th>{B.cols.bits}</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.position} className={r.index === null ? 'is-unknown' : ''}>
                  <td>{r.position}</td>
                  <td>{r.word}</td>
                  <td>{r.index === null ? '-' : r.index}</td>
                  <td>{r.bits === null ? B.notInList : r.bits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hidden > 0 && <p className="hw1-note">{B.moreWords(hidden)}</p>}
      {groups.length > 0 ? (
        <>
          <p className="hw1-table-title"><strong>{B.bitsTitle(analysis.bits.length - analysis.checksum.length, analysis.checksum.length)}</strong></p>
          <p className="hw2-bits">
            {groups.map((g, i) => (
              <span key={i} className="hw2-bit-group">
                {g.entropy}
                {g.checksum && <mark>{g.checksum}</mark>}
              </span>
            ))}
          </p>
          <Value label={B.entropyLabel(analysis.entropy.length * 8)}>{hex(analysis.entropy)}</Value>
          <Value label={B.hashLabel}>{view.entropyHash(analysis)}</Value>
          <p className={analysis.valid ? 'hw2-check is-ok' : 'hw2-check is-bad'}>{analysis.valid ? B.checksumOk(analysis) : B.checksumBad(analysis)}</p>
        </>
      ) : (
        <p className="hw1-note">{B.noBits}</p>
      )}
      <p className="hw1-table-title"><strong>{B.seedTitle}</strong></p>
      <pre className="hw1-formulas">{B.seedFormula}</pre>
      <Stale text={text} />
      <Value label={B.seedLabel(pipeline.passphrase !== '')}>{hex(pipeline.seed)}</Value>
      <Paras list={B.after} />
    </>
  );
};

// --- 1.3 BIP-32 ---------------------------------------------------------------

const Bip32 = React.memo(function Bip32({ pipeline, text }) {
  const B = text.bip32;
  const rows = useMemo(() => view.levelRows(pipeline), [pipeline]);
  const leak = useMemo(() => view.leakDemo(pipeline), [pipeline]);
  const parent = view.parentPath(pipeline);
  return (
    <>
      <Paras list={B.intro} />
      <p className="hw1-table-title"><strong>{B.levelsTitle}</strong></p>
      <Stale text={text} />
      <table className="hw1-table hw1-discussion-table hw2-levels">
        <thead>
          <tr><th>{B.cols.path}</th><th>{B.cols.kind}</th><th>{B.cols.data}</th><th>{B.cols.key}</th><th>{B.cols.chain}</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.path}>
              <th data-label={B.cols.path}><code>{r.path}</code></th>
              <td data-label={B.cols.kind}>{B.kinds[r.kind]}</td>
              <td data-label={B.cols.data}><code>{view.shortHex(r.data, 6)}</code></td>
              <td data-label={B.cols.key}><code>{view.shortHex(r.key, 6)}</code></td>
              <td data-label={B.cols.chain}><code>{view.shortHex(r.chainCode, 6)}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hw1-table-title"><strong>{B.extendedTitle}</strong></p>
      <Value label={B.xprv(pipeline.path)}>{pipeline.extended.xprv}</Value>
      <Value label={B.xpub(pipeline.path)}>{pipeline.extended.xpub}</Value>
      {parent && <Value label={B.parentXpub(parent)}>{pipeline.extended.parentXpub}</Value>}
      <p className="hw1-note">{B.extendedNote}</p>
      <p className="hw1-table-title"><strong>{B.leakTitle}</strong></p>
      {leak.applicable ? <Paras list={B.leak(leak)} /> : <p>{leak.reason === 'master' ? B.leakMaster : B.leakHardened}</p>}
    </>
  );
});

// --- 1.4 BIP-44 ---------------------------------------------------------------

const Bip44 = React.memo(function Bip44({ pipeline, comparison, text }) {
  const B = text.bip44;
  const levels = view.bip44Levels(pipeline.levels);
  return (
    <>
      <p>{B.intro}</p>
      <p className="hw1-table-title"><strong>{B.levelsTitle(pipeline.path)}</strong></p>
      <Stale text={text} />
      {levels.standard ? (
        <ul className="hw2-roles">
          {levels.rows.map((r) => (
            <li key={r.role}><code>{r.label}</code> {B.roles[r.role](r.value)}</li>
          ))}
        </ul>
      ) : (
        <p>{B.notStandard(pipeline.path)}</p>
      )}
      <p className="hw1-table-title"><strong>{B.compareTitle}</strong></p>
      <p>{B.compareIntro(view.COMPARISON_ACCOUNTS)}</p>
      <table className="hw1-table hw1-discussion-table hw2-compare">
        <thead>
          <tr><th>{B.cols.wallet}</th><th>{B.cols.path}</th><th>{B.cols.address}</th></tr>
        </thead>
        <tbody>
          {comparison.map((r) => {
            const known = view.testAccount(r.address);
            const current = r.path === pipeline.path;
            return (
              <tr key={`${r.preset}|${r.index}`} className={current ? 'is-current' : ''}>
                <th data-label={B.cols.wallet}>{B.presetNames[r.preset]}</th>
                <td data-label={B.cols.path}><code>{r.path}</code></td>
                <td data-label={B.cols.address}>
                  <code>{r.address}</code>
                  {known && <span className="hw1-note"> ({B.testMark} {known.index + 1})</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Paras list={B.after} />
    </>
  );
});

// --- 1.5 secp256k1 ------------------------------------------------------------

const Secp = React.memo(function Secp({ pipeline, text }) {
  const C = text.secp;
  const params = useMemo(() => view.curveParameters(), []);
  const checks = useMemo(() => view.curveChecks(pipeline), [pipeline]);
  return (
    <>
      <Paras list={C.intro} />
      <details className="hw2-details">
        <summary>{C.constantsTitle}</summary>
        {['p', 'n', 'Gx', 'Gy'].map((key) => <Value key={key} label={C.constants[key]}>{params[key]}</Value>)}
      </details>
      <p className="hw1-table-title"><strong>{C.keyTitle}</strong></p>
      <Stale text={text} />
      <Value label={C.keyLabel}>{hex(pipeline.privateKey)}</Value>
      <p className={checks.keyInRange ? 'hw2-check is-ok' : 'hw2-check is-bad'}>{C.keyCheck(checks.keyInRange)}</p>
      <Value label={C.xLabel}>{checks.x}</Value>
      <Value label={C.yLabel}>{checks.y}</Value>
      <p className={checks.onCurve ? 'hw2-check is-ok' : 'hw2-check is-bad'}>{C.onCurve(checks.onCurve)}</p>
      <p className="hw1-table-title"><strong>{C.encodingsTitle}</strong></p>
      <Value label={C.uncompressed}>{hex(pipeline.publicKey.uncompressed)}</Value>
      <Value label={C.compressed(checks.even)}>{hex(pipeline.publicKey.compressed)}</Value>
      <Value label={C.ethereumForm}>{hex(pipeline.address.xy)}</Value>
      <p className={checks.decodes ? 'hw2-check is-ok' : 'hw2-check is-bad'}>{C.decompress(checks.decodes)}</p>
      <Paras list={C.after} />
    </>
  );
});

// --- 1.6 Keccak-256 -----------------------------------------------------------

const Keccak = React.memo(function Keccak({ pipeline, text }) {
  const K = text.keccak;
  const parts = useMemo(() => view.hashParts(pipeline), [pipeline]);
  return (
    <>
      <p>{K.intro}</p>
      <Stale text={text} />
      <Value label={K.inputLabel}>{hex(pipeline.address.xy)}</Value>
      <Value label={K.hashLabel}>
        <span className="hw2-dropped">{parts.dropped}</span>
        <mark>{parts.kept}</mark>
      </Value>
      <Value label={K.addressLabel}>{pipeline.address.address}</Value>
      <Value label={K.sha3Label} className="is-muted">{parts.sha3}</Value>
      <Paras list={K.after} />
    </>
  );
});

// --- 1.7 EIP-55 ---------------------------------------------------------------

const AddressChecker = ({ reference, text }) => {
  const E = text.eip55;
  const [typed, setTyped] = useState(reference);
  const result = view.checkTypedAddress(typed, reference);
  let message;
  let ok = false;
  if (result.status === 'format') message = E.check.format;
  else if (result.status === 'valid') {
    message = E.check.valid(result.same);
    ok = result.same;
  } else if (result.status === 'noChecksum') message = E.check.noChecksum(result.same);
  else message = E.check.invalid(result.same, result.positions);
  return (
    <>
      <div className="hw1-controls hw2-checker">
        <label>
          {E.checkerLabel}
          <input
            type="text"
            {...PRIVATE_FIELD}
            maxLength={view.ADDRESS_MAX_LENGTH}
            value={typed}
            onChange={(e) => setTyped(e.target.value.slice(0, view.ADDRESS_MAX_LENGTH))}
            aria-describedby="hw2-checker-result"
          />
        </label>
      </div>
      <p className="hw1-note">{E.checkerHint}</p>
      <p id="hw2-checker-result" className={ok ? 'hw2-check is-ok' : result.status === 'invalid' || result.status === 'format' ? 'hw2-check is-bad' : 'hw2-check'} aria-live="polite">
        {message}
      </p>
    </>
  );
};

const Eip55 = React.memo(function Eip55({ pipeline, text }) {
  const E = text.eip55;
  const c = pipeline.checksum;
  const letters = c.chars.filter((ch) => ch.letter).length;
  return (
    <>
      <Paras list={E.intro} />
      <p className="hw1-table-title"><strong>{E.gridTitle}</strong></p>
      <Stale text={text} />
      <div className="hw2-grid" role="img" aria-label={`${E.resultLabel}: ${c.address}`}>
        {c.chars.map((ch, i) => (
          <span key={i} className={ch.letter ? (ch.upper ? 'is-upper' : 'is-lower') : 'is-digit'}>
            <b>{ch.upper ? ch.char.toUpperCase() : ch.char}</b>
            <small>{c.hash[i]}</small>
          </span>
        ))}
      </div>
      <p className="hw1-note">{E.gridLegend}</p>
      <Value label={E.hashLabel}>{c.hash}</Value>
      <Value label={E.resultLabel}>{c.address}</Value>
      <p>{E.letters(letters)}</p>
      <p className="hw1-table-title"><strong>{E.checkerTitle}</strong></p>
      <AddressChecker key={c.address} reference={c.address} text={text} />
      <Paras list={E.after} />
    </>
  );
});

// --- 1.8 Vettori di test --------------------------------------------------------

const Vectors = React.memo(function Vectors({ result, text }) {
  const V = text.verify;
  if (!result.value) return result.error ? <p className="hw1-note">{text.ui.error(result.error)}</p> : <Pending text={text} />;
  const rows = result.value;
  const ok = rows.filter((r) => r.ok).length;
  return (
    <>
      <p className={ok === rows.length ? 'hw2-check is-ok' : 'hw2-check is-bad'}><strong>{V.summary(ok, rows.length)}</strong></p>
      <details className="hw2-details">
        <summary>{V.details(rows.length)}</summary>
        {view.vectorGroups(rows).map((g) => (
          <React.Fragment key={g.group}>
            <p className="hw1-table-title"><strong>{V.groups[g.group]}</strong></p>
            <table className="hw1-table hw1-discussion-table hw2-vectors">
              <thead>
                <tr><th>{V.cols.check}</th><th>{V.cols.expected}</th><th>{V.cols.result}</th></tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={`${r.check}|${r.subject}`}>
                    <th data-label={V.cols.check}>{V.label(r)}</th>
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

// --- 1.9 Wallet -----------------------------------------------------------------

const Wallets = React.memo(function Wallets({ result, text }) {
  const W = text.wallets;
  const rows = result.value || [];
  return (
    <>
      <p>{W.intro}</p>
      <ol className="hw2-steps">
        {W.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <p className="hw1-table-title"><strong>{W.tableTitle}</strong></p>
      <table className="hw1-table hw1-discussion-table hw2-accounts">
        <thead>
          <tr><th>{W.cols.account}</th><th>{W.cols.path}</th><th>{W.cols.address}</th><th>{W.cols.check}</th></tr>
        </thead>
        <tbody>
          {hw.TEST_ACCOUNTS.map((a) => {
            const path = hw.pathFor('bip44', a.index);
            const row = rows.find((r) => r.check === 'address' && r.subject === path);
            let mark = '...';
            if (row) mark = row.ok ? '✓' : '✗';
            return (
              <tr key={a.index}>
                <th data-label={W.cols.account}>{W.accountName(a.index)}</th>
                <td data-label={W.cols.path}><code>{path}</code></td>
                <td data-label={W.cols.address}><code>{a.address}</code></td>
                <td data-label={W.cols.check} className={row && !row.ok ? 'is-bad' : 'is-ok'}>{mark}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="hw1-note">{W.verified}</p>
    </>
  );
});

// --- 3. Statistiche -------------------------------------------------------------

const Statistics = React.memo(function Statistics({ result, text, palette }) {
  const s = result.value || null;
  const T = text.stats;
  const F = text.fmt;
  const charts = useMemo(() => (s ? view.chartData(s, { decimal: F.decimal, axes: T.axes }) : null), [s, F, T]);
  const tips = useMemo(() => (s ? view.chartTips(s, charts, T.tips) : null), [s, charts, T]);
  const summary = useMemo(() => (s ? view.testSummary(s) : null), [s]);
  const titles = view.STAT_SECTIONS.map(({ key, id, title }) => <Title key={key} id={id} level={1}>{text.sections[title]}</Title>);
  const summaryTitle = <Title id="hw2-stats-summary" level={1}>{text.sections.statsSummary}</Title>;
  if (!s) {
    // i titoli ci sono sempre, cosi' l'indice trova le sezioni anche durante il calcolo
    const status = result.error ? <p className="hw1-note">{text.ui.error(result.error)}</p> : <Pending text={text} />;
    return (
      <>
        {view.STAT_SECTIONS.map(({ key }, i) => <React.Fragment key={key}>{titles[i]}{status}</React.Fragment>)}
        {summaryTitle}
        {status}
      </>
    );
  }
  const smallest = summary.smallest;
  return (
    <>
      {titles[0]}
      <p>{T.bip39.intro}</p>
      <Figure wide title={T.bip39.wordsChart(s.bip39.words.test.N, s.samples.mnemonics)} draw={hw.drawBarChart} data={charts.words} palette={palette} tip={tips.words} />
      <div className="hw1-charts">
        <Figure title={T.bip39.nibbleChart(s.samples.mnemonics)} draw={hw.drawBarChart} data={charts.nibble} palette={palette} tip={tips.nibble} />
      </div>
      <Tests section="bip39" s={s} text={text} />
      <Paras list={T.bip39.explain(s)} />

      {titles[1]}
      <p>{T.seed.intro}</p>
      <div className="hw1-charts">
        <Figure title={T.seed.bitsChart(s.seed.bits.N)} draw={hw.drawBarChart} data={charts.seedBits} palette={palette} tip={tips.seedBits} />
        <Figure title={T.seed.distanceChart(s.seed.avalanche, charts.seedDistances)} draw={hw.drawBarChart} data={charts.seedDistances} palette={palette} tip={tips.seedDistances} />
      </div>
      <Tests section="seed" s={s} text={text} />
      <Paras list={T.seed.explain(s)} />

      {titles[2]}
      <p>{T.bip32.intro}</p>
      <div className="hw1-charts">
        <Figure title={T.bip32.bitsChart(s.bip32.bits.N)} draw={hw.drawBarChart} data={charts.keyBits} palette={palette} tip={tips.keyBits} />
        <Figure title={T.bip32.distanceChart(s.bip32.siblings, charts.siblings)} draw={hw.drawBarChart} data={charts.siblings} palette={palette} tip={tips.siblings} />
      </div>
      <Figure wide title={T.bip32.heatmap(s.bip32.correlation)} draw={hw.drawHeatmap} data={charts.correlation} palette={palette} tip={tips.correlation} />
      <Tests section="bip32" s={s} text={text} />
      <Paras list={T.bip32.explain(s)} />

      {titles[3]}
      <p>{T.secp.intro}</p>
      <div className="hw1-charts">
        <Figure title={T.secp.xChart(s.secp256k1.bitsX.N)} draw={hw.drawBarChart} data={charts.xBits} palette={palette} tip={tips.xBits} />
        <Figure title={T.secp.yChart(s.secp256k1.bitsY.N)} draw={hw.drawBarChart} data={charts.yBits} palette={palette} tip={tips.yBits} />
      </div>
      <Figure title={T.secp.distanceChart(s.secp256k1.avalanche, charts.pointDistances)} draw={hw.drawBarChart} data={charts.pointDistances} palette={palette} tip={tips.pointDistances} />
      <Tests section="secp256k1" s={s} text={text} />
      <p className="hw2-structure">{T.secp.homomorphism(s.secp256k1.homomorphism)}</p>
      <Paras list={T.secp.explain(s)} />

      {titles[4]}
      <p>{T.keccak.intro}</p>
      <div className="hw1-charts">
        <Figure title={T.keccak.bitsChart(s.keccak.addressBits.N)} draw={hw.drawBarChart} data={charts.addressBits} palette={palette} tip={tips.addressBits} />
        <Figure title={T.keccak.hexChart(s.keccak.firstHex.test.N)} draw={hw.drawBarChart} data={charts.firstHex} palette={palette} tip={tips.firstHex} />
      </div>
      <Figure title={T.keccak.distanceChart(s.keccak.avalanche, charts.keccakDistances)} draw={hw.drawBarChart} data={charts.keccakDistances} palette={palette} tip={tips.keccakDistances} />
      <Figure wide title={T.keccak.heatmap} draw={hw.drawHeatmap} data={charts.sac} palette={palette} tip={tips.sac} />
      <Tests section="keccak" s={s} text={text} />
      <Paras list={T.keccak.explain(s)} />

      {titles[5]}
      <p>{T.eip55.intro}</p>
      <Figure title={T.eip55.lettersChart(s.eip55.letters.test.N)} draw={hw.drawBarChart} data={charts.letters} palette={palette} tip={tips.letters} />
      <Tests section="eip55" s={s} text={text} />
      <Paras list={T.eip55.explain(s)} />

      {summaryTitle}
      <p>{T.summary.intro(summary, `${T.steps[smallest.section]}: ${T.labels[smallest.section][smallest.key]}`)}</p>
      <table className="hw1-table hw1-discussion-table hw2-summary">
        <thead>
          <tr><th>{T.summary.cols.step}</th><th>{T.summary.cols.hypothesis}</th><th>{T.summary.cols.p}</th><th>{T.summary.cols.verdict}</th></tr>
        </thead>
        <tbody>
          {summary.all.map((t) => {
            const rejected = t.result.verdict === 'reject';
            return (
              <tr key={`${t.section}|${t.key}`} className={rejected ? 'is-rejected' : ''}>
                <th data-label={T.summary.cols.step}>{T.steps[t.section]}</th>
                <td data-label={T.summary.cols.hypothesis}>{T.labels[t.section][t.key]}</td>
                <td data-label={T.summary.cols.p}>{F.pval(t.result.pValue)}</td>
                <td data-label={T.summary.cols.verdict}>{T.verdict[rejected ? 'reject' : 'notReject']}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="hw2-structure">{T.secp.homomorphism(s.secp256k1.homomorphism)}</p>
      <Paras list={T.summary.after} />
    </>
  );
});

// --- 0, 2, 4, 5: le sezioni di solo testo ---------------------------------------
// Memorizzate: scrivendo nei campi della sezione 1 non si ridisegnano.

const Assignment = React.memo(function Assignment({ text }) {
  const S = text.sections;
  return (
    <section className="hw1-section hw2">
      <Title id="hw2-assignment" level={0}>{S.assignment}</Title>
      <Paras list={text.assignment.intro} />
      <details className="hw1-original" open>
        <summary>{text.assignment.originalTitle}</summary>
        <p className="hw1-note">{text.assignment.originalNote}</p>
        <blockquote lang="en">
          {originalAssignment().map((block, i) => {
            if (block.type === 'title' || block.type === 'heading') return <p key={i}><strong>{block.text}</strong></p>;
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
  );
});

const Categories = React.memo(function Categories({ text }) {
  const S = text.sections;
  return (
    <section className="hw1-section hw2 hw2-far">
      <Title id="hw2-categories" level={0}>{S.categories}</Title>
      <p>{text.categories.intro}</p>
      <table className="hw1-table hw1-discussion-table hw2-categories">
        <thead>
          <tr>
            <th>{text.categories.cols.category}</th><th>{text.categories.cols.what}</th>
            <th>{text.categories.cols.where}</th><th>{text.categories.cols.properties}</th>
          </tr>
        </thead>
        <tbody>
          {text.categories.rows.map((row) => (
            <tr key={row.key}>
              <th data-label={text.categories.cols.category}>{row.name}</th>
              <td data-label={text.categories.cols.what}>{row.what}</td>
              <td data-label={text.categories.cols.where}>{row.where}</td>
              <td data-label={text.categories.cols.properties}>{row.properties}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paras list={text.categories.after} />
    </section>
  );
});

const History = React.memo(function History({ text, digests }) {
  const S = text.sections;
  const H = text.history;
  return (
    <section className="hw1-section hw2 hw2-far">
      <Title id="hw2-history" level={0}>{S.history}</Title>
      <Title id="hw2-timeline" level={1}>{S.timeline}</Title>
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

      <Title id="hw2-sha" level={1}>{S.sha}</Title>
      <p>{H.sha.intro}</p>
      <table className="hw1-table hw1-discussion-table hw2-sha">
        <thead>
          <tr>{H.sha.cols.map((c, i) => <th key={i}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {H.sha.rows.map((row) => (
            <tr key={row[0]}>
              <th>{row[0]}</th>
              {row.slice(1).map((cell, i) => <td key={i} data-label={H.sha.cols[i + 1]}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hw1-table-title"><strong>{H.sha.digestsTitle}</strong></p>
      <Value label={H.sha.digestLabel('Keccak-256')}>{digests.keccak}</Value>
      <Value label={H.sha.digestLabel('SHA3-256')}>{digests.sha3}</Value>
      <Paras list={H.sha.paras} />
    </section>
  );
});

const Discussion = React.memo(function Discussion({ text, summary }) {
  const S = text.sections;
  const D = text.discussion;
  return (
    <section className="hw1-section hw2 hw2-far">
      <Title id="hw2-discussion" level={0}>{S.discussion}</Title>

      <Title id="hw2-why" level={1}>{S.why}</Title>
      <p>{D.why.intro}</p>
      <table className="hw1-table hw1-discussion-table hw2-why">
        <thead>
          <tr><th>{D.why.cols.parts}</th><th>{D.why.cols.purpose}</th><th>{D.why.cols.instead}</th></tr>
        </thead>
        <tbody>
          {D.why.rows.map((row) => (
            <tr key={row.parts}>
              <th data-label={D.why.cols.parts}>{row.parts}</th>
              <td data-label={D.why.cols.purpose}>{row.purpose}</td>
              <td data-label={D.why.cols.instead}>{row.instead}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paras list={D.why.after} />

      <Title id="hw2-fit" level={1}>{S.fit}</Title>
      <Paras list={D.fit} />

      <Title id="hw2-conclusion" level={1}>{S.conclusion}</Title>
      <Paras list={D.conclusion(summary)} />
    </section>
  );
});

// --- La pagina --------------------------------------------------------------------

const Homework2 = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const text = HW2_TEXTS[language] || HW2_TEXTS.it;
  const palette = PALETTES[theme === 'dark' ? 'dark' : 'light'];
  const S = text.sections;
  const I = text.input;

  // --- 1.1 i campi, e l'ultimo input valido da cui si calcola la pipeline ---
  const [fields, setFields] = useState(view.DEFAULT_INPUTS);
  const [applied, setApplied] = useState(() => view.appliedInput(view.readInputs(view.DEFAULT_INPUTS)));
  const read = useMemo(() => view.readInputs(fields), [fields]);
  const change = (patch) => {
    const next = { ...fields, ...patch };
    setFields(next);
    const r = view.readInputs(next);
    if (r.valid) {
      const input = view.appliedInput(r);
      setApplied((prev) => (sameApplied(prev, input) ? prev : input));
    }
  };
  const restore = () => change(view.DEFAULT_INPUTS);
  // passando al percorso personalizzato, si parte da quello in uso
  const changePreset = (value) => {
    const preset = view.PRESETS.includes(value) ? value : 'bip44';
    change(preset === 'custom' && read.path.ok ? { preset, customPath: read.path.value } : { preset });
  };
  const generate = (words) => change({ mnemonic: hw.generateMnemonic(words) });

  // il seed (2048 iterazioni di PBKDF2) si ricalcola solo se cambiano frase o passphrase
  const analysis = useMemo(() => hw.analyzeMnemonic(applied.mnemonic), [applied.mnemonic]);
  const seed = useMemo(() => hw.mnemonicToSeed(applied.mnemonic, applied.passphrase), [applied.mnemonic, applied.passphrase]);
  const keys = useMemo(() => hw.keysFromSeed(seed, applied.path), [seed, applied.path]);
  const pipeline = useMemo(() => ({ ok: true, analysis, passphrase: applied.passphrase, ...keys }), [analysis, applied.passphrase, keys]);
  const comparison = useMemo(() => view.presetComparison(seed), [seed]);
  const stale = !read.valid;
  const badge = view.inputBadge(fields, I);

  const vectors = useComputed('vectors');
  const stats = useComputed('explore');
  const summary = useMemo(() => (stats.value ? view.testSummary(stats.value) : null), [stats.value]);
  const digests = useMemo(() => view.emptyDigests(), []);

  // il messaggio sotto il campo della frase: valida, o il primo controllo che fallisce
  const a = read.analysis;
  let mnemonicStatus;
  if (a.error === 'empty') mnemonicStatus = I.status.empty;
  else if (a.error === 'unknown-word') mnemonicStatus = I.status.unknown(a.unknown.map((u) => ({ ...u, suggestions: view.suggestWords(u.word) })));
  else if (a.error === 'length') mnemonicStatus = I.status.length(a.count);
  else if (a.error === 'checksum') mnemonicStatus = I.status.checksum(a);
  else mnemonicStatus = I.status.valid(a);

  let indexError = null;
  if (fields.preset !== 'custom' && !read.index.ok) {
    if (read.index.error === 'notInteger') indexError = I.indexError.notInteger(read.index.text);
    else if (read.index.error === 'range') indexError = I.indexError.range(view.INDEX_MAX);
    else indexError = I.indexError.empty;
  }
  const pathError = fields.preset === 'custom' && !read.path.ok ? I.pathError[read.path.error] : null;

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
            <a href={`${DOWNLOADS}homework2.zip`} download="homework2.zip" className="button icon solid fa-download">{text.download.zip}</a>
            <a href={`${DOWNLOADS}homework2/index.html?lang=${language === 'en' ? 'en' : 'it'}`} target="_blank" rel="noopener noreferrer" className="button alt icon solid fa-external-link-alt">{text.download.online}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <HomeworkShell slug="homework-2" sidebar={sidebar} toc={toc}>
      <Assignment text={text} />

      {/* 1. TASK: la pipeline */}
      <section className={stale ? 'hw1-section hw2 is-stale' : 'hw1-section hw2'}>
        <Title id="hw2-pipeline" level={0}>{S.pipeline}</Title>
        <Paras list={text.pipeline.intro} />
        <Flow pipeline={pipeline} text={text} />

        <Title id="hw2-input" level={1}>{S.input}</Title>
        <p>{I.intro}</p>
        <div className="hw2-fields">
          <label className="hw2-mnemonic">
            {I.mnemonicLabel}
            <textarea
              rows={3}
              {...PRIVATE_FIELD}
              maxLength={view.MNEMONIC_MAX_LENGTH}
              value={fields.mnemonic}
              onChange={(e) => change({ mnemonic: e.target.value.slice(0, view.MNEMONIC_MAX_LENGTH) })}
              aria-invalid={!a.valid}
              aria-describedby="hw2-mnemonic-status"
            />
          </label>
          <p id="hw2-mnemonic-status" className={a.valid ? 'hw2-check is-ok' : 'hw1-field-error'} role={a.valid ? undefined : 'alert'}>{mnemonicStatus}</p>
          <span className="hw1-buttons">
            <button type="button" className="button alt" onClick={() => change({ mnemonic: hw.TEST_MNEMONIC })}>{I.useTest}</button>
            <button type="button" className="button alt" onClick={() => generate(12)}>{I.random(12)}</button>
            <button type="button" className="button alt" onClick={() => generate(24)}>{I.random(24)}</button>
          </span>
          <p className="hw1-note">{I.randomNote}</p>
          <div className="hw1-controls">
            <label className="hw2-passphrase">
              {I.passphraseLabel}
              <input
                type="text"
                {...PRIVATE_FIELD}
                maxLength={view.PASSPHRASE_MAX_LENGTH}
                value={fields.passphrase}
                onChange={(e) => change({ passphrase: e.target.value.slice(0, view.PASSPHRASE_MAX_LENGTH) })}
                aria-describedby="hw2-passphrase-help"
              />
            </label>
          </div>
          <p id="hw2-passphrase-help" className="hw1-note">{I.passphraseHint}</p>
          <div className="hw1-controls">
            <label className="hw2-preset">
              {I.presetLabel}
              <select value={fields.preset} onChange={(e) => changePreset(e.target.value)}>
                {view.PRESETS.map((p) => <option key={p} value={p}>{I.presets[p]}</option>)}
              </select>
            </label>
            {fields.preset === 'custom' ? (
              <label className="hw2-path">
                {I.pathLabel}
                <input
                  type="text"
                  {...PRIVATE_FIELD}
                  maxLength={view.PATH_MAX_LENGTH}
                  value={fields.customPath}
                  onChange={(e) => change({ customPath: e.target.value.slice(0, view.PATH_MAX_LENGTH) })}
                  aria-invalid={!read.path.ok}
                  aria-describedby="hw2-path-help"
                />
              </label>
            ) : (
              <label className="hw2-index">
                {I.indexLabel}
                <input
                  type="text"
                  inputMode="numeric"
                  {...PRIVATE_FIELD}
                  maxLength={view.INDEX_MAX_LENGTH}
                  value={fields.indexText}
                  onChange={(e) => change({ indexText: e.target.value.slice(0, view.INDEX_MAX_LENGTH) })}
                  aria-invalid={!read.index.ok}
                  aria-describedby="hw2-path-help"
                />
              </label>
            )}
          </div>
          <p id="hw2-path-help" className={indexError || pathError ? 'hw1-field-error' : 'hw1-note'} role={indexError || pathError ? 'alert' : undefined}>
            {indexError || pathError || (fields.preset === 'custom' ? I.pathHint : I.indexHint(view.INDEX_MAX))}
          </p>
        </div>
        {stale && <p className="hw2-stale" role="status">{I.stale}</p>}
        <p className={badge.known ? 'hw1-badge-line is-task' : 'hw1-badge-line is-custom'}>
          <span>{badge.text}</span>
          {badge.restore && <button type="button" className="button alt hw1-restore" onClick={restore}>{I.restore}</button>}
        </p>

        <Title id="hw2-bip39" level={1}>{S.bip39}</Title>
        <Bip39 analysis={read.analysis} pipeline={pipeline} text={text} />

        <Title id="hw2-bip32" level={1}>{S.bip32}</Title>
        <Bip32 pipeline={pipeline} text={text} />

        <Title id="hw2-bip44" level={1}>{S.bip44}</Title>
        <Bip44 pipeline={pipeline} comparison={comparison} text={text} />

        <Title id="hw2-secp256k1" level={1}>{S.secp256k1}</Title>
        <Secp pipeline={pipeline} text={text} />

        <Title id="hw2-keccak" level={1}>{S.keccak}</Title>
        <Keccak pipeline={pipeline} text={text} />

        <Title id="hw2-eip55" level={1}>{S.eip55}</Title>
        <Eip55 pipeline={pipeline} text={text} />

        <Title id="hw2-verify" level={1}>{S.verify}</Title>
        <p>{text.verify.intro}</p>
        <Vectors result={vectors} text={text} />

        <Title id="hw2-wallets" level={1}>{S.wallets}</Title>
        <Wallets result={vectors} text={text} />
      </section>

      <Categories text={text} />

      {/* 3. Statistiche */}
      <section className="hw1-section hw2 hw2-far">
        <Title id="hw2-stats" level={0}>{S.stats}</Title>
        <Paras list={text.stats.intro} />
        <Statistics result={stats} text={text} palette={palette} />
      </section>

      <History text={text} digests={digests} />

      <Discussion text={text} summary={summary} />
    </HomeworkShell>
  );
};

export default Homework2;
