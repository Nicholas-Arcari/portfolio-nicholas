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
import { goToSection } from './goToSection';

const OPEN_CLASS = 'hw-index-open';

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
    goToSection(id);
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
