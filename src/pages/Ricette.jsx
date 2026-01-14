// src/pages/Ricette.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Ricette = () => {
  // Stato per gestire l'apertura del menu a tendina
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const terminalLines = [
    "> ./load_module.sh --recipes",
    "> Loading Recipes database...",
    "> Status: Kitchen Mode Activated.",
    "> Ready."
  ];

  // Gestione classi body per layout "no-sidebar"
  useEffect(() => {
    document.body.classList.remove('homepage');
    document.body.classList.add('no-sidebar');
    window.scrollTo(0, 0); // Scroll in alto all'apertura
    
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
          <TerminalText lines={terminalLines} />
          
          <nav id="nav">
            <ul>
              <li><Link className="icon solid fa-home" to="/"><span>Home</span></Link></li>
              
              {/* MENU A TENDINA PASSIONI */}
              <li 
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
                style={{ position: 'relative' }} 
              >
                <a className="icon solid fa-glass-cheers" style={{ cursor: 'pointer' }}>
                  <span>Passioni</span>
                </a>
                
                {isDropdownOpen && (
                  <ul style={{ 
                    display: 'block', position: 'absolute', top: '100%', left: '50%', 
                    transform: 'translateX(-50%)', backgroundColor: '#fff', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '4px', 
                    padding: '10px 0', minWidth: '200px', zIndex: 1000, listStyle: 'none', margin: 0
                  }}>
                    <li style={{ padding: '5px 20px', borderTop: 'none' }}>
                      <Link to="/ricette" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>Ricette di Mamma Niky</Link>
                    </li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}>
                      <Link to="/cocktail" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>I miei Cocktail</Link>
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
                <header><h2>Il codice del gusto</h2></header>
                <p>Quando chiudo il terminale, la cucina diventa il mio nuovo laboratorio. Qui raccolgo i miei esperimenti culinari preferiti.</p>
             </article>

             {/* Sezione Ricette */}
             <article className="box post">
                <header><h2>Ricette di <strong>Mamma Niky</strong></h2></header>
                <a href="#" className="image featured"><img src="/images/pic05.jpg" alt="Cucina" /></a>
                
                <p>Ricette testate, debuggate e pronte per il deploy in tavola.</p>

                <hr />

                <h3>Torta di Mele "Legacy Code"</h3>
                <p>Una ricetta tramandata da generazioni, stabile, robusta e priva di bug.<br />
                <strong>Ingredienti:</strong> 3 mele golden, 200g farina, 150g zucchero, 2 uova, lievito vanigliato.<br />
                <strong>Procedimento:</strong> Compilare tutti gli ingredienti in una ciotola, eseguire il render in forno a 180°C per 40 minuti.</p>

                <hr />

                <h3>Lasagne al Forno "Layer 7"</h3>
                <p>Sette strati di puro gusto, perfettamente incapsulati.<br />
                <strong>Ingredienti:</strong> Sfoglia all'uovo, Ragù bolognese (cottura lenta), Besciamella, Parmigiano Reggiano.<br />
                <strong>Procedimento:</strong> Assemblare i pacchetti (strati) sequenzialmente. Hardening della crosta in forno fino a doratura completa.</p>

                <hr />

                <h3>Tiramisù "Java(Script)"</h3>
                <p>Il boost di caffeina necessario per le nottate di coding.<br />
                <strong>Ingredienti:</strong> Mascarpone, Savoiardi, Caffè espresso forte, Cacao amaro.<br />
                <strong>Note:</strong> Nessuna cottura richiesta (Serverless architecture).</p>
             </article>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
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

export default Ricette;