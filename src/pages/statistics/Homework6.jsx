// src/pages/statistics/Homework6.jsx
// Homework #6 di Statistics: lo scheletro pronto prima della consegna, con
// la struttura degli altri homework (la consegna, il compito, i test
// statistici, il contesto storico, le conclusioni) e gli strumenti gia' al
// lavoro: le verifiche del generatore e i calcoli nel worker. Quando arriva
// la consegna, le sue sezioni entrano qui nello stesso ordine del testo, e il
// riquadro "Scarica il codice" torna nella barra laterale (il programma
// scaricabile e' gia' in hw6/standalone, ma la build non lo pubblica ancora).
//
// Qui c'e' solo la pagina React. I calcoli, il generatore e i grafici sono in
// hw6/homework6.js, i testi (italiano e inglese) in hw6/texts.js, le sezioni
// e i parametri in hw6/view.js.
import React, { useMemo } from 'react';
import { useLanguage } from '../../contexts/languageContext';
import HomeworkShell from './HomeworkShell';
import * as hw from './hw6/homework6';
import * as view from './hw6/view';
import { HW6_TEXTS, originalAssignment } from './hw6/texts';
import { useExplore } from './hw6/useJob';

const HEADINGS = ['h3', 'h4', 'h5'];

// Un titolo di sezione: id per l'indice, tabIndex -1 perche' l'indice ci
// porti anche il focus della tastiera.
const Title = ({ id, level, children }) => {
  const Tag = HEADINGS[level];
  return <Tag id={id} tabIndex={-1} className="hw1-anchor">{children}</Tag>;
};

const Paras = ({ list }) => list.filter(Boolean).map((t, i) => <p key={i}>{t}</p>);

const Pending = ({ text, result }) => (result && result.error ? <p className="hw1-note">{text.ui.error(result.error)}</p> : <p className="hw1-note hw1-pending" role="status">{text.ui.computing}</p>);

const Check = ({ ok, children }) => <p className={ok ? 'hw2-check is-ok' : 'hw2-check is-bad'}>{children}</p>;

// --- 0. La consegna --------------------------------------------------------------

const Assignment = React.memo(function Assignment({ text }) {
  const blocks = originalAssignment();
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5">
      <Title id="hw6-assignment" level={0}>{text.sections.assignment}</Title>
      <Paras list={text.assignment.intro} />
      <details className="hw1-original" open>
        <summary>{text.assignment.originalTitle}</summary>
        {blocks.length === 0 ? (
          <p className="hw1-note">{text.assignment.missing}</p>
        ) : (
          <>
            <p className="hw1-note">{text.assignment.originalNote}</p>
            <blockquote lang="en">
              {blocks.map((block, i) => {
                if (block.type === 'title') return <p key={i}><strong>{block.text}</strong></p>;
                if (block.type === 'list') return <ul key={i}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
                if (block.type === 'link') return <p key={i}><a href={block.href} target="_blank" rel="noopener noreferrer">{block.text}</a></p>;
                return <p key={i}>{block.text}</p>;
              })}
            </blockquote>
          </>
        )}
      </details>
    </section>
  );
});

// --- 1.1 Verifiche --------------------------------------------------------------------

const Verify = React.memo(function Verify({ s, job, text }) {
  const V = text.checks;
  const rows = useMemo(() => hw.verifyAll(), []);
  const ok = rows.filter((r) => r.ok).length;
  return (
    <>
      <p>{V.intro}</p>
      <Check ok={ok === rows.length}><strong>{V.summary(ok, rows.length)}</strong></Check>
      <div className="hw1-scroll">
        <table className="hw1-table hw1-discussion-table">
          <thead>
            <tr><th>{V.cols.name}</th><th>{V.cols.expected}</th><th>{V.cols.actual}</th><th>{V.cols.ok}</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <th data-label={V.cols.name}>{r.name}</th>
                <td data-label={V.cols.expected}><code>{r.expected}</code></td>
                <td data-label={V.cols.actual}><code>{r.actual}</code></td>
                <td data-label={V.cols.ok}>{r.ok ? V.ok : V.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {s ? <p>{V.generator(s.generator, s.params.seed)}</p> : <Pending text={text} result={job} />}
    </>
  );
});

// --- 2. I test statistici ---------------------------------------------------------------

const TestsSummary = React.memo(function TestsSummary({ s, job, text }) {
  const T = text.tests;
  const g = s ? s.generator : null;
  return (
    <section className="hw1-section hw2 hw3 hw4 hw5">
      <Title id="hw6-tests" level={0}>{text.sections.tests}</Title>
      <p>{T.intro}</p>
      {!g ? (
        <Pending text={text} result={job} />
      ) : (
        <table className="hw1-table hw1-discussion-table hw2-summary">
          <thead>
            <tr><th>{T.cols.subject}</th><th>{T.cols.hypothesis}</th><th>{T.cols.p}</th><th>{T.cols.verdict}</th></tr>
          </thead>
          <tbody>
            <tr className={g.verdict === 'reject' ? 'is-rejected' : ''}>
              <th data-label={T.cols.subject}>{T.rows.generator.subject}</th>
              <td data-label={T.cols.hypothesis}>{T.rows.generator.hypothesis}</td>
              <td data-label={T.cols.p}>{T.line(g)}</td>
              <td data-label={T.cols.verdict}>{T.verdicts[g.verdict]}</td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );
});

// --- La pagina ---------------------------------------------------------------------------------

const Homework6 = () => {
  const { language } = useLanguage();
  const text = HW6_TEXTS[language] || HW6_TEXTS.en;
  const S = text.sections;
  // i calcoli della pagina, nel worker: per ora la prova del generatore
  const job = useExplore(view.paramsKey(view.DEFAULT_PARAMS));
  const s = job.value || null;
  const toc = useMemo(
    () => ({
      sections: view.tocEntries(S),
      labels: { button: text.ui.index, title: text.ui.indexTitle, close: text.ui.close },
    }),
    [S, text.ui],
  );

  return (
    <HomeworkShell slug="homework-6" toc={toc}>
      <Assignment text={text} />

      <section className="hw1-section hw2 hw3 hw4 hw5">
        <Title id="hw6-task" level={0}>{S.task}</Title>
        <Paras list={text.task.intro} />
        <Title id="hw6-checks" level={1}>{S.checks}</Title>
        <Verify s={s} job={job} text={text} />
      </section>

      <TestsSummary s={s} job={job} text={text} />

      <section className="hw1-section hw2 hw3 hw4 hw5">
        <Title id="hw6-history" level={0}>{S.history}</Title>
        <Paras list={text.history.intro} />
      </section>

      <section className="hw1-section hw2 hw3 hw4 hw5">
        <Title id="hw6-conclusion" level={0}>{S.conclusion}</Title>
        <Paras list={text.conclusion.paras} />
      </section>
    </HomeworkShell>
  );
};

export default Homework6;
