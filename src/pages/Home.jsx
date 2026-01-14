// src/pages/Home.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Home = () => {
  // Stato per gestire l'apertura del menu a tendina
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const terminalLines = [
    "> ./init_profile.sh",
    "> Loading Nicholas Arcari...",
    "> Computer Science Graduate & Cybersecurity Enthusiast",
    "> Modules: [WebDev, Network_Sec, DevOps]",
    "> Ready."
  ];

  // Funzione per lo scroll fluido alle sezioni (Profilo, Esperienza)
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="page-wrapper">
      
      {/* --- HEADER --- */}
      <section id="header">
        <div className="container">
          {/* Logo */}
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          
          {/* Effetto Terminale */}
          <br />
          <TerminalText lines={terminalLines} />
          
          {/* Navigazione */}
          <nav id="nav">
            <ul>
              <li className="current">
                <Link className="icon solid fa-home" to="/"><span>Home</span></Link>
              </li>
              
              {/* Link Profilo */}
              <li>
                <a 
                  className="icon solid fa-user" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('banner'); }} 
                  style={{ cursor: 'pointer' }}
                >
                  <span>Profilo</span>
                </a>
              </li>
              
              {/* Link Esperienza */}
              <li>
                <a 
                  className="icon solid fa-briefcase" 
                  onClick={(e) => { e.preventDefault(); scrollToSection('main'); }} 
                  style={{ cursor: 'pointer' }}
                >
                  <span>Esperienza</span>
                </a>
              </li>
              
              {/* MENU A TENDINA PASSIONI */}
              <li 
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
                style={{ position: 'relative' }}
              >
                <a 
                  className="icon solid fa-glass-cheers" 
                  style={{ cursor: 'pointer' }}
                >
                  <span>Passioni</span>
                </a>
                
                {/* Sottomenu */}
                {isDropdownOpen && (
                  <ul style={{ 
                    display: 'block', 
                    position: 'absolute', 
                    top: '100%', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    backgroundColor: '#fff', // Sfondo bianco per renderlo leggibile
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    padding: '10px 0',
                    minWidth: '200px',
                    zIndex: 1000,
                    listStyle: 'none',
                    margin: 0
                  }}>
                    <li style={{ padding: '5px 20px', borderTop: 'none' }}>
                      <Link to="/ricette" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>
                        Ricette di Mamma Niky
                      </Link>
                    </li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}>
                      <Link to="/cocktail" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>
                        I miei Cocktail
                      </Link>
                    </li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}>
                      <Link to="/stampe3d" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>
                        Stampe 3D
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              <li>
                <a className="icon brands fa-github" href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer">
                  <span>GitHub</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section id="features">
        <div className="container">
          <header>
            <h2>Competenze <strong>Tecniche</strong></h2>
          </header>
          <div className="row aln-center">
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="images/pic01.jpg" alt="Cybersecurity" /></a>
                <header><h3>Cybersecurity</h3></header>
                <p>Vulnerability assessment, <br />Sicurezza web (OWASP Top 10), <br />Hardening Linux, <br />Network Analysis (Nmap, Burp Suite, Wazuh).</p>
              </section>
            </div>
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="images/pic02.jpg" alt="Web Development" /></a>
                <header><h3>Fullstack Web Dev</h3></header>
                <p>Backend: PHP, Python, Laravel 12+ <br />Frontend: React, Vite, HTML/CSS <br />Database: MySQL, PostgreSQL</p>
              </section>
            </div>
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="images/pic03.jpg" alt="DevOps" /></a>
                <header><h3>DevOps & Systems</h3></header>
                <p>Docker, Kubernetes, <br />Git/GitHub, <br />Bash Scripting, Linux (Ubuntu, Kali), <br />Gestione servizi e networking TCP/IP.</p>
              </section>
            </div>
          </div>
        </div>
      </section>

      {/* --- BANNER --- */}
      <section id="banner">
        <div className="container">
          <p><strong>Neolaureato in Scienze Informatiche</strong><br />con forte interesse per la Cybersecurity e esperienza in laboratorio per vulnerability assessment, sicurezza web (OWASP Top 10) e hardening di sistemi Linux.</p>
        </div>
      </section>

      {/* --- MAIN --- */}
      <section id="main">
        <div className="container">
          <div className="row">

            {/* Content */}
            <div id="content" className="col-8 col-12-medium">
              
              <article className="box post">
                <header><h2><a href="#">Esperienze di <strong>Lavoro</strong></a></h2></header>
                <h3>Freelance Fullstack Web Developer (2025 - Oggi)</h3>
                <p>
                  Sviluppo di una piattaforma gestionale Fullstack per la <strong>digitalizzazione e l'automazione integrale dei processi aziendali</strong>, 
                  dal reparto amministrativo fino alla linea di produzione.
                  <br />
                  Il progetto ha previsto la migrazione da sistemi legacy ad un'architettura web containerizzata sicura, 
                  gestendo ordini, calcoli complessi e generando output diretti per i macchinari industriali.
                </p>
                <h3>Esperienze Precedenti</h3>
                <ul>
                  <li><strong>Guardia Giurata (G.P.G.), CoopService (2023-2024):</strong> Attività di presidio e coordinamento in contesti sensibili.</li>
                  <li><strong>Magazziniere, GLS (2021-2022):</strong> Supporto logistica e gestione carichi.</li>
                </ul>
              </article>

              <article className="box post">
                <header><h2><a href="#">Progetti di <strong>Cybersecurity</strong></a></h2></header>
                <a href="https://github.com/Nicholas-Arcari" className="image featured"><img src="images/img1.jpg" alt="Cybersecurity Lab" /></a>
                <p>Una selezione dei principali progetti pratici presenti nel mio portfolio GitHub, focalizzati su hardening, analisi di rete e offensive security.</p>
                <hr />
                <h3>Cybersecurity Labs</h3>
                <p>Laboratorio completo diviso in 10 moduli, dalla <strong>Recon</strong> alla <strong>Defense</strong>. Include tool custom per Social Engineering, simulazioni di Web Attacks, configurazione di Honeypots e Post-Exploitation.<br /><strong>Stack:</strong> <span className="tech-stack">Python, Bash, Docker, Linux Security</span></p>
                <a href="https://github.com/Nicholas-Arcari/cybersecurity-labs" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">Vedi Repo</a>
                <br /><br />
                <hr />
                <h3>RaspberryPi Home Lab</h3>
                <p>Configurazione e hardening di un'infrastruttura di rete domestica sicura. Implementazione di <strong>VPN</strong> (WireGuard), blocco pubblicità (Pi-hole), <strong>NAS</strong> sicuro e un <strong>Honeypot</strong> di rete per rilevare intrusioni.<br /><strong>Stack:</strong> <span className="tech-stack">Linux (Raspbian), Docker, OpenVPN/WireGuard, Pi-hole</span></p>
                <a href="https://github.com/Nicholas-Arcari/RaspberryPi" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">Vedi Repo</a>
                <br /><br />
                <hr />
                <h3>Tor Networking Guide</h3>
                <p>Guida e script per la navigazione anonima e la configurazione di servizi nascosti. Analisi del routing <strong>Onion</strong> e best practices per la privacy digitale.<br /><strong>Stack:</strong> <span className="tech-stack">Tor Browser, Proxychains, Network Privacy</span></p>
                <a href="https://github.com/Nicholas-Arcari/tor-networking-guide" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">Vedi Repo</a>
                <br /><br />
                <hr />
                <h3>Flipper Zero</h3>
                <p>Esplorazione e auditing di protocolli radio e sistemi di controllo accessi. Analisi segnali <strong>Sub-GHz</strong>, clonazione tag <strong>NFC/RFID</strong> e automazione badUSB.<br /><strong>Stack:</strong> <span className="tech-stack">Flipper Zero, GPIO, Radio Protocols, Hardware Hacking</span></p>
                <a href="https://github.com/Nicholas-Arcari/FlipperZero-guide" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">Vedi Repo</a>
              </article>
            </div>

            {/* Sidebar */}
            <div id="sidebar" className="col-4 col-12-medium">
              <section>
                <ul className="divided">
                  <li>
                    <article className="box excerpt">
                      <header><span className="date">2021 - 2025</span><h3><a href="#">Università di Parma</a></h3></header>
                      <p>Laurea Triennale in Scienze Informatiche.<br />Voto: <strong>90/110</strong>.</p>
                    </article>
                  </li>
                  <li>
                    <article className="box excerpt">
                      <header><span className="date">2016 - 2021</span><h3><a href="#">IISS Berenini</a></h3></header>
                      <p>Maturità scientifica opzione scienze applicate.<br />Voto: <strong>88/100</strong>.</p>
                    </article>
                  </li>
                </ul>
              </section>
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><a href="#">Certificazioni</a></h3></header>
                      <ul>
                        <li><strong>Cisco CCNA 200-301</strong> (in corso)</li>
                        <li><strong>CompTIA Security+ SY0-701</strong> (in preparazione)</li>
                      </ul>
                    </article>
                  </li>
                </ul>
              </section>
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/ricette">Non solo codice...</Link></h3></header>
                      <p>Quando non sono al terminale, mi dedico alla cucina e alla mixology. Scopri le mie ricette e i miei cocktail.</p>
                      <Link to="/ricette" className="button icon solid fa-utensils">Vai alle Ricette</Link>
                      <br /><br />
                      <Link to="/cocktail" className="button icon solid fa-glass-martini">Vai ai Cocktail</Link>
                    </article>
                  </li>
                </ul>
              </section>
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><a href="#">Soft Skills</a></h3></header>
                      <p>- Improvvisazione e flessibilità mentale.<br />- Gestione efficace dello stress che si riassume come "immunità all'ansia".<br />- Problem solving autonomo.</p>
                    </article>
                  </li>
                </ul>
              </section>
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight" style={{ textAlign: 'center' }}>
                      <header><h3><a href="#">Curriculum Vitae</a></h3></header>
                      <p>Scarica il documento completo.</p>
                      <a href="assets/cv/cv_arcari_nicholas.pdf" className="button icon solid fa-download" download>Scarica CV (PDF)</a>
                    </article>
                  </li>
                </ul>
              </section>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER AGGIORNATO (Senza Form) --- */}
      <section id="footer">
        <div className="container">
          <header>
            <h2>Contatti</h2>
          </header>
          <div className="row aln-center"> {/* Centrato orizzontalmente */}
            
            <div className="col-12 col-12-medium" style={{ textAlign: 'center' }}>
              <section>
                {/*
                <p style={{ fontSize: '1.2em', marginBottom: '2em' }}>
                  Contattami per collaborazioni in ambito Sviluppo Web Fullstack o progetti di Cybersecurity.
                </p>
                */}
                
                {/* Contenitore contatti centrato */}
                <div style={{ display: 'inline-block', textAlign: 'center' }}>
                  <ul className="icons" style={{ listStyle: 'none', padding: 0 }}>
                    <li className="icon solid fa-home" style={{ marginBottom: '1em', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginLeft: '15px' }}>
                        Via Scipione 45/A<br />
                        43039, Salsomaggiore Terme (PR)<br />
                        Italia
                      </span>
                    </li>
                    <li className="icon solid fa-phone" style={{ marginBottom: '1em', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginLeft: '15px' }}>+39 351 714 0966</span>
                    </li>
                    <li className="icon solid fa-envelope" style={{ marginBottom: '1em', display: 'flex', alignItems: 'center' }}>
                      <a href="mailto:arcari.nicholaso@gmail.com" style={{ marginLeft: '15px' }}>arcari.nicholas0@gmail.com</a>
                    </li>
                    <li className="icon brands fa-instagram" style={{ marginBottom: '1em', display: 'flex', alignItems: 'center' }}>
                      <a href="https://www.instagram.com/diokaneki_/" target="_blank" rel="noreferrer" style={{ marginLeft: '15px' }}>
                        @diokaneki_
                      </a>
                    </li>
                    <li className="icon brands fa-instagram" style={{ display: 'flex', alignItems: 'center' }}>
                      <a href="https://www.instagram.com/nicholas.arcari/" target="_blank" rel="noreferrer" style={{ marginLeft: '15px' }}>
                        @nicholas.arcari
                      </a>
                    </li>
                    <li className="icon brands fa-github" style={{ display: 'flex', alignItems: 'center' }}>
                      <a href="https://github.com/Nicholas-Arcari" style={{ marginLeft: '15px' }}>github.com/Nicholas-Arcari</a>
                    </li>
                  </ul>
                </div>

              </section>
            </div>

          </div>
        </div>
        
        {/* Copyright */}
        <div id="copyright" className="container">
          <ul className="links">
            <li>&copy; Nicholas Arcari. All rights reserved.</li><li>Design: HTML5 UP</li>
          </ul>
        </div>
      </section>

    </div>
  );
};

export default Home;