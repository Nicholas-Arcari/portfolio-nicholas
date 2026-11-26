// src/components/SkipLink.jsx
// Il primo elemento che si raggiunge con Tab, prima ancora dei pulsanti di
// tema e lingua: porta il focus all'inizio del contenuto (#main, che ogni
// pagina ha), senza dover attraversare logo e menu a ogni pagina. Gli indirizzi
// del sito stanno dopo il # (HashRouter), quindi non puo' essere un semplice
// link a "#main", che cambierebbe pagina: l'href e' la pagina stessa (aperto in
// una scheda nuova non rompe niente) e il clic sposta il focus. Resta fuori
// dalla vista finche' non ha il focus (.skip-link, HackerTheme.css).
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import '../i18n/nav';

const SkipLink = () => {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const skip = (event) => {
    const main = document.getElementById('main');
    if (!main) return;
    event.preventDefault();
    main.setAttribute('tabindex', '-1');
    main.focus();
  };
  return <a className="skip-link" href={`#${pathname}`} onClick={skip}>{t('nav.skip')}</a>;
};

export default SkipLink;
