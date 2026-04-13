// src/pages/Stampe3d.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from '../components/Footer';

const Stampe3d = () => {
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTermExecuted, setSearchTermExecuted] = useState(""); // Ricerca progetti eseguiti
  const [searchTermFuture, setSearchTermFuture] = useState("");     // Ricerca progetti futuri

  const [showExecuted, setShowExecuted] = useState(false); // Default: nascosto
  const [showFuture, setShowFuture] = useState(false);     // Default: nascosto

  const executedProjects = t('stampe3d.executed');
  const futureProjects = t('stampe3d.future');

  // --- FILTRI ---
  const filteredExecuted = executedProjects.filter(project =>
    project.title.toLowerCase().includes(searchTermExecuted.toLowerCase()) ||
    project.topic.toLowerCase().includes(searchTermExecuted.toLowerCase())
  );

  const filteredFuture = futureProjects.filter(project =>
    project.title.toLowerCase().includes(searchTermFuture.toLowerCase()) ||
    project.topic.toLowerCase().includes(searchTermFuture.toLowerCase())
  );

  // Gestione layout
  useEffect(() => {
    document.body.classList.remove('homepage');
    document.body.classList.add('no-sidebar');
    window.scrollTo(0, 0);

    return () => {
      document.body.classList.remove('no-sidebar');
      document.body.classList.add('homepage');
    };
  }, []);

  return (
    <div id="page-wrapper">

      {/* --- HEADER --- */}
      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <br />
          <TerminalText lines={t('stampe3d.terminal')} />

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
          <div id="content">

             {/* Intro */}
             <article className="box post">
                <header><h2>{t('stampe3d.introTitle')}</h2></header>
                <p>{t('stampe3d.introDesc')}</p>

                <p style={{ marginTop: '1.5em', fontStyle: 'italic', borderLeft: '4px solid #d52349', paddingLeft: '15px', color: '#555' }}>
                  🚀 <strong>{t('stampe3d.collabLabel')}</strong> {t('stampe3d.collabNote')}
                </p>
             </article>

             {/* --- SEZIONE 1: PROGETTI ESEGUITI (ESPANDIBILE) --- */}
             <section>
                <header style={{ marginBottom: '2em', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5em', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>{t('stampe3d.executedTitle')}</h2>

                    {/* BOTTONE TOGGLE ESEGUITI */}
                    <div style={{ marginTop: '15px' }}>
                        <button
                            className="button alt small"
                            onClick={() => setShowExecuted(!showExecuted)}
                        >
                            {showExecuted ? t('stampe3d.hide') : t('stampe3d.show')}
                            <i className={`icon solid ${showExecuted ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginLeft: '10px' }}></i>
                        </button>
                    </div>
                </header>

                {/* CONTENUTO CONDIZIONALE ESEGUITI */}
                {showExecuted && (
                    <div className="fade-in">
                        {/* SEARCH BAR ESEGUITI */}
                        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                        <input
                            type="text"
                            placeholder={t('stampe3d.searchPlaceholder')}
                            value={searchTermExecuted}
                            onChange={(e) => setSearchTermExecuted(e.target.value)}
                            style={{
                            width: '60%',
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            fontSize: '1em'
                            }}
                        />
                        {searchTermExecuted && (
                            <p className="search-results-count">
                              {filteredExecuted.length} {filteredExecuted.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
                            </p>
                        )}
                        </div>

                        <div className="row">
                            {filteredExecuted.length > 0 ? (
                            filteredExecuted.map((project, index) => (
                                <div key={index} className="col-6 col-12-medium">
                                    <article className="box feature">
                                        {project.image ? (
                                        <a href="#" className="image featured">
                                            <img src={project.image} alt={project.title} style={{ objectFit: 'cover', height: '300px' }} />
                                        </a>
                                        ) : (
                                        <div className="image-placeholder">
                                            <i className="icon solid fa-cube"></i>
                                        </div>
                                        )}
                                        <header>
                                            <h3>{project.title}</h3>
                                            <span style={{ display: 'inline-block', backgroundColor: '#eee', color: '#444', padding: '2px 10px', borderRadius: '15px', fontSize: '0.8em', marginBottom: '10px' }}>
                                            {project.topic}
                                            </span>
                                        </header>
                                        <p>{project.description}</p>

                                        <div style={{ fontSize: '0.9em', color: '#555', paddingTop: '10px' }}>

                                            {/* LINK */}
                                            {project.link && (
                                            <p style={{ margin: 0, marginBottom: '5px', wordBreak: 'break-all' }}>
                                                <strong>{t('stampe3d.link')} </strong>
                                                <a href={project.link} target="_blank" rel="noreferrer" style={{ color: '#d52349' }}>
                                                    {project.link}
                                                </a>
                                            </p>
                                            )}

                                            {/* SPAZIO */}
                                            <br />

                                            {/* MATERIALE */}
                                            <p style={{ marginBottom: '0.5em' }}><strong>{t('stampe3d.material')}</strong> {project.material}</p>

                                            {/* BARRA ORIZZONTALE ALLA FINE */}
                                            <hr style={{ marginTop: '10px', marginBottom: '0' }} />
                                        </div>
                                    </article>
                                </div>
                            ))
                            ) : (
                            <p style={{ width: '100%', textAlign: 'center' }}>{t('stampe3d.noResults')}</p>
                            )}
                        </div>
                    </div>
                )}
             </section>

             <hr style={{ margin: '4em 0' }} />

             {/* --- SEZIONE 2: PROGETTI DA ESEGUIRE (ESPANDIBILE) --- */}
             <section>
                <header style={{ marginBottom: '2em', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5em', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>{t('stampe3d.futureTitle')}</h2>

                    {/* BOTTONE TOGGLE FUTURI */}
                    <div style={{ marginTop: '15px' }}>
                        <button
                            className="button alt small"
                            onClick={() => setShowFuture(!showFuture)}
                        >
                            {showFuture ? t('stampe3d.hide') : t('stampe3d.show')}
                            <i className={`icon solid ${showFuture ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginLeft: '10px' }}></i>
                        </button>
                    </div>
                </header>

                {/* CONTENUTO CONDIZIONALE FUTURI */}
                {showFuture && (
                    <div className="fade-in">
                        {/* SEARCH BAR FUTURI */}
                        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                        <input
                            type="text"
                            placeholder={t('stampe3d.searchPlaceholder')}
                            value={searchTermFuture}
                            onChange={(e) => setSearchTermFuture(e.target.value)}
                            style={{
                            width: '60%',
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            fontSize: '1em'
                            }}
                        />
                        {searchTermFuture && (
                            <p className="search-results-count">
                              {filteredFuture.length} {filteredFuture.length === 1 ? t('settings.resultFound') : t('settings.resultsFound')}
                            </p>
                        )}
                        </div>

                        <div className="row">
                            {filteredFuture.length > 0 ? (
                            filteredFuture.map((project, index) => (
                                <div key={index} className="col-6 col-12-medium">
                                    <article className="box feature" style={{ opacity: 0.9 }}>
                                        {project.image ? (
                                        <a href="#" className="image featured">
                                            <img src={project.image} alt={project.title} style={{ objectFit: 'cover', height: '300px', filter: 'grayscale(30%)' }} />
                                        </a>
                                        ) : (
                                        <div className="image-placeholder" style={{ filter: 'grayscale(30%)', opacity: 0.7 }}>
                                            <i className="icon solid fa-cube"></i>
                                        </div>
                                        )}
                                        <header>
                                            <h3>{project.title}</h3>
                                            <span style={{ display: 'inline-block', backgroundColor: '#eee', color: '#444', padding: '2px 10px', borderRadius: '15px', fontSize: '0.8em', marginBottom: '10px' }}>
                                            {project.topic}
                                            </span>
                                        </header>
                                        <p>{project.description}</p>

                                        <div style={{ fontSize: '0.9em', color: '#555', paddingTop: '10px' }}>

                                            {/* LINK */}
                                            {project.link && (
                                            <p style={{ margin: 0, marginBottom: '5px', wordBreak: 'break-all' }}>
                                                <strong>{t('stampe3d.link')} </strong>
                                                <a href={project.link} target="_blank" rel="noreferrer" style={{ color: '#d52349' }}>
                                                    {project.link}
                                                </a>
                                            </p>
                                            )}

                                            <br />

                                            {/* MATERIALE */}
                                            <p style={{ marginBottom: '0.5em' }}><strong>{t('stampe3d.material')}</strong> {project.material}</p>

                                            {/* BARRA ORIZZONTALE ALLA FINE */}
                                            <hr style={{ marginTop: '10px', marginBottom: '0' }} />
                                        </div>
                                    </article>
                                </div>
                            ))
                            ) : (
                            <p style={{ width: '100%', textAlign: 'center' }}>{t('stampe3d.noResults')}</p>
                            )}
                        </div>
                    </div>
                )}
             </section>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <Footer />
    </div>
  );
};

export default Stampe3d;
