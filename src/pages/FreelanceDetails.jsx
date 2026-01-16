// src/pages/FreelanceDetails.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const FreelanceDetails = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const projectName = "FrameFlow AI"; 

  const terminalLines = [
    `> ./load_product.sh --${projectName.toLowerCase().replace(' ', '-')}`,
    "> Analyzing Legacy Bottlenecks...",
    "> Initializing Computer Vision...",
    "> Optimizing Logistics Sorting...",
    "> Status: Production Ready."
  ];

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
          <TerminalText lines={terminalLines} />
          
          <nav id="nav">
            <ul>
              <li><Link className="icon solid fa-home" to="/"><span>Home</span></Link></li>
              <li 
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
                style={{ position: 'relative' }} 
              >
                <a className="icon solid fa-glass-cheers" style={{ cursor: 'pointer' }}><span>Passioni</span></a>
                {isDropdownOpen && (
                  <ul style={{ 
                    display: 'block', position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', 
                    backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '4px', 
                    padding: '10px 0', minWidth: '200px', zIndex: 1000, listStyle: 'none', margin: 0
                  }}>
                    <li style={{ padding: '5px 20px', borderTop: 'none' }}><Link to="/ricette" style={{ display: 'block', color: '#444' }}>Ricette di Mamma Niki</Link></li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/cocktail" style={{ display: 'block', color: '#444' }}>I miei Cocktail</Link></li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/stampe3d" style={{ display: 'block', color: '#444' }}>Stampe 3D</Link></li>
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
                    <h2>{projectName}: Enterprise ERP & Automation</h2>
                    <p style={{ fontStyle: 'italic', color: '#666' }}>
                      Piattaforma gestionale Fullstack per la digitalizzazione totale dei processi manifatturieri, dall'analisi tecnica AI al controllo macchine CNC.
                    </p>
                  </header>
                  
                  {/* KPI - LAYOUT SX - CENTRO - DX */}
                  <div className="row aln-center" style={{ margin: '2em 0', alignItems: 'flex-start' }}>
                    <div className="col-4 col-12-small" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>-99%</h3>
                        <p style={{ margin: 0, lineHeight: '1.2' }}>Tempo Elaborazione<br />Commessa</p>
                    </div>
                    <div className="col-4 col-12-small" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>AI</h3>
                        <p style={{ margin: 0, lineHeight: '1.2' }}>Lettura Automatica<br />Schede Tecniche</p>
                    </div>
                    <div className="col-4 col-12-small" style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>4.0 & 5.0</h3>
                        <p style={{ margin: 0, lineHeight: '1.2' }}>Integrazione<br />Industriale</p>
                    </div>
                  </div>

                  <hr />

                  {/* 1. IL PROBLEMA */}
                  <h3>Il Problema: Limiti dei Sistemi Legacy</h3>
                  <p>
                    L'azienda operava con un sistema basato su fogli <strong>Excel e macro VBA datate</strong>, ormai instabili e non manutenibili.
                    Questo approccio comportava rischi critici: errori umani nell'inserimento dati, tempi di calcolo di svariate ore per commesse complesse e l'impossibilità di scalare la produzione. Serviva una soluzione radicale per digitalizzare il flusso informativo.
                  </p>

                  <hr />

                  {/* 2. IL MIO RUOLO */}
                  <h3>Il Mio Ruolo: Fullstack Architect</h3>
                  <p>
                    Ho gestito l'intero ciclo di vita del software: dall'analisi dei requisiti con l'ufficio tecnico alla progettazione dell'architettura containerizzata, fino allo sviluppo del core AI in Python e del frontend in React. Ho curato personalmente il deployment in fabbrica (dallo sviluppo alla produzione) e la formazione del personale.
                  </p>

                  <hr />

                  {/* 3. LA SOLUZIONE DETTAGLIATA */}
                  <h3>La Soluzione: Architettura e Funzionamento</h3>
                  <p>Ho sviluppato una Web App modulare che copre tre aree aziendali nevralgiche:</p>

                  <h4>A. Reparto Produzione: AI & Computer Vision</h4>
                  <p>L'innovazione principale risiede nell'eliminazione del data entry manuale. Il sistema offre:</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    <li><strong>Input Intelligente (OCR & LLM):</strong> L'utente può caricare direttamente i file PDF, DXF o DWG delle schede tecniche. Sfruttando <strong>Large Language Models</strong> e algoritmi Python proprietari, l'applicativo "legge" l'immagine, comprende le quote e rileva la presenza di accessori senza che l'utente debba selezionarli manualmente.</li>
                    <li><strong>Engine di Calcolo Seriale:</strong> Una volta acquisiti i dati, un motore Python esegue la computazione. Non è stato necessario il parallelismo poiché l'ottimizzazione del codice seriale ha ridotto i tempi di elaborazione da diverse ore a <strong>meno di un minuto</strong>.</li>
                    <li><strong>Industria 4.0 e 5.0:</strong> Generazione automatica di file macchina (TLF, DXF) e invio diretto ai macchinari industriali tramite protocolli standard. L'invio è ordinabile per ottimizzare la logistica di magazzino.</li>
                  </ul>

                  <h4>B. Reparto Commerciale: Automazione Documentale</h4>
                  <p>Il sistema agisce come un gestionale evoluto:</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    <li><strong>Creazione Schede Tecniche:</strong> Un processo che richiedeva giorni è ora pressoché istantaneo grazie agli script di automazione.</li>
                    <li><strong>Preventivi e Fatture:</strong> Generazione rapida e tracciata di documenti fiscali e offerte commerciali.</li>
                  </ul>

                  <h4>C. Reparto Amministrativo & Logistica Avanzata</h4>
                  <p>L'utente amministratore ha il controllo totale sulla configurazione dei processi e sulla logistica:</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    <li><strong>Algoritmi di Sorting (Piano di Carico):</strong> Sono stati implementati algoritmi di ordinamento specifici, inoltre, è stata sfruttata la programmazione a vincoli per calcolare l'incastro matematicamente perfetto dei colli su bilici e magazzino, massimizzando la saturazione volumetrica.</li>
                    <li><strong>Monitoraggio Enterprise:</strong> Controllo granulare dei log tramite <strong>Loki</strong> e dashboard <strong>Grafana</strong>.</li>
                    <li><strong>Comunicazione Sicura:</strong> Integrazione nativa con <strong>ProtonMail</strong> per notifiche criptate.</li>
                  </ul>

                  <hr />

                  {/* 4. SICUREZZA */}
                  <h3>Sicurezza e Infrastruttura</h3>
                  <p>
                    L'intera infrastruttura è protetta secondo standard enterprise:
                    monitoraggio attivo delle intrusioni tramite SIEM (<strong>Wazuh</strong> e <strong>Suricata</strong>),
                    accesso via VPN, firewall perimetrali e autenticazione applicativa robusta.
                  </p>

               </article>
            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium">
               
               {/* Box Tecnologie */}
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3>Tech Stack</h3></header>
                      <p>Tecnologie scelte per performance e stabilità.</p>
                      <ul className="check-list" style={{ listStyle: 'none', padding: 0 }}>
                        <li><strong>Frontend:</strong> React, Vite</li>
                        <li><strong>Backend:</strong> PHP (Laravel 12)</li>
                        <li><strong>AI Core:</strong> Python (LLM, OpenCV), Minizink</li>
                        <li><strong>DB:</strong> MySQL, PhpMyAdmin</li>
                        <li><strong>DevOps:</strong> Docker, Kubernetes</li>
                        <li><strong>Security:</strong> Wazuh, Suricata</li>
                        <li><strong>Monitoring:</strong> Grafana, Loki, ProtonMail</li>
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
                      <header><h3><Link to="/">Torna alla Home</Link></h3></header>
                      <p>Vuoi vedere gli altri progetti o il mio percorso accademico?</p>
                      <Link to="/" className="button icon solid fa-home">Home</Link>
                    </article>
                  </li>
                </ul>
              </section>

            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <section id="footer">
        <div id="copyright" className="container">
           <ul className="links">
               <li>&copy; Nicholas Arcari.</li>
               <li><Link to="/">Torna alla Home</Link></li>
           </ul>
        </div>
      </section>
    </div>
  );
};

export default FreelanceDetails;