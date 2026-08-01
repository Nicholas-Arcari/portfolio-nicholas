// src/pages/Ricette.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';
import WheelOfFortune from '../components/WheelOfFortune';

const FOOD_SYMBOLS = ['🍎', '🍰', '🍝', '🍲', '🧀', '🥧', '🍮', '🥘', '🍜', '🍛'];

const Ricette = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Stato ricerca
  const { t } = useLanguage();

  // Gestione layout (Sidebar Destra)
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

  // --- DATABASE RICETTE ---
  // Simbolo assegnato per indice: coerente tra lista e ruota della fortuna
  const recipesData = t('ricette.recipes').map((r, i) => ({ ...r, sym: FOOD_SYMBOLS[i % FOOD_SYMBOLS.length] }));
  const filteredRecipes = recipesData.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="page-wrapper">

      {/* --- HEADER --- */}
      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <br />
          <TerminalText lines={t('ricette.terminal')} />

          <nav id="nav">
            <ul>
              <li><Link className="icon solid fa-home" to="/"><span>{t('nav.home')}</span></Link></li>
              <li><Link className="icon solid fa-user" to="/about"><span>{t('nav.about')}</span></Link></li>

              <li
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
                style={{ position: 'relative' }}
              >
                <a className="icon solid fa-glass-cheers" style={{ cursor: 'pointer' }}>
                  <span>{t('nav.passions')}</span>
                </a>

                {isDropdownOpen && (
                  <ul style={{
                    display: 'block', position: 'absolute', top: '100%', left: '50%',
                    transform: 'translateX(-50%)', backgroundColor: '#fff',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '4px',
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
                  <span className="image featured"><img src="images/img2.jpg" alt="Cucina" /></span>

                  <p>{t('ricette.subtitle')}</p>

                  {/* BARRA DI RICERCA */}
                  <input
                    type="text"
                    placeholder={t('ricette.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                      {filteredRecipes.length} {filteredRecipes.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
                    </p>
                  )}

                  {/* LISTA FILTRATA RICETTE */}
                  {filteredRecipes.length > 0 ? (
                    filteredRecipes.map((recipe, index) => (
                      <React.Fragment key={index}>
                        <hr />
                        <h3>{recipe.sym} {recipe.name}</h3>
                        <p>
                          {recipe.description}<br />
                          <strong>{t('ricette.ingredients')}</strong> {recipe.ingredients}<br />
                          <strong>{t('ricette.preparation')}</strong> {recipe.preparation}
                        </p>
                      </React.Fragment>
                    ))
                  ) : (
                    <p style={{textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>
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
