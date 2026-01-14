// src/pages/Cocktail.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Cocktail = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const terminalLines = [
    "> ./load_module.sh --bar",
    "> Loading Cocktail library...",
    "> Status: Mixology Mode Activated.",
    "> Ready."
  ];

  // GESTIONE LAYOUT
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
          <TerminalText lines={terminalLines} />
          
          <nav id="nav">
            <ul>
              <li><Link className="icon solid fa-home" to="/"><span>Home</span></Link></li>
              
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
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}>
                      <Link to="/stampe3d" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>Stampe 3D</Link>
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
          
          {/* PRIMA RIGA: Intro + Sidebar (Solo Classici) */}
          <div className="row">
            
            {/* 1. INTRO (Colonna Sinistra) */}
            <div className="col-8 col-12-medium">
               <article className="box post">
                  <header><h2>Mixology & Tech</h2></header>
                  <p>La precisione nel dosare gli ingredienti è importante quanto quella nel scrivere codice. Ecco le mie creazioni per il relax post-deploy.</p>
               </article>
            </div>

            {/* 2. SIDEBAR (Colonna Destra - SOLO CLASSICI) */}
            <div id="sidebar" className="col-4 col-12-medium">
              
              {/* Box Navigazione Classici */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/cocktail-classici">Torna alle origini</Link></h3></header>
                      <p>Preferisci i sapori tradizionali? Ho raccolto qui i grandi classici IBA e le ricette senza tempo.</p>
                      <Link to="/cocktail-classici" className="button icon solid fa-glass-martini-alt">I Grandi Classici</Link>
                    </article>
                  </li>
                </ul>
              </section>

            </div>
          </div>

          {/* SECONDA RIGA: Lista Cocktail Tech (Larghezza Piena) */}
          <div className="row">
            <div className="col-12">
               <article className="box post">
                  <header><h2>I miei <strong>Cocktail</strong></h2></header>
                  <a href="#" className="image featured"><img src="images/img3.jpg" alt="Cocktails" /></a>
                  
                  <p>Mixology ispirata al mondo tech. Bere responsabilmente (nessun buffer overflow consentito).</p>

                  <hr />

                  <h3>Gin(t) Commit -m "Refreshing"</h3>
                  <p>Il classico per chiudere la giornata lavorativa.<br />
                  <strong>Ingredienti:</strong> 50ml Gin secco, 150ml Acqua tonica premium, Scorza di lime, Bacche di ginepro.<br />
                  <strong>Procedimento:</strong> Versare il gin su ghiaccio, aggiungere la tonica delicatamente per non rompere la carbonazione (e il codice).</p>

                  <hr />

                  <h3>Dark Mode (Espresso Martini)</h3>
                  <p>Elegante, scuro e ti tiene sveglio.<br />
                  <strong>Ingredienti:</strong> 50ml Vodka, 30ml Liquore al caffè (Kahlúa), 1 tazzina di espresso fresco, Chicchi di caffè per decorazione.<br />
                  <strong>Procedimento:</strong> Shakerare energicamente con ghiaccio per creare la schiuma perfetta.</p>

                  <hr />

                  <h3>Firewall (Spicy Margarita)</h3>
                  <p>Blocca la noia con un tocco piccante.<br />
                  <strong>Ingredienti:</strong> 50ml Tequila, 25ml Lime fresco, 15ml Sciroppo di Agave, 2 fettine di Jalapeño.<br />
                  <strong>Procedimento:</strong> Shakerare con ghiaccio, servire in bicchiere con bordo di sale e peperoncino.</p>
               </article>
            </div>
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

export default Cocktail;