import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';

const NotFound = () => {
  const { t } = useLanguage();

  usePageLayout('no-sidebar');

  return (
    <div id="page-wrapper">

      <SiteHeader nav={false} />

      <section id="main">
        <div className="container">
          <article className="box post" style={{ textAlign: 'center', padding: '4em 2em' }}>
            <h2 style={{ fontSize: '6em', marginBottom: '0.2em', lineHeight: '1' }}>404</h2>
            <h3>{t('notFound.title')}</h3>
            <p>{t('notFound.text')}</p>
            <Link to="/" className="button icon solid fa-home" style={{ marginTop: '1.5em' }}>
              {t('notFound.back')}
            </Link>
          </article>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NotFound;
