// src/pages/Hobby.jsx
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Hobby = () => {
  const terminalLines = [
    "> ./load_module.sh --hobby",
    "> Loading Recipes database...",
    "> Loading Cocktail library...",
    "> Status: Relax Mode Activated.",
    "> Ready."
  ];

  // Gestione dello scroll per le ancore (#recipes, #cocktails)
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div id="page-wrapper">
      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <TerminalText lines={terminalLines} />
          
          <nav id="nav">
            <ul>
              <li><Link className="icon solid fa-home" to="/"><span>Home</span></Link></li>
              <li className="current">
                <span className="icon solid fa-glass-cheers"><span>Passioni</span></span>
                <ul>
                  <li><a href="#recipes">Ricette di Mamma Niky</a></li>
                  <li><a href="#cocktails">I miei Cocktail</a></li>
                </ul>
              </li>
              <li><a className="icon brands fa-github" href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer"><span>GitHub</span></a></li>
            </ul>
          </nav>
        </div>
      </section>

      <section id="main">
        <div className="container">
          <div id="content">
             <article className="box post">
                <header><h2>Quando chiudo il terminale...</h2></header>
                <p>La cybersecurity richiede concentrazione e precisione, esattamente come la cucina e la mixology.</p>
             </article>

             {/* Sezione Ricette */}
             <article className="box post" id="recipes">
                <header><h2>Ricette di <strong>Mamma Niky</strong></h2></header>
                <a href="#" className="image featured"><img src="/images/pic05.jpg" alt="Cucina" /></a>
                <p>Ricette testate, debuggate e pronte per il deploy.</p>
                <hr />
                <h3>Torta di Mele "Legacy Code"</h3>
                <p>Una ricetta tramandata da generazioni.<br /><strong>Procedimento:</strong> Compilare gli ingredienti.</p>
                {/* Altre ricette... */}
             </article>

             {/* Sezione Cocktail */}
             <article className="box post" id="cocktails">
                <header><h2>I miei <strong>Cocktail</strong></h2></header>
                <a href="#" className="image featured"><img src="/images/pic06.jpg" alt="Cocktails" /></a>
                <p>Mixology ispirata al mondo tech.</p>
                <hr />
                <h3>Gin(t) Commit -m "Refreshing"</h3>
                <p><strong>Ingredienti:</strong> Gin, Tonica, Lime.</p>
                {/* Altri cocktail... */}
             </article>
          </div>
        </div>
      </section>

      <section id="footer">
        <div id="copyright" className="container">
           <ul className="links">
               <li>&copy; Nicholas Arcari.</li>
               <li><Link to="/">Torna alla Home</Link></li>
           </ul>
        </div>
      </section>
    </div>
  );
};

export default Hobby;