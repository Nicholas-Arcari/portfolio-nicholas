// src/pages/SeedCast.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';

const SeedCast = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [guide, setGuide] = useState(null); // Default: nascosto; si apre al click sul bottone
  const [showFaq, setShowFaq] = useState(false); // Default: nascosto
  const { t } = useLanguage();

  const faq = t('seedCast.faq');

  useEffect(() => {
    // Layout con sidebar destra, come la home
    document.body.classList.remove('no-sidebar');
    document.body.classList.add('homepage');
    window.scrollTo(0, 0);
  }, []);

  return (
    <div id="page-wrapper">

      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <br />
          <TerminalText lines={t('seedCast.terminal')} />

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
          <div className="row">

            {/* Content */}
            <div id="content" className="col-8 col-12-medium">
          <article className="box post" style={{ padding: '4em 2em' }}>

            <div style={{ textAlign: 'center' }}>
              <i className="icon solid fa-seedling" style={{ fontSize: '4em', color: '#d52349', marginBottom: '0.3em', display: 'block' }}></i>
              <h2 style={{ fontSize: '3em', marginBottom: '0.2em' }}>{t('seedCast.heading')}</h2>
              <p style={{ fontSize: '0.85em', color: '#d52349', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1em' }}>
                {t('seedCast.status')}
              </p>
              <p style={{ fontSize: '1.2em', color: '#666', maxWidth: '640px', margin: '0 auto 2em' }}>
                {t('seedCast.text')}
              </p>
            </div>

            {/* Cosa include */}
            <h3 style={{ marginBottom: '0.6em' }}>{t('seedCast.productTitle')}</h3>
            <ul style={{ marginBottom: '2em' }}>
              {t('seedCast.features').map((f, i) => (
                <li key={i} style={{ marginBottom: '0.3em' }}>{f}</li>
              ))}
            </ul>

          </article>

          {/* La prova in un article suo: il template traccia la doppia riga
              sopra ogni article dopo il primo, e quella del blocco successivo
              la chiude, isolandola come sulle altre pagine prodotto. */}
          <article className="box post" style={{ padding: '4em 2em' }}>

            <h3 style={{ marginBottom: '0.6em' }}>{t('seedCast.howTitle')}</h3>
            <div style={{ display: 'flex', gap: '0.5em', marginBottom: '1.2em', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setGuide(guide === 'simple' ? null : 'simple')}
                className={guide === 'simple' ? 'button small' : 'button alt small'}
                aria-expanded={guide === 'simple'}
              >
                {t('seedCast.tabSimple')}
              </button>
              <button
                type="button"
                onClick={() => setGuide(guide === 'tech' ? null : 'tech')}
                className={guide === 'tech' ? 'button small' : 'button alt small'}
                aria-expanded={guide === 'tech'}
              >
                {t('seedCast.tabTech')}
              </button>
            </div>

            {guide === 'simple' && (
              <div className="fade-in" style={{ marginBottom: '2em' }}>
                <p style={{ color: '#666', marginBottom: '0.8em' }}>
                  {t('seedCast.simpleIntro')}
                </p>
                <ol>
                  {t('seedCast.simpleSteps').map((s, i) => (
                    <li key={i} style={{ marginBottom: '0.6em', lineHeight: 1.5 }}>{s}</li>
                  ))}
                </ol>
                <p style={{ fontSize: '0.9em', color: '#888', marginTop: '1em' }}>
                  {t('seedCast.simpleHelp')}
                </p>
              </div>
            )}

            {guide === 'tech' && (
              <div className="fade-in" style={{ marginBottom: '2em' }}>
                <p style={{ color: '#666', marginBottom: '0.8em' }}>
                  {t('seedCast.techIntro')}
                </p>
                <ol>
                  {t('seedCast.techSteps').map((s, i) => (
                    <li key={i} style={{ marginBottom: '0.6em', lineHeight: 1.5 }}>{s}</li>
                  ))}
                </ol>
                <p style={{ fontSize: '0.9em', color: '#888', marginTop: '1em' }}>
                  {t('seedCast.techNotes')}
                </p>
              </div>
            )}

          </article>

          {/* FAQ come articolo #content separato: il template disegna la doppia
              riga orizzontale sopra gli article successivi al primo, separando
              visivamente le FAQ dal resto della pagina (light e dark mode). */}
          <article className="box post" style={{ padding: '4em 2em' }}>
            {/* Titolo e comando centrati come sulle altre pagine prodotto: sono
                l'invito ad aprire il blocco. Il contenuto torna a sinistra. */}
            <div style={{ marginBottom: '1em', textAlign: 'center' }}>
              <h3 style={{ marginBottom: '0.6em' }}>{t('seedCast.faqTitle')}</h3>
              <button
                type="button"
                className="button alt small"
                onClick={() => setShowFaq(!showFaq)}
                aria-expanded={showFaq}
              >
                {showFaq ? t('seedCast.faqHide') : t('seedCast.faqShow')}
                <i className={`icon solid ${showFaq ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginLeft: '10px' }}></i>
              </button>

              {showFaq && (
                <div className="fade-in" style={{ marginTop: '1.5em', textAlign: 'left' }}>
                  <h4 style={{ marginBottom: '0.8em', color: '#d52349' }}>{faq.techTitle}</h4>
                  {faq.tech.map((item, i) => (
                    <div key={`tech-${i}`} style={{ marginBottom: '1.2em' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.3em' }}>{item.q}</p>
                      <p style={{ color: '#666', margin: 0 }}>{item.a}</p>
                    </div>
                  ))}

                  <h4 style={{ margin: '1.8em 0 0.8em', color: '#d52349' }}>{faq.generalTitle}</h4>
                  {faq.general.map((item, i) => (
                    <div key={`gen-${i}`} style={{ marginBottom: '1.2em' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.3em' }}>{item.q}</p>
                      <p style={{ color: '#666', margin: 0 }}>{item.a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>

          {/* Doppia riga orizzontale sotto le FAQ (come quella disegnata sopra) */}
          <div className="double-rule" aria-hidden="true"></div>

          <div style={{ margin: '2em 0', textAlign: 'center' }}>
            <Link to="/" className="button alt small icon solid fa-arrow-left">
              {t('seedCast.back')}
            </Link>
          </div>
            </div>

            {/* Sidebar destra: Requisiti + costo + Accesso + Contatti.
                Il costo sta in evidenza perche in un prodotto BYOK e la prima
                domanda vera: i token li paga chi lo usa. */}
            <div id="sidebar" className="col-4 col-12-medium">

              {/* Requisiti */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header>
                        <h3>
                          <i className="icon solid fa-microchip" style={{ color: '#d52349', marginRight: '0.5em' }}></i>
                          {t('seedCast.reqTitle')}
                        </h3>
                      </header>
                      <p style={{ fontSize: '0.95em', color: '#666' }}>{t('seedCast.reqIntro')}</p>
                      <ul style={{ fontSize: '0.9em', marginBottom: 0 }}>
                        {t('seedCast.reqList').map((r, i) => (
                          <li key={i} style={{ marginBottom: '0.2em' }}>{r}</li>
                        ))}
                      </ul>
                    </article>
                  </li>
                </ul>
              </section>

              {/* Quanto si spende: in un prodotto BYOK e il vincolo che decide
                  se ha senso lanciare una ricerca da duecento attivita. */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header>
                        <h3>
                          <i className="icon solid fa-wallet" style={{ color: '#d52349', marginRight: '0.5em' }}></i>
                          {t('seedCast.costTitle')}
                        </h3>
                      </header>
                      <p style={{ fontSize: '0.95em', color: '#666', margin: 0 }}>{t('seedCast.costText')}</p>
                    </article>
                  </li>
                </ul>
              </section>

              {/* Accesso */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header>
                        <h3>
                          <i className="icon solid fa-lock" style={{ color: '#d52349', marginRight: '0.5em' }}></i>
                          {t('seedCast.accessTitle')}
                        </h3>
                      </header>
                      <p style={{ fontSize: '0.95em', color: '#666', margin: 0 }}>{t('seedCast.contactNote')}</p>
                    </article>
                  </li>
                </ul>
              </section>

              {/* Contatti */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header>
                        <h3>
                          <i className="icon solid fa-envelope" style={{ color: '#d52349', marginRight: '0.5em' }}></i>
                          {t('seedCast.contactTitle')}
                        </h3>
                      </header>
                      <p style={{ fontSize: '0.95em', color: '#666' }}>{t('seedCast.contact')}</p>
                      <a href="mailto:arcari.nicholas0@gmail.com?subject=SeedCast%20-%20informazioni" className="button icon solid fa-envelope" style={{ width: '100%', marginBottom: '10px' }}>
                        Email
                      </a>
                      <a href="https://www.linkedin.com/in/nicholas-arcari-6245893a7" className="button alt icon brands fa-linkedin" target="_blank" rel="noopener noreferrer" style={{ width: '100%', marginBottom: '10px' }}>
                        LinkedIn
                      </a>
                      <Link to="/" className="button alt small icon solid fa-arrow-left" style={{ width: '100%' }}>
                        {t('seedCast.back')}
                      </Link>
                    </article>
                  </li>
                </ul>
              </section>

            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SeedCast;
