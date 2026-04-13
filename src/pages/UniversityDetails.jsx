// src/pages/UniversityDetails.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';

const UniversityDetails = () => {
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Layout Right Sidebar
  useEffect(() => {
    document.body.classList.remove('homepage');
    document.body.classList.remove('no-sidebar');
    document.body.classList.add('right-sidebar');
    window.scrollTo(0, 0);

    return () => {
      document.body.classList.remove('right-sidebar');
      document.body.classList.add('homepage');
    };
  }, []);

  const coursesData = t('university.courses');

  // Filtra i corsi
  const filteredCourses = coursesData.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <br />
          <TerminalText lines={t('university.terminal')} />

          <nav id="nav">
            <ul>
              <li><Link className="icon solid fa-home" to="/"><span>{t('nav.home')}</span></Link></li>
              <li><Link className="icon solid fa-user" to="/about"><span>{t('nav.about')}</span></Link></li>
              <li
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
                style={{ position: 'relative' }}
              >
                <a className="icon solid fa-glass-cheers" style={{ cursor: 'pointer' }}><span>{t('nav.passions')}</span></a>
                {isDropdownOpen && (
                  <ul style={{
                    display: 'block', position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '4px',
                    padding: '10px 0', minWidth: '200px', zIndex: 1000, listStyle: 'none', margin: 0
                  }}>
                    <li style={{ padding: '5px 20px', borderTop: 'none' }}><Link to="/ricette" style={{ display: 'block', color: '#444' }}>{t('nav.recipes')}</Link></li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/cocktail" style={{ display: 'block', color: '#444' }}>{t('nav.cocktails')}</Link></li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/stampe3d" style={{ display: 'block', color: '#444' }}>{t('nav.prints3d')}</Link></li>
                  </ul>
                )}
              </li>
              <li><a className="icon brands fa-github" href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer"><span>GitHub</span></a></li>
            </ul>
          </nav>
        </div>
      </section>

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
                  <input
                    type="text"
                    placeholder={t('university.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                                <h3 style={{ margin: 0 }}>{course.name}</h3>
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
                        <strong>{t('university.sidebarUni')}</strong> {t('university.sidebarAteneol')}<br />
                        <strong>{t('university.sidebarCourse')}</strong> {t('university.sidebarCorsol')}<br />
                        <strong>{t('university.sidebarPeriod')}</strong> {t('university.sidebarPeriodol')}<br />
                        <strong>{t('university.sidebarGrade')}</strong> {t('university.sidebarVotol')}
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
