// src/pages/product/ProductKit.jsx
// I pezzi comuni alle pagine dei prodotti (SOC Suite, Citizen Shield, FinanzMe,
// ByteBulk, SeedCast): lo scheletro della pagina, l'intestazione del prodotto,
// le guide di installazione, le sezioni a scomparsa, le domande frequenti e i
// riquadri della colonna destra. Ogni pagina li compone e ci aggiunge le sue
// sezioni; i testi arrivano gia' tradotti, cosi' le chiavi restano scritte per
// intero nella pagina e la build le controlla (build/i18n-check.js). L'aspetto
// sta in product.css.
import { createContext, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';
import SiteHeader from '../../components/SiteHeader';
import VideoModal from '../../components/VideoModal';
import { VIDEO_BASE } from '../../config/media';
import { usePageLayout } from '../../utils/usePageLayout';
import { usePageTitle } from '../../utils/usePageTitle';
import './product.css';

// apre il video di installazione nella finestra della pagina (VideoBox)
const OpenVideo = createContext(() => {});

// La pagina: intestazione del sito, colonna dei contenuti (con la doppia riga
// e il ritorno alla Home in fondo), colonna destra, finestra dei video se la
// pagina ne ha (`video`: le etichette della finestra), piede.
export function ProductPage({ title, terminal, back, video, sidebar, children }) {
  const [playing, setPlaying] = useState(null); // { src, title } | null: il video si scarica solo all'apertura
  usePageLayout('homepage');
  usePageTitle(title);
  return (
    <OpenVideo.Provider value={setPlaying}>
      <div id="page-wrapper" className="product-page">
        <SiteHeader terminal={terminal} />
        <section id="main">
          <div className="container">
            <div className="row">
              <div id="content" className="col-8 col-12-medium">
                {children}
                {/* Doppia riga orizzontale sotto l'ultimo riquadro (come quella disegnata sopra) */}
                <div className="double-rule" aria-hidden="true"></div>
                <div className="product-back">
                  <Link to="/" className="button alt small icon solid fa-arrow-left">{back}</Link>
                </div>
              </div>
              <div id="sidebar" className="col-4 col-12-medium">
                {sidebar}
              </div>
            </div>
          </div>
        </section>
        {video && (
          <VideoModal
            open={!!playing}
            src={playing?.src}
            title={playing?.title}
            onClose={() => setPlaying(null)}
            unsupportedText={video.unsupported}
            closeLabel={video.close}
          />
        )}
        <Footer />
      </div>
    </OpenVideo.Provider>
  );
}

// Un riquadro della colonna dei contenuti. Ogni riquadro dopo il primo ha la
// doppia riga sopra (la disegna il template): cosi' le sezioni si separano.
export function ProductArticle({ children }) {
  return <article className="box post product-article">{children}</article>;
}

// Icona, nome del prodotto, stato (facoltativo) e descrizione, centrati
export function ProductHero({ icon, heading, status, text }) {
  return (
    <div className="product-hero">
      <i className={`icon solid ${icon} product-hero-icon`}></i>
      <h2 className={status ? 'product-hero-title has-status' : 'product-hero-title'}>{heading}</h2>
      {status && <p className="product-status">{status}</p>}
      <p className="product-lead">{text}</p>
    </div>
  );
}

// Cosa include: titolo ed elenco delle funzioni
export function FeatureList({ title, items }) {
  return (
    <>
      <h3 className="product-title">{title}</h3>
      <ul className="product-features">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </>
  );
}

// Com'e' fatto il prodotto: titolo, introduzione, punti, nota finale
export function ArchitectureSection({ title, intro, items, note }) {
  return (
    <>
      <h3 className="product-title">{title}</h3>
      <p className="product-intro">{intro}</p>
      <ul className="product-points">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <p className="product-note">{note}</p>
    </>
  );
}

// Una guida di installazione aperta: introduzione, passi, nota finale
function Guide({ intro, steps, note }) {
  return (
    <div className="fade-in product-guide">
      <p className="product-guide-intro">{intro}</p>
      <ol className="product-guide-steps">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <p className="product-guide-note">{note}</p>
    </div>
  );
}

// Come installare, in un riquadro suo: due guide (semplice e tecnica), una
// alla volta, nascoste finche' non si preme il loro pulsante; in fondo, se c'e',
// il pacchetto da scaricare. `simple` e `tech`: { tab, intro, steps, note }.
export function InstallGuides({ title, simple, tech, download }) {
  const [guide, setGuide] = useState(null);
  const tab = (name, label) => (
    <button
      type="button"
      onClick={() => setGuide(guide === name ? null : name)}
      className={guide === name ? 'button small' : 'button alt small'}
      aria-expanded={guide === name}
    >
      {label}
    </button>
  );
  return (
    <ProductArticle>
      <h3 className="product-title">{title}</h3>
      <div className="product-tabs">
        {tab('simple', simple.tab)}
        {tab('tech', tech.tab)}
      </div>
      {guide === 'simple' && <Guide {...simple} />}
      {guide === 'tech' && <Guide {...tech} />}
      {download && (
        <div className="product-download">
          <a href={download.href} className="button icon solid fa-download" download>
            {download.label}
          </a>
          <p className="product-download-note">{download.note}</p>
        </div>
      )}
    </ProductArticle>
  );
}

// Una sezione a scomparsa in un riquadro suo: titolo e pulsante centrati (sono
// l'invito ad aprirla), contenuto a sinistra, dove si legge. `spaced`: un po'
// di spazio sotto, come per le domande frequenti.
export function Collapsible({ title, show, hide, spaced = false, children }) {
  const [open, setOpen] = useState(false);
  return (
    <ProductArticle>
      <div className={spaced ? 'product-collapsible is-spaced' : 'product-collapsible'}>
        <h3 className="product-title">{title}</h3>
        <button
          type="button"
          className="button alt small"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? hide : show}
          <i className={`icon solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'} toggle-icon`}></i>
        </button>
        {open && (
          <div className="fade-in product-collapsible-body">
            {children}
          </div>
        )}
      </div>
    </ProductArticle>
  );
}

// Le domande frequenti: tecniche e generali
export function FaqSections({ faq }) {
  const group = (items, prefix) => items.map((item, i) => (
    <div key={`${prefix}-${i}`} className="product-faq-item">
      <p className="product-faq-q">{item.q}</p>
      <p className="product-faq-a">{item.a}</p>
    </div>
  ));
  return (
    <>
      <h4 className="product-faq-title">{faq.techTitle}</h4>
      {group(faq.tech, 'tech')}
      <h4 className="product-faq-title is-spaced">{faq.generalTitle}</h4>
      {group(faq.general, 'gen')}
    </>
  );
}

// Il blocco di un comando (aspetto in product.css); `last`: niente spazio sotto
export function CommandBlock({ last = false, children }) {
  return <pre tabIndex={0} className={last ? 'product-command is-last' : 'product-command'}>{children}</pre>;
}

// Un riquadro della colonna destra, con l'icona (facoltativa) nel titolo
export function SidebarBox({ icon, title, children }) {
  return (
    <section>
      <ul className="divided">
        <li>
          <article className="box highlight">
            <header>
              <h3>
                {icon && <i className={`icon solid ${icon} product-box-icon`}></i>}
                {title}
              </h3>
            </header>
            {children}
          </article>
        </li>
      </ul>
    </section>
  );
}

// Un testo breve in un riquadro (accesso, requisito HTTPS, costi)
export function TextBox({ icon, title, text }) {
  return (
    <SidebarBox icon={icon} title={title}>
      <p className="product-box-text is-only">{text}</p>
    </SidebarBox>
  );
}

// I video di installazione: `file` e' il prefisso dei due video nella release
export function VideoBox({ file, title, intro, windows, linux }) {
  const open = useContext(OpenVideo);
  return (
    <SidebarBox title={title}>
      <p className="product-box-text">{intro}</p>
      <button
        type="button"
        className="button icon brands fa-windows product-box-button has-next"
        onClick={() => open({ src: `${VIDEO_BASE}/${file}-install-windows.mp4`, title: `${title} - ${windows}` })}
      >
        {windows}
      </button>
      <button
        type="button"
        className="button alt icon brands fa-linux product-box-button"
        onClick={() => open({ src: `${VIDEO_BASE}/${file}-install-linux-macos.mp4`, title: `${title} - ${linux}` })}
      >
        {linux}
      </button>
    </SidebarBox>
  );
}

// La chiave di licenza, col contratto in PDF
export function LicenseBox({ title, text, eulaHref, eulaLink }) {
  return (
    <SidebarBox icon="fa-key" title={title}>
      <p className="product-box-text">{text}</p>
      <p className="product-box-link">
        <a href={eulaHref} target="_blank" rel="noopener noreferrer">
          <i className="icon solid fa-file-alt lead-icon"></i>
          {eulaLink}
        </a>
      </p>
    </SidebarBox>
  );
}

// I requisiti, in elenco
export function RequirementsBox({ title, intro, items }) {
  return (
    <SidebarBox icon="fa-microchip" title={title}>
      <p className="product-box-text">{intro}</p>
      <ul className="product-box-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </SidebarBox>
  );
}

// I contatti: email con l'oggetto gia' scritto, LinkedIn, ritorno alla Home
export function ContactBox({ title, text, subject, back }) {
  return (
    <SidebarBox icon="fa-envelope" title={title}>
      <p className="product-box-text">{text}</p>
      <a href={`mailto:arcari.nicholas0@gmail.com?subject=${subject}`} className="button icon solid fa-envelope product-box-button has-next">
        Email
      </a>
      <a href="https://www.linkedin.com/in/nicholas-arcari-6245893a7" className="button alt icon brands fa-linkedin product-box-button has-next" target="_blank" rel="noopener noreferrer">
        LinkedIn
      </a>
      <Link to="/" className="button alt small icon solid fa-arrow-left product-box-button">
        {back}
      </Link>
    </SidebarBox>
  );
}
