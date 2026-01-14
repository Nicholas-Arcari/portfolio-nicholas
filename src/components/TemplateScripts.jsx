// src/components/TemplateScripts.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TemplateScripts = () => {
  const location = useLocation();

  useEffect(() => {
    // Funzione che esegue lo script jQuery
    const initThemeScripts = () => {
      const $ = window.jQuery;
      
      // Se jQuery non è caricato o il menu non esiste ancora, esci
      if (!$ || $('#nav').length === 0) return;

      const $body = $('body');
      const $nav = $('#nav');

      // 1. Pulizia preventiva (Rimuove vecchi menu se esistono per evitare duplicati)
      $('#titleBar').remove();
      $('#navPanel').remove();
      $body.removeClass('navPanel-visible');

      // 2. Dropdowns (Menu a tendina desktop)
      if ($nav.children('ul').length > 0) {
          $nav.children('ul').dropotron({
              mode: 'fade',
              noOpenerFade: true,
              hoverDelay: 150,
              hideDelay: 350
          });
      }

      // 3. Mobile Navigation (Sidebar)
      // Title Bar (le tre lineette)
      $(
          '<div id="titleBar">' +
              '<a href="#navPanel" class="toggle"></a>' +
          '</div>'
      ).appendTo($body);

      // Panel (il menu laterale vero e proprio)
      $(
          '<div id="navPanel">' +
              '<nav>' +
                  // Qui usa la funzione navList() definita in util.js
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
    };

    // Eseguiamo lo script con un piccolo ritardo (100ms) per dare tempo a React di disegnare il DOM
    const timer = setTimeout(initThemeScripts, 100);

    // Pulizia quando si smonta il componente
    return () => clearTimeout(timer);

  }, [location]); // Riesegui ogni volta che cambia la pagina (location)

  // Questo componente non renderizza nulla visivamente, gestisce solo gli script
  return null;
};

export default TemplateScripts;