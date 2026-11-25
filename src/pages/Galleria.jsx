// src/pages/Galleria.jsx
import React from 'react';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';

const Galleria = () => {
  const { t } = useLanguage();

  usePageLayout('no-sidebar');

  return (
    <div id="page-wrapper">

      {/* --- HEADER --- */}
      <SiteHeader terminal={t('galleria.terminal')} />

      {/* --- MAIN --- */}
      <section id="main">
        <div className="container">
          <div id="content">

            {/* Intro */}
            <article className="box post">
              {/* amoR e' Roma letta al contrario: le maiuscole contano, quindi qui il titolo non passa in maiuscolo come gli altri */}
              <header><h2 style={{ textTransform: 'none' }}>{t('galleria.introTitle')}</h2></header>
              <p>{t('galleria.introDesc')}</p>

              {/* Segnaposto finche' le foto non sono pronte, come quello dei servizi in arrivo in Home */}
              <div className="soft-panel" style={{ textAlign: 'center', padding: '2em 1em', marginTop: '1.5em' }}>
                <i className="icon solid fa-camera-retro" style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.5em', display: 'block' }}></i>
                <h3 style={{ marginBottom: 0 }}>{t('galleria.wip')}</h3>
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
