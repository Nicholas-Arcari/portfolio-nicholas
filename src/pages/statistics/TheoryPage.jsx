// src/pages/statistics/TheoryPage.jsx
// La pagina di teoria di un homework: la teoria che sta dietro all'esercizio,
// la scaletta per presentarlo alla cattedra e le domande probabili, con le
// risposte nascoste finche' non si aprono (cosi' ci si interroga da soli).
// Il contenuto, in italiano e in inglese, sta in theory/homeworkN.js; come
// gli homework, la pagina si apre in inglese.
import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { STATISTICS_HOMEWORK } from '../../config/homework';
import StatisticsLayout from './StatisticsLayout';
import HomeworkIndex from './HomeworkIndex';

const HEADINGS = ['h3', 'h4'];

// Un blocco del contenuto: un paragrafo (stringa), un elenco, dei passi
// numerati, delle formule, una tabella, la scaletta o le domande
function Block({ block, labels }) {
  if (typeof block === 'string') return <p>{block}</p>;
  if (block.list) return <ul className="th-list">{block.list.map((item, i) => <li key={i}>{item}</li>)}</ul>;
  if (block.steps) return <ol className="th-list">{block.steps.map((item, i) => <li key={i}>{item}</li>)}</ol>;
  if (block.formula) return <pre className="hw1-formulas">{block.formula}</pre>;
  if (block.note) return <p className="th-note">{block.note}</p>;
  if (block.table) {
    const { cols, rows } = block.table;
    return (
      <div className="hw1-scroll">
        <table className="hw1-table th-table">
          <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j} data-label={cols[j]}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.outline) {
    return (
      <ol className="th-outline">
        {block.outline.map((step, i) => (
          <li key={i}>
            <span className="th-time">{step.time}</span>
            <strong>{step.title}</strong>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (block.qa) {
    return (
      <div className="th-qa">
        {block.qa.map((item, i) => (
          <details key={i}>
            <summary>{item.q}</summary>
            <p><span className="th-answer-label">{labels.answer}</span> {item.a}</p>
          </details>
        ))}
      </div>
    );
  }
  return null;
}

const TheoryPage = ({ slug, theory }) => {
  const { t, language } = useLanguage();
  const hw = STATISTICS_HOMEWORK.find((h) => h.slug === slug);
  const text = theory[language];
  const titleRef = useRef(null);

  const toc = useMemo(
    () => ({
      sections: text.sections.map(({ id, title, level }) => ({ id, title, level })),
      labels: { button: t('statistics.theoryIndex'), title: t('statistics.theoryIndexTitle'), close: t('statistics.theoryClose') },
    }),
    [text, t],
  );
  const labels = { answer: t('statistics.theoryAnswer') };

  const backToTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (titleRef.current) titleRef.current.focus({ preventScroll: true });
  };

  return (
    <StatisticsLayout terminal={[`> ./open_theory.sh --${slug}`, ...t('statistics.homeworkTerminal')]}>
      <article className="box post th-page">
        <header className="hw-title">
          <h2 ref={titleRef} tabIndex={-1}>{`${hw.name} - ${t('statistics.theory')}`}</h2>
          <HomeworkIndex sections={toc.sections} labels={toc.labels} />
        </header>

        {text.intro.map((p, i) => <p key={i}>{p}</p>)}
        <p className="th-open-homework">
          <Link to={`/statistics/${slug}`} className="button alt icon solid fa-flask">{t('statistics.theoryOpenHomework')}</Link>
        </p>

        {text.sections.map((section) => {
          const Tag = HEADINGS[section.level];
          return (
            <section key={section.id} className={section.level === 0 ? 'th-section' : 'th-subsection'}>
              <Tag id={section.id} tabIndex={-1} className="hw1-anchor">{section.title}</Tag>
              {(section.blocks || []).map((block, i) => <Block key={i} block={block} labels={labels} />)}
            </section>
          );
        })}

        <div className="hw-bottom-actions">
          <Link to="/statistics" className="button alt icon solid fa-arrow-left">{t('statistics.backToList')}</Link>
          <Link to={`/statistics/${slug}`} className="button alt icon solid fa-flask">{t('statistics.theoryOpenHomework')}</Link>
          <button type="button" className="button alt icon solid fa-arrow-up" onClick={backToTop}>{t('statistics.backToTop')}</button>
        </div>
      </article>
    </StatisticsLayout>
  );
};

export default TheoryPage;
