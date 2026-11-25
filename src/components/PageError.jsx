import React from 'react';
import { useLanguage } from '../contexts/languageContext';
import Footer from './Footer';
import { isReloading } from '../utils/reloadOnMissingPage';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import '../i18n/pageError';

// Il messaggio al posto della pagina, impaginato come la pagina 404.
const Message = () => {
  const { t } = useLanguage();

  usePageLayout('no-sidebar');

  return (
    <div id="page-wrapper">

      <SiteHeader nav={false} />

      <section id="main">
        <div className="container">
          <article className="box post" style={{ textAlign: 'center', padding: '4em 2em' }}>
            <h3>{t('pageError.title')}</h3>
            <p style={{ textAlign: 'center' }}>{t('pageError.text')}</p>
            <button type="button" className="button icon solid fa-redo" style={{ marginTop: '1.5em' }} onClick={() => window.location.reload()}>
              {t('pageError.reload')}
            </button>
          </article>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Una pagina che non arriva (il suo file manca, o manca la rete) o che si rompe
// mentre si disegna: invece della pagina vuota resta il sito, con un messaggio.
// Sta dentro PageTransition, che cambia chiave a ogni percorso: cambiando pagina
// si riparte da capo.
class PageError extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    // il sito si sta gia' ricaricando da solo: niente messaggio per un istante
    if (isReloading()) return <div className="page-loading" aria-busy="true" />;
    return <Message />;
  }
}

export default PageError;
