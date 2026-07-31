// src/components/VideoModal.jsx
// Modal in sovrimpressione per i video tutorial.
// Il tag <video> viene renderizzato SOLO quando `open` e true: cosi il file
// non viene scaricato finche l'utente non preme il pulsante (nessun peso a
// pagina chiusa). Chiusura con click sull'overlay, sul bottone o con Esc.
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const VideoModal = ({ open, onClose, src, title, unsupportedText, closeLabel }) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  // Il modal viene montato via portal direttamente su document.body: cosi
  // "position: fixed" e ancorato al viewport e non a un antenato con transform
  // (es. ".page-transition"), che altrimenti lo farebbe scorrere con la pagina.
  // Risultato: il riquadro resta centrato ovunque si trovi l'utente nella pagina.
  return createPortal(
    <div className="video-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="video-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-head">
          <h4 className="video-modal-title">{title}</h4>
          <button
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
