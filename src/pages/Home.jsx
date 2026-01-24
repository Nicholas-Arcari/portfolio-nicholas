// src/pages/Home.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Home = () => {
  // Stato per gestire l'apertura del menu a tendina
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- NUOVI STATI PER LE SEZIONI ESPANDIBILI ---
  const [showWork, setShowWork] = useState(false); // Default: nascosto
  const [showCyber, setShowCyber] = useState(false); // Default: nascosto

  const terminalLines = [
    "> ./init_profile.sh",
    "> Loading Nicholas Arcari...",
    "> Computer Science Graduate & Cybersecurity Enthusiast",
    "> Modules: [WebDev, Network_Sec, DevOps]",
    "> Ready."
  ];

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

              {/* NUOVO LINK: Chi Sono / About */}
              <li>
                <Link className="icon solid fa-user" to="/about"><span>Chi Sono</span></Link>
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
                    backgroundColor: '#fff',
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
                <a href="#" className="image featured"><img src="images/img5.jpg" alt="Cybersecurity" /></a>
                <header><h3>Cybersecurity</h3></header>
                <p>Vulnerability assessment, <br />Sicurezza web (OWASP Top 10), <br />Hardening Linux, <br />Network Analysis (Nmap, Burp Suite, Wazuh).</p>
              </section>
            </div>
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="images/img6.jpg" alt="Web Development" /></a>
                <header><h3>Fullstack Web Dev</h3></header>
                <p>Backend: PHP, Python, Laravel 12+ <br />Frontend: React, Vite, HTML/CSS <br />Database: MySQL, PostgreSQL</p>
              </section>
            </div>
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="images/img7.jpg" alt="DevOps" /></a>
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
          <p><strong>Laureato in Scienze Informatiche</strong><br />con forte interesse per la Cybersecurity e esperienza in laboratorio per vulnerability assessment, sicurezza web (OWASP Top 10) e hardening di sistemi Linux.</p>
        </div>
      </section>

      {/* --- MAIN --- */}
      <section id="main">
        <div className="container">
          <div className="row">

            {/* Content */}
            <div id="content" className="col-8 col-12-medium">
              
              {/* --- ARTICOLO 1: ESPERIENZE DI LAVORO (ESPANDIBILE) --- */}
              <article className="box post">
                <header>
                    <h2><a href="#">Esperienze di <strong>Lavoro</strong></a></h2>
                    {/* Bottone Toggle Lavoro */}
                    <div style={{ textAlign: 'left', marginTop: '15px', marginBottom: '20px' }}>
                        <button 
                            className="button alt small" 
                            onClick={() => setShowWork(!showWork)}
                        >
                            {showWork ? 'Nascondi Esperienze' : 'Mostra Esperienze'}
                            <i className={`icon solid ${showWork ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginLeft: '10px' }}></i>
                        </button>
                    </div>
                </header>
                
                {/* Contenuto Condizionale Lavoro */}
                {showWork && (
                    <div className="work-content-wrapper fade-in">
                      <br /><br />
                        <h3>Freelance Fullstack Web Developer (2025 - Oggi)</h3>
                        
                        <p>
                        Sviluppo di una piattaforma gestionale Fullstack per la <strong>digitalizzazione e l'automazione integrale dei processi aziendali</strong>, 
                        dal reparto amministrativo fino alla linea di produzione.
                        <br />
                        Il progetto ha previsto la migrazione da sistemi legacy ad un'architettura web containerizzata sicura, 
                        gestendo ordini, calcoli complessi e generando output diretti per i macchinari industriali.
                        </p>
                        
                        <p style={{ fontSize: '0.9em', color: '#666', borderLeft: '3px solid #ddd', paddingLeft: '10px' }}>
                        <strong>Tech Stack:</strong> Backend (PHP, Python, Laravel 12+), Frontend (React, Vite), 
                        Database (MySQL, PhpMyAdmin), DevOps (Docker, Kubernetes).
                        </p>

                        {/* BOTTONE VIEW MORE FREELANCE */}
                        <Link to="/freelance-details" className="button icon solid fa-arrow-circle-right" style={{ marginTop: '10px', marginBottom: '20px' }}>
                        Vedi Dettagli Progetto
                        </Link>

                        <br /><hr /><br />

                        <h3>Esperienze Precedenti</h3>
                        <ul>
                        <li><strong>Guardia Giurata (G.P.G.), CoopService, Parma (2023-2024)</strong><br />Gestione di situazioni ad alta responsabilità e collaborazione con personale sanitario
        e pubblico. Attività di presidio, coordinamento e controllo accessi in contesti sensibili.</li>
                        <li><strong>Operaio stagionale, Rodolfi Mansueto, Castelguelfo (2023)</strong><br />Produzione di vari tipi di passate di pomodoro durante le sue differenti fasi: pulizia,
        cottura, accatastamento in bancali.</li>
                        <li><strong>Magazziniere, GLS, Fidenza (2021-2022)</strong><br />Lavoro di squadra in attività di logistica, smistamento pacchi e coordinamento carichi.</li>
                        </ul>
                    </div>
                )}
              </article>

              {/* --- ARTICOLO 2: PROGETTI CYBERSECURITY (ESPANDIBILE) --- */}
              <article className="box post">
                <header>
                    <h2><a href="#">Progetti di <strong>Cybersecurity</strong></a></h2>
                    {/* Bottone Toggle Cyber */}
                    <div style={{ textAlign: 'left', marginTop: '15px', marginBottom: '20px' }}>
                        <button 
                            className="button alt small" 
                            onClick={() => setShowCyber(!showCyber)}
                        >
                            {showCyber ? 'Nascondi Progetti' : 'Mostra Progetti'}
                            <i className={`icon solid ${showCyber ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginLeft: '10px' }}></i>
                        </button>
                    </div>
                </header>

                {/* Contenuto Condizionale Cyber */}
                {showCyber && (
                    <div className="cyber-content-wrapper fade-in">
                      <br /><br />
                        <a href="https://github.com/Nicholas-Arcari" className="image featured"><img src="images/img1.jpg" alt="Cybersecurity Lab" /></a>
                        <p>Una selezione dei principali progetti pratici presenti nel mio portfolio GitHub, focalizzati su hardening, analisi di rete e offensive security.</p>
                        <hr />
                        
                        <h3>Cybersecurity Labs</h3>
                        <p>
                          Repository centrale strutturata seguendo il flusso logico della <strong>Cyber Kill Chain</strong> e di un Penetration Test reale. Il laboratorio è diviso in 10 moduli che coprono l'intero spettro delle operazioni:
                          <br /><br />
                          <strong>Red Team (Offensive):</strong> Dalla ricognizione (OSINT) e Vulnerability Assessment fino all'exploitation avanzata (Web, System & Wireless), Social Engineering e Post-Exploitation (Pivoting/Persistence).
                          <br />
                          <strong>Blue Team (Defensive):</strong> Difesa attiva con <strong>Wazuh</strong> (SIEM), Hardening di sistemi, configurazione Honeypots e Digital Forensics con <strong>Wireshark</strong>.
                          <br />
                          <strong>Cloud & Modern:</strong> Sicurezza per Docker, Kubernetes e ambienti Cloud (AWS/Azure).
                          <br /><br />
                          <strong>Stack:</strong> <span className="tech-stack">Python, Bash, Kali Linux, Docker, Wazuh, Burp Suite</span>
                        </p>
                        <a href="https://github.com/Nicholas-Arcari/cybersecurity-labs" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">Vedi Repo</a>
                        
                        <br /><br />
                        <hr />
                        
                        <h3>Raspberry Pi Home Lab</h3>
                        <p>
                          Server multifunzione basato su <strong>OpenMediaVault</strong> e <strong>Docker</strong> con boot da NVMe. Architettura segmentata (DMZ/Mgmt) che integra uno stack di sicurezza Enterprise:
                          <br /><br />
                          <strong>Defense & Monitoring:</strong> SIEM <strong>Wazuh</strong> per la rilevazione minacce, <strong>Arkime</strong> per Full Packet Capture e integrazione VirusTotal.
                          <br />
                          <strong>Deception:</strong> Honeypots (Cowrie, Dionaea) isolati per analizzare attacchi SSH/Malware.
                          <br />
                          <strong>Network:</strong> VPN WireGuard, Pi-hole e Reverse Proxy.
                          <br /><br />
                          <strong>Stack:</strong> <span className="tech-stack">OMV, Docker, Portainer, Wazuh, Arkime, WireGuard</span>
                        </p>
                        <a href="https://github.com/Nicholas-Arcari/RaspberryPi" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">Vedi Repo</a>
                        
                        <br /><br />
                        <hr />
                        
                        <h3>Tor Networking Guide</h3>
                        <p>
                          Documentazione tecnica completa sull'utilizzo avanzato della rete Tor in ambiente Linux. Il progetto copre l'intero stack di anonimizzazione:
                          <br /><br />
                          <strong>Architecture & Routing:</strong> Analisi del funzionamento dei nodi (Guard, Middle, Exit), configurazione del file <code>torrc</code> e gestione dei circuiti.
                          <br />
                          <strong>Censorship Evasion:</strong> Implementazione di <strong>Bridge Obfs4</strong> per offuscare il traffico e aggirare DPI (Deep Packet Inspection) o blocchi ISP.
                          <br />
                          <strong>Automation & Scripting:</strong> Script Bash per la rotazione automatica dell'IP (<code>SIGNAL NEWNYM</code>), gestione del ControlPort 9051 e tunneling via <strong>Proxychains</strong>.
                          <br />
                          <strong>Privacy & Security:</strong> Mitigazione del fingerprinting, gestione DNS Leaks e considerazioni legali sull'uso in Italia.
                          <br /><br />
                          <strong>Stack:</strong> <span className="tech-stack">Tor Service, Bash, Proxychains, Obfs4, Kali Linux</span>
                        </p>
                        <a href="https://github.com/Nicholas-Arcari/tor-networking-guide" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">Vedi Repo</a>
                        
                        <br /><br />
                        <hr />
                        
                        <h3>Flipper Zero Guide</h3>
                        <p>
                          Guida approfondita al modding e all'espansione del Flipper Zero. Il repository esplora le capacità native e custom del dispositivo, andando oltre l'uso base:
                          <br /><br />
                          <strong>Custom Firmware & GPIO:</strong> Guida al flashing di <strong>RogueMaster</strong> (e fork successivi) per sbloccare frequenze e funzionalità. Integrazione hardware via GPIO per debug e sensoristica.
                          <br />
                          <strong>WiFi & RF Expansion:</strong> Configurazione di schede <strong>ESP32/ESP8266</strong> per eseguire <strong>WiFi Marauder</strong> (sniffing, deauth) e moduli NRF24 per mousejacking.
                          <br />
                          <strong>Access Control:</strong> Analisi segnali Sub-GHz, clonazione keyfob (NFC/RFID/iButton) e simulazione BadUSB.
                          <br /><br />
                          <strong>Stack:</strong> <span className="tech-stack">Flipper Zero, GPIO, ESP32, RogueMaster FW, BadUSB</span>
                        </p>
                        <a href="https://github.com/Nicholas-Arcari/FlipperZero-guide" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">Vedi Repo</a>
                    </div>
                )}
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
                      
                      {/* BOTTONE VIEW MORE UNIVERSITA */}
                      <Link to="/university-details" className="button icon solid fa-arrow-circle-right" style={{ marginTop: '10px' }}>
                        Dettagli Accademici
                      </Link>

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

              {/* Sezione Certificazioni Arricchita */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><a href="#">Certificazioni</a></h3></header>
                      
                      {/* Cisco CCNA */}
                      <div style={{ marginBottom: '1.5em' }}>
                        <h4 style={{ marginBottom: '0.5em', fontSize: '1.1em' }}>
                          <i className="icon solid fa-network-wired" style={{ marginRight: '10px', color: '#00bceb' }}></i>
                          Cisco CCNA 200-301
                        </h4>
                        <p style={{ fontSize: '0.9em', marginBottom: '0.5em' }}>
                          Competenza convalidata nella configurazione, gestione e troubleshooting di infrastrutture di rete enterprise, con focus su automazione e programmabilità.
                        </p>
                        {/* Progress Bar */}
                        <div style={{ backgroundColor: '#e0e0e0', borderRadius: '5px', height: '10px', width: '100%' }}>
                          <div style={{ backgroundColor: '#4caf50', width: '60%', height: '100%', borderRadius: '5px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.8em', color: '#666', display: 'block', marginTop: '5px' }}>
                          Stato: In Corso (60%)
                        </span>
                      </div>

                      {/* CompTIA Security+ */}
                      <div>
                        <h4 style={{ marginBottom: '0.5em', fontSize: '1.1em' }}>
                          <i className="icon solid fa-shield-alt" style={{ marginRight: '10px', color: '#ff3d3d' }}></i>
                          CompTIA Security+ SY0-701
                        </h4>
                        <p style={{ fontSize: '0.9em', marginBottom: '0.5em' }}>
                          Certificazione core per la sicurezza informatica operativa: valutazione delle minacce, gestione del rischio e implementazione di architetture sicure (Defense-in-Depth).
                        </p>
                        {/* Progress Bar */}
                        <div style={{ backgroundColor: '#e0e0e0', borderRadius: '5px', height: '10px', width: '100%' }}>
                          <div style={{ backgroundColor: '#ff9800', width: '02%', height: '100%', borderRadius: '5px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.8em', color: '#666', display: 'block', marginTop: '5px' }}>
                          Stato: In Preparazione (0%)
                        </span>
                      </div>

                    </article>
                  </li>
                </ul>
              </section>

              {/* Sezione Non Solo Codice */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/ricette">Non solo codice...</Link></h3></header>
                      <p>Quando non sono al terminale, mi dedico alla cucina, alla mixology e alla stampa 3D. Scopri le mie passioni.</p>
                      <Link to="/ricette" className="button icon solid fa-utensils">Vai alle Ricette</Link>
                      <br /><br />
                      <Link to="/cocktail" className="button icon solid fa-glass-martini">Vai ai Cocktail</Link>
                      <br /><br />
                      <Link to="/stampe3d" className="button icon solid fa-cube">Vai alle Stampe 3D</Link>
                    </article>
                  </li>
                </ul>
              </section>

            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER MINIMAL --- */}
      <section id="footer">
        <div id="copyright" className="container">
          <ul className="links">
            <li>&copy; {new Date().getFullYear()} Nicholas Arcari. All rights reserved.</li>
            <li>Design: HTML5 UP</li>
          </ul>
        </div>
      </section>

    </div>
  );
};

export default Home;