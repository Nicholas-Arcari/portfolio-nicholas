// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Home = () => {
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
          <TerminalText lines={terminalLines} />
          
          {/* Navigazione */}
          <nav id="nav">
            <ul>
              <li className="current"><Link className="icon solid fa-home" to="/"><span>Home</span></Link></li>
              <li><a className="icon solid fa-user" href="#banner"><span>Profilo</span></a></li>
              <li><a className="icon solid fa-briefcase" href="#main"><span>Esperienza</span></a></li>
              <li>
                <span className="icon solid fa-glass-cheers"><span>Passioni</span></span>
                <ul>
                  <li><Link to="/hobby#recipes">Ricette di Mamma Niky</Link></li>
                  <li><Link to="/hobby#cocktails">I miei Cocktail</Link></li>
                </ul>
              </li>
              <li><a className="icon brands fa-github" href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer"><span>GitHub</span></a></li>
            </ul>
          </nav>
        </div>
      </section>

      {/* --- FEATURES (Competenze Tecniche) --- */}
      <section id="features">
        <div className="container">
          <header>
            <h2>Competenze <strong>Tecniche</strong></h2>
          </header>
          <div className="row aln-center">
            
            {/* Cybersecurity */}
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="/images/pic01.jpg" alt="Cybersecurity" /></a>
                <header><h3>Cybersecurity</h3></header>
                <p>Vulnerability assessment, Sicurezza web (OWASP Top 10), Hardening Linux, Network Analysis (Nmap, Burp Suite, Wazuh).</p>
              </section>
            </div>

            {/* Web Dev */}
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="/images/pic02.jpg" alt="Web Development" /></a>
                <header><h3>Fullstack Web Dev</h3></header>
                <p>Backend: PHP, Python, Laravel 12+. Frontend: React, Vite, HTML/CSS. Database: MySQL, PostgreSQL.</p>
              </section>
            </div>

            {/* DevOps */}
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="/images/pic03.jpg" alt="DevOps" /></a>
                <header><h3>DevOps & Systems</h3></header>
                <p>Docker, Kubernetes, Git/GitHub, Bash Scripting, Linux (Ubuntu, Kali), Gestione servizi e networking TCP/IP.</p>
              </section>
            </div>

          </div>
        </div>
      </section>

      {/* --- BANNER (Intro) --- */}
      <section id="banner">
        <div className="container">
          <p><strong>Neolaureato in Scienze Informatiche</strong> con forte interesse per la Cybersecurity e esperienza in laboratorio per vulnerability assessment, sicurezza web (OWASP Top 10) e hardening di sistemi Linux.</p>
        </div>
      </section>

      {/* --- MAIN (Corpo Centrale) --- */}
      <section id="main">
        <div className="container">
          <div className="row">

            {/* COLONNA SINISTRA (Contenuti Principali) */}
            <div id="content" className="col-8 col-12-medium">

              {/* Esperienze di Lavoro */}
              <article className="box post">
                <header>
                  <h2><a href="#">Esperienze di <strong>Lavoro</strong></a></h2>
                </header>
                <h3>Freelance Fullstack Web Developer (2025 - Oggi)</h3>
                <p>Sviluppo e manutenzione di applicazioni web dockerizzate restful API.
                Stack tecnologico: Backend (PHP, Python, Laravel 12+), Frontend (React, Vite), Database (MySQL, PhpMyAdmin), DevOps (Docker, Kubernetes).</p>

                <h3>Esperienze Precedenti</h3>
                <ul>
                  <li><strong>Guardia Giurata (G.P.G.), CoopService (2023-2024):</strong> Attività di presidio e coordinamento in contesti sensibili.</li>
                  <li><strong>Magazziniere, GLS (2021-2022):</strong> Supporto logistica e gestione carichi.</li>
                </ul>
              </article>

              {/* Progetti Cybersecurity */}
              <article className="box post">
                <header>
                  <h2><a href="#">Progetti di <strong>Cybersecurity</strong></a></h2>
                </header>
                <a href="https://github.com/Nicholas-Arcari" className="image featured"><img src="/images/pic04.jpg" alt="Cybersecurity Lab" /></a>
                
                <p>Una selezione dei principali progetti pratici presenti nel mio portfolio GitHub, focalizzati su hardening, analisi di rete e offensive security.</p>
                
                <hr />

                <h3>Cybersecurity Labs</h3>
                <p>Laboratorio completo diviso in 10 moduli, dalla <strong>Recon</strong> alla <strong>Defense</strong>.
                Include tool custom per Social Engineering, simulazioni di Web Attacks, configurazione di Honeypots e Post-Exploitation.<br />
                <strong>Stack:</strong> <span className="tech-stack">Python, Bash, Docker, Linux Security</span></p>
                <a href="https://github.com/Nicholas-Arcari/cybersecurity-labs" className="button icon brands fa-github">Vedi Repo</a>

                <hr />

                <h3>RaspberryPi Home Lab</h3>
                <p>Configurazione e hardening di un'infrastruttura di rete domestica sicura.
                Implementazione di <strong>VPN</strong> (WireGuard), blocco pubblicità (Pi-hole), <strong>NAS</strong> sicuro e un <strong>Honeypot</strong> di rete per rilevare intrusioni.<br />
                <strong>Stack:</strong> <span className="tech-stack">Linux (Raspbian), Docker, OpenVPN/WireGuard, Pi-hole</span></p>
                <a href="https://github.com/Nicholas-Arcari/RaspberryPi" className="button icon brands fa-github">Vedi Repo</a>

                <hr />

                <h3>Tor Networking Guide</h3>
                <p>Guida e script per la navigazione anonima e la configurazione di servizi nascosti.
                Analisi del routing <strong>Onion</strong> e best practices per la privacy digitale.<br />
                <strong>Stack:</strong> <span className="tech-stack">Tor Browser, Proxychains, Network Privacy</span></p>
                <a href="https://github.com/Nicholas-Arcari/tor-networking-guide" className="button icon brands fa-github">Vedi Repo</a>

                <hr />

                <h3>Flipper Zero</h3>
                <p>Esplorazione e auditing di protocolli radio e sistemi di controllo accessi.
                Analisi segnali <strong>Sub-GHz</strong>, clonazione tag <strong>NFC/RFID</strong> e automazione badUSB.<br />
                <strong>Stack:</strong> <span className="tech-stack">Flipper Zero, GPIO, Radio Protocols, Hardware Hacking</span></p>
                <a href="https://github.com/Nicholas-Arcari/FlipperZero-guide" className="button icon brands fa-github">Vedi Repo</a>

              </article>

            </div>

            {/* COLONNA DESTRA (Sidebar) */}
            <div id="sidebar" className="col-4 col-12-medium">

              {/* Istruzione */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box excerpt">
                      <header>
                        <span className="date">2021 - 2025</span>
                        <h3><a href="#">Università di Parma</a></h3>
                      </header>
                      <p>Laurea Triennale in Scienze Informatiche.<br />
                      Voto: <strong>90/110</strong>.</p>
                    </article>
                  </li>
                  <li>
                    <article className="box excerpt">
                      <header>
                        <span className="date">2016 - 2021</span>
                        <h3><a href="#">IISS Berenini</a></h3>
                      </header>
                      <p>Maturità scientifica opzione scienze applicate.<br />
                      Voto: <strong>88/100</strong>.</p>
                    </article>
                  </li>
                </ul>
              </section>

              {/* Certificazioni */}
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

              {/* Link Pagina Hobby */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/hobby">Non solo codice...</Link></h3></header>
                      <p>Quando non sono al terminale, mi dedico alla cucina e alla mixology. Scopri le mie ricette e i miei cocktail.</p>
                      <Link to="/hobby" className="button icon solid fa-utensils">Vai alle Ricette & Cocktail</Link>
                    </article>
                  </li>
                </ul>
              </section>

              {/* Soft Skills */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><a href="#">Soft Skills</a></h3></header>
                      <p>
                        - Improvvisazione e flessibilità mentale.<br />
                        - Gestione efficace dello stress.<br />
                        - Problem solving autonomo.
                      </p>
                    </article>
                  </li>
                </ul>
              </section>

              {/* Download CV */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight" style={{ textAlign: 'center' }}>
                      <header><h3><a href="#">Curriculum Vitae</a></h3></header>
                      <p>Scarica il documento completo.</p>
                      <a href="/assets/cv/cv_arcari_nicholas.pdf" className="button icon solid fa-download" download>Scarica CV (PDF)</a>
                    </article>
                  </li>
                </ul>
              </section>

            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <section id="footer">
        <div className="container">
          <header>
            <h2>Contatti</h2>
          </header>
          <div className="row">
            
            {/* Form Contatti */}
            <div className="col-6 col-12-medium">
              <section>
                <form method="post" action="#">
                  <div className="row gtr-50">
                    <div className="col-6 col-12-small">
                      <input name="name" placeholder="Nome" type="text" />
                    </div>
                    <div className="col-6 col-12-small">
                      <input name="email" placeholder="Email" type="text" />
                    </div>
                    <div className="col-12">
                      <textarea name="message" placeholder="Messaggio"></textarea>
                    </div>
                    <div className="col-12">
                      <a href="#" className="form-button-submit button icon solid fa-envelope">Invia Messaggio</a>
                    </div>
                  </div>
                </form>
              </section>
            </div>

            {/* Info Contatti */}
            <div className="col-6 col-12-medium">
              <section>
                <p>Contattami per collaborazioni in ambito Sviluppo Web Fullstack o progetti di Cybersecurity.</p>
                <div className="row">
                  <div className="col-6 col-12-small">
                    <ul className="icons">
                      <li className="icon solid fa-home">
                        Via Scipione 45/A<br />
                        43039, Salsomaggiore Terme (PR)<br />
                        Italia
                      </li>
                      <li className="icon solid fa-phone">
                        +39 351 714 0966
                      </li>
                      <li className="icon solid fa-envelope">
                        <a href="mailto:arcari.nicholaso@gmail.com">arcari.nicholaso@gmail.com</a>
                      </li>
                    </ul>
                  </div>
                  <div className="col-6 col-12-small">
                    <ul className="icons">
                      <li className="icon brands fa-github">
                        <a href="https://github.com/Nicholas-Arcari">github.com/Nicholas-Arcari</a>
                      </li>
                    </ul>
                  </div>
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