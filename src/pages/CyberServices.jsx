// src/pages/CyberServices.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';

const CyberServices = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t } = useLanguage();

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

      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <br />
          <TerminalText lines={t('cyberServices.terminal')} />

          <nav id="nav">
            <ul>
              <li><Link className="icon solid fa-home" to="/"><span>{t('nav.home')}</span></Link></li>
              <li><Link className="icon solid fa-user" to="/about"><span>{t('nav.about')}</span></Link></li>
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
              <li><a className="icon brands fa-github" href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer"><span>{t('nav.github')}</span></a></li>
            </ul>
          </nav>
        </div>
      </section>

      <section id="main">
        <div className="container">
          <article className="box post" style={{ padding: '4em 2em' }}>

            <div style={{ textAlign: 'center' }}>
              <i className="icon solid fa-shield-alt" style={{ fontSize: '4em', color: '#d52349', marginBottom: '0.3em', display: 'block' }}></i>
              <h2 style={{ fontSize: '3em', marginBottom: '0.3em' }}>{t('cyberServices.heading')}</h2>
              <p style={{ fontSize: '1.2em', color: '#666', maxWidth: '640px', margin: '0 auto 2em' }}>
                {t('cyberServices.text')}
              </p>
            </div>

            {/* Cosa include */}
            <h3 style={{ marginBottom: '0.6em' }}>{t('cyberServices.productTitle')}</h3>
            <ul style={{ marginBottom: '2em' }}>
              {t('cyberServices.features').map((f, i) => (
                <li key={i} style={{ marginBottom: '0.3em' }}>{f}</li>
              ))}
            </ul>

            {/* Come iniziare */}
            <h3 style={{ marginBottom: '0.6em' }}>{t('cyberServices.howTitle')}</h3>
            <ol style={{ marginBottom: '2em' }}>
              {t('cyberServices.steps').map((s, i) => (
                <li key={i} style={{ marginBottom: '0.4em' }}>{s}</li>
              ))}
            </ol>

            {/* Download */}
            <div style={{ textAlign: 'center', margin: '2em 0' }}>
              <a
                href={`${import.meta.env.BASE_URL}downloads/soc-suite-deploy.zip`}
                className="button icon solid fa-download"
                download
              >
                {t('cyberServices.downloadBtn')}
              </a>
              <p style={{ fontSize: '0.85em', color: '#888', marginTop: '0.8em' }}>
                {t('cyberServices.downloadNote')}
              </p>
            </div>

            {/* Chiave di licenza */}
            <div style={{
              border: '1px solid #eee', borderRadius: '6px', padding: '1.5em',
              background: '#fafafa', marginBottom: '2em',
            }}>
              <h4 style={{ marginBottom: '0.5em' }}>
                <i className="icon solid fa-key" style={{ color: '#d52349', marginRight: '0.5em' }}></i>
                {t('cyberServices.licenseTitle')}
              </h4>
              <p style={{ fontSize: '0.95em', color: '#666', margin: 0 }}>
                {t('cyberServices.licenseText')}
              </p>
            </div>

            <hr style={{ maxWidth: '200px', margin: '0 auto 2em' }} />

            <p style={{ fontSize: '1em', color: '#888', marginBottom: '2em', textAlign: 'center' }}>
              {t('cyberServices.contact')}
            </p>

            <div style={{ textAlign: 'center' }}>
              <a href="mailto:arcari.nicholas0@gmail.com?subject=SOC%20Suite%20-%20richiesta%20licenza" className="button icon solid fa-envelope" style={{ marginRight: '10px', marginBottom: '10px' }}>
                Email
              </a>
              <a href="https://www.linkedin.com/in/nicholas-arcari-6245893a7" className="button alt icon brands fa-linkedin" target="_blank" rel="noopener noreferrer" style={{ marginBottom: '10px' }}>
                LinkedIn
              </a>
            </div>

            <div style={{ marginTop: '2em', textAlign: 'center' }}>
              <Link to="/" className="button alt small icon solid fa-arrow-left">
                {t('cyberServices.back')}
              </Link>
            </div>

          </article>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CyberServices;
