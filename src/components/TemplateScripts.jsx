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
      // Creiamo il pulsante Hamburger
      $('<div id="titleBar">' +
        '<a href="#navPanel" class="toggle"></a>' +
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

      // --- 4. GESTIONE CLICK (Il trucco per farli funzionare) ---
      // Rimuoviamo vecchi eventi per evitare doppi click
      $(document).off('click', '#navPanel a');
      
      // Aggiungiamo un listener su TUTTI i link del menu mobile
      $(document).on('click', '#navPanel a', function(e) {
        const href = $(this).attr('href');

        // Se è un link interno (non inizia con http, non è vuoto, non è solo #)
        if (href && href !== '#' && !href.startsWith('http') && !href.startsWith('mailto')) {
          e.preventDefault(); // Ferma il browser (che ricaricherebbe la pagina)
          e.stopPropagation();

          // 1. Chiudi graficamente il menu
          $body.removeClass('navPanel-visible');

          // 2. Pulisci l'indirizzo (rimuovi il # se presente all'inizio)
          // Esempio: se href="#/ricette" diventa "/ricette"
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
          // Nota: Non rimuoviamo titleBar qui per evitare "flash" visivi durante la navigazione,
          // la pulizia avverrà all'inizio del prossimo ciclo (punto 1).
          $('body').removeClass('navPanel-visible');
      }
    };

  }, [location, navigate]); // Riesegui ogni volta che l'utente cambia pagina

  return null; // Questo componente non mostra nulla a video
};

export default TemplateScripts;