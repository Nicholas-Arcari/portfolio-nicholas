// src/pages/FreelanceDetails.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const FreelanceDetails = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const projectName = "FrameFlow AI"; 

  const terminalLines = [
    `> ./load_product.sh --${projectName.toLowerCase().replace(' ', '-')}`,
    "> Initializing LLM Vision Module...",
    "> Connecting to PLC Interface...",
    "> Optimizing Sorting Algorithms...",
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
                    <li style={{ padding: '5px 20px', borderTop: 'none' }}><Link to="/ricette" style={{ display: 'block', color: '#444' }}>Ricette</Link></li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/cocktail" style={{ display: 'block', color: '#444' }}>Cocktail</Link></li>
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
                    <p>Piattaforma gestionale Fullstack per l'industria manifatturiera. Sostituisce un sistema legacy in VBA con un'architettura moderna, integrando AI e algoritmi di ottimizzazione.</p>
                  </header>
                  
                  {/* KPI*/}
                  <div className="row aln-center" style={{ margin: '2em 0', textAlign: 'center', alignItems: 'flex-start' }}>
                    
                    <div className="col-4 col-12-small">
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>-99%</h3>
                        <p style={{ margin: 0, lineHeight: '1.2' }}>Tempo Elaborazione<br />Commessa</p>
                    </div>
                    
                    <div className="col-4 col-12-small">
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>AI</h3>
                        <p style={{ margin: 0, lineHeight: '1.2' }}>Lettura Automatica<br />Schede</p>
                    </div>
                    
                    <div className="col-4 col-12-small">
                        <h3 style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.2em', lineHeight: '1' }}>4.0 & 5.0</h3>
                        <p style={{ margin: 0, lineHeight: '1.2' }}>Integrazione<br />Macchinari</p>
                    </div>

                  </div>

                  <hr /><br />

                  <h3>1. Reparto Produzione: Il Cuore Operativo</h3>
                  <p>L'applicativo rivoluziona l'inserimento dati e la generazione degli output produttivi:</p>
                  
                  <h4>Acquisizione Dati con LLM & Computer Vision</h4>
                  <p>Il sistema elimina l'inserimento manuale (comunque disponibile). L'utente carica il PDF, DXF o DWG della scheda tecnica firmata dal cliente e l'applicativo:</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    <li><strong>Analizza l'immagine:</strong> Sfruttando algoritmi Python e LLM (Large Language Models).</li>
                    <li><strong>Estrae le misure:</strong> Riconosce automaticamente le quote dei componenti.</li>
                    <li><strong>Rileva Accessori:</strong> Identifica visivamente la presenza di accessori extra senza input umano.</li>
                    <li><strong>Salva nel DB:</strong> Popola il database relazionale, pronto per la computazione.</li>
                  </ul>

                  <h4>Computazione Seriale & Output</h4>
                  <p>Il motore di calcolo Python applica formule brevettate e regole logiche (If/Then) definite dall'utente. L'elaborazione, ottimizzata con librerie open-source, è passata da <strong>diverse ore a meno di un minuto</strong> per commesse complesse.</p>
                  <p><strong>Output generati (ZIP):</strong> PDF tecnici, CSV per reportistica, file TLF e DXF per il taglio.</p>

                  <h4>Industria 4.0 & 5.0</h4>
                  <p>Al termine della computazione, il sistema invia i dati (tramite CSV formattati ad hoc) direttamente ai <strong>macchinari industriali</strong>. L'ordine di invio è personalizzabile dall'utente per ottimizzare lo spazio logistico in magazzino e i tempi macchina.</p>

                  <br /><hr /><br />

                  <h3>2. Reparto Commerciale: Velocità di Esecuzione</h3>
                  <p>L'applicativo funge da CRM avanzato. La creazione di schede tecniche, preventivi e fatture è stata completamente automatizzata.</p>
                  <blockquote>
                    "Processi che richiedevano giorni di lavoro manuale ora vengono completati in pochi minuti, permettendo al reparto vendite di rispondere istantaneamente alle richieste dei clienti."
                  </blockquote>

                  <br /><hr /><br />

                  <h3>3. Reparto Amministrativo & Logistica</h3>
                  <p>L'amministrazione ha il controllo totale sui processi:</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    <li><strong>Gestione Processi:</strong> Personalizzazione dei flussi di lavoro tra i vari reparti.</li>
                    <li><strong>Algoritmi di Sorting (Piano di Carico):</strong> Sono stati implementati algoritmi di ordinamento avanzati per calcolare automaticamente il piano di carico ottimale per il magazzino e per i bilici (camion), massimizzando lo spazio disponibile.</li>
                    <li><strong>Monitoraggio:</strong> Controllo granulare dei log tramite <strong>Loki</strong> e dashboard <strong>Grafana</strong>.</li>
                    <li><strong>Comunicazione:</strong> Integrazione con ProtonMail per comunicazioni criptate.</li>
                  </ul>

                  <br /><hr /><br />

                  <h3>Sicurezza Enterprise (Defense in Depth)</h3>
                  <p>L'infrastruttura è blindata su più livelli:</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    <li><strong>SIEM:</strong> Monitoraggio attivo delle minacce con <strong>Wazuh</strong> e <strong>Suricata</strong>.</li>
                    <li><strong>Accesso:</strong> VPN aziendale, Firewall perimetrali e autenticazione Token (Sanctum).</li>
                    <li><strong>GDPR:</strong> Tracking degli accessi e gestione utenti RBAC (Role-Based Access Control).</li>
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
                      <header><h3>Tech Stack</h3></header>
                      <p>Architettura solida e scalabile.</p>
                      <ul className="check-list" style={{ listStyle: 'none', padding: 0 }}>
                        <li>✅ <strong>Frontend:</strong> React, Vite</li>
                        <li>✅ <strong>Backend:</strong> PHP (Laravel 12)</li>
                        <li>✅ <strong>AI Engine:</strong> Python (LLM, OpenCV)</li>
                        <li>✅ <strong>DB:</strong> MySQL</li>
                        <li>✅ <strong>Infra:</strong> Docker, Kubernetes</li>
                        <li>✅ <strong>Monitoring:</strong> Grafana, Loki, Wazuh</li>
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