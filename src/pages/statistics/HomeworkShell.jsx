// src/pages/statistics/HomeworkShell.jsx
// La cornice di ogni pagina homework: titolo (con l'indice delle sezioni, se
// la pagina ne passa uno), date nell'ora di Roma, descrizione, e in fondo il
// ritorno all'elenco e all'inizio della pagina. Il contenuto vero sta nel
// file del singolo homework (Homework1.jsx, Homework2.jsx, ...), passato
// come figlio; finche' manca, la pagina dice che e' in preparazione.
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { STATISTICS_HOMEWORK } from '../../config/homework';
import { formatRomeDateTime } from '../../utils/romeDate';
import StatisticsLayout from './StatisticsLayout';
import HomeworkIndex from './HomeworkIndex';

// `toc`: { sections: [{ id, title, level }], labels: { button, title, close } }
const HomeworkShell = ({ slug, sidebar = null, toc = null, children }) => {
  const { t, language } = useLanguage();
  const hw = STATISTICS_HOMEWORK.find((h) => h.slug === slug);
  const description = hw.description[language];
  const titleRef = useRef(null);

  // In cima alla pagina, e il focus sul titolo: chi usa la tastiera riparte
  // da li', non dal pulsante in fondo
  const backToTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    if (titleRef.current) titleRef.current.focus({ preventScroll: true });
  };

  return (
    <StatisticsLayout terminal={[`> ./open_homework.sh --${slug}`, ...t('statistics.homeworkTerminal')]} sidebar={sidebar}>
      <article className="box post">
        <header className="hw-title">
          <h2 ref={titleRef} tabIndex={-1}>{hw.name}</h2>
          {toc && <HomeworkIndex sections={toc.sections} labels={toc.labels} />}
        </header>

        <p className="hw-dates">
          <span><strong>{t('statistics.colCreated')}:</strong> {formatRomeDateTime(hw.created)}</span>
          <span><strong>{t('statistics.colDue')}:</strong> {formatRomeDateTime(hw.due)}</span>
        </p>
        {description && <p>{description}</p>}

        {children || (
          <p style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
            {t('statistics.homeworkWip')}
          </p>
        )}

        <div className="hw-bottom-actions">
          <Link to="/statistics" className="button alt icon solid fa-arrow-left">{t('statistics.backToList')}</Link>
          <button type="button" className="button alt icon solid fa-arrow-up" onClick={backToTop}>{t('statistics.backToTop')}</button>
        </div>
      </article>
    </StatisticsLayout>
  );
};

export default HomeworkShell;
