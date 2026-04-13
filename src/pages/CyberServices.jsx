// src/pages/CyberServices.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';

const CyberServices = () => {
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
        </div>
      </section>

      <section id="main">
        <div className="container">
          <article className="box post" style={{ textAlign: 'center', padding: '6em 2em' }}>

            <i className="icon solid fa-tools" style={{ fontSize: '4em', color: '#d52349', marginBottom: '0.5em', display: 'block' }}></i>

            <h2 style={{ fontSize: '3em', marginBottom: '0.3em' }}>{t('cyberServices.heading')}</h2>
            <p style={{ fontSize: '1.2em', color: '#666', maxWidth: '600px', margin: '0 auto 2em' }}>
              {t('cyberServices.text')}
            </p>

            <hr style={{ maxWidth: '200px', margin: '0 auto 2em' }} />

            <p style={{ fontSize: '1em', color: '#888', marginBottom: '2em' }}>
              {t('cyberServices.contact')}
            </p>

            <div>
              <a href="mailto:arcari.nicholas0@gmail.com" className="button icon solid fa-envelope" style={{ marginRight: '10px', marginBottom: '10px' }}>
                Email
              </a>
              <a href="https://www.linkedin.com/in/nicholas-arcari-6245893a7" className="button alt icon brands fa-linkedin" target="_blank" rel="noopener noreferrer" style={{ marginBottom: '10px' }}>
                LinkedIn
              </a>
            </div>

            <div style={{ marginTop: '2em' }}>
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
