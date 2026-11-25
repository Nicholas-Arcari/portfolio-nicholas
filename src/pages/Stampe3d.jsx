// src/pages/Stampe3d.jsx
import React from 'react';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SearchInput from '../components/SearchInput';
import { useRemembered, useRememberedScroll } from '../utils/listMemory';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import { usePageTitle } from '../utils/usePageTitle';
import '../i18n/nav';
import '../i18n/settings';
import '../i18n/stampe3d';

const Stampe3d = () => {
  const { t } = useLanguage();
  const [searchTermExecuted, setSearchTermExecuted] = useRemembered('searchExecuted', ''); // Ricerca progetti eseguiti
  const [searchTermFuture, setSearchTermFuture] = useRemembered('searchFuture', '');     // Ricerca progetti futuri

  const [showExecuted, setShowExecuted] = useRemembered('showExecuted', false); // Default: nascosto
  const [showFuture, setShowFuture] = useRemembered('showFuture', false);     // Default: nascosto
  useRememberedScroll();

  const executedProjects = t('stampe3d.executed');
  const futureProjects = t('stampe3d.future');

  // --- FILTRI ---
  const filteredExecuted = executedProjects.filter(project =>
    project.title.toLowerCase().includes(searchTermExecuted.toLowerCase()) ||
    project.topic.toLowerCase().includes(searchTermExecuted.toLowerCase())
  );

  const filteredFuture = futureProjects.filter(project =>
    project.title.toLowerCase().includes(searchTermFuture.toLowerCase()) ||
    project.topic.toLowerCase().includes(searchTermFuture.toLowerCase())
  );

  usePageLayout('no-sidebar', { scrollToTop: false });
  usePageTitle(t('nav.prints3d'));

  return (
    <div id="page-wrapper" className="prints-page">

      {/* --- HEADER --- */}
      <SiteHeader terminal={t('stampe3d.terminal')} />

      {/* --- MAIN --- */}
      <section id="main">
        <div className="container">
          <div id="content">

             {/* Intro */}
             <article className="box post">
                <header><h2>{t('stampe3d.introTitle')}</h2></header>
                <p>{t('stampe3d.introDesc')}</p>

                <p className="print-callout">
                  🚀 <strong>{t('stampe3d.collabLabel')}</strong> {t('stampe3d.collabNote')}
                </p>
             </article>

             {/* --- SEZIONE 1: PROGETTI ESEGUITI (ESPANDIBILE) --- */}
             <section>
                <header className="print-section-header">
                    <h2 className="print-section-title">{t('stampe3d.executedTitle')}</h2>

                    {/* BOTTONE TOGGLE ESEGUITI */}
                    <div className="print-toggle">
                        <button
                            className="button alt small"
                            onClick={() => setShowExecuted(!showExecuted)}
                        >
                            {showExecuted ? t('stampe3d.hide') : t('stampe3d.show')}
                            <i className={`icon solid ${showExecuted ? 'fa-chevron-up' : 'fa-chevron-down'} toggle-icon`}></i>
                        </button>
                    </div>
                </header>

                {/* CONTENUTO CONDIZIONALE ESEGUITI */}
                {showExecuted && (
                    <div className="fade-in">
                        {/* SEARCH BAR ESEGUITI */}
                        <div className="print-search">
                        <SearchInput
                          className="search-input-compact"
                            placeholder={t('stampe3d.searchPlaceholder')}
                            value={searchTermExecuted}
                            onChange={setSearchTermExecuted}
                        />
                        {searchTermExecuted && (
                            <p className="search-results-count">
                              {filteredExecuted.length} {filteredExecuted.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
                            </p>
                        )}
                        </div>

                        <div className="row">
                            {filteredExecuted.length > 0 ? (
                            filteredExecuted.map((project, index) => (
                                <div key={index} className="col-6 col-12-medium">
                                    <article className="box feature">
                                        <span className="image featured">
                                          {project.image ? (
                                            <img className="print-photo" src={project.image} alt={project.title} loading="lazy" decoding="async" />
                                          ) : (
                                            <span className="image-fallback"><i className="icon solid fa-cube"></i></span>
                                          )}
                                        </span>
                                        <header>
                                            <h3>{project.title}</h3>
                                            <span className="tag-chip">
                                            {project.topic}
                                            </span>
                                        </header>
                                        <p>{project.description}</p>

                                        <div className="print-meta">

                                            {/* LINK */}
                                            {project.link && (
                                            <p className="print-link-line">
                                                <strong>{t('stampe3d.link')} </strong>
                                                <a className="print-link" href={project.link} target="_blank" rel="noreferrer">
                                                    {project.link}
                                                </a>
                                            </p>
                                            )}

                                            {/* SPAZIO */}
                                            <br />

                                            {/* MATERIALE */}
                                            <p className="print-material"><strong>{t('stampe3d.material')}</strong> {project.material}</p>

                                            {/* BARRA ORIZZONTALE ALLA FINE */}
                                            <hr className="print-rule" />
                                        </div>
                                    </article>
                                </div>
                            ))
                            ) : (
                            <p className="print-empty">{t('stampe3d.noResults')}</p>
                            )}
                        </div>
                    </div>
                )}
             </section>

             <hr className="print-divider" />

             {/* --- SEZIONE 2: PROGETTI DA ESEGUIRE (ESPANDIBILE) --- */}
             <section>
                <header className="print-section-header">
                    <h2 className="print-section-title">{t('stampe3d.futureTitle')}</h2>

                    {/* BOTTONE TOGGLE FUTURI */}
                    <div className="print-toggle">
                        <button
                            className="button alt small"
                            onClick={() => setShowFuture(!showFuture)}
                        >
                            {showFuture ? t('stampe3d.hide') : t('stampe3d.show')}
                            <i className={`icon solid ${showFuture ? 'fa-chevron-up' : 'fa-chevron-down'} toggle-icon`}></i>
                        </button>
                    </div>
                </header>

                {/* CONTENUTO CONDIZIONALE FUTURI */}
                {showFuture && (
                    <div className="fade-in">
                        {/* SEARCH BAR FUTURI */}
                        <div className="print-search">
                        <SearchInput
                          className="search-input-compact"
                            placeholder={t('stampe3d.searchPlaceholder')}
                            value={searchTermFuture}
                            onChange={setSearchTermFuture}
                        />
                        {searchTermFuture && (
                            <p className="search-results-count">
                              {filteredFuture.length} {filteredFuture.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
                            </p>
                        )}
                        </div>

                        <div className="row">
                            {filteredFuture.length > 0 ? (
                            filteredFuture.map((project, index) => (
                                <div key={index} className="col-6 col-12-medium">
                                    <article className="box feature print-card-future">
                                        <span className="image featured">
                                          {project.image ? (
                                            <img className="print-photo is-future" src={project.image} alt={project.title} loading="lazy" decoding="async" />
                                          ) : (
                                            <span className="image-fallback is-future"><i className="icon solid fa-cube"></i></span>
                                          )}
                                        </span>
                                        <header>
                                            <h3>{project.title}</h3>
                                            <span className="tag-chip">
                                            {project.topic}
                                            </span>
                                        </header>
                                        <p>{project.description}</p>

                                        <div className="print-meta">

                                            {/* LINK */}
                                            {project.link && (
                                            <p className="print-link-line">
                                                <strong>{t('stampe3d.link')} </strong>
                                                <a className="print-link" href={project.link} target="_blank" rel="noreferrer">
                                                    {project.link}
                                                </a>
                                            </p>
                                            )}

                                            <br />

                                            {/* MATERIALE */}
                                            <p className="print-material"><strong>{t('stampe3d.material')}</strong> {project.material}</p>

                                            {/* BARRA ORIZZONTALE ALLA FINE */}
                                            <hr className="print-rule" />
                                        </div>
                                    </article>
                                </div>
                            ))
                            ) : (
                            <p className="print-empty">{t('stampe3d.noResults')}</p>
                            )}
                        </div>
                    </div>
                )}
             </section>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <Footer />
    </div>
  );
};

export default Stampe3d;
