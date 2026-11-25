// src/pages/FreelanceDetails.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import '../i18n/freelance';
import '../i18n/nav';

const FreelanceDetails = () => {
  const { t } = useLanguage();

  usePageLayout('right-sidebar');

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <SiteHeader terminal={t('freelance.terminal')} />

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
                        <p style={{ margin: 0, lineHeight: '1.2', textAlign: 'left' }}>{t('freelance.kpi.time')}</p>
                    </div>
                    <div className="col-4 col-12-small" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>AI</h3>
                        <p style={{ margin: 0, lineHeight: '1.2', textAlign: 'left' }}>{t('freelance.kpi.ai')}</p>
                    </div>
                    <div className="col-4 col-12-small" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>4.0 & 5.0</h3>
                        <p style={{ margin: 0, lineHeight: '1.2', textAlign: 'left' }}>{t('freelance.kpi.industry')}</p>
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

               {/* GESTIONALE ERP/CRM */}
               <article className="box post">
                  <header>
                    <h2>{t('freelance.erp.title')}</h2>
                    <p style={{ fontStyle: 'italic', color: '#666' }}>
                      {t('freelance.erp.subtitle')}
                    </p>
                  </header>

                  {/* KPI - LAYOUT SX - CENTRO - DX */}
                  <div className="row aln-center" style={{ margin: '2em 0', alignItems: 'flex-start' }}>
                    <div className="col-4 col-12-small" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>100%</h3>
                        <p style={{ margin: 0, lineHeight: '1.2', textAlign: 'left' }}>{t('freelance.erp.kpi.tests')}</p>
                    </div>
                    <div className="col-4 col-12-small" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>ASVS L2</h3>
                        <p style={{ margin: 0, lineHeight: '1.2', textAlign: 'left' }}>{t('freelance.erp.kpi.security')}</p>
                    </div>
                    <div className="col-4 col-12-small" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>E2E</h3>
                        <p style={{ margin: 0, lineHeight: '1.2', textAlign: 'left' }}>{t('freelance.erp.kpi.flow')}</p>
                    </div>
                  </div>

                  <hr />

                  {/* 1. IL PROBLEMA */}
                  <h3>{t('freelance.erp.problemTitle')}</h3>
                  <p>{t('freelance.erp.problemDesc')}</p>

                  <hr />

                  {/* 2. IL MIO RUOLO */}
                  <h3>{t('freelance.erp.roleTitle')}</h3>
                  <p>{t('freelance.erp.roleDesc')}</p>

                  <hr />

                  {/* 3. LA SOLUZIONE DETTAGLIATA */}
                  <h3>{t('freelance.erp.solutionTitle')}</h3>
                  <p>{t('freelance.erp.solutionIntro')}</p>

                  <h4>{t('freelance.erp.salesTitle')}</h4>
                  <p>{t('freelance.erp.salesIntro')}</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    {t('freelance.erp.salesItems').map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>

                  <h4>{t('freelance.erp.prodTitle')}</h4>
                  <p>{t('freelance.erp.prodIntro')}</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    {t('freelance.erp.prodItems').map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>

                  <h4>{t('freelance.erp.adminTitle')}</h4>
                  <p>{t('freelance.erp.adminIntro')}</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    {t('freelance.erp.adminItems').map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>

                  <hr />

                  {/* 4. SICUREZZA E QUALITA' */}
                  <h3>{t('freelance.erp.securityTitle')}</h3>
                  <p>{t('freelance.erp.securityDesc')}</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    {t('freelance.erp.securityItems').map((item, i) => (
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

               {/* Box Tecnologie Gestionale */}
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3>{t('freelance.erp.sidebarTechTitle')}</h3></header>
                      <p>{t('freelance.erp.sidebarTechDesc')}</p>
                      <ul className="check-list" style={{ listStyle: 'none', padding: 0 }}>
                        <li><strong>Backend:</strong> Java 25, Spring Boot 4, Spring Modulith</li>
                        <li><strong>Persistence:</strong> Spring Data JDBC, Flyway</li>
                        <li><strong>Frontend:</strong> React 19, TypeScript, Vite, Tailwind, shadcn/ui</li>
                        <li><strong>State & Forms:</strong> TanStack Query, React Hook Form, Zod</li>
                        <li><strong>API:</strong> REST, OpenAPI 3.1</li>
                        <li><strong>DB:</strong> MySQL 8.4</li>
                        <li><strong>Real-Time:</strong> Server-Sent Events</li>
                        <li><strong>Documents:</strong> PDF Service, Apache POI, FatturaPA XML</li>
                        <li><strong>Security:</strong> Spring Security, Argon2id, OWASP ASVS L2</li>
                        <li><strong>Infra:</strong> Docker, k3s, Kustomize, Traefik, Nginx</li>
                        <li><strong>Quality:</strong> Error Prone, SpotBugs, Semgrep, Trivy, JaCoCo</li>
                        <li><strong>Testing:</strong> JUnit 5, Testcontainers, Vitest, Playwright</li>
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
