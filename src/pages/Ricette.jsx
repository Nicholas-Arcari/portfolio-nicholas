// src/pages/Ricette.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Ricette = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const terminalLines = [
    "> ./load_module.sh --recipes",
    "> Loading Recipes database...",
    "> Status: Kitchen Mode Activated.",
    "> Ready."
  ];

  // GESTIONE LAYOUT: Attiva la sidebar destra
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

      {/* MAIN */}
      <section id="main">
        <div className="container">
          <div className="row">
            
            {/* COLONNA SINISTRA: Contenuto */}
            <div id="content" className="col-8 col-12-medium">
               
               <article className="box post">
                  <header><h2>Il codice del gusto</h2></header>
                  <p>Quando chiudo il terminale, la cucina diventa il mio nuovo laboratorio. Qui raccolgo i miei esperimenti culinari preferiti.</p>
               </article>

              <article className="box post">
                  <header><h2>Ricette di <strong>Mamma Niky</strong></h2></header>
                  <a href="#" className="image featured"><img src="images/img2.jpg" alt="Cucina" /></a>
                  
                  <p>Algoritmi culinari tramandati, debuggati e pronti per il deploy in tavola.</p>

                  <hr />

                  <h3>Torta di Mele "Legacy Code"</h3>
                  <p>Una ricetta scritta decenni fa che nessuno osa refattorizzare perché funziona perfettamente così.<br />
                  <strong>Ingredienti:</strong> 3 mele golden (Core Data), 200g farina (Base Class), 150g zucchero (Syntactic Sugar), 2 uova.<br />
                  <strong>Procedimento:</strong> Compilare gli ingredienti in una ciotola, gestire le eccezioni (grumi) ed eseguire il render in forno a 180°C per 40 minuti.</p>

                  <hr />

                  <h3>Lasagne al Forno "OSI Model (Layer 7)"</h3>
                  <p>Sette strati di puro gusto, con incapsulamento perfetto dei pacchetti di sapore.<br />
                  <strong>Ingredienti:</strong> Sfoglia all'uovo (Physical Layer), Ragù bolognese (Network), Besciamella (Transport), Parmigiano (Application).<br />
                  <strong>Procedimento:</strong> Stacking dei layer in sequenza. Hardening della crosta in forno fino a doratura completa (Firewall attivo).</p>

                  <hr />

                  <h3>Tiramisù "Java(Script)"</h3>
                  <p>Il boost di caffeina necessario per le nottate di coding. Pura energia asincrona.<br />
                  <strong>Ingredienti:</strong> Mascarpone (Framework pesante), Savoiardi (Dependencies), Caffè espresso forte (Runtime), Cacao amaro (UI).<br />
                  <strong>Note:</strong> Architettura Serverless (nessuna cottura richiesta). Deploy istantaneo in frigo.</p>

                  <hr />

                  <h3>Spaghetti alla Carbonara "Spaghetti Code"</h3>
                  <p>Un groviglio delizioso dove le dipendenze sono strette, ma il risultato è perfetto.<br />
                  <strong>Ingredienti:</strong> Spaghetti, Guanciale croccante (Hardware acceleration), Tuorli d'uovo, Pecorino Romano, Pepe nero.<br />
                  <strong>Procedimento:</strong> Attenzione alla "Race Condition": l'uovo va unito a fuoco spento per evitare il crash (frittata). Mantecare in loop fino a cremosità.</p>

                  <hr />

                  <h3>Polpette al Sugo "Microservices"</h3>
                  <p>Piccoli moduli di gusto indipendenti, altamente scalabili e facili da consumare.<br />
                  <strong>Ingredienti:</strong> Macinato misto, Pane raffermo, Prezzemolo, Aglio, Sugo di pomodoro (Message Broker).<br />
                  <strong>Procedimento:</strong> Istanziare molteplici polpette e farle girare nel container (padella) con il sugo a fuoco lento.</p>

               </article>

            </div>

            {/* COLONNA DESTRA: Sidebar */}
            <div id="sidebar" className="col-4 col-12-medium">
              
              {/* Box Link Pizze */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/pizze">Voglia di Pizza?</Link></h3></header>
                      <p>Lievitazione lenta, alta idratazione e ingredienti di prima scelta. Scopri le mie pizze fatte in casa.</p>
                      <Link to="/pizze" className="button icon solid fa-pizza-slice">Le mie Pizze</Link>
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

export default Ricette;