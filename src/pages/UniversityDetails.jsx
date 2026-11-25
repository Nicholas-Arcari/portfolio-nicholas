// src/pages/UniversityDetails.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SearchInput from '../components/SearchInput';
import { useRemembered, useRememberedScroll } from '../utils/listMemory';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import { usePageTitle } from '../utils/usePageTitle';
import '../i18n/nav';
import '../i18n/settings';
import '../i18n/university';

const UniversityDetails = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useRemembered('search', '');
  useRememberedScroll();

  usePageLayout('right-sidebar', { scrollToTop: false });
  usePageTitle(t('university.title'));

  const coursesData = t('university.courses');

  // Filtra i corsi
  const filteredCourses = coursesData.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="page-wrapper" className="courses-page">

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
                        <div className="course">
                            <div className="course-head">
                                {/* Un esame con una pagina sua (per ora Reti di Calcolatori, con il laboratorio) ha il nome cliccabile */}
                                <h3 className="course-title">{course.link ? <Link to={course.link} className="course-link">{course.name}</Link> : course.name}</h3>
                                <span className="button alt small course-badge">{course.year}</span>
                            </div>
                            <p className="course-text">{course.description}</p>
                        </div>
                        {index < filteredCourses.length - 1 && <hr />}
                      </React.Fragment>
                    ))
                  ) : (
                    <p className="empty-note">
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
