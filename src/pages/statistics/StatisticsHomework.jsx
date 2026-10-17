// src/pages/statistics/StatisticsHomework.jsx
// Elenco degli homework e dei project di Statistics, con la stessa barra di
// ricerca delle altre pagine con un elenco: filtra per nome e descrizione
// nella lingua scelta, e i pulsanti sotto la barra per tipo (tutti, solo gli
// homework, solo i project). Ogni riga porta alla sua pagina: il nome e' un link vero
// (tastiera, apri in nuova scheda), e il resto della riga e' cliccabile per
// comodita'.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { STATISTICS_HOMEWORK } from '../../config/homework';
import { formatRomeDateTime } from '../../utils/romeDate';
import SearchInput from '../../components/SearchInput';
import StatisticsLayout from './StatisticsLayout';

const SEARCH_STYLE = {
  width: '100%',
  padding: '15px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  backgroundColor: '#f9f9f9',
  fontSize: '1.1em',
  marginBottom: '10px',
};

const FILTERS = [
  ['all', 'statistics.filterAll'],
  ['homework', 'statistics.filterHomework'],
  ['project', 'statistics.filterProject'],
];

const StatisticsHomework = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState('all');

  const term = searchTerm.trim().toLowerCase();
  const filtered = STATISTICS_HOMEWORK.filter(
    (hw) => (type === 'all' || hw.type === type) && (!term || `${hw.name} ${hw.description[language]}`.toLowerCase().includes(term)),
  );

  return (
    <StatisticsLayout terminal={t('statistics.terminal')}>
      <article className="box post">
        <header><h2>{t('statistics.title')}</h2></header>
        <p>{t('statistics.subtitle')}</p>

        <SearchInput
          placeholder={t('statistics.search')}
          value={searchTerm}
          onChange={setSearchTerm}
          style={SEARCH_STYLE}
        />
        <div className="hw-filter" role="group" aria-label={t('statistics.filterLabel')}>
          <span className="hw-filter-label">{t('statistics.filterLabel')}</span>
          {FILTERS.map(([value, label]) => (
            <button key={value} type="button" className="button alt small" aria-pressed={type === value} onClick={() => setType(value)}>{t(label)}</button>
          ))}
        </div>
        {(searchTerm || type !== 'all') && (
          <p className="search-results-count">
            {filtered.length} {filtered.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
          </p>
        )}

        {filtered.length > 0 ? (
          <table className="hw-table">
            <thead>
              <tr>
                <th>{t('statistics.colName')}</th>
                <th>{t('statistics.colDescription')}</th>
                <th>{t('statistics.colCompleted')}</th>
                <th>{t('statistics.colDue')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((hw) => (
                <tr key={hw.slug} className="hw-row" onClick={() => navigate(`/statistics/${hw.slug}`)}>
                  <td data-label={t('statistics.colName')}>
                    <Link to={`/statistics/${hw.slug}`} onClick={(e) => e.stopPropagation()}>{hw.name}</Link>
                    {/* la teoria dietro all'homework, in una scheda nuova: l'elenco resta aperto */}
                    {hw.theory && (
                      <a
                        className="hw-theory-link icon solid fa-book"
                        href={`#/statistics/${hw.slug}/theory`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('statistics.theoryNewTab')}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t('statistics.theory')}
                      </a>
                    )}
                  </td>
                  <td data-label={t('statistics.colDescription')}>{hw.description[language]}</td>
                  <td data-label={t('statistics.colCompleted')}>{hw.completed ? formatRomeDateTime(hw.completed) : t('statistics.dueTbd')}</td>
                  <td data-label={t('statistics.colDue')}>{hw.due ? formatRomeDateTime(hw.due) : t('statistics.dueTbd')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
            {t('statistics.noResults')}
          </p>
        )}

        <p className="hw-note">{t('statistics.timezoneNote')}</p>
      </article>
    </StatisticsLayout>
  );
};

export default StatisticsHomework;
