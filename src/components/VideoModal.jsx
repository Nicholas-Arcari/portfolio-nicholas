// src/components/VideoModal.jsx
// Modal in sovrimpressione per i video tutorial.
// Il tag <video> viene renderizzato SOLO quando `open` e true: cosi il file
// non viene scaricato finche l'utente non preme il pulsante (nessun peso a
// pagina chiusa). Chiusura con click sull'overlay, sul bottone o con Esc.
//
// Da tastiera e per i lettori di schermo la finestra e' l'unica cosa sulla
// pagina finche' resta aperta: all'apertura il focus va sul pulsante di
// chiusura e il resto del documento diventa inerte (inert: non si raggiunge
// con Tab e i lettori di schermo non lo leggono); alla chiusura tutto torna
// com'era e il focus torna al pulsante che l'aveva aperta. Il nome della
// finestra e' il suo titolo.
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const VideoModal = ({ open, onClose, src, title, unsupportedText, closeLabel }) => {
  const overlay = useRef(null);
  const closeButton = useRef(null);
  const titleId = useId();
  // l'ultima onClose ricevuta: l'effetto qui sotto dipende solo da `open`, cosi'
  // un nuovo render del genitore non sposta il focus a finestra aperta
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') close.current();
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const opener = document.activeElement;
    const others = [...document.body.children].filter((el) => el !== overlay.current && !el.inert);
    others.forEach((el) => { el.inert = true; });
    closeButton.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      others.forEach((el) => { el.inert = false; });
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  // Il modal viene montato via portal direttamente su document.body: cosi
  // "position: fixed" e ancorato al viewport e non a un antenato con transform
  // (es. ".page-transition"), che altrimenti lo farebbe scorrere con la pagina.
  // Risultato: il riquadro resta centrato ovunque si trovi l'utente nella pagina.
  return createPortal(
    <div ref={overlay} className="video-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="video-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-head">
          <h4 id={titleId} className="video-modal-title">{title}</h4>
          <button
            ref={closeButton}
            type="button"
            className="video-modal-close"
            onClick={onClose}
            aria-label={closeLabel}
          >
            &times;
          </button>
        </div>
        <video className="video-modal-video" src={src} controls autoPlay preload="metadata">
          {unsupportedText}
        </video>
      </div>
    </div>,
    document.body
  );
};

export default VideoModal;
