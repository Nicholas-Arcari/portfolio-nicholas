// src/pages/Home.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';

const Home = () => {
  // Stato per gestire l'apertura del menu a tendina
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- NUOVI STATI PER LE SEZIONI ESPANDIBILI ---
  const [showWork, setShowWork] = useState(false); // Default: nascosto
  const [showCyber, setShowCyber] = useState(false); // Default: nascosto

  const { t } = useLanguage();

  return (
    <div id="page-wrapper">

      {/* --- HEADER --- */}
      <section id="header">
        <div className="container">
          {/* Logo */}
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>

          {/* Effetto Terminale */}
          <br />
          <TerminalText lines={t('home.terminal')} />

          {/* Navigazione */}
          <nav id="nav">
            <ul>
              <li className="current">
                <Link className="icon solid fa-home" to="/"><span>{t('nav.home')}</span></Link>
              </li>

              {/* NUOVO LINK: Chi Sono / About */}
              <li>
                <Link className="icon solid fa-user" to="/about"><span>{t('nav.about')}</span></Link>
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
                  <span>{t('nav.passions')}</span>
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
                        {t('nav.recipes')}
                      </Link>
                    </li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}>
                      <Link to="/cocktail" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>
                        {t('nav.cocktails')}
                      </Link>
                    </li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}>
                      <Link to="/stampe3d" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>
                        {t('nav.prints3d')}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              <li>
                <a className="icon brands fa-github" href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer">
                  <span>{t('nav.github')}</span>
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
            <h2>{t('home.features.title')} <strong>{t('home.features.titleBold')}</strong></h2>
          </header>
          <div className="row aln-center">
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="images/img5.jpg" alt="Cybersecurity" /></a>
                <header><h3>{t('home.features.cyber.title')}</h3></header>
                <p>{t('home.features.cyber.text')}</p>
              </section>
            </div>
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="images/img6.jpg" alt="Web Development" /></a>
                <header><h3>{t('home.features.fullstack.title')}</h3></header>
                <p>{t('home.features.fullstack.text')}</p>
              </section>
            </div>
            <div className="col-4 col-6-medium col-12-small">
              <section>
                <a href="#" className="image featured"><img src="images/img7.jpg" alt="DevOps" /></a>
                <header><h3>{t('home.features.devops.title')}</h3></header>
                <p>{t('home.features.devops.text')}</p>
              </section>
            </div>
          </div>
        </div>
      </section>

      {/* --- BANNER --- */}
      <section id="banner">
        <div className="container">
          <p><strong>{t('home.banner')}</strong><br />{t('home.bannerText')}</p>
        </div>
      </section>

      {/* --- CTA CONTATTAMI --- */}
      <section id="cta" style={{ padding: '2em 0', textAlign: 'center' }}>
        <div className="container">
          <h3 style={{ marginBottom: '0.5em' }}>{t('home.cta.title')}</h3>
          <p style={{ marginBottom: '1.2em', textAlign: 'center' }}>{t('home.cta.text')}</p>
          <div>
            <a href="mailto:arcari.nicholas0@gmail.com" className="button icon solid fa-envelope" style={{ marginRight: '10px' }}>
              {t('home.cta.email')}
            </a>
            <a href="https://www.linkedin.com/in/nicholas-arcari-6245893a7" className="button alt icon brands fa-linkedin" target="_blank" rel="noopener noreferrer">
              {t('home.cta.linkedin')}
            </a>
          </div>
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
                    <h2><a href="#">{t('home.work.title')} <strong>{t('home.work.titleBold')}</strong></a></h2>
                    {/* Bottone Toggle Lavoro */}
                    <div style={{ textAlign: 'left', marginTop: '15px', marginBottom: '20px' }}>
                        <button
                            className="button alt small"
                            onClick={() => setShowWork(!showWork)}
                        >
                            {showWork ? t('home.work.hide') : t('home.work.show')}
                            <i className={`icon solid ${showWork ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginLeft: '10px' }}></i>
                        </button>
                    </div>
                </header>

                {/* Contenuto Condizionale Lavoro */}
                {showWork && (
                    <div className="work-content-wrapper fade-in">
                      <br /><br />
                        <h3>{t('home.work.freelanceTitle')}</h3>

                        <p>
                        {t('home.work.freelanceDesc')}
                        <br />
                        {t('home.work.freelanceMigration')}
                        </p>

                        <p style={{ fontSize: '0.9em', color: '#666', borderLeft: '3px solid #ddd', paddingLeft: '10px' }}>
                        <strong>Tech Stack:</strong> {t('home.work.freelanceTech')}
                        </p>

                        {/* BOTTONE VIEW MORE FREELANCE */}
                        <Link to="/freelance-details" className="button icon solid fa-arrow-circle-right" style={{ marginTop: '10px', marginBottom: '20px' }}>
                        {t('home.work.viewDetails')}
                        </Link>

                        <br /><hr /><br />

                        <h3>{t('home.work.previousTitle')}</h3>
                        <ul>
                        {t('home.work.previous').map((item, index) => (
                          <li key={index}><strong>{item.role}</strong><br />{item.desc}</li>
                        ))}
                        </ul>
                    </div>
                )}
              </article>

              {/* --- ARTICOLO 2: PROGETTI CYBERSECURITY (ESPANDIBILE) --- */}
              <article className="box post">
                <header>
                    <h2><a href="#">{t('home.cyber.title')} <strong>{t('home.cyber.titleBold')}</strong></a></h2>
                    {/* Bottone Toggle Cyber */}
                    <div style={{ textAlign: 'left', marginTop: '15px', marginBottom: '20px' }}>
                        <button
                            className="button alt small"
                            onClick={() => setShowCyber(!showCyber)}
                        >
                            {showCyber ? t('home.cyber.hide') : t('home.cyber.show')}
                            <i className={`icon solid ${showCyber ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginLeft: '10px' }}></i>
                        </button>
                    </div>
                </header>

                {/* Contenuto Condizionale Cyber */}
                {showCyber && (
                    <div className="cyber-content-wrapper fade-in">
                      <br /><br />
                        <a href="https://github.com/Nicholas-Arcari" className="image featured"><img src="images/img1.jpg" alt="Cybersecurity Lab" /></a>
                        <p>{t('home.cyber.intro')}</p>
                        <hr />

                        <h3>{t('home.cyber.labs.title')}</h3>
                        <p>
                          {t('home.cyber.labs.desc')}
                          <br /><br />
                          <strong>Red Team (Offensive):</strong> {t('home.cyber.labs.red')}
                          <br />
                          <strong>Blue Team (Defensive):</strong> {t('home.cyber.labs.blue')}
                          <br />
                          <strong>Cloud & Modern:</strong> {t('home.cyber.labs.cloud')}
                          <br /><br />
                          <strong>Stack:</strong> <span className="tech-stack">Python, Bash, Docker, VirtualBox, MITRE ATT&CK</span>
                        </p>
                        <a href="https://github.com/Nicholas-Arcari/cybersecurity-labs" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">{t('home.cyber.viewRepo')}</a>

                        <br /><br />
                        <hr />

                        <h3>{t('home.cyber.rpi.title')}</h3>
                        <p>
                          {t('home.cyber.rpi.desc')}
                          <br /><br />
                          <strong>Defense & Monitoring:</strong> {t('home.cyber.rpi.defense')}
                          <br />
                          <strong>Deception:</strong> {t('home.cyber.rpi.deception')}
                          <br />
                          <strong>Network:</strong> {t('home.cyber.rpi.network')}
                          <br /><br />
                          <strong>Stack:</strong> <span className="tech-stack">Linux, Docker, Portainer, Wazuh, WireGuard, Pi-hole, Cowrie, OpenMediaVault</span>
                        </p>
                        <a href="https://github.com/Nicholas-Arcari/RaspberryPi" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">{t('home.cyber.viewRepo')}</a>

                        <br /><br />
                        <hr />

                        <h3>{t('home.cyber.tor.title')}</h3>
                        <p>
                          {t('home.cyber.tor.desc')}
                          <br /><br />
                          <strong>Architecture & Routing:</strong> {t('home.cyber.tor.arch')}
                          <br />
                          <strong>Censorship Evasion:</strong> {t('home.cyber.tor.censorship')}
                          <br />
                          <strong>Automation & Scripting:</strong> {t('home.cyber.tor.automation')}
                          <br />
                          <strong>Privacy & Security:</strong> {t('home.cyber.tor.privacy')}
                          <br /><br />
                          <strong>Stack:</strong> <span className="tech-stack">Tor, Shell, Python, Proxychains, Network Security, OPSEC</span>
                        </p>
                        <a href="https://github.com/Nicholas-Arcari/tor-networking-guide" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">{t('home.cyber.viewRepo')}</a>

                        <br /><br />
                        <hr />

                        <h3>{t('home.cyber.flipper.title')}</h3>
                        <p>
                          {t('home.cyber.flipper.desc')}
                          <br /><br />
                          <strong>Custom Firmware & GPIO:</strong> {t('home.cyber.flipper.firmware')}
                          <br />
                          <strong>WiFi & RF Expansion:</strong> {t('home.cyber.flipper.wifi')}
                          <br />
                          <strong>Access Control:</strong> {t('home.cyber.flipper.access')}
                          <br /><br />
                          <strong>Stack:</strong> <span className="tech-stack">Flipper Zero, C, Radio Protocols, NFC/RFID, GPIO, BadUSB</span>
                        </p>
                        <a href="https://github.com/Nicholas-Arcari/FlipperZero-guide" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">{t('home.cyber.viewRepo')}</a>

                        <br /><br />
                        <hr />

                        <h3>{t('home.cyber.ctf.title')}</h3>
                        <p>
                          {t('home.cyber.ctf.desc')}
                          <br /><br />
                          <strong>Categories:</strong> {t('home.cyber.ctf.categories')}
                          <br />
                          <strong>Automation:</strong> {t('home.cyber.ctf.tools')}
                          <br /><br />
                          <strong>Stack:</strong> <span className="tech-stack">Python, Bash, Burp Suite, Wireshark, Ghidra</span>
                        </p>
                        <a href="https://github.com/Nicholas-Arcari/ctf-writeups" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">{t('home.cyber.viewRepo')}</a>

                        <br /><br />
                        <hr />

                        <h3>{t('home.cyber.detection.title')}</h3>
                        <p>
                          {t('home.cyber.detection.desc')}
                          <br /><br />
                          <strong>Formats:</strong> {t('home.cyber.detection.formats')}
                          <br />
                          <strong>Testing & CI/CD:</strong> {t('home.cyber.detection.testing')}
                          <br /><br />
                          <strong>Stack:</strong> <span className="tech-stack">Sigma, Yara, Suricata, Wazuh, ELK Stack, MITRE ATT&CK</span>
                        </p>
                        <a href="https://github.com/Nicholas-Arcari/detection-engineering" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">{t('home.cyber.viewRepo')}</a>

                        <br /><br />
                        <hr />

                        <h3>{t('home.cyber.soc.title')}</h3>
                        <p>
                          {t('home.cyber.soc.desc')}
                          <br /><br />
                          <strong>Modules:</strong> {t('home.cyber.soc.modules')}
                          <br />
                          <strong>Integrations:</strong> {t('home.cyber.soc.integrations')}
                          <br /><br />
                          <strong>Stack:</strong> <span className="tech-stack">Python, FastAPI, React, Vite, Docker, VirusTotal API, SQLite</span>
                        </p>
                        <a href="https://github.com/Nicholas-Arcari/soc-toolkit" className="button icon brands fa-github" target="_blank" rel="noopener noreferrer">{t('home.cyber.viewRepo')}</a>

                        <br /><br />
                        <hr />

                        {/* CTA SERVIZI CYBER */}
                        <div style={{ textAlign: 'center', padding: '2em 1em', backgroundColor: '#f9f9f9', borderRadius: '8px', marginTop: '1em' }}>
                          <i className="icon solid fa-shield-alt" style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.5em', display: 'block' }}></i>
                          <h3>{t('cyberServices.ctaTitle')}</h3>
                          <p style={{ color: '#666' }}>{t('cyberServices.ctaDesc')}</p>
                          <Link to="/cyber-services" className="button icon solid fa-arrow-circle-right">
                            {t('cyberServices.ctaBtn')}
                          </Link>
                        </div>
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
                      <header><span className="date">{t('home.sidebar.uniDate')}</span><h3><a href="#">{t('home.sidebar.uniTitle')}</a></h3></header>
                      <p>{t('home.sidebar.uniDesc')}<br />{t('home.sidebar.uniGrade')} <strong>90/110</strong>.</p>

                      {/* BOTTONE VIEW MORE UNIVERSITA */}
                      <Link to="/university-details" className="button icon solid fa-arrow-circle-right" style={{ marginTop: '10px' }}>
                        {t('home.sidebar.uniDetails')}
                      </Link>

                    </article>
                  </li>
                  <li>
                    <article className="box excerpt">
                      <header><span className="date">{t('home.sidebar.hsDate')}</span><h3><a href="#">{t('home.sidebar.hsTitle')}</a></h3></header>
                      <p>{t('home.sidebar.hsDesc')}<br />{t('home.sidebar.hsGrade')} <strong>88/100</strong>.</p>
                    </article>
                  </li>
                </ul>
              </section>

              {/* Sezione Certificazioni Arricchita */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><a href="#">{t('home.sidebar.certs')}</a></h3></header>

                      {/* Cisco CCNA */}
                      <div style={{ marginBottom: '1.5em' }}>
                        <h4 style={{ marginBottom: '0.5em', fontSize: '1.1em' }}>
                          <i className="icon solid fa-network-wired" style={{ marginRight: '10px', color: '#00bceb' }}></i>
                          Cisco CCNA 200-301
                        </h4>
                        <p style={{ fontSize: '0.9em', marginBottom: '0.5em' }}>
                          {t('home.sidebar.ccnaDesc')}
                        </p>
                        {/* Progress Bar */}
                        <div style={{ backgroundColor: '#e0e0e0', borderRadius: '5px', height: '10px', width: '100%' }}>
                          <div style={{ backgroundColor: '#4caf50', width: '60%', height: '100%', borderRadius: '5px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.8em', color: '#666', display: 'block', marginTop: '5px' }}>
                          {t('home.sidebar.ccnaStatus')}
                        </span>
                      </div>

                      {/* CompTIA Security+ */}
                      <div>
                        <h4 style={{ marginBottom: '0.5em', fontSize: '1.1em' }}>
                          <i className="icon solid fa-shield-alt" style={{ marginRight: '10px', color: '#ff3d3d' }}></i>
                          CompTIA Security+ SY0-701
                        </h4>
                        <p style={{ fontSize: '0.9em', marginBottom: '0.5em' }}>
                          {t('home.sidebar.secplusDesc')}
                        </p>
                        {/* Progress Bar */}
                        <div style={{ backgroundColor: '#e0e0e0', borderRadius: '5px', height: '10px', width: '100%' }}>
                          <div style={{ backgroundColor: '#ff9800', width: '0%', height: '100%', borderRadius: '5px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.8em', color: '#666', display: 'block', marginTop: '5px' }}>
                          {t('home.sidebar.secplusStatus')}
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
                      <header><h3><Link to="/ricette">{t('home.sidebar.notOnlyCode')}</Link></h3></header>
                      <p>{t('home.sidebar.notOnlyCodeDesc')}</p>
                      <Link to="/ricette" className="button icon solid fa-utensils">{t('home.sidebar.goRecipes')}</Link>
                      <br /><br />
                      <Link to="/cocktail" className="button icon solid fa-glass-martini">{t('home.sidebar.goCocktails')}</Link>
                      <br /><br />
                      <Link to="/stampe3d" className="button icon solid fa-cube">{t('home.sidebar.goPrints')}</Link>
                    </article>
                  </li>
                </ul>
              </section>

            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER MINIMAL --- */}
      <Footer />

    </div>
  );
};

export default Home;
