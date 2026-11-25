// src/pages/ssa/SsaList.jsx
// Le lezioni di Security in Software Applications, nello stile dell'elenco di
// Distributed Systems: come si leggono gli appunti, la barra di ricerca, che
// filtra per nome e argomenti nella lingua scelta, e una riga per lezione che
// porta alla sua pagina. Ricerca e scorrimento tornano con Indietro del
// browser (src/utils/listMemory.js).
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { SSA_LECTURES } from '../../config/ssa';
import SearchInput from '../../components/SearchInput';
import { useRemembered, useRememberedScroll } from '../../utils/listMemory';
import StatisticsLayout from '../statistics/StatisticsLayout';
import { SSA_PATH, ssaCourse, lectureName } from './ssaCourse';
import './ssa.css';
import '../../i18n/settings';
import '../../i18n/ssa';

const SEARCH_STYLE = {
  width: '100%',
  padding: '15px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  backgroundColor: '#f9f9f9',
  fontSize: '1.1em',
  marginBottom: '10px',
};

const SsaList = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useRemembered('search', '');
  useRememberedScroll();

  const term = searchTerm.trim().toLowerCase();
  const filtered = SSA_LECTURES.filter(
    (lecture) => !term || `${lectureName(lecture, language, t)} ${lecture.description[language]}`.toLowerCase().includes(term),
  );

  return (
    <StatisticsLayout title={t('ssa.title')} terminal={t('ssa.terminal')} course={ssaCourse(t)}>
      <article className="box post">
        <header><h2>{t('ssa.title')}</h2></header>
        <p>{t('ssa.subtitle')}</p>

        <section className="ssa-howto" aria-labelledby="ssa-howto-title">
          <h3 id="ssa-howto-title">{t('ssa.howToTitle')}</h3>
          <ul>
            {t('ssa.howTo').map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>

        <SearchInput
          placeholder={t('ssa.search')}
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
                <th>{t('ssa.colName')}</th>
                <th>{t('ssa.colDescription')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lecture) => (
                <tr key={lecture.slug} className="hw-row" onClick={() => navigate(`${SSA_PATH}/${lecture.slug}`)}>
                  <td data-label={t('ssa.colName')}>
                    <Link to={`${SSA_PATH}/${lecture.slug}`} onClick={(e) => e.stopPropagation()}>{lectureName(lecture, language, t)}</Link>
                  </td>
                  <td data-label={t('ssa.colDescription')}>{lecture.description[language]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
            {t('ssa.noResults')}
          </p>
        )}
      </article>
    </StatisticsLayout>
  );
};

export default SsaList;
