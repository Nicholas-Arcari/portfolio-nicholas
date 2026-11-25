// src/pages/Cocktail_classici.jsx
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

const Cocktail_classici = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useRemembered('search', '');
  useRememberedScroll();

  usePageLayout('right-sidebar', { scrollToTop: false });

  // Simbolo assegnato per indice: coerente tra lista e ruota della fortuna
  const cocktailsData = withSymbols(t('cocktailClassici.cocktails'), DRINK_SYMBOLS);

  // Filtra i cocktail in base alla ricerca
  const filteredCocktails = cocktailsData.filter(cocktail =>
    cocktail.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <SiteHeader terminal={t('cocktailClassici.terminal')} />

      {/* MAIN */}
      <section id="main">
        <div className="container">
          <div className="row">

            {/* CONTENT - Lista Cocktail */}
            <div id="content" className="col-8 col-12-medium">

               {/* Intro */}
               <article className="box post">
                  <header><h2>{t('cocktailClassici.title')}</h2></header>
                  <p>{t('cocktailClassici.subtitle')}</p>

                  {/* BARRA DI RICERCA */}
                  <SearchInput
                    placeholder={t('cocktailClassici.search')}
                    value={searchTerm}
                    onChange={setSearchTerm}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                      backgroundColor: '#f9f9f9',
                      fontSize: '1.1em',
                      marginTop: '20px'
                    }}
                  />
                  {searchTerm && (
                    <p className="search-results-count">
                      {filteredCocktails.length} {filteredCocktails.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
                    </p>
                  )}
               </article>

               {/* LISTA FILTRATA DEI COCKTAIL */}
               {filteredCocktails.length > 0 ? (
                 filteredCocktails.map((cocktail, index) => (
                   <React.Fragment key={index}>
                     <article className="box post">
                        <header><h2 id={`classico-${cocktail.idx}`} className="wheel-anchor">{cocktail.sym} {cocktail.name}</h2></header>

                        <h3>{t('cocktailClassici.ingredientsLabel')}</h3>
                        <p>{cocktail.ingredients}</p>

                        <h3>{t('cocktailClassici.preparationLabel')}</h3>
                        <p>{cocktail.preparation}</p>

                        <h3>{t('cocktailClassici.historyLabel')}</h3>
                        <p>{cocktail.history}</p>
                     </article>
                     {/* Aggiunge la linea orizzontale se non è l'ultimo elemento */}
                     {index < filteredCocktails.length - 1 && <hr />}
                   </React.Fragment>
                 ))
               ) : (
                 <article className="box post">
                   <p>{t('cocktailClassici.noResults')}</p>
                 </article>
               )}

            </div>

            {/* SIDEBAR */}
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
                        onPick={(i) => jumpToItem(`classico-${i}`, () => setSearchTerm(''))}
                      />
                    </article>
                  </li>
                </ul>
              </section>

               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/cocktail">{t('cocktailClassici.sidebarTech')}</Link></h3></header>
                      <p>{t('cocktailClassici.sidebarTechDesc')}</p>
                      <Link to="/cocktail" className="button icon solid fa-microchip">{t('cocktailClassici.sidebarTechBtn')}</Link>
                    </article>
                  </li>
                </ul>
              </section>

              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/">{t('cocktailClassici.sidebarHome')}</Link></h3></header>
                      <p>{t('cocktailClassici.sidebarHomeDesc')}</p>
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

export default Cocktail_classici;