// src/pages/Cocktail.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Cocktail = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Stato ricerca

  const terminalLines = [
    "> ./load_module.sh --bar",
    "> Loading Cocktail library...",
    "> Status: Campari Addicted.",
    "> Ready."
  ];

  // GESTIONE LAYOUT
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

  // --- DATABASE COCKTAIL TECH ---
  const cocktailsData = [
    {
      name: "Gin(t) Commit -m \"Refreshing\"",
      description: "La versione stabile per chiudere la giornata lavorativa senza conflitti di merge.",
      ingredients: "50ml Gin (Libreria base), 150ml Tonica (Dependencies), Lime (Patch correttiva).",
      preparation: "Eseguire il push del gin su ghiaccio, iniettare la tonica delicatamente per non rompere la build (carbonazione)."
    },
    {
      name: "Dark Mode",
      description: "Il tema preferito dagli sviluppatori. Riduce l'affaticamento visivo e aumenta la latenza cardiaca.",
      ingredients: "50ml Vodka, 30ml Liquore al caffè (Kahlúa), 1 tazzina di espresso (Java Runtime).",
      preparation: "Shakerare energicamente per compilare la schiuma perfetta in cima allo stack."
    },
    {
      name: "Firewall",
      description: "Un layer di sicurezza piccante che blocca le intrusioni della noia.",
      ingredients: "50ml Tequila, 25ml Lime, 15ml Agave, Jalapeño (Packet Filter).",
      preparation: "Configurare il bordo del bicchiere con sale e peperoncino. Servire ghiacciato per mitigare l'attacco DDoS al palato."
    },
    {
      name: "Blue Screen of Death",
      description: "Un errore di sistema fatale, ma tropicale. Riavviare l'utente dopo la consumazione.",
      ingredients: "50ml Vodka, 20ml Blue Curaçao (System Error), Limonata.",
      preparation: "Versare tutto nel bicchiere. Se lo schermo diventa blu, avete bevuto troppo."
    },
    {
      name: "Legacy Code",
      description: "Una ricetta deprecata dal 1800, ma che gira ancora perfettamente su tutti i sistemi.",
      ingredients: "45ml Bourbon (Codice spaghetti), Zolletta di zucchero (Hardcoded value), Angostura.",
      preparation: "Diluire lentamente come un refactoring doloroso ma necessario."
    },
    {
      name: "Kernel Panic",
      description: "Quando il sistema va in crash perché hai caricato troppi moduli (alcolici) insieme.",
      ingredients: "Vodka, Rum, Gin, Tequila, Cointreau (Tutte le librerie possibili), Coca-Cola.",
      preparation: "Mescolare tutto. Attenzione: alto rischio di shutdown improvviso del sistema nervoso."
    }
  ];

  // Filtra i cocktail
  const filteredCocktails = cocktailsData.filter(cocktail =>
    cocktail.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <li><Link className="icon solid fa-user" to="/about"><span>Chi Sono</span></Link></li>
              
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
          
          {/* UNICA RIGA PER GESTIRE LAYOUT SIDEBAR */}
          <div className="row">
            
            {/* 1. CONTENT */}
            <div id="content" className="col-8 col-12-medium">
               
               {/* INTRO */}
               <article className="box post">
                  <header><h2>Mixology & Tech</h2></header>
                  <p>La precisione nel dosare gli ingredienti è importante quanto quella nel scrivere codice. Ecco le mie creazioni per il relax post-deploy.</p>
               </article>

               {/* LISTA COCKTAIL */}
               <article className="box post">
                  <header><h2>I miei <strong>Cocktail</strong></h2></header>
                  <a href="#" className="image featured"><img src="images/img3.jpg" alt="Cocktails" /></a>
                  
                  <p>Algoritmi liquidi compilati al momento per l'ottimizzazione delle prestazioni sociali.</p>

                  {/* BARRA DI RICERCA */}
                  <input
                    type="text"
                    placeholder="Cerca un cocktail tech..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '15px', 
                      borderRadius: '5px', 
                      border: '1px solid #ccc',
                      backgroundColor: '#f9f9f9',
                      fontSize: '1.1em',
                      marginBottom: '30px'
                    }}
                  />

                  {/* ELEMENTI FILTRATI */}
                  {filteredCocktails.length > 0 ? (
                    filteredCocktails.map((cocktail, index) => (
                      <React.Fragment key={index}>
                        <hr />
                        <h3>{cocktail.name}</h3>
                        <p>{cocktail.description}<br />
                        <strong>Ingredienti:</strong> {cocktail.ingredients}<br />
                        <strong>Procedimento:</strong> {cocktail.preparation}</p>
                      </React.Fragment>
                    ))
                  ) : (
                    <p style={{textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>
                      Nessun cocktail trovato con questo nome. Controlla il codice sorgente!
                    </p>
                  )}
               </article>
            </div>

            {/* 2. SIDEBAR  */}
            <div id="sidebar" className="col-4 col-12-medium">
              
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

              {/* Box Navigazione */}
              <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/">Torna alla Home</Link></h3></header>
                      <p>Vuoi vedere le mie esperienze lavorative o le mie passioni?</p>
                      <Link to="/" className="button icon solid fa-home">Home</Link>
                    </article>
                  </li>
                </ul>
              </section>

            </div>
          </div>

        </div>
      </section>

      {/* FOOTER MINIMAL */}
      <section id="footer">
        <div id="copyright" className="container">
          <ul className="links">
            <li>&copy; {new Date().getFullYear()} Nicholas Arcari. All rights reserved.</li>
            <li>Design: HTML5 UP</li>
          </ul>
        </div>
      </section>

    </div>
  );
};

export default Cocktail;