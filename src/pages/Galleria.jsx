// src/pages/Galleria.jsx
import React from 'react';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import { usePageTitle } from '../utils/usePageTitle';
import '../i18n/galleria';
import '../i18n/nav';

const Galleria = () => {
  const { t } = useLanguage();

  usePageLayout('no-sidebar');
  usePageTitle(t('nav.gallery'));

  return (
    <div id="page-wrapper" className="galleria-page">

      {/* --- HEADER --- */}
      <SiteHeader terminal={t('galleria.terminal')} />

      {/* --- MAIN --- */}
      <section id="main">
        <div className="container">
          <div id="content">

            {/* Intro */}
            <article className="box post">
              {/* amoR e' Roma letta al contrario: le maiuscole contano, quindi qui il titolo non passa in maiuscolo come gli altri */}
              <header><h2 className="galleria-title">{t('galleria.introTitle')}</h2></header>
              <p>{t('galleria.introDesc')}</p>

              {/* Segnaposto finche' le foto non sono pronte, come quello dei servizi in arrivo in Home */}
              <div className="soft-panel feature-panel is-spaced">
                <i className="icon solid fa-camera-retro feature-icon"></i>
                <h3 className="galleria-wip-title">{t('galleria.wip')}</h3>
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <Footer />
    </div>
  );
};

export default Galleria;
