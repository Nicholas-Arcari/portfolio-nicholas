// src/pages/About.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';

const About = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { t } = useLanguage();

  // Layout No-Sidebar per questa pagina
  useEffect(() => {
    document.body.classList.remove('homepage');
    document.body.classList.add('no-sidebar');
    window.scrollTo(0, 0);
    return () => {
      document.body.classList.remove('no-sidebar');
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
          <TerminalText lines={t('about.terminal')} />

          <nav id="nav">
            <ul>
              <li><Link className="icon solid fa-home" to="/"><span>{t('nav.home')}</span></Link></li>
              <li className="current"><Link className="icon solid fa-user" to="/about"><span>{t('nav.about')}</span></Link></li>
              <li
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
                style={{ position: 'relative' }}
              >
                <a className="icon solid fa-glass-cheers" style={{ cursor: 'pointer' }}><span>{t('nav.passions')}</span></a>
                {isDropdownOpen && (
                  <ul style={{
                    display: 'block', position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '4px',
                    padding: '10px 0', minWidth: '200px', zIndex: 1000, listStyle: 'none', margin: 0
                  }}>
                    <li style={{ padding: '5px 20px', borderTop: 'none' }}><Link to="/ricette" style={{ display: 'block', color: '#444' }}>{t('nav.recipes')}</Link></li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/cocktail" style={{ display: 'block', color: '#444' }}>{t('nav.cocktails')}</Link></li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/stampe3d" style={{ display: 'block', color: '#444' }}>{t('nav.prints3d')}</Link></li>
                  </ul>
                )}
              </li>

              {/* Voce Attiva */}
              <li><a className="icon brands fa-github" href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer"><span>{t('nav.github')}</span></a></li>
            </ul>
          </nav>
        </div>
      </section>

      {/* MAIN - SEZIONE ABOUT */}
      <section id="main">
        <div className="container">
          <div id="content">

            {/* Box Contenitore Stile Clean */}
            <article className="box post" style={{ padding: '3em' }}>

              <div className="row aln-middle">

                {/* COLONNA SINISTRA: FOTO */}
                <div className="col-5 col-12-medium">
                  {/* MODIFICA QUI: Applicato borderRadius anche al contenitore (span) per curvare la cornice */}
                  <span className="image fit" style={{ borderRadius: '15px' }}>
                    <img
                      src="images/test.jpg"
                      alt="Nicholas Arcari"
                      style={{ borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    />
                  </span>
                </div>

                {/* COLONNA DESTRA: TESTO E CONTATTI */}
                <div className="col-7 col-12-medium">
                  <header>
                    <h2 style={{ fontSize: '2.8em', marginBottom: '0.5em', borderBottom: '3px solid #d52349', display: 'inline-block' }}>
                      {t('about.title')}
                    </h2>
                  </header>

                  <div style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555' }}>
                    {t('about.bio').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>

                </div>
              </div>

              {/* CONTATTI: sotto foto e testo, a tutta larghezza */}
              <div style={{ marginTop: '3em' }}>
                <h3 style={{ fontSize: '1.5em', marginBottom: '1em' }}>{t('about.contacts')}</h3>
                <ul className="about-contacts">

                  <li>
                    <i className="icon solid fa-envelope" style={{ width: '30px', color: '#d52349', fontSize: '1.2em' }}></i>
                    <a href="mailto:arcari.nicholas0@gmail.com" style={{ fontWeight: 'bold' }}>arcari.nicholas0@gmail.com</a>
                  </li>

                  <li>
                    <i className="icon solid fa-phone" style={{ width: '30px', color: '#d52349', fontSize: '1.2em' }}></i>
                    <span>+39 351 714 0966</span>
                  </li>

                  <li>
                    <i className="icon solid fa-map-marker-alt" style={{ width: '30px', color: '#d52349', fontSize: '1.2em' }}></i>
                    <span>{t('about.location')}</span>
                  </li>

                  <li>
                    <i className="icon brands fa-linkedin" style={{ width: '30px', color: '#0077b5', fontSize: '1.2em' }}></i>
                    <a href="https://www.linkedin.com/in/nicholas-arcari-6245893a7/" target="_blank" rel="noreferrer">LinkedIn</a>
                  </li>

                  <li>
                    <i className="icon brands fa-github" style={{ width: '30px', color: '#333', fontSize: '1.2em' }}></i>
                    <a href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer">GitHub</a>
                  </li>

                  <li>
                    <i className="icon solid fa-terminal" style={{ width: '30px', color: '#C02026', fontSize: '1.2em' }}></i>
                    <a href="https://tryhackme.com/p/arcari.nicholas0" target="_blank" rel="noreferrer">TryHackMe</a>
                  </li>

                  <li>
                    <i className="icon solid fa-bug" style={{ width: '30px', color: '#333', fontSize: '1.2em' }}></i>
                    <a href="https://hackerone.com/arcari" target="_blank" rel="noreferrer">HackerOne</a>
                  </li>

                </ul>
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* FOOTER MINIMAL */}
      <Footer />

    </div>
  );
};

export default About;
