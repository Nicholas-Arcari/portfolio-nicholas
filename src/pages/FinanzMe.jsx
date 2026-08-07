// src/pages/FinanzMe.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';
import VideoModal from '../components/VideoModal';
import { VIDEO_BASE } from '../config/media';

const FinanzMe = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [guide, setGuide] = useState(null); // Default: nascosto; si apre al click sul bottone
  const [showFaq, setShowFaq] = useState(false); // Default: nascosto
  const [video, setVideo] = useState(null); // { src, title } | null — lazy: caricato solo al click
  const { t } = useLanguage();

  const faq = t('finanzMe.faq');

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
          <TerminalText lines={t('finanzMe.terminal')} />

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
              <i className="icon solid fa-chart-line" style={{ fontSize: '4em', color: '#d52349', marginBottom: '0.3em', display: 'block' }}></i>
              <h2 style={{ fontSize: '3em', marginBottom: '0.2em' }}>{t('finanzMe.heading')}</h2>
              <p style={{ fontSize: '0.85em', color: '#d52349', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1em' }}>
                {t('finanzMe.status')}
              </p>
              <p style={{ fontSize: '1.2em', color: '#666', maxWidth: '640px', margin: '0 auto 2em' }}>
                {t('finanzMe.text')}
              </p>
            </div>

            {/* Cosa include */}
            <h3 style={{ marginBottom: '0.6em' }}>{t('finanzMe.productTitle')}</h3>
            <ul style={{ marginBottom: '2em' }}>
              {t('finanzMe.features').map((f, i) => (
                <li key={i} style={{ marginBottom: '0.3em' }}>{f}</li>
              ))}
            </ul>

            {/* Come installare - due guide, nascoste finche non si preme un bottone */}
            <h3 style={{ marginBottom: '0.6em' }}>{t('finanzMe.howTitle')}</h3>
            <div style={{ display: 'flex', gap: '0.5em', marginBottom: '1.2em', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setGuide(guide === 'simple' ? null : 'simple')}
                className={guide === 'simple' ? 'button small' : 'button alt small'}
                aria-expanded={guide === 'simple'}
              >
                {t('finanzMe.tabSimple')}
              </button>
              <button
                type="button"
                onClick={() => setGuide(guide === 'tech' ? null : 'tech')}
                className={guide === 'tech' ? 'button small' : 'button alt small'}
                aria-expanded={guide === 'tech'}
              >
                {t('finanzMe.tabTech')}
              </button>
            </div>

            {guide === 'simple' && (
              <div className="fade-in" style={{ marginBottom: '2em' }}>
                <p style={{ color: '#666', marginBottom: '0.8em' }}>
                  {t('finanzMe.simpleIntro')}
                </p>
                <ol>
                  {t('finanzMe.simpleSteps').map((s, i) => (
                    <li key={i} style={{ marginBottom: '0.6em', lineHeight: 1.5 }}>{s}</li>
                  ))}
                </ol>
                <p style={{ fontSize: '0.9em', color: '#888', marginTop: '1em' }}>
                  {t('finanzMe.simpleHelp')}
                </p>
              </div>
            )}

            {guide === 'tech' && (
              <div className="fade-in" style={{ marginBottom: '2em' }}>
                <p style={{ color: '#666', marginBottom: '0.8em' }}>
                  {t('finanzMe.techIntro')}
                </p>
                <ol>
                  {t('finanzMe.techSteps').map((s, i) => (
                    <li key={i} style={{ marginBottom: '0.6em', lineHeight: 1.5 }}>{s}</li>
                  ))}
                </ol>
                <p style={{ fontSize: '0.9em', color: '#888', marginTop: '1em' }}>
                  {t('finanzMe.techNotes')}
                </p>
              </div>
            )}

          </article>

          {/* FAQ come articolo #content separato: il template disegna la doppia
              riga orizzontale sopra gli article successivi al primo, separando
              visivamente le FAQ dal resto della pagina (light e dark mode). */}
          <article className="box post" style={{ padding: '4em 2em' }}>
            <div style={{ marginBottom: '1em' }}>
              <h3 style={{ marginBottom: '0.6em' }}>{t('finanzMe.faqTitle')}</h3>
              <button
                type="button"
                className="button alt small"
                onClick={() => setShowFaq(!showFaq)}
                aria-expanded={showFaq}
              >
                {showFaq ? t('finanzMe.faqHide') : t('finanzMe.faqShow')}
                <i className={`icon solid ${showFaq ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginLeft: '10px' }}></i>
              </button>

              {showFaq && (
                <div className="fade-in" style={{ marginTop: '1.5em' }}>
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
              {t('finanzMe.back')}
            </Link>
          </div>
            </div>

            {/* Sidebar destra: Video installazione + Accesso + Contatti */}
            <div id="sidebar" className="col-4 col-12-medium">

              {/* Video: come si installa */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3>{t('finanzMe.videoTitle')}</h3></header>
                      <p style={{ fontSize: '0.95em', color: '#666' }}>{t('finanzMe.videoIntro')}</p>
                      <button
                        type="button"
                        className="button icon brands fa-windows"
                        style={{ width: '100%', marginBottom: '10px' }}
                        onClick={() => setVideo({
                          src: `${VIDEO_BASE}/finanzme-install-windows.mp4`,
                          title: `${t('finanzMe.videoTitle')} — ${t('finanzMe.videoWindows')}`,
                        })}
                      >
                        {t('finanzMe.videoWindows')}
                      </button>
                      <button
                        type="button"
                        className="button alt icon brands fa-linux"
                        style={{ width: '100%' }}
                        onClick={() => setVideo({
                          src: `${VIDEO_BASE}/finanzme-install-linux-macos.mp4`,
                          title: `${t('finanzMe.videoTitle')} — ${t('finanzMe.videoLinux')}`,
                        })}
                      >
                        {t('finanzMe.videoLinux')}
                      </button>
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
                          {t('finanzMe.accessTitle')}
                        </h3>
                      </header>
                      <p style={{ fontSize: '0.95em', color: '#666', margin: 0 }}>{t('finanzMe.contactNote')}</p>
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
                          {t('finanzMe.contactTitle')}
                        </h3>
                      </header>
                      <p style={{ fontSize: '0.95em', color: '#666' }}>{t('finanzMe.contact')}</p>
                      <a href="mailto:arcari.nicholas0@gmail.com?subject=FinanzMe%20-%20informazioni" className="button icon solid fa-envelope" style={{ width: '100%', marginBottom: '10px' }}>
                        Email
                      </a>
                      <a href="https://www.linkedin.com/in/nicholas-arcari-6245893a7" className="button alt icon brands fa-linkedin" target="_blank" rel="noopener noreferrer" style={{ width: '100%', marginBottom: '10px' }}>
                        LinkedIn
                      </a>
                      <Link to="/" className="button alt small icon solid fa-arrow-left" style={{ width: '100%' }}>
                        {t('finanzMe.back')}
                      </Link>
                    </article>
                  </li>
                </ul>
              </section>

            </div>

          </div>
        </div>
      </section>

      <VideoModal
        open={!!video}
        src={video?.src}
        title={video?.title}
        onClose={() => setVideo(null)}
        unsupportedText={t('finanzMe.videoUnsupported')}
        closeLabel={t('finanzMe.videoClose')}
      />

      <Footer />
    </div>
  );
};

export default FinanzMe;
