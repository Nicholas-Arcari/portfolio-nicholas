// src/pages/Cocktail_classici.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Cocktail_classici = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const terminalLines = [
    "> ./load_module.sh --iba-classics",
    "> Loading historical archives...",
    "> Status: Vintage Mode Activated.",
    "> Ready."
  ];

  // Gestione layout identica a Cocktail.jsx
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

  return (
    <div id="page-wrapper">
      
      {/* HEADER */}
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
                <a className="icon solid fa-glass-cheers" style={{ cursor: 'pointer' }}><span>Passioni</span></a>
                {isDropdownOpen && (
                  <ul style={{ 
                    display: 'block', position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', 
                    backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '4px', 
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

      {/* MAIN */}
      <section id="main">
        <div className="container">
          <div className="row">
            
            {/* CONTENT */}
            <div id="content" className="col-8 col-12-medium">
               <article className="box post">
                  <header><h2>I Grandi Classici</h2></header>
                  <p>Le ricette intramontabili che hanno fatto la storia della miscelazione.</p>
                  
                  <hr />
                  
                  <h3>Negroni</h3>
                  <p>L'aperitivo italiano per eccellenza.<br />
                  <strong>Ingredienti:</strong> 30ml Gin, 30ml Campari, 30ml Vermouth Rosso.<br />
                  <strong>Procedimento:</strong> Costruire direttamente nel bicchiere con ghiaccio e guarnire con fetta d'arancia.</p>

                  <hr />

                  <h3>Old Fashioned</h3>
                  <p>Il padre di tutti i cocktail.<br />
                  <strong>Ingredienti:</strong> 45ml Bourbon o Rye Whiskey, 1 zolletta di zucchero, Angostura Bitters, spruzzata di soda.<br />
                  <strong>Procedimento:</strong> Pestare zucchero e bitters, aggiungere ghiaccio e whiskey, mescolare fino a diluizione perfetta.</p>
               </article>
            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium">
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/cocktail">Torna al futuro</Link></h3></header>
                      <p>Ti mancano i miei esperimenti tech? Torna alla pagina principale dei cocktail.</p>
                      <Link to="/cocktail" className="button icon solid fa-microchip">I Cocktail Tech</Link>
                    </article>
                  </li>
                </ul>
              </section>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
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

export default Cocktail_classici;