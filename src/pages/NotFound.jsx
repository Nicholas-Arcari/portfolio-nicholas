import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';

const NotFound = () => {
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
