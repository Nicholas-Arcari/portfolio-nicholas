// src/pages/UniversityDetails.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SearchInput from '../components/SearchInput';
import { useRemembered, useRememberedScroll } from '../utils/listMemory';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import '../i18n/nav';
import '../i18n/settings';
import '../i18n/university';

const UniversityDetails = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useRemembered('search', '');
  useRememberedScroll();

  usePageLayout('right-sidebar', { scrollToTop: false });

  const coursesData = t('university.courses');

  // Filtra i corsi
  const filteredCourses = coursesData.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <SiteHeader terminal={t('university.terminal')} />

      {/* MAIN */}
      <section id="main">
        <div className="container">
          <div className="row">

            {/* CONTENT */}
            <div id="content" className="col-8 col-12-medium">
               <article className="box post">
                  <header><h2>{t('university.title')}</h2></header>
                  <p>{t('university.subtitle')}</p>

                  {/* BARRA DI RICERCA */}
                  <SearchInput
                    placeholder={t('university.search')}
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {/* Un esame con una pagina sua (per ora Reti di Calcolatori, con il laboratorio) ha il nome cliccabile */}
                                <h3 style={{ margin: 0 }}>{course.link ? <Link to={course.link} className="course-link">{course.name}</Link> : course.name}</h3>
                                <span className="button alt small" style={{ pointerEvents: 'none' }}>{course.year}</span>
                            </div>
                            <p style={{ marginTop: '0.5em' }}>{course.description}</p>
                        </div>
                        {index < filteredCourses.length - 1 && <hr />}
                      </React.Fragment>
                    ))
                  ) : (
                    <p style={{textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>
                      {t('university.noResults')}
                    </p>
                  )}

               </article>
            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium">

               {/* Box Resume */}
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3>{t('university.sidebarTitle')}</h3></header>
                      <p>
                        <strong>{t('university.sidebarAteneol')}</strong> {t('university.sidebarUni')}<br />
                        <strong>{t('university.sidebarCorsol')}</strong> {t('university.sidebarCourse')}<br />
                        <strong>{t('university.sidebarPeriodol')}</strong> {t('university.sidebarPeriod')}
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
                      <header><h3><Link to="/">{t('university.sidebarHome')}</Link></h3></header>
                      <p>{t('university.sidebarHomeDesc')}</p>
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

export default UniversityDetails;
