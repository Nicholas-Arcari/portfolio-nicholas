// src/pages/statistics/StatisticsLayout.jsx
// Lo scheletro comune alle pagine di Statistics (l'elenco degli homework e le
// pagine dei singoli homework): stesso header, stessa navigazione e stessa
// sidebar destra delle altre pagine del portfolio. Lo usano anche le pagine
// di Reti di Calcolatori, con il loro riepilogo (`course`). Da computer la
// colonna destra resta in vista mentre la pagina scorre (followSidebar.js).
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../../components/TerminalText';
import { useLanguage } from '../../contexts/languageContext';
import Footer from '../../components/Footer';
import HomeworkIndex from './HomeworkIndex';
import { useFollowingSidebar } from './followSidebar';

// `sidebar`: riquadri in piu' nella colonna destra, subito dopo il riepilogo
// (es. il download del codice di un homework).
// `course`: il riepilogo in cima alla sidebar ({ summary: [[etichetta,
// valore], ...] }) e il ritorno al piano di studi ({ back: { to, title,
// desc, btn } }); senza, quelli di Statistics.
// `index`: l'indice delle sezioni della pagina ({ sections, labels }, lo
// stesso di HomeworkIndex): un pulsante Indice in cima alla colonna, per
// saltare a una sezione senza tornare in cima alla pagina.
const StatisticsLayout = ({ terminal, sidebar = null, course = null, index = null, children }) => {
  const { t } = useLanguage();
  const sidebarRef = useRef(null);
  useFollowingSidebar(sidebarRef);
  const summary = course ? course.summary : [
    [t('statistics.sidebarCoursel'), 'Statistics'],
    [t('statistics.sidebarDegreel'), t('masterDetails.sidebarCourse')],
  ];
  const back = course ? course.back : {
    to: '/master-details',
    title: t('statistics.sidebarBack'),
    desc: t('statistics.sidebarBackDesc'),
    btn: t('statistics.sidebarBackBtn'),
  };
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <br />
          <TerminalText lines={terminal} />

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
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/galleria" style={{ display: 'block', color: '#444' }}>{t('nav.gallery')}</Link></li>
                  </ul>
                )}
              </li>
              <li><a className="icon brands fa-github" href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer"><span>GitHub</span></a></li>
            </ul>
          </nav>
        </div>
      </section>

      {/* MAIN */}
      <section id="main" className="stats-main">
        <div className="container">
          <div className="row">

            {/* CONTENT */}
            <div id="content" className="col-8 col-12-medium">
              {children}
            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium stats-sidebar" ref={sidebarRef}>
              <section>
                <ul className="divided">
                  {index && (
                    <li>
                      <article className="box highlight stats-sidebar-index">
                        <HomeworkIndex sections={index.sections} labels={index.labels} />
                      </article>
                    </li>
                  )}
                  <li>
                    <article className="box highlight">
                      <header><h3>{t('statistics.sidebarTitle')}</h3></header>
                      <p>
                        {summary.map(([label, value], i) => (
                          <React.Fragment key={label}>
                            {i > 0 && <br />}
                            <strong>{label}</strong> {value}
                          </React.Fragment>
                        ))}
                      </p>
                    </article>
                  </li>
                </ul>
              </section>

              {sidebar}

              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to={back.to}>{back.title}</Link></h3></header>
                      <p>{back.desc}</p>
                      <Link to={back.to} className="button icon solid fa-graduation-cap">{back.btn}</Link>
                    </article>
                  </li>
                </ul>
              </section>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StatisticsLayout;
