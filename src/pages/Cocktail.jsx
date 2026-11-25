// src/pages/Cocktail.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SearchInput from '../components/SearchInput';
import { useRemembered, useRememberedScroll } from '../utils/listMemory';
import WheelOfFortune from '../components/WheelOfFortune';
import { jumpToItem } from '../utils/jumpToItem';
import { DRINK_SYMBOLS, withSymbols } from '../config/symbols';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import '../i18n/cocktail';
import '../i18n/settings';
import '../i18n/wheel';

const Cocktail = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useRemembered('search', '');
  useRememberedScroll();

  usePageLayout('right-sidebar', { scrollToTop: false });

  // --- DATABASE COCKTAIL TECH (from translations) ---
  // Simbolo assegnato per indice: coerente tra lista e ruota della fortuna
  const cocktailsData = withSymbols(t('cocktail.cocktails'), DRINK_SYMBOLS);

  // Filtra i cocktail
  const filteredCocktails = cocktailsData.filter(cocktail =>
    cocktail.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="page-wrapper">

      {/* --- HEADER --- */}
      <SiteHeader terminal={t('cocktail.terminal')} />

      {/* --- MAIN --- */}
      <section id="main">
        <div className="container">

          {/* UNICA RIGA PER GESTIRE LAYOUT SIDEBAR */}
          <div className="row">

            {/* 1. CONTENT */}
            <div id="content" className="col-8 col-12-medium">

               {/* INTRO */}
               <article className="box post">
                  <header><h2>{t('cocktail.introTitle')}</h2></header>
                  <p>{t('cocktail.introDesc')}</p>
               </article>

               {/* LISTA COCKTAIL */}
               <article className="box post">
                  <header><h2>{t('cocktail.title')} <strong>{t('cocktail.titleBold')}</strong></h2></header>
                  <span className="image featured"><img src="images/img3.jpg" alt="Cocktails" /></span>

                  <p>{t('cocktail.subtitle')}</p>

                  {/* BARRA DI RICERCA */}
                  <SearchInput
                    placeholder={t('cocktail.search')}
                    value={searchTerm}
                    onChange={setSearchTerm}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                      backgroundColor: '#f9f9f9',
                      fontSize: '1.1em',
                      marginBottom: '10px'
                    }}
                  />
                  {searchTerm && (
                    <p className="search-results-count">
                      {filteredCocktails.length} {filteredCocktails.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
                    </p>
                  )}

                  {/* ELEMENTI FILTRATI */}
                  {filteredCocktails.length > 0 ? (
                    filteredCocktails.map((cocktail, index) => (
                      <React.Fragment key={index}>
                        <hr />
                        <h3 id={`cocktail-${cocktail.idx}`} className="wheel-anchor">{cocktail.sym} {cocktail.name}</h3>
                        <p>{cocktail.description}<br />
                        <strong>{t('cocktail.ingredients')}</strong> {cocktail.ingredients}<br />
                        <strong>{t('cocktail.preparation')}</strong> {cocktail.preparation}</p>
                      </React.Fragment>
                    ))
                  ) : (
                    <p style={{textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>
                      {t('cocktail.noResults')}
                    </p>
                  )}
               </article>
            </div>

            {/* 2. SIDEBAR  */}
            <div id="sidebar" className="col-4 col-12-medium">

              {/* Ruota della Fortuna */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <WheelOfFortune
                        items={cocktailsData}
                        title={t('wheel.title')}
                        intro={t('wheel.intro')}
                        spinLabel={t('wheel.spin')}
                        spinningLabel={t('wheel.spinning')}
                        resultLabel={t('wheel.result')}
                        goToLabel={t('wheel.goTo')}
                        onPick={(i) => jumpToItem(`cocktail-${i}`, () => setSearchTerm(''))}
                      />
                    </article>
                  </li>
                </ul>
              </section>

              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/cocktail-classici">{t('cocktail.sidebarClassics')}</Link></h3></header>
                      <p>{t('cocktail.sidebarClassicsDesc')}</p>
                      <Link to="/cocktail-classici" className="button icon solid fa-glass-martini-alt">{t('cocktail.sidebarClassicsBtn')}</Link>
                    </article>
                  </li>
                </ul>
              </section>

              {/* Box Navigazione */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/">{t('cocktail.sidebarHome')}</Link></h3></header>
                      <p>{t('cocktail.sidebarHomeDesc')}</p>
                      <Link to="/" className="button icon solid fa-home">Home</Link>
                    </article>
                  </li>
                </ul>
              </section>

            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <Footer />

    </div>
  );
};

export default Cocktail;
