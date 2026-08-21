// src/components/TemplateScripts.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';

const TemplateScripts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

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
      const $navPanel = $('<div id="navPanel">' +
        '<nav>' +
        $nav.navList() +
        '</nav>' +
        '</div>'
      );

      // --- FIX MENU MOBILE: sottomenu "Passioni" ---
      // navList() clona i link presenti nel DOM al momento dell'init, ma il
      // sottomenu delle passioni e' renderizzato da React solo quando aperto
      // (hover): al caricamento non esiste, quindi i suoi link non finivano nel
      // pannello mobile. In piu' la voce "Passioni" non ha href, per cui il tap
      // non produceva alcun effetto. Qui reinseriamo i link figli sotto di essa.
      // Nota: sotto i 980px "#nav" e' nascosto e si usa solo "#navPanel",
      // quindi questo e' l'unico punto che governa il menu su telefono.
      const passionLinks = [
        { href: '#/ricette', label: t('nav.recipes') },
        { href: '#/cocktail', label: t('nav.cocktails') },
        { href: '#/stampe3d', label: t('nav.prints3d') },
      ];
      const $passions = $navPanel.find('a.link').filter(function () {
        return !$(this).attr('href');
      }).first();

      if ($passions.length > 0) {
        const childrenHtml = passionLinks.map((l) =>
          '<a class="link depth-1" href="' + l.href + '">' +
          '<span class="indent-1"></span>' + l.label + '</a>'
        ).join('');
        $passions.after(childrenHtml);
      }

      $navPanel
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

  }, [location, navigate, t]); // Riesegui a ogni cambio pagina o di lingua

  return null; // Questo componente non mostra nulla a video
};

export default TemplateScripts;