// src/components/TemplateScripts.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // 1. Importa useNavigate

const TemplateScripts = () => {
  const location = useLocation();
  const navigate = useNavigate(); // 2. Inizializza il navigatore

  useEffect(() => {
    // Funzione che esegue lo script jQuery
    const initThemeScripts = () => {
      const $ = window.jQuery;
      
      // Se jQuery non è caricato o il menu non esiste ancora, esci
      if (!$ || $('#nav').length === 0) return;

      const $body = $('body');
      const $nav = $('#nav');

      // 1. Pulizia preventiva
      $('#titleBar').remove();
      $('#navPanel').remove();
      $body.removeClass('navPanel-visible');

      // 2. Dropdowns Desktop
      if ($nav.children('ul').length > 0) {
          $nav.children('ul').dropotron({
              mode: 'fade',
              noOpenerFade: true,
              hoverDelay: 150,
              hideDelay: 350
          });
      }

      // 3. Mobile Navigation (Sidebar)
      // Title Bar
      $(
          '<div id="titleBar">' +
              '<a href="#navPanel" class="toggle"></a>' +
          '</div>'
      ).appendTo($body);

      // Panel
      $(
          '<div id="navPanel">' +
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

      // --- FIX MOBILE NAV (La parte magica) ---
      // Intercettiamo i click sui link dentro il pannello mobile appena creato
      $('#navPanel').on('click', 'a', function(e) {
        const href = $(this).attr('href');

        // Se è un link interno (non inizia con http e non è vuoto)
        if (href && href !== '#' && !href.startsWith('http') && !href.startsWith('mailto')) {
            e.preventDefault();     // Ferma il comportamento standard del browser
            e.stopPropagation();    // Ferma eventuali script jQuery del template

            // 1. Chiudi il menu rimuovendo la classe
            $body.removeClass('navPanel-visible');

            // 2. Pulisci l'href (che potrebbe essere '#/ricette') per ottenere '/ricette'
            // Dato che usi HashRouter, il link reale è già '#/ricette', ma navigate vuole il path
            const path = href.replace('#', ''); 

            // 3. Naviga usando React Router
            navigate(path);
        }
      });
    };

    const timer = setTimeout(initThemeScripts, 100);

    return () => clearTimeout(timer);

  }, [location, navigate]); // Aggiungi navigate alle dipendenze

  return null;
};

export default TemplateScripts;