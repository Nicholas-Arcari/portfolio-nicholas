// src/pages/Pizze.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Pizze = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const terminalLines = [
    "> ./load_module.sh --pizza-oven",
    "> Preheating to 450°C...",
    "> Status: Dough Rising...",
    "> Ready."
  ];

  // Layout Right Sidebar (per coerenza o per tornare indietro)
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
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}>
                      <Link to="/stampe3d" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>Stampe 3D & Maker</Link>
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
                  <header><h2>Le mie Pizze</h2></header>
                  <p>72 ore di lievitazione, idratazione al 70% e ingredienti selezionati.</p>
                  
                  <hr />
                  
                  <h3>Margherita 2.0</h3>
                  <p>La regina delle pizze, ottimizzata.<br />
                  <strong>Topping:</strong> Pomodoro San Marzano DOP, Mozzarella Fior di Latte, Basilico fresco, Olio EVO.<br />
                  <strong>Impasto:</strong> Diretto lungo, 24h TA.</p>

                  <hr />

                  <h3>Diavola (Firewall Breach)</h3>
                  <p>Piccante al punto giusto.<br />
                  <strong>Topping:</strong> Pomodoro, Mozzarella, Salame piccante napoletano, 'Nduja di Spilinga.<br />
                  <strong>Impasto:</strong> Biga 100%, 48h frigo.</p>
               </article>
            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium">
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/ricette">Torna alla cucina</Link></h3></header>
                      <p>Preferisci qualcosa di dolce o un primo piatto? Torna alle ricette di Mamma Niky.</p>
                      <Link to="/ricette" className="button icon solid fa-utensils">Tutte le Ricette</Link>
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

export default Pizze;