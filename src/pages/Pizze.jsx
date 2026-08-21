// src/pages/Pizze.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/languageContext';
import Footer from '../components/Footer';
import WheelOfFortune from '../components/WheelOfFortune';
import { PIZZA_SYMBOLS, withSymbols } from '../config/symbols';

const Pizze = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Stato ricerca
  const { t } = useLanguage();

  // Layout Right Sidebar
  useEffect(() => {
    document.body.classList.remove('homepage');
    document.body.classList.remove('no-sidebar');
    document.body.classList.add('right-sidebar');
    window.scrollTo(0, 0);

    return () => {
      document.body.classList.remove('right-sidebar');
      document.body.classList.add('homepage');
    };
  }, []);

  // --- DATABASE PIZZE ---
  // Simbolo assegnato per indice: coerente tra lista e ruota della fortuna
  const pizzasData = withSymbols(t('pizze.pizzas'), PIZZA_SYMBOLS);
  const filteredPizzas = pizzasData.filter(pizza =>
    pizza.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <br />
          <TerminalText lines={t('pizze.terminal')} />

          <nav id="nav">
            <ul>
              <li><Link className="icon solid fa-home" to="/"><span>{t('nav.home')}</span></Link></li>
              <li><Link className="icon solid fa-user" to="/about"><span>{t('nav.about')}</span></Link></li>

              <li
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
                style={{ position: 'relative' }}
              >
                <a className="icon solid fa-glass-cheers" style={{ cursor: 'pointer' }}><span>{t('nav.passions')}</span></a>
                {isDropdownOpen && (
                  <ul style={{
                    display: 'block', position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '4px',
                    padding: '10px 0', minWidth: '200px', zIndex: 1000, listStyle: 'none', margin: 0
                  }}>
                    <li style={{ padding: '5px 20px', borderTop: 'none' }}>
                      <Link to="/ricette" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>{t('nav.recipes')}</Link>
                    </li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}>
                      <Link to="/cocktail" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>{t('nav.cocktails')}</Link>
                    </li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}>
                      <Link to="/stampe3d" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>{t('nav.prints3d')}</Link>
                    </li>
                  </ul>
                )}
              </li>
              <li><a className="icon brands fa-github" href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer"><span>GitHub</span></a></li>
            </ul>
          </nav>
        </div>
      </section>

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
                  <input
                    type="text"
                    placeholder={t('pizze.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                      backgroundColor: '#f9f9f9',
                      fontSize: '1.1em',
                      marginBottom: '10px',
                      marginTop: '10px'
                    }}
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
                        <h3>{pizza.sym} {pizza.name}</h3>
                        <p>
                          {pizza.description}<br />
                          <strong>{t('pizze.topping')}</strong> {pizza.topping}<br />
                          <strong>{t('pizze.dough')}</strong> {pizza.dough}
                        </p>
                      </React.Fragment>
                    ))
                  ) : (
                    <p style={{textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>
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
