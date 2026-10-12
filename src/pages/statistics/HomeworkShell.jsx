// src/pages/statistics/HomeworkShell.jsx
// La cornice di ogni pagina homework: titolo, date nell'ora di Roma,
// descrizione e ritorno all'elenco. Il contenuto vero sta nel file del
// singolo homework (Homework1.jsx, Homework2.jsx, ...), passato come figlio;
// finche' manca, la pagina dice che e' in preparazione.
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { STATISTICS_HOMEWORK } from '../../config/homework';
import { formatRomeDateTime } from '../../utils/romeDate';
import StatisticsLayout from './StatisticsLayout';

const HomeworkShell = ({ slug, sidebar = null, children }) => {
  const { t, language } = useLanguage();
  const hw = STATISTICS_HOMEWORK.find((h) => h.slug === slug);
  const description = hw.description[language];

  return (
    <StatisticsLayout terminal={[`> ./open_homework.sh --${slug}`, ...t('statistics.homeworkTerminal')]} sidebar={sidebar}>
      <article className="box post">
        <header><h2>{hw.name}</h2></header>

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

        <Link to="/statistics" className="button alt icon solid fa-arrow-left">{t('statistics.backToList')}</Link>
      </article>
    </StatisticsLayout>
  );
};

export default HomeworkShell;
