import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import { usePageTitle } from '../utils/usePageTitle';
import '../i18n/notFound';

const NotFound = () => {
  const { t } = useLanguage();

  usePageLayout('no-sidebar');
  usePageTitle(t('notFound.title'));

  return (
    <div id="page-wrapper" className="notice-page">

      <SiteHeader nav={false} />

      <section id="main">
        <div className="container">
          <article className="box post notice-card">
            <h2 className="notice-code">404</h2>
            <h3>{t('notFound.title')}</h3>
            <p>{t('notFound.text')}</p>
            <Link to="/" className="button icon solid fa-home notice-action">
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
