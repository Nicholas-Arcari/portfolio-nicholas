// src/pages/statistics/HomeworkIndex.jsx
// Il pulsante "Indice" accanto al titolo di un homework e il suo modal: le
// sezioni della pagina in sovrimpressione, sopra uno sfondo scurito, e un
// clic porta all'inizio della sezione scelta.
//
// Il modal e' un <dialog> nativo aperto con showModal(): il browser lo mette
// nello strato superiore (sopra tutto, anche dentro un antenato con un
// transform come .page-transition), rende inerte il resto della pagina,
// chiude con Esc e riporta il focus al pulsante. Qui restano lo sfondo, il
// blocco dello scorrimento e il salto alla sezione: i titoli delle sezioni
// hanno tabIndex -1, cosi' il focus arriva li' e la tastiera riparte da li'.
import React, { useEffect, useRef } from 'react';

const OPEN_CLASS = 'hw-index-open';
const FOLLOW_MS = 2500;

// Porta il titolo in cima e lo segue per un paio di secondi: se nel
// frattempo qualcosa sopra cambia altezza (il terminale dell'intestazione che
// scrive una riga, un grafico che finisce di disegnarsi), lo scorrimento
// riparte verso la nuova posizione invece di fermarsi storto. Se l'utente
// scorre da se', si smette subito di inseguire.
function scrollToSection(target) {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const userEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  const started = performance.now();
  let stopped = false;
  let lastTop = target.getBoundingClientRect().top + window.scrollY;
  const stop = () => {
    stopped = true;
    userEvents.forEach((type) => window.removeEventListener(type, stop));
  };
  userEvents.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  target.scrollIntoView({ behavior, block: 'start' });
  const follow = () => {
    if (stopped) return;
    if (performance.now() - started > FOLLOW_MS) {
      stop();
      return;
    }
    const top = target.getBoundingClientRect().top + window.scrollY;
    if (Math.abs(top - lastTop) > 1) {
      lastTop = top;
      target.scrollIntoView({ behavior, block: 'start' });
    }
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
}

const HomeworkIndex = ({ sections, labels }) => {
  const dialogRef = useRef(null);

  // se la pagina cambia con il modal aperto, lo scorrimento torna libero
  useEffect(() => () => document.documentElement.classList.remove(OPEN_CLASS), []);

  const open = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    document.documentElement.classList.add(OPEN_CLASS);
    dialog.showModal();
  };

  const close = () => {
    document.documentElement.classList.remove(OPEN_CLASS);
    if (dialogRef.current && dialogRef.current.open) dialogRef.current.close();
  };

  const go = (id) => {
    close();
    const target = document.getElementById(id);
    if (!target) return;
    target.focus({ preventScroll: true });
    scrollToSection(target);
    // un lampo breve sul titolo raggiunto, come per la ruota della fortuna
    target.classList.remove('hw-index-target');
    void target.offsetWidth;
    target.classList.add('hw-index-target');
    target.addEventListener('animationend', () => target.classList.remove('hw-index-target'), { once: true });
  };

  return (
    <>
      <button type="button" className="button alt icon solid fa-list-ul hw-index-button" onClick={open} aria-haspopup="dialog">
        {labels.button}
      </button>
      <dialog
        ref={dialogRef}
        className="hw-index"
        aria-labelledby="hw-index-title"
        onClose={close}
        onClick={(e) => {
          // il clic sullo sfondo arriva al <dialog> stesso: il riquadro interno lo riempie tutto
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="hw-index-box">
          <div className="hw-index-head">
            <h4 id="hw-index-title">{labels.title}</h4>
            <button type="button" className="hw-index-close" onClick={close} aria-label={labels.close}>
              &times;
            </button>
          </div>
          <nav className="hw-index-body" aria-labelledby="hw-index-title">
            <ul className="hw-index-list">
              {sections.map((s) => (
                <li key={s.id} className={`hw-index-level-${s.level}`}>
                  <button type="button" onClick={() => go(s.id)}>{s.title}</button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </dialog>
    </>
  );
};

export default HomeworkIndex;
