// src/pages/distributed/DistributedList.jsx
// Le lezioni di Distributed Systems, nello stile dell'elenco di Statistics:
// la barra di ricerca, che filtra per nome e argomenti nella lingua scelta, e
// una riga per lezione che porta alla sua pagina. Ricerca e scorrimento
// tornano con Indietro del browser (src/utils/listMemory.js).
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { DS_LECTURES } from '../../config/distributed';
import SearchInput from '../../components/SearchInput';
import { useRemembered, useRememberedScroll } from '../../utils/listMemory';
import StatisticsLayout from '../statistics/StatisticsLayout';
import { dsCourse, lectureName } from './dsCourse';

const SEARCH_STYLE = {
  width: '100%',
  padding: '15px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  backgroundColor: '#f9f9f9',
  fontSize: '1.1em',
  marginBottom: '10px',
};

const DistributedList = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useRemembered('search', '');
  useRememberedScroll();

  const term = searchTerm.trim().toLowerCase();
  const filtered = DS_LECTURES.filter(
    (lecture) => !term || `${lectureName(lecture, language, t)} ${lecture.description[language]}`.toLowerCase().includes(term),
  );

  return (
    <StatisticsLayout terminal={t('distributed.terminal')} course={dsCourse(t)}>
      <article className="box post">
        <header><h2>{t('distributed.title')}</h2></header>
        <p>{t('distributed.subtitle')}</p>

        <SearchInput
          placeholder={t('distributed.search')}
          value={searchTerm}
          onChange={setSearchTerm}
          style={SEARCH_STYLE}
        />
        {searchTerm && (
          <p className="search-results-count">
            {filtered.length} {filtered.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
          </p>
        )}

        {filtered.length > 0 ? (
          <table className="hw-table lab-table">
            <thead>
              <tr>
                <th>{t('distributed.colName')}</th>
                <th>{t('distributed.colDescription')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lecture) => (
                <tr key={lecture.slug} className="hw-row" onClick={() => navigate(`/distributed-systems/${lecture.slug}`)}>
                  <td data-label={t('distributed.colName')}>
                    <Link to={`/distributed-systems/${lecture.slug}`} onClick={(e) => e.stopPropagation()}>{lectureName(lecture, language, t)}</Link>
                  </td>
                  <td data-label={t('distributed.colDescription')}>{lecture.description[language]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
            {t('distributed.noResults')}
          </p>
        )}
      </article>
    </StatisticsLayout>
  );
};

export default DistributedList;
