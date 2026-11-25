// src/components/SiteNav.jsx
import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import { NAV } from '../config/nav';

// Un sottomenu del menu in alto (Passioni). Si apre passando col mouse, come
// e' sempre stato, ma anche con un clic o un tocco e da tastiera: Invio o
// spazio sulla voce, freccia giu' per entrare nell'elenco; Esc lo chiude e
// riporta il fuoco sulla voce, e si chiude anche quando il fuoco esce.
// La voce resta un <a> perche' il template disegna cosi' le voci del menu;
// senza href non entrerebbe nel giro del tasto Tab, da qui tabIndex e role.
const Dropdown = ({ item }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const trigger = useRef(null);
  const list = useRef(null);

  const links = () => [...(list.current ? list.current.querySelectorAll('a') : [])];

  const onTriggerKey = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen((value) => !value);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      // l'elenco esiste solo da aperto: il fuoco ci va al disegno successivo
      requestAnimationFrame(() => links()[0]?.focus());
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const onListKey = (event) => {
    const all = links();
    const at = all.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      setOpen(false);
      trigger.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      all[(at + step + all.length) % all.length]?.focus();
    }
  };

  // il fuoco e' passato fuori dalla voce e dal suo elenco
  const onBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <li className="nav-dropdown" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onBlur={onBlur}>
      <a
        ref={trigger}
        className={item.icon}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        // un clic o un tocco apre: richiudere lo fanno l'uscita del mouse,
        // un tocco altrove, Esc. Col mouse il menu e' gia' aperto dal
        // passaggio, e un clic che lo chiudesse sotto il puntatore sorprenderebbe
        onClick={() => setOpen(true)}
        onKeyDown={onTriggerKey}
      >
        <span>{t(item.label)}</span>
      </a>
      {open && (
        <ul id={menuId} ref={list} className="nav-dropdown-menu" onKeyDown={onListKey}>
          {item.children.map((child) => (
            <li key={child.to}><Link to={child.to}>{t(child.label)}</Link></li>
          ))}
        </ul>
      )}
    </li>
  );
};

// Il menu in alto delle pagine (sopra i 980 px; sotto c'e' quello a scomparsa).
// `current`: l'id della voce da evidenziare, se la pagina e' una delle voci.
const SiteNav = ({ current }) => {
  const { t } = useLanguage();
  return (
    <nav id="nav">
      <ul>
        {NAV.map((item) => {
          if (item.children) return <Dropdown key={item.id} item={item} />;
          const label = <span>{t(item.label)}</span>;
          return (
            <li key={item.id} className={item.id === current ? 'current' : undefined}>
              {item.href
                ? <a className={item.icon} href={item.href} target="_blank" rel="noreferrer">{label}</a>
                : <Link className={item.icon} to={item.to}>{label}</Link>}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SiteNav;
