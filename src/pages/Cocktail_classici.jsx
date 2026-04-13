// src/pages/Cocktail_classici.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';

const Cocktail_classici = () => {
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const cocktailsData = t('cocktailClassici.cocktails');

  // Filtra i cocktail in base alla ricerca
  const filteredCocktails = cocktailsData.filter(cocktail =>
    cocktail.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="page-wrapper">

      {/* HEADER */}
      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <br />
          <TerminalText lines={t('cocktailClassici.terminal')} />

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

            {/* CONTENT - Lista Cocktail */}
            <div id="content" className="col-8 col-12-medium">

               {/* Intro */}
               <article className="box post">
                  <header><h2>{t('cocktailClassici.title')}</h2></header>
                  <p>{t('cocktailClassici.subtitle')}</p>

                  {/* BARRA DI RICERCA */}
                  <input
                    type="text"
                    placeholder={t('cocktailClassici.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                        <header><h2>{cocktail.name}</h2></header>

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