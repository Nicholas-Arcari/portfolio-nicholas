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
      {/* Header */}
      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <TerminalText lines={terminalLines} />
          
          <nav id="nav">
            <ul>
              <li className="current"><Link className="icon solid fa-home" to="/"><span>Home</span></Link></li>
              <li><a className="icon solid fa-user" href="#banner"><span>Profilo</span></a></li>
              <li><a className="icon solid fa-briefcase" href="#main"><span>Esperienza</span></a></li>
              <li>
                <span className="icon solid fa-glass-cheers"><span>Passioni</span></span>
                <ul>
                  <li><Link to="/hobby">Ricette & Cocktail</Link></li>
                </ul>
              </li>
              <li><a className="icon brands fa-github" href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer"><span>GitHub</span></a></li>
            </ul>
          </nav>
        </div>
      </section>

      {/* Features */}
      <section id="features">
        <div className="container">
          <header>
            <h2>Competenze <strong>Tecniche</strong></h2>
          </header>
          <div className="row aln-center">
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="/images/pic01.jpg" alt="Cybersecurity" /></a>
                <header><h3>Cybersecurity</h3></header>
                <p>Vulnerability assessment, Sicurezza web (OWASP Top 10), Hardening Linux, Network Analysis.</p>
              </section>
            </div>
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="/images/pic02.jpg" alt="Web Dev" /></a>
                <header><h3>Fullstack Web Dev</h3></header>
                <p>Backend: PHP, Python, Laravel 12+. Frontend: React, Vite. Database: MySQL.</p>
              </section>
            </div>
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="/images/pic03.jpg" alt="DevOps" /></a>
                <header><h3>DevOps & Systems</h3></header>
                <p>Docker, Kubernetes, Git/GitHub, Bash Scripting, Linux (Ubuntu, Kali).</p>
              </section>
            </div>
          </div>
        </div>
      </section>

      {/* Banner */}
      <section id="banner">
        <div className="container">
          <p><strong>Neolaureato in Scienze Informatiche</strong> con forte interesse per la Cybersecurity...</p>
        </div>
      </section>

      {/* Main Content */}
      <section id="main">
        <div className="container">
          <div className="row">
            <div id="content" className="col-8 col-12-medium">
              
              {/* Esperienza */}
              <article className="box post">
                <header><h2><a href="#">Esperienze di <strong>Lavoro</strong></a></h2></header>
                <h3>Freelance Fullstack Web Developer (2025 - Oggi)</h3>
                <p>Sviluppo e manutenzione di applicazioni web dockerizzate restful API.</p>
                <h3>Esperienze Precedenti</h3>
                <ul>
                  <li><strong>Guardia Giurata (G.P.G.):</strong> Attività di presidio.</li>
                  <li><strong>Magazziniere, GLS:</strong> Supporto logistica.</li>
                </ul>
              </article>

              {/* Progetti Cybersecurity */}
              <article className="box post">
                <header><h2><a href="#">Progetti di <strong>Cybersecurity</strong></a></h2></header>
                <a href="https://github.com/Nicholas-Arcari" className="image featured"><img src="/images/pic04.jpg" alt="Cybersecurity Lab" /></a>
                <p>Selezione dei principali progetti pratici presenti nel portfolio GitHub.</p>
                
                <hr />
                <h3>Cybersecurity Labs</h3>
                <p>Laboratorio completo diviso in 10 moduli. <strong>Stack:</strong> <span className="tech-stack">Python, Bash, Docker</span></p>
                <a href="https://github.com/Nicholas-Arcari/cybersecurity-labs" className="button icon brands fa-github">Vedi Repo</a>

                <hr />
                <h3>RaspberryPi Home Lab</h3>
                <p>Configurazione e hardening infrastruttura. <strong>Stack:</strong> <span className="tech-stack">Linux, WireGuard, Pi-hole</span></p>
                <a href="https://github.com/Nicholas-Arcari/RaspberryPi" className="button icon brands fa-github">Vedi Repo</a>

                <hr />
                <h3>Flipper Zero</h3>
                <p>Esplorazione protocolli radio. <strong>Stack:</strong> <span className="tech-stack">Hardware Hacking</span></p>
                <a href="https://github.com/Nicholas-Arcari/FlipperZero-guide" className="button icon brands fa-github">Vedi Repo</a>
              </article>
            </div>

            {/* Sidebar */}
            <div id="sidebar" className="col-4 col-12-medium">
              <section>
                <ul className="divided">
                  <li>
                    <article className="box excerpt">
                      <header><span className="date">2021 - 2025</span><h3><a href="#">Università di Parma</a></h3></header>
                      <p>Laurea Triennale in Scienze Informatiche. Voto: <strong>90/110</strong>.</p>
                    </article>
                  </li>
                  <li>
                    <article className="box excerpt">
                      <header><span className="date">2016 - 2021</span><h3><a href="#">IISS Berenini</a></h3></header>
                      <p>Maturità scientifica opzione scienze applicate. Voto: <strong>88/100</strong>.</p>
                    </article>
                  </li>
                </ul>
              </section>

              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><a href="/hobby">Non solo codice...</a></h3></header>
                      <p>Cucina e Mixology. Scopri le mie ricette.</p>
                      <Link to="/hobby" className="button icon solid fa-utensils">Vai alle Ricette</Link>
                    </article>
                  </li>
                </ul>
              </section>

              <section>
                <ul className="divided">
                    <li>
                        <article className="box highlight" style={{textAlign: 'center'}}>
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

      {/* Footer */}
      <section id="footer">
        <div className="container">
           {/* Contenuto Footer omesso per brevità, copia dall'HTML originale */}
           <div id="copyright" className="container">
              <ul className="links">
                  <li>&copy; Nicholas Arcari.</li>
              </ul>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Home;