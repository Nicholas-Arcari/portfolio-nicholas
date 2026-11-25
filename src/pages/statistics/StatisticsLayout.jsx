// src/pages/statistics/StatisticsLayout.jsx
// Lo scheletro comune alle pagine di Statistics (l'elenco degli homework e le
// pagine dei singoli homework): stesso header, stessa navigazione e stessa
// sidebar destra delle altre pagine del portfolio. Lo usano anche le pagine
// di Reti di Calcolatori, con il loro riepilogo (`course`). Da computer la
// colonna destra resta in vista mentre la pagina scorre (followSidebar.js).
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/languageContext';
import Footer from '../../components/Footer';
import HomeworkIndex from './HomeworkIndex';
import { useFollowingSidebar } from './followSidebar';
import SiteHeader from '../../components/SiteHeader';
import { usePageLayout } from '../../utils/usePageLayout';
import { usePageTitle } from '../../utils/usePageTitle';
import '../../i18n/masterDetails';
import '../../i18n/statistics';

// `title`: il titolo della scheda (usePageTitle).
// `sidebar`: riquadri in piu' nella colonna destra, subito dopo il riepilogo
// (es. il download del codice di un homework).
// `course`: il riepilogo in cima alla sidebar ({ summary: [[etichetta,
// valore], ...] }) e il ritorno al piano di studi ({ back: { to, title,
// desc, btn } }); senza, quelli di Statistics.
// `index`: l'indice delle sezioni della pagina ({ sections, labels }, lo
// stesso di HomeworkIndex): un pulsante Indice in cima alla colonna, per
// saltare a una sezione senza tornare in cima alla pagina.
const StatisticsLayout = ({ title, terminal, sidebar = null, course = null, index = null, children }) => {
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

  usePageLayout('right-sidebar');
  usePageTitle(title);

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <SiteHeader terminal={terminal} />

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
