// src/pages/Pizze.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import SearchInput from '../components/SearchInput';
import { useRemembered, useRememberedScroll } from '../utils/listMemory';
import WheelOfFortune from '../components/WheelOfFortune';
import { jumpToItem } from '../utils/jumpToItem';
import { PIZZA_SYMBOLS, withSymbols } from '../config/symbols';
import SiteHeader from '../components/SiteHeader';
import { usePageLayout } from '../utils/usePageLayout';
import { usePageTitle } from '../utils/usePageTitle';
import '../i18n/nav';
import '../i18n/pizze';
import '../i18n/settings';
import '../i18n/wheel';

const Pizze = () => {
  const [searchTerm, setSearchTerm] = useRemembered('search', '');
  useRememberedScroll();
  const { t } = useLanguage();

  usePageLayout('right-sidebar', { scrollToTop: false });
  usePageTitle(t('pizze.title'));

  // --- DATABASE PIZZE ---
  // Simbolo assegnato per indice: coerente tra lista e ruota della fortuna
  const pizzasData = withSymbols(t('pizze.pizzas'), PIZZA_SYMBOLS);
  const filteredPizzas = pizzasData.filter(pizza =>
    pizza.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <SiteHeader terminal={t('pizze.terminal')} />

      {/* MAIN */}
      <section id="main">
        <div className="container">
          <div className="row">

            {/* CONTENT */}
            <div id="content" className="col-8 col-12-medium">
                <article className="box post">
                  <header><h2>{t('pizze.title')}</h2></header>
                  <p>{t('pizze.subtitle')}</p>

                  {/* BARRA DI RICERCA */}
                  <SearchInput
                    placeholder={t('pizze.search')}
                    value={searchTerm}
                    onChange={setSearchTerm}
                  />
                  {searchTerm && (
                    <p className="search-results-count">
                      {filteredPizzas.length} {filteredPizzas.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
                    </p>
                  )}

                  {/* LISTA FILTRATA */}
                  {filteredPizzas.length > 0 ? (
                    filteredPizzas.map((pizza, index) => (
                      <React.Fragment key={index}>
                        <hr />
                        <h3 id={`pizza-${pizza.idx}`} className="wheel-anchor">{pizza.sym} {pizza.name}</h3>
                        <p>
                          {pizza.description}<br />
                          <strong>{t('pizze.topping')}</strong> {pizza.topping}<br />
                          <strong>{t('pizze.dough')}</strong> {pizza.dough}
                        </p>
                      </React.Fragment>
                    ))
                  ) : (
                    <p className="empty-note">
                      {t('pizze.noResults')}
                    </p>
                  )}

                </article>
            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium">

               {/* Ruota della Fortuna */}
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <WheelOfFortune
                        items={pizzasData}
                        title={t('wheel.title')}
                        intro={t('wheel.intro')}
                        spinLabel={t('wheel.spin')}
                        spinningLabel={t('wheel.spinning')}
                        resultLabel={t('wheel.result')}
                        goToLabel={t('wheel.goTo')}
                        onPick={(i) => jumpToItem(`pizza-${i}`, () => setSearchTerm(''))}
                      />
                    </article>
                  </li>
                </ul>
              </section>

               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/ricette">{t('pizze.sidebarRecipes')}</Link></h3></header>
                      <p>{t('pizze.sidebarRecipesDesc')}</p>
                      <Link to="/ricette" className="button icon solid fa-utensils">{t('pizze.sidebarRecipesBtn')}</Link>
                    </article>
                  </li>
                </ul>
              </section>

              {/* Box Navigazione */}
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/">{t('pizze.sidebarHome')}</Link></h3></header>
                      <p>{t('pizze.sidebarHomeDesc')}</p>
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

export default Pizze;
