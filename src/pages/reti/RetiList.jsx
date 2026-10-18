// src/pages/reti/RetiList.jsx
// Il laboratorio di Reti di Calcolatori, nello stile dell'elenco di
// Statistics ma nella lingua del sito: in cima l'intestazione del README del
// repository, poi la barra di ricerca e una riga per esercitazione, e sotto
// la tabella lo stack tecnologico e la topologia di rete, sempre dal README.
// Niente date e niente pagine di teoria: ogni file unisce gia' teoria e
// pratica.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import { RETI_LAB, RETI_REPO } from '../../config/reti';
import SearchInput from '../../components/SearchInput';
import StatisticsLayout from '../statistics/StatisticsLayout';
import Markdown from './Markdown';
import { README_PARTS, labDescription } from './labText';
import { retiCourse } from './retiCourse';

// Del README, sotto la tabella, restano solo queste sezioni: le altre
// ripetevano l'elenco delle esercitazioni o parlavano del repository
const README_BELOW = ['Stack Tecnologico', 'Topologia di Rete'];

const SEARCH_STYLE = {
  width: '100%',
  padding: '15px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  backgroundColor: '#f9f9f9',
  fontSize: '1.1em',
  marginBottom: '10px',
};

const RetiList = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const term = searchTerm.trim().toLowerCase();
  const filtered = RETI_LAB.filter(
    (ex) => !term || `${ex.name} ${labDescription(ex, language)}`.toLowerCase().includes(term),
  );

  const repoBox = (
    <section>
      <ul className="divided">
        <li>
          <article className="box highlight">
            <header><h3>{t('reti.repoTitle')}</h3></header>
            <p>{t('reti.repoText')}</p>
            <a href={RETI_REPO} target="_blank" rel="noopener noreferrer" className="button alt icon brands fa-github">{t('reti.github')}</a>
          </article>
        </li>
      </ul>
    </section>
  );

  return (
    <StatisticsLayout terminal={t('reti.terminal')} course={retiCourse(t)} sidebar={repoBox}>
      <article className="box post">
        <header><h2>{t('reti.title')}</h2></header>
        <p>{t('reti.subtitle')}</p>

        <section className="lab-readme">
          <Markdown source={README_PARTS.intro} />
        </section>

        <SearchInput
          placeholder={t('reti.search')}
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
                <th>{t('reti.colName')}</th>
                <th>{t('reti.colDescription')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex) => (
                <tr key={ex.slug} className="hw-row" onClick={() => navigate(`/reti-di-calcolatori/${ex.slug}`)}>
                  <td data-label={t('reti.colName')}>
                    <Link to={`/reti-di-calcolatori/${ex.slug}`} onClick={(e) => e.stopPropagation()}>{ex.name}</Link>
                  </td>
                  <td data-label={t('reti.colDescription')}>{labDescription(ex, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
            {t('reti.noResults')}
          </p>
        )}

        {README_PARTS.sections.filter((part) => README_BELOW.includes(part.title)).map((part) => (
          <section key={part.title} className="lab-readme-section">
            <h3>{part.title}</h3>
            <Markdown source={part.source} />
          </section>
        ))}
      </article>
    </StatisticsLayout>
  );
};

export default RetiList;
