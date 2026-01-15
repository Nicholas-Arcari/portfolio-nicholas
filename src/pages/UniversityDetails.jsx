// src/pages/UniversityDetails.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const UniversityDetails = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const terminalLines = [
    "> ./load_module.sh --education",
    "> Loading Transcript...",
    "> Calculating GPA...",
    "> Status: Graduated (90/110).",
    "> Ready."
  ];

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
                  <header><h2>Università di Parma</h2></header>
                  <p>Laurea Triennale in Scienze Informatiche (2021 - 2025).</p>
                  
                  <h3>Percorso di Studi</h3>
                  <p>Il corso di laurea ha fornito solide basi teoriche e pratiche nell'ambito dell'informatica pura, spaziando dagli algoritmi alla sicurezza delle reti.</p>

                  <hr />

                  <h3>Esami Chiave e Competenze Acquisite</h3>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    <li><strong>Programmazione & Algoritmi:</strong> Approfondimento di C, C++, Java e Python. Studio della complessità computazionale e strutture dati.</li>
                    <li><strong>Reti di Calcolatori:</strong> Architettura TCP/IP, routing, protocolli di livello applicazione e sicurezza di rete.</li>
                    <li><strong>Basi di Dati:</strong> Progettazione E-R, SQL, normalizzazione e gestione DBMS.</li>
                    <li><strong>Sistemi Operativi:</strong> Gestione processi, memoria, file system e programmazione concorrente (Linux/Unix).</li>
                    <li><strong>Ingegneria del Software:</strong> Metodologie Agile, design pattern e ciclo di vita del software.</li>
                    <li><strong>Sicurezza Informatica:</strong> Crittografia, sicurezza web e principi di ethical hacking.</li>
                  </ul>

                  <hr />

                  <h3>Tesi di Laurea</h3>
                  <p>Analisi e sviluppo di soluzioni per la gestione sicura e l'automazione dei processi in ambienti industriali, integrando tecnologie web moderne con hardware legacy.</p>
               </article>
            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium">
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/">Torna alla Home</Link></h3></header>
                      <p>Vuoi vedere le mie esperienze lavorative o le mie passioni?</p>
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

export default UniversityDetails;