// src/pages/MasterDetails.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';

const MasterDetails = () => {
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Layout Right Sidebar (come la pagina della triennale)
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

  const coursesData = t('masterDetails.courses');

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
          <TerminalText lines={t('masterDetails.terminal')} />

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
                  <header><h2>{t('masterDetails.title')}</h2></header>
                  <p>{t('masterDetails.subtitle')}</p>

                  {/* Nota CFU: chiarisce perche' la somma degli insegnamenti
                      elencati non arriva da sola ai 120 CFU del corso */}
                  <p className="soft-panel" style={{ padding: '1em 1.2em', fontSize: '0.9em', color: '#888', marginBottom: '1.5em' }}>
                    <i className="icon solid fa-info-circle" style={{ color: '#d52349', marginRight: '0.5em' }}></i>
                    {t('masterDetails.cfuNote')}
                  </p>

                  {/* BARRA DI RICERCA */}
                  <input
                    type="text"
                    placeholder={t('masterDetails.search')}
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1em', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0 }}>{course.name}</h3>
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
