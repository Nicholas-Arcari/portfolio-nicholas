// src/components/SiteHeader.jsx
import { Link } from 'react-router-dom';
import TerminalText from './TerminalText';
import SiteNav from './SiteNav';

// L'intestazione di ogni pagina: il logo, il terminale animato con le righe
// della pagina (`terminal`) e il menu, con la voce `current` evidenziata. Le
// pagine di errore mostrano solo il logo (`nav={false}`, senza terminale).
const SiteHeader = ({ terminal, current, nav = true }) => (
  <section id="header">
    <div className="container">
      <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
      {terminal && (
        <>
          <br />
          <TerminalText lines={terminal} />
        </>
      )}
      {nav && <SiteNav current={current} />}
    </div>
  </section>
);

export default SiteHeader;
