// src/pages/statistics/StatisticsHomework.jsx
// Elenco degli homework di Statistics. Ogni riga porta alla pagina
// dell'homework: il nome e' un link vero (tastiera, apri in nuova scheda),
// e il resto della riga e' cliccabile per comodita'.
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { STATISTICS_HOMEWORK } from '../../config/homework';
import { formatRomeDateTime } from '../../utils/romeDate';
import StatisticsLayout from './StatisticsLayout';

const StatisticsHomework = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  return (
    <StatisticsLayout terminal={t('statistics.terminal')}>
      <article className="box post">
        <header><h2>{t('statistics.title')}</h2></header>
        <p>{t('statistics.subtitle')}</p>

        <table className="hw-table">
          <thead>
            <tr>
              <th>{t('statistics.colName')}</th>
              <th>{t('statistics.colDescription')}</th>
              <th>{t('statistics.colCreated')}</th>
              <th>{t('statistics.colDue')}</th>
            </tr>
          </thead>
          <tbody>
            {STATISTICS_HOMEWORK.map((hw) => (
              <tr key={hw.slug} className="hw-row" onClick={() => navigate(`/statistics/${hw.slug}`)}>
                <td data-label={t('statistics.colName')}>
                  <Link to={`/statistics/${hw.slug}`} onClick={(e) => e.stopPropagation()}>{hw.name}</Link>
                </td>
                <td data-label={t('statistics.colDescription')}>{hw.description[language]}</td>
                <td data-label={t('statistics.colCreated')}>{formatRomeDateTime(hw.created)}</td>
                <td data-label={t('statistics.colDue')}>{formatRomeDateTime(hw.due)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="hw-note">{t('statistics.timezoneNote')}</p>
      </article>
    </StatisticsLayout>
  );
};

export default StatisticsHomework;
