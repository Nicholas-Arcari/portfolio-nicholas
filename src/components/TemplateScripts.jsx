// src/components/TemplateScripts.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TemplateScripts = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Definiamo la funzione di inizializzazione
    const initThemeScripts = () => {
      const $ = window.jQuery;

      // Se jQuery non c'è o il menu non è ancora stato disegnato da React, riprova dopo
      if (!$ || $('#nav').length === 0) {
        return; 
      }

      const $body = $('body');
      const $nav = $('#nav');

      // --- 1. PULIZIA (Reset) ---
      // Rimuoviamo eventuali barre vecchie create da navigazioni precedenti
      $('#titleBar').remove();
      $('#navPanel').remove();
      $body.removeClass('navPanel-visible');

      // Rimuoviamo i vecchi handler dal body per evitare accumulo
      $body.off('.navPanel');
      $(document).off('.navPanel');

      // Sblocchiamo lo scroll se era rimasto bloccato
      $('html, body').css('overflow', '');

      // --- 2. DROPDOWNS (Menu Desktop) ---
      if ($nav.children('ul').length > 0) {
        // Se dropotron è già attivo, distruggilo per ricrearlo pulito
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
      // Creiamo il pulsante Hamburger (senza href="#navPanel" per evitare
      // conflitti con HashRouter che interpreterebbe il cambio di hash
      // come una navigazione di route)
      $('<div id="titleBar">' +
        '<a class="toggle"></a>' +
        '</div>'
      ).appendTo($body);

      // Creiamo il Pannello Laterale clonando i link del menu originale
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

      // --- 4. TOGGLE HAMBURGER ---
      // Gestiamo il click direttamente invece di affidarci al plugin panel()
      // che usa href="#navPanel" (incompatibile con HashRouter)
      $('#titleBar .toggle').on('click.navPanel', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $body.toggleClass('navPanel-visible');
      });

      // --- 5. GESTIONE CLICK LINK NEL MENU MOBILE ---
      $(document).on('click.navPanel', '#navPanel a', function(e) {
        const href = $(this).attr('href');

        // Se è un link interno (non inizia con http, non è vuoto, non è solo #)
        if (href && href !== '#' && !href.startsWith('http') && !href.startsWith('mailto')) {
          e.preventDefault();
          e.stopPropagation();

          // 1. Chiudi graficamente il menu
          $body.removeClass('navPanel-visible');

          // 2. Pulisci l'indirizzo (rimuovi il # se presente all'inizio)
          let path = href;
          if (path.startsWith('#')) {
             path = path.substring(1);
          }

          // 3. Naviga usando React
          navigate(path);
        }
      });
    };

    // Eseguiamo lo script con un piccolo ritardo (200ms) per essere SICURI 
    // che React abbia finito di disegnare l'HTML della pagina.
    const timer = setTimeout(initThemeScripts, 200);

    // Pulizia quando si smonta il componente
    return () => {
      clearTimeout(timer);
      const $ = window.jQuery;
      if($) {
          $('body').removeClass('navPanel-visible');
          // Rimuoviamo gli handler namespaced per evitare accumulo
          $('body').off('.navPanel');
          $(document).off('.navPanel');
      }
    };

  }, [location, navigate]); // Riesegui ogni volta che l'utente cambia pagina

  return null; // Questo componente non mostra nulla a video
};

export default TemplateScripts;