// src/pages/FreelanceDetails.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const FreelanceDetails = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const terminalLines = [
    "> ./load_project.sh --freelance",
    "> Loading System Architecture...",
    "> Accessing Legacy Data...",
    "> Status: Production Ready.",
    "> Ready."
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
               <article className="box post">
                  <header><h2>Freelance Fullstack Developer</h2></header>
                  <p>Digitalizzazione e automazione dei processi aziendali per un'azienda produttrice di monoblocchi per serramenti.</p>
                  
                  <h3>Il Problema (Legacy System)</h3>
                  <p>Ho preso in carico un sistema gestionale originariamente sviluppato in Excel con macro VBA. Il sistema era diventato instabile e difficile da manutenere dopo l'uscita del precedente sviluppatore, creando un collo di bottiglia tra l'ufficio tecnico e la produzione.</p>

                  <hr />

                  <h3>La Soluzione (Architettura Moderna)</h3>
                  <p>Ho progettato e sviluppato da zero una <strong>Web App containerizzata</strong> basata su API RESTful, accessibile via browser da qualsiasi postazione aziendale (ufficio e fabbrica).</p>
                  
                  <h4>Funzionalità Chiave:</h4>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    <li><strong>Gestione Ruoli (RBAC):</strong> Admin (gestione formule/utenti/log), User (creazione commesse/piano di carico), Developer.</li>
                    <li><strong>Sicurezza:</strong> Autenticazione tramite Token Sanctum, tracking IP, notifiche email automatiche (Brevo) per accessi sospetti o cambi password.</li>
                    <li><strong>Automazione Calcoli:</strong> Script Python che applicano formule brevettate su database JSON strutturati.</li>
                    <li><strong>Output di Produzione:</strong> Generazione automatica di archivi ZIP contenenti PDF, CSV, DXF e TLF pronti per le macchine a controllo numerico.</li>
                  </ul>

                  <hr />

                  <h3>Tech Stack & Strumenti</h3>
                  <p>
                    <strong>Frontend:</strong> React, Vite, HTML5, CSS3.<br />
                    <strong>Backend:</strong> PHP (Laravel 12), Python (Scripting).<br />
                    <strong>Database:</strong> MySQL, phpMyAdmin.<br />
                    <strong>DevOps:</strong> Docker, Podman, Kubernetes, Server Windows.<br />
                    <strong>Industria 4.0:</strong> Interazione con macchine aziendali e protocolli standard (PLC, OPC UA).
                  </p>
               </article>
            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium">
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