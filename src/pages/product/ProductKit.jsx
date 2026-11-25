// src/pages/product/ProductKit.jsx
// I pezzi comuni alle pagine dei prodotti (SOC Suite, Citizen Shield, FinanzMe,
// ByteBulk, SeedCast): lo scheletro della pagina, l'intestazione del prodotto,
// le guide di installazione, le sezioni a scomparsa, le domande frequenti e i
// riquadri della colonna destra. Ogni pagina li compone e ci aggiunge le sue
// sezioni; i testi arrivano gia' tradotti, cosi' le chiavi restano scritte per
// intero nella pagina e la build le controlla (build/i18n-check.js).
import { createContext, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';
import SiteHeader from '../../components/SiteHeader';
import VideoModal from '../../components/VideoModal';
import { VIDEO_BASE } from '../../config/media';
import { usePageLayout } from '../../utils/usePageLayout';
import { usePageTitle } from '../../utils/usePageTitle';

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
      <div id="page-wrapper">
        <SiteHeader terminal={terminal} />
        <section id="main">
          <div className="container">
            <div className="row">
              <div id="content" className="col-8 col-12-medium">
                {children}
                {/* Doppia riga orizzontale sotto l'ultimo riquadro (come quella disegnata sopra) */}
                <div className="double-rule" aria-hidden="true"></div>
                <div style={{ margin: '2em 0', textAlign: 'center' }}>
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
  return <article className="box post" style={{ padding: '4em 2em' }}>{children}</article>;
}

// Icona, nome del prodotto, stato (facoltativo) e descrizione, centrati
export function ProductHero({ icon, heading, status, text }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <i className={`icon solid ${icon}`} style={{ fontSize: '4em', color: 'var(--accent-text)', marginBottom: '0.3em', display: 'block' }}></i>
      <h2 style={{ fontSize: '3em', marginBottom: status ? '0.2em' : '0.3em' }}>{heading}</h2>
      {status && (
        <p style={{ fontSize: '0.85em', color: 'var(--accent-text)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1em' }}>
          {status}
        </p>
      )}
      <p style={{ fontSize: '1.2em', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto 2em' }}>
        {text}
      </p>
    </div>
  );
}

// Cosa include: titolo ed elenco delle funzioni
export function FeatureList({ title, items }) {
  return (
    <>
      <h3 style={{ marginBottom: '0.6em' }}>{title}</h3>
      <ul style={{ marginBottom: '2em' }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: '0.3em' }}>{item}</li>
        ))}
      </ul>
    </>
  );
}

// Com'e' fatto il prodotto: titolo, introduzione, punti, nota finale
export function ArchitectureSection({ title, intro, items, note }) {
  return (
    <>
      <h3 style={{ marginBottom: '0.6em' }}>{title}</h3>
      <p style={{ marginBottom: '1.2em', lineHeight: 1.6 }}>{intro}</p>
      <ul style={{ marginBottom: '1em' }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: '0.5em', lineHeight: 1.5 }}>{item}</li>
        ))}
      </ul>
      <p style={{ fontSize: '0.9em', color: 'var(--text-subtle)', marginBottom: '1em' }}>
        {note}
      </p>
    </>
  );
}

