// src/pages/About.jsx
import React from 'react';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import '../i18n/about';

const About = () => {

  const { t } = useLanguage();

  usePageLayout('no-sidebar');

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <SiteHeader terminal={t('about.terminal')} current="about" />

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
                      src="images/about.webp"
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
                    <i className="icon solid fa-envelope" style={{ width: '30px', color: 'var(--accent-text)', fontSize: '1.2em' }}></i>
                    <a href="mailto:arcari.nicholas0@gmail.com" style={{ fontWeight: 'bold' }}>arcari.nicholas0@gmail.com</a>
                  </li>

                  <li>
                    <i className="icon solid fa-phone" style={{ width: '30px', color: 'var(--accent-text)', fontSize: '1.2em' }}></i>
                    <span>+39 351 714 0966</span>
                  </li>

                  <li>
                    <i className="icon solid fa-map-marker-alt" style={{ width: '30px', color: 'var(--accent-text)', fontSize: '1.2em' }}></i>
                    <span>{t('about.location')}</span>
                  </li>

                  <li>
                    <i className="icon solid fa-map-marker-alt" style={{ width: '30px', color: 'var(--accent-text)', fontSize: '1.2em' }}></i>
                    <span>{t('about.location2')}</span>
                  </li>

                  <li>
                    <i className="icon brands fa-linkedin" style={{ width: '30px', color: '#0077b5', fontSize: '1.2em' }}></i>
                    <a href="https://www.linkedin.com/in/nicholas-arcari-6245893a7/" target="_blank" rel="noreferrer">LinkedIn</a>
                  </li>

                  <li>
                    <i className="icon brands fa-github is-ink" style={{ width: '30px', fontSize: '1.2em' }}></i>
                    <a href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer">GitHub</a>
                  </li>

                  <li>
                    <i className="icon solid fa-terminal" style={{ width: '30px', color: '#C02026', fontSize: '1.2em' }}></i>
                    <a href="https://tryhackme.com/p/arcari.nicholas0" target="_blank" rel="noreferrer">TryHackMe</a>
                  </li>

                  <li>
                    <i className="icon solid fa-bug is-ink" style={{ width: '30px', fontSize: '1.2em' }}></i>
                    <a href="https://hackerone.com/arcari" target="_blank" rel="noreferrer">HackerOne</a>
                  </li>

                  <li>
                    <i className="icon brands fa-instagram" style={{ width: '30px', color: '#E4405F', fontSize: '1.2em' }}></i>
                    <a href="https://www.instagram.com/diokaneki_/" target="_blank" rel="noreferrer">Instagram</a>
                  </li>

                  <li>
                    <i className="icon brands fa-tiktok" style={{ width: '30px', fontSize: '1.2em' }}></i>
                    <a href="https://www.tiktok.com/@diokaneki_" target="_blank" rel="noreferrer">TikTok</a>
                  </li>

                  <li>
                    <i className="icon solid fa-user-friends" style={{ width: '30px', color: 'var(--accent-text)', fontSize: '1.2em' }}></i>
                    <a href="https://bump.app/p/pDMoXGCBts0zZ" target="_blank" rel="noreferrer">Bump</a>
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
