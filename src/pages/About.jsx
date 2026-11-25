// src/pages/About.jsx
import React from 'react';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import { usePageTitle } from '../utils/usePageTitle';
import '../i18n/about';
import '../i18n/nav';

const About = () => {

  const { t } = useLanguage();

  usePageLayout('no-sidebar');
  usePageTitle(t('nav.about'));

  return (
    <div id="page-wrapper" className="about-page">

      {/* HEADER */}
      <SiteHeader terminal={t('about.terminal')} current="about" />

      {/* MAIN - SEZIONE ABOUT */}
      <section id="main">
        <div className="container">
          <div id="content">

            {/* Box Contenitore Stile Clean */}
            <article className="box post about-card">

              <div className="row aln-middle">

                {/* COLONNA SINISTRA: FOTO */}
                <div className="col-5 col-12-medium">
                  {/* Cornice (span) e foto hanno lo stesso raggio: .about-photo in HackerTheme.css */}
                  <span className="image fit about-photo">
                    <img
                      src="images/about.webp"
                      alt="Nicholas Arcari"
                      width="1000"
                      height="1640"
                    />
                  </span>
                </div>

                {/* COLONNA DESTRA: TESTO E CONTATTI */}
                <div className="col-7 col-12-medium">
                  <header>
                    <h2 className="about-title">
                      {t('about.title')}
                    </h2>
                  </header>

                  <div className="about-text">
                    {t('about.bio').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>

                </div>
              </div>

              {/* CONTATTI: sotto foto e testo, a tutta larghezza */}
              <div className="about-contacts-block">
                <h3 className="about-contacts-title">{t('about.contacts')}</h3>
                <ul className="about-contacts">

                  <li>
                    <i className="icon solid fa-envelope contact-icon is-accent"></i>
                    <a className="about-email" href="mailto:arcari.nicholas0@gmail.com">arcari.nicholas0@gmail.com</a>
                  </li>

                  <li>
                    <i className="icon solid fa-phone contact-icon is-accent"></i>
                    <span>+39 351 714 0966</span>
                  </li>

                  <li>
                    <i className="icon solid fa-map-marker-alt contact-icon is-accent"></i>
                    <span>{t('about.location')}</span>
                  </li>

                  <li>
                    <i className="icon solid fa-map-marker-alt contact-icon is-accent"></i>
                    <span>{t('about.location2')}</span>
                  </li>

                  <li>
                    <i className="icon brands fa-linkedin contact-icon is-linkedin"></i>
                    <a href="https://www.linkedin.com/in/nicholas-arcari-6245893a7/" target="_blank" rel="noreferrer">LinkedIn</a>
                  </li>

                  <li>
                    <i className="icon brands fa-github is-ink contact-icon"></i>
                    <a href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer">GitHub</a>
                  </li>

                  <li>
                    <i className="icon solid fa-terminal contact-icon is-tryhackme"></i>
                    <a href="https://tryhackme.com/p/arcari.nicholas0" target="_blank" rel="noreferrer">TryHackMe</a>
                  </li>

                  <li>
                    <i className="icon solid fa-bug is-ink contact-icon"></i>
                    <a href="https://hackerone.com/arcari" target="_blank" rel="noreferrer">HackerOne</a>
                  </li>

                  <li>
                    <i className="icon brands fa-instagram contact-icon is-instagram"></i>
                    <a href="https://www.instagram.com/diokaneki_/" target="_blank" rel="noreferrer">Instagram</a>
                  </li>

                  <li>
                    <i className="icon brands fa-tiktok contact-icon"></i>
                    <a href="https://www.tiktok.com/@diokaneki_" target="_blank" rel="noreferrer">TikTok</a>
                  </li>

                  <li>
                    <i className="icon solid fa-user-friends contact-icon is-accent"></i>
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