// Una guida di installazione aperta: introduzione, passi, nota finale
function Guide({ intro, steps, note }) {
  return (
    <div className="fade-in" style={{ marginBottom: '2em' }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: '0.8em' }}>
        {intro}
      </p>
      <ol>
        {steps.map((step, i) => (
          <li key={i} style={{ marginBottom: '0.6em', lineHeight: 1.5 }}>{step}</li>
        ))}
      </ol>
      <p style={{ fontSize: '0.9em', color: 'var(--text-subtle)', marginTop: '1em' }}>
        {note}
      </p>
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
      <h3 style={{ marginBottom: '0.6em' }}>{title}</h3>
      <div style={{ display: 'flex', gap: '0.5em', marginBottom: '1.2em', flexWrap: 'wrap' }}>
        {tab('simple', simple.tab)}
        {tab('tech', tech.tab)}
      </div>
      {guide === 'simple' && <Guide {...simple} />}
      {guide === 'tech' && <Guide {...tech} />}
      {download && (
        <div style={{ textAlign: 'center', margin: '2em 0' }}>
          <a href={download.href} className="button icon solid fa-download" download>
            {download.label}
          </a>
          <p style={{ fontSize: '0.85em', color: 'var(--text-subtle)', marginTop: '0.8em' }}>
            {download.note}
          </p>
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
      <div style={spaced ? { marginBottom: '1em', textAlign: 'center' } : { textAlign: 'center' }}>
        <h3 style={{ marginBottom: '0.6em' }}>{title}</h3>
        <button
          type="button"
          className="button alt small"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? hide : show}
          <i className={`icon solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginLeft: '10px' }}></i>
        </button>
        {open && (
          <div className="fade-in" style={{ marginTop: '1.5em', textAlign: 'left' }}>
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
    <div key={`${prefix}-${i}`} style={{ marginBottom: '1.2em' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '0.3em' }}>{item.q}</p>
      <p style={{ color: 'var(--text-muted)', margin: 0 }}>{item.a}</p>
    </div>
  ));
  return (
    <>
      <h4 style={{ marginBottom: '0.8em', color: 'var(--accent-text)' }}>{faq.techTitle}</h4>
      {group(faq.tech, 'tech')}
      <h4 style={{ margin: '1.8em 0 0.8em', color: 'var(--accent-text)' }}>{faq.generalTitle}</h4>
      {group(faq.general, 'gen')}
    </>
  );
}

// Il blocco di un comando, su sfondo grigio traslucido e col colore del testo
// ereditato: regge sia il tema chiaro sia quello scuro senza stili doppi.
export function CommandBlock({ last = false, children }) {
  return (
    <pre tabIndex={0} style={{
      fontFamily: 'monospace', fontSize: '0.78em', lineHeight: 1.6,
      whiteSpace: 'pre', overflowX: 'auto', margin: last ? 0 : '0 0 1em',
      padding: '0.9em 1em', borderLeft: '3px solid #d52349',
      background: 'rgba(128,128,128,0.12)', borderRadius: '3px',
    }}>{children}</pre>
  );
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
                {icon && <i className={`icon solid ${icon}`} style={{ color: 'var(--accent-text)', marginRight: '0.5em' }}></i>}
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
      <p style={{ fontSize: '0.95em', color: 'var(--text-muted)', margin: 0 }}>{text}</p>
    </SidebarBox>
  );
}

// I video di installazione: `file` e' il prefisso dei due video nella release
export function VideoBox({ file, title, intro, windows, linux }) {
  const open = useContext(OpenVideo);
  return (
    <SidebarBox title={title}>
      <p style={{ fontSize: '0.95em', color: 'var(--text-muted)' }}>{intro}</p>
      <button
        type="button"
        className="button icon brands fa-windows"
        style={{ width: '100%', marginBottom: '10px' }}
        onClick={() => open({ src: `${VIDEO_BASE}/${file}-install-windows.mp4`, title: `${title} - ${windows}` })}
      >
        {windows}
      </button>
      <button
        type="button"
        className="button alt icon brands fa-linux"
        style={{ width: '100%' }}
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
      <p style={{ fontSize: '0.95em', color: 'var(--text-muted)' }}>{text}</p>
      <p style={{ fontSize: '0.9em', marginTop: '0.9em', marginBottom: 0 }}>
        <a href={eulaHref} target="_blank" rel="noopener noreferrer">
          <i className="icon solid fa-file-alt" style={{ marginRight: '0.4em' }}></i>
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
      <p style={{ fontSize: '0.95em', color: 'var(--text-muted)' }}>{intro}</p>
      <ul style={{ fontSize: '0.9em', marginBottom: 0 }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: '0.2em' }}>{item}</li>
        ))}
      </ul>
    </SidebarBox>
  );
}

// I contatti: email con l'oggetto gia' scritto, LinkedIn, ritorno alla Home
export function ContactBox({ title, text, subject, back }) {
  return (
    <SidebarBox icon="fa-envelope" title={title}>
      <p style={{ fontSize: '0.95em', color: 'var(--text-muted)' }}>{text}</p>
      <a href={`mailto:arcari.nicholas0@gmail.com?subject=${subject}`} className="button icon solid fa-envelope" style={{ width: '100%', marginBottom: '10px' }}>
        Email
      </a>
      <a href="https://www.linkedin.com/in/nicholas-arcari-6245893a7" className="button alt icon brands fa-linkedin" target="_blank" rel="noopener noreferrer" style={{ width: '100%', marginBottom: '10px' }}>
        LinkedIn
      </a>
      <Link to="/" className="button alt small icon solid fa-arrow-left" style={{ width: '100%' }}>
        {back}
      </Link>
    </SidebarBox>
  );
}
