// src/components/MobileNav.jsx
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import { NAV } from '../config/nav';
import '../i18n/nav';

// Il menu a scomparsa di telefoni e tablet (sotto i 980 px main.css nasconde
// #nav): la barra in alto col pulsante (#titleBar) e il pannello che entra da
// sinistra (#navPanel). Prima lo costruivano jQuery e i plugin del template;
// qui ha la stessa struttura (classi link, depth-N, indent-N e la classe
// navPanel-visible sul body), cosi' lo stile resta quello di main.css. Le voci
// sono quelle di src/config/nav.js, con i sottomenu rientrati.
// Come faceva il template si chiude scegliendo una voce, toccando o cliccando
// fuori dal pannello, con Esc o con uno scorrimento del dito verso sinistra.
const TRANSITION = 500; // la durata dello scorrimento del pannello in main.css
const SWIPE = 50; // i px verso sinistra che chiudono il pannello...
const SWIPE_SLACK = 20; // ...se il dito non si e' spostato in verticale piu' di cosi'

const ITEMS = NAV.flatMap((item) => [
  { ...item, depth: 0 },
  ...(item.children || []).map((child) => ({ ...child, depth: 1 })),
]);

const MobileNav = () => {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  // cambiando pagina il pannello si chiude: lo stato che dipende da un valore
  // che cambia si azzera durante il render, come suggerisce React
  const [shownOn, setShownOn] = useState(pathname);
  if (shownOn !== pathname) {
    setShownOn(pathname);
    setOpen(false);
  }
  const panel = useRef(null);
  const toggle = useRef(null);
  const touch = useRef(null);

  useEffect(() => {
    document.body.classList.toggle('navPanel-visible', open);
    if (open) return undefined;
    // richiuso, il pannello riparte dall'inizio quando e' uscito dallo schermo
    const timer = setTimeout(() => {
      if (panel.current) panel.current.scrollTop = 0;
    }, TRANSITION);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => () => document.body.classList.remove('navPanel-visible'), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    // a pannello aperto un tocco sulla pagina lo chiude e basta: non segue un
    // link che stava sotto il dito. Per questo si ascolta in cattura, prima di
    // React e del browser.
    const onOutside = (event) => {
      if (panel.current?.contains(event.target) || toggle.current?.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('click', onOutside, true);
    document.addEventListener('touchend', onOutside, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onOutside, true);
      document.removeEventListener('touchend', onOutside, true);
    };
  }, [open]);

  const flip = () => setOpen((value) => !value);

  const onToggleKey = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const opening = !open;
    flip();
    // da tastiera il fuoco entra nel pannello, sulla prima voce
    if (opening) requestAnimationFrame(() => panel.current?.querySelector('a')?.focus());
  };

  const onTouchStart = (event) => {
    const { pageX, pageY } = event.touches[0];
    touch.current = { x: pageX, y: pageY };
  };
  const onTouchMove = (event) => {
    if (!touch.current) return;
    const dx = touch.current.x - event.touches[0].pageX;
    const dy = touch.current.y - event.touches[0].pageY;
    if (Math.abs(dy) < SWIPE_SLACK && dx > SWIPE) {
      touch.current = null;
      setOpen(false);
    }
  };

  const close = () => setOpen(false);

  return createPortal(
    <>
      <div id="titleBar">
        <a
          ref={toggle}
          className="toggle"
          role="button"
          tabIndex={0}
          aria-label={t('nav.menu')}
          aria-expanded={open}
          aria-controls="navPanel"
          onClick={flip}
          onKeyDown={onToggleKey}
        />
      </div>
      {/* chiuso il pannello resta fuori schermo: inert lo toglie dal giro del
          tasto Tab e dai lettori di schermo */}
      <div id="navPanel" ref={panel} inert={!open} onTouchStart={onTouchStart} onTouchMove={onTouchMove}>
        <nav aria-label={t('nav.menu')}>
          {ITEMS.map((item) => {
            const className = `link depth-${item.depth}`;
            const content = (
              <>
                <span className={`indent-${item.depth}`} />
                {t(item.label)}
              </>
            );
            if (item.href) {
              return <a key={item.label} className={className} href={item.href} target="_blank" rel="noreferrer" onClick={close}>{content}</a>;
            }
            if (item.to) {
              return <Link key={item.label} className={className} to={item.to} onClick={close}>{content}</Link>;
            }
            return <span key={item.label} className={className}>{content}</span>;
          })}
        </nav>
      </div>
    </>,
    document.body,
  );
};

export default MobileNav;
