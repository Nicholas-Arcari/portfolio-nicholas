// src/pages/Ricette.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SearchInput from '../components/SearchInput';
import { useRemembered, useRememberedScroll } from '../utils/listMemory';
import WheelOfFortune from '../components/WheelOfFortune';
import { jumpToItem } from '../utils/jumpToItem';
import { FOOD_SYMBOLS, withSymbols } from '../config/symbols';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import { usePageTitle } from '../utils/usePageTitle';
import '../i18n/nav';
import '../i18n/ricette';
import '../i18n/settings';
import '../i18n/wheel';

const Ricette = () => {
  const [searchTerm, setSearchTerm] = useRemembered('search', '');
  useRememberedScroll();
  const { t } = useLanguage();

  usePageLayout('right-sidebar', { scrollToTop: false });
  usePageTitle(t('nav.recipes'));

  // --- DATABASE RICETTE ---
  // Simbolo assegnato per indice: coerente tra lista e ruota della fortuna
  const recipesData = withSymbols(t('ricette.recipes'), FOOD_SYMBOLS);
  const filteredRecipes = recipesData.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="page-wrapper">

      {/* --- HEADER --- */}
      <SiteHeader terminal={t('ricette.terminal')} />

      {/* --- MAIN --- */}
      <section id="main">
        <div className="container">
          <div className="row">

            {/* COLONNA SINISTRA: Contenuto */}
            <div id="content" className="col-8 col-12-medium">

               <article className="box post">
                  <header><h2>{t('ricette.introTitle')}</h2></header>
                  <p>{t('ricette.introDesc')}</p>
               </article>

               <article className="box post">
                  <header><h2>{t('ricette.title')} <strong>{t('ricette.titleBold')}</strong></h2></header>
                  <span className="image featured"><img src="images/img2.webp" alt="Cucina" width="1600" height="1067" decoding="async" /></span>

                  <p>{t('ricette.subtitle')}</p>

                  {/* BARRA DI RICERCA */}
                  <SearchInput
                    placeholder={t('ricette.search')}
                    value={searchTerm}
                    onChange={setSearchTerm}
                  />
                  {searchTerm && (
                    <p className="search-results-count">
                      {filteredRecipes.length} {filteredRecipes.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
                    </p>
                  )}

                  {/* LISTA FILTRATA RICETTE */}
                  {filteredRecipes.length > 0 ? (
                    filteredRecipes.map((recipe, index) => (
                      <React.Fragment key={index}>
                        <hr />
                        <h3 id={`ricetta-${recipe.idx}`} className="wheel-anchor">{recipe.sym} {recipe.name}</h3>
                        <p>
                          {recipe.description}<br />
                          <strong>{t('ricette.ingredients')}</strong> {recipe.ingredients}<br />
                          <strong>{t('ricette.preparation')}</strong> {recipe.preparation}
                        </p>
                      </React.Fragment>
                    ))
                  ) : (
                    <p className="empty-note">
                      {t('ricette.noResults')}
                    </p>
                  )}

               </article>

            </div>

            {/* COLONNA DESTRA: Sidebar */}
            <div id="sidebar" className="col-4 col-12-medium">

              {/* Ruota della Fortuna */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <WheelOfFortune
                        items={recipesData}
                        title={t('wheel.title')}
                        intro={t('wheel.intro')}
                        spinLabel={t('wheel.spin')}
                        spinningLabel={t('wheel.spinning')}
                        resultLabel={t('wheel.result')}
                        goToLabel={t('wheel.goTo')}
                        onPick={(i) => jumpToItem(`ricetta-${i}`, () => setSearchTerm(''))}
                      />
                    </article>
                  </li>
                </ul>
              </section>

              {/* Box Link Pizze */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/pizze">{t('ricette.sidebarPizza')}</Link></h3></header>
                      <p>{t('ricette.sidebarPizzaDesc')}</p>
                      <Link to="/pizze" className="button icon solid fa-pizza-slice">{t('ricette.sidebarPizzaBtn')}</Link>
                    </article>
                  </li>
                </ul>
              </section>

              {/* Box Navigazione */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/">{t('ricette.sidebarHome')}</Link></h3></header>
                      <p>{t('ricette.sidebarHomeDesc')}</p>
                      <Link to="/" className="button icon solid fa-home">{t('nav.home')}</Link>
                    </article>
                  </li>
                </ul>
              </section>

            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Ricette;
