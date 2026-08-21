// src/pages/FreelanceDetails.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';

const FreelanceDetails = () => {
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <br />
          <TerminalText lines={t('freelance.terminal')} />

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

               {/* INTRODUZIONE PRODOTTO */}
               <article className="box post">
                  <header>
                    <h2>{t('freelance.title')}</h2>
                    <p style={{ fontStyle: 'italic', color: '#666' }}>
                      {t('freelance.subtitle')}
                    </p>
                  </header>

                  {/* KPI - LAYOUT SX - CENTRO - DX */}
                  <div className="row aln-center" style={{ margin: '2em 0', alignItems: 'flex-start' }}>
                    <div className="col-4 col-12-small" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>-99%</h3>
                        <p style={{ margin: 0, lineHeight: '1.2' }}>{t('freelance.kpi.time')}</p>
                    </div>
                    <div className="col-4 col-12-small" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>AI</h3>
                        <p style={{ margin: 0, lineHeight: '1.2' }}>{t('freelance.kpi.ai')}</p>
                    </div>
                    <div className="col-4 col-12-small" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>4.0 & 5.0</h3>
                        <p style={{ margin: 0, lineHeight: '1.2' }}>{t('freelance.kpi.industry')}</p>
                    </div>
                  </div>

                  <hr />

                  {/* 1. IL PROBLEMA */}
                  <h3>{t('freelance.problemTitle')}</h3>
                  <p>{t('freelance.problemDesc')}</p>

                  <hr />

                  {/* 2. IL MIO RUOLO */}
                  <h3>{t('freelance.roleTitle')}</h3>
                  <p>{t('freelance.roleDesc')}</p>

                  <hr />

                  {/* 3. LA SOLUZIONE DETTAGLIATA */}
                  <h3>{t('freelance.solutionTitle')}</h3>
                  <p>{t('freelance.solutionIntro')}</p>

                  <h4>{t('freelance.prodTitle')}</h4>
                  <p>{t('freelance.prodIntro')}</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    {t('freelance.prodItems').map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>

                  <h4>{t('freelance.commTitle')}</h4>
                  <p>{t('freelance.commIntro')}</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    {t('freelance.commItems').map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>

                  <h4>{t('freelance.adminTitle')}</h4>
                  <p>{t('freelance.adminIntro')}</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    {t('freelance.adminItems').map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>

                  <hr />

                  {/* 4. CYBERSECURITY */}
                  <h3>{t('freelance.securityTitle')}</h3>
                  <p>{t('freelance.securityDesc')}</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    {t('freelance.securityItems').map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>

               </article>
            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium">

               {/* Box Tecnologie */}
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3>{t('freelance.sidebarTechTitle')}</h3></header>
                      <p>{t('freelance.sidebarTechDesc')}</p>
                      <ul className="check-list" style={{ listStyle: 'none', padding: 0 }}>
                        <li><strong>Frontend:</strong> React 19, TypeScript, Vite, Tailwind</li>
                        <li><strong>Backend:</strong> PHP 8.2, Laravel 12, Sanctum</li>
                        <li><strong>Computation:</strong> Python, Flask, networkx</li>
                        <li><strong>Solver:</strong> Python, FastAPI, MiniZinc, OR-Tools</li>
                        <li><strong>OPC-UA:</strong> Python, FastAPI, opcua</li>
                        <li><strong>AI Service:</strong> Python, FastAPI, Ollama</li>
                        <li><strong>PDF Service:</strong> Python, Flask, ReportLab</li>
                        <li><strong>DB:</strong> MySQL 8.4</li>
                        <li><strong>Real-Time:</strong> Laravel Reverb (WebSocket)</li>
                        <li><strong>Infra:</strong> Docker (14 container), k3s, Nginx</li>
                        <li><strong>Monitoring:</strong> Grafana, Loki, Promtail</li>
                        <li><strong>Licensing:</strong> Servizio dedicato, JWT firmati, feature-gating</li>
                        <li><strong>Security:</strong> Wazuh, Suricata, SonarQube, Trivy, Snyk</li>
                      </ul>
                    </article>
                  </li>
                </ul>
              </section>

               {/* Box Navigazione */}
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/">{t('freelance.sidebarHome')}</Link></h3></header>
                      <p>{t('freelance.sidebarHomeDesc')}</p>
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

export default FreelanceDetails;
