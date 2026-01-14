// src/pages/Pizze.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Pizze = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Stato ricerca

  const terminalLines = [
    "> ./load_module.sh --pizza-oven",
    "> Preheating to 450°C...",
    "> Status: Dough Rising...",
    "> Ready."
  ];

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
  const pizzasData = [
    {
      name: "Margherita 2.0 (Stable Release)",
      description: "La regina delle pizze, ottimizzata e priva di bug.",
      topping: "Pomodoro San Marzano DOP, Mozzarella Fior di Latte, Basilico fresco, Olio EVO.",
      dough: "Diretto lungo, 24h TA."
    },
    {
      name: "Diavola (Firewall Breach)",
      description: "Piccante al punto giusto, penetra ogni difesa.",
      topping: "Pomodoro, Mozzarella, Salame piccante napoletano, 'Nduja di Spilinga.",
      dough: "Biga 100%, 48h frigo."
    },
    {
      name: "Quattro Formaggi \"Full Stack\"",
      description: "Un'architettura a quattro livelli di pura cremosità.",
      topping: "Gorgonzola dolce (Backend), Taleggio, Mozzarella (Frontend), Scaglie di Grana (UI).",
      dough: "Poolish ad alta idratazione."
    },
    {
      name: "Ortolana \"Root Access\"",
      description: "Accesso privilegiato alle migliori verdure di stagione (vegan friendly).",
      topping: "Crema di zucchine, Melanzane a funghetto, Peperoni arrostiti, Pomodori confit.",
      dough: "Integrale al 30% (Legacy grain)."
    },
    {
      name: "Napoli \"Salted Hash\"",
      description: "Crittografia saporita con un pizzico di sapidità aggiunta.",
      topping: "Pomodoro, Acciughe di Cetara, Capperi di Pantelleria, Origano, Olive nere.",
      dough: "Classico Napoletano STG."
    },
    {
      name: "Marinara \"Open Source\"",
      description: "Pochi ingredienti, codice pulito, trasparente e accessibile a tutti.",
      topping: "Pomodoro San Marzano, Aglio rosso, Origano di montagna, Olio EVO abbondante.",
      dough: "Diretto veloce (per un deploy rapido)."
    },
    {
      name: "Salsiccia e Friarielli \"Backend Heavy\"",
      description: "Una pizza robusta che regge carichi di lavoro pesanti.",
      topping: "Provola affumicata, Salsiccia a punta di coltello, Friarielli ripassati aglio e olio.",
      dough: "Autolisi lunga per massimizzare la struttura."
    }
  ];

  // Filtra le pizze
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
            
            {/* CONTENT */}
            <div id="content" className="col-8 col-12-medium">
                <article className="box post">
                  <header><h2>Le mie Pizze</h2></header>
                  <p>72 ore di lievitazione, idratazione al 70% e ingredienti selezionati. Un deploy di sapori in produzione.</p>
                  
                  {/* BARRA DI RICERCA */}
                  <input
                    type="text"
                    placeholder="Cerca una pizza..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '15px', 
                      borderRadius: '5px', 
                      border: '1px solid #ccc',
                      backgroundColor: '#f9f9f9',
                      fontSize: '1.1em',
                      marginBottom: '30px',
                      marginTop: '10px'
                    }}
                  />

                  {/* LISTA FILTRATA */}
                  {filteredPizzas.length > 0 ? (
                    filteredPizzas.map((pizza, index) => (
                      <React.Fragment key={index}>
                        <hr />
                        <h3>{pizza.name}</h3>
                        <p>
                          {pizza.description}<br />
                          <strong>Topping:</strong> {pizza.topping}<br />
                          <strong>Impasto:</strong> {pizza.dough}
                        </p>
                      </React.Fragment>
                    ))
                  ) : (
                    <p style={{textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>
                      Nessuna pizza trovata. Forse è ancora in fase di lievitazione?
                    </p>
                  )}

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