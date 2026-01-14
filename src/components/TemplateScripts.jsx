// src/components/TemplateScripts.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TemplateScripts = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Funzione principale di inizializzazione
    const initThemeScripts = () => {
      const $ = window.jQuery;

      // Se jQuery o il menu non esistono, fermati
      if (!$ || $('#nav').length === 0) return;

      const $body = $('body');
      const $nav = $('#nav');

      // --- 1. PULIZIA TOTALE (Fondamentale) ---
      // Rimuoviamo vecchi pannelli e barre per evitare duplicati che bloccano i click
      $('#titleBar').remove();
      $('#navPanel').remove();
      $body.removeClass('navPanel-visible');
      
      // Resettiamo eventuali eventi attaccati in precedenza per evitare doppi click
      $('#navPanel').off(); 

      // --- 2. DESKTOP: Dropdowns (Dropotron) ---
      // Inizializziamo solo se ci sono sottomenu
      if ($nav.children('ul').length > 0) {
        // Disattiva dropotron se era già attivo (per sicurezza)
        if ($nav.children('ul').data('dropotron')) {
             $nav.children('ul').dropotron('destroy');
        }
        
        $nav.children('ul').dropotron({
          mode: 'fade',
          noOpenerFade: true,
          hoverDelay: 150,
          hideDelay: 350
        });
      }

      // --- 3. MOBILE: NavPanel ---
      // Aggiungiamo il pulsante hamburger
      $('<div id="titleBar">' +
        '<a href="#navPanel" class="toggle"></a>' +
        '</div>'
      ).appendTo($body);

      // Creiamo il pannello laterale clonando il menu
      $('<div id="navPanel">' +
        '<nav>' +
        $nav.navList() +
        '</nav>' +
        '</div>'
      )
        .appendTo($body)
        .panel({
          delay: 500,
          hideOnClick: true,
          hideOnSwipe: true,
          resetScroll: true,
          resetForms: true,
          side: 'left',
          target: $body,
          visibleClass: 'navPanel-visible'
        });

      // --- 4. GESTIONE CLICK MOBILE (React Router Fix) ---
      // Intercettiamo i click sul menu mobile APPENA CREATO
      // Nota: usiamo 'body' come delegato perché #navPanel viene creato dinamicamente
      $('body').off('click', '#navPanel a'); // Rimuovi vecchi listener
      $('body').on('click', '#navPanel a', function(e) {
        const href = $(this).attr('href');

        // Se è un link interno valido
        if (href && href !== '#' && !href.startsWith('http') && !href.startsWith('mailto')) {
          e.preventDefault();
          e.stopPropagation();

          // Chiudi il menu
          $body.removeClass('navPanel-visible');

          // Naviga con React (rimuovendo l'eventuale # iniziale)
          const path = href.replace('#', '');
          navigate(path);
        }
      });
    };

    // Ritardo di 200ms per dare tempo a React di renderizzare il DOM
    const timer = setTimeout(initThemeScripts, 200);

    // Cleanup quando si cambia pagina
    return () => {
      clearTimeout(timer);
      // Pulizia extra quando il componente si smonta
      const $ = window.jQuery;
      if ($) {
        $('#titleBar').remove();
        $('#navPanel').remove();
        $('body').removeClass('navPanel-visible');
      }
    };

  }, [location, navigate]); // Riesegui ad ogni cambio pagina

  return null;
};

export default TemplateScripts;