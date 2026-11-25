// src/pages/MasterDetails.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SearchInput from '../components/SearchInput';
import { useRemembered, useRememberedScroll } from '../utils/listMemory';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import { usePageTitle } from '../utils/usePageTitle';
import '../i18n/masterDetails';
import '../i18n/nav';
import '../i18n/settings';

const MasterDetails = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useRemembered('search', '');
  useRememberedScroll();

  usePageLayout('right-sidebar', { scrollToTop: false });
  usePageTitle(t('masterDetails.title'));

  const coursesData = t('masterDetails.courses');

  // Filtra i corsi
  const filteredCourses = coursesData.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <SiteHeader terminal={t('masterDetails.terminal')} />

      {/* MAIN */}
      <section id="main">
        <div className="container">
          <div className="row">

            {/* CONTENT */}
            <div id="content" className="col-8 col-12-medium">
               <article className="box post">
                  <header><h2>{t('masterDetails.title')}</h2></header>
                  <p>{t('masterDetails.subtitle')}</p>

                  {/* BARRA DI RICERCA */}
                  <SearchInput
                    placeholder={t('masterDetails.search')}
                    value={searchTerm}
                    onChange={setSearchTerm}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                      backgroundColor: '#f9f9f9',
                      fontSize: '1.1em',
                      marginBottom: '10px'
                    }}
                  />
                  {searchTerm && (
                    <p className="search-results-count">
                      {filteredCourses.length} {filteredCourses.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
                    </p>
                  )}

                  {/* LISTA CORSI */}
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course, index) => (
                      <React.Fragment key={index}>
                        <div style={{ marginBottom: '2em' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1em', flexWrap: 'wrap' }}>
                                {/* Un corso con una pagina sua (Statistics con gli homework, Distributed Systems e Security in Software Applications con le lezioni) ha il nome cliccabile */}
                                <h3 style={{ margin: 0 }}>{course.link ? <Link to={course.link} className="course-link">{course.name}</Link> : course.name}</h3>
                                <span style={{ display: 'flex', gap: '0.4em', flexWrap: 'wrap' }}>
                                  <span className="button alt small" style={{ pointerEvents: 'none' }}>{course.year}</span>
                                  <span className="button alt small" style={{ pointerEvents: 'none' }}>{course.cfu}</span>
                                </span>
                            </div>
                            <p style={{ marginTop: '0.5em' }}>{course.description}</p>
                        </div>
                        {index < filteredCourses.length - 1 && <hr />}
                      </React.Fragment>
                    ))
                  ) : (
                    <p style={{textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>
                      {t('masterDetails.noResults')}
                    </p>
                  )}

               </article>
            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium">

               {/* Box Riepilogo */}
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3>{t('masterDetails.sidebarTitle')}</h3></header>
                      <p>
                        <strong>{t('masterDetails.sidebarAteneol')}</strong> {t('masterDetails.sidebarUni')}<br />
                        <strong>{t('masterDetails.sidebarCorsol')}</strong> {t('masterDetails.sidebarCourse')}<br />
                        <strong>{t('masterDetails.sidebarPeriodol')}</strong> {t('masterDetails.sidebarPeriod')}<br />
                        <strong>{t('masterDetails.sidebarLangl')}</strong> {t('masterDetails.sidebarLang')}<br />
                        <strong>{t('masterDetails.sidebarStatol')}</strong> {t('masterDetails.sidebarStatus')}
                      </p>
                    </article>
                  </li>
                </ul>
              </section>

               {/* Box Navigazione */}
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/">{t('masterDetails.sidebarHome')}</Link></h3></header>
                      <p>{t('masterDetails.sidebarHomeDesc')}</p>
                      <Link to="/" className="button icon solid fa-home">{t('nav.home')}</Link>
                    </article>
                  </li>
                </ul>
              </section>

            </div>

          </div>
        </div>
      </section>

      {/* FOOTER MINIMAL */}
      <Footer />
    </div>
  );
};

export default MasterDetails;
