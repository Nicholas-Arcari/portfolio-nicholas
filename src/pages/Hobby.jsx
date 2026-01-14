// src/pages/Hobby.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Hobby = () => {
  // Stato per gestire l'apertura del menu a tendina (come in Home.jsx)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const terminalLines = [
    "> ./load_module.sh --hobby",
    "> Loading Recipes database...",
    "> Loading Cocktail library...",
    "> Status: Relax Mode Activated.",
    "> Ready."
  ];

  // 1. GESTIONE CLASSI BODY (Fondamentale per allargare il layout)
  useEffect(() => {
    // Quando la pagina viene montata:
    document.body.classList.remove('homepage'); // Rimuove stile Home
    document.body.classList.add('no-sidebar');  // Aggiunge stile Pagina Larga
    
    // Quando si esce dalla pagina (cleanup):
    return () => {
      document.body.classList.remove('no-sidebar');
      document.body.classList.add('homepage'); // Ripristina stile Home
    };
  }, []);

  // 2. GESTIONE SCROLL ANCORE
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100); 
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

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
              
              {/* MENU A TENDINA PASSIONI (Logica Uniformata a Home.jsx) */}
              <li 
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
                style={{ position: 'relative' }} 
              >
                <a 
                  className="icon solid fa-glass-cheers" 
                  style={{ cursor: 'pointer' }} // Uniforma lo stile del cursore
                >
                  <span>Passioni</span>
                </a>
                
                {/* Sottomenu */}
                {isDropdownOpen && (
                  <ul style={{ 
                    display: 'block', 
                    position: 'absolute', 
                    top: '100%', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    backgroundColor: '#fff', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    padding: '10px 0',
                    minWidth: '200px',
                    zIndex: 1000,
                    listStyle: 'none',
                    margin: 0
                  }}>
                    <li style={{ padding: '5px 20px', borderTop: 'none' }}>
                      <Link to="/hobby#recipes" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>
                        Ricette di Mamma Niky
                      </Link>
                    </li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}>
                      <Link to="/hobby#cocktails" style={{ display: 'block', color: '#444', textDecoration: 'none' }}>
                        I miei Cocktail
                      </Link>
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
                <header><h2>Quando chiudo il terminale...</h2></header>
                <p>La cybersecurity richiede concentrazione e precisione, esattamente come la cucina e la mixology. 
                Qui raccolgo i miei esperimenti culinari e le mie creazioni alcoliche (e non).</p>
             </article>

             {/* Sezione Ricette */}
             <article className="box post" id="recipes">
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

             {/* Sezione Cocktail */}
             <article className="box post" id="cocktails">
                <header><h2>I miei <strong>Cocktail</strong></h2></header>
                <a href="#" className="image featured"><img src="/images/pic06.jpg" alt="Cocktails" /></a>
                
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
      </section>

      {/* --- FOOTER PULITO --- */}
      <section id="footer">
        <div className="container">
          <header>
            <h2>Contatti</h2>
          </header>
          <div className="row aln-center"> 
            
            <div className="col-12 col-12-medium" style={{ textAlign: 'center' }}>
              <section>
                <p style={{ fontSize: '1.2em', marginBottom: '2em' }}>
                  Contattami per collaborazioni in ambito Sviluppo Web Fullstack o progetti di Cybersecurity.
                </p>
                
                {/* Contenitore contatti centrato */}
                <div style={{ display: 'inline-block', textAlign: 'center' }}>
                  <ul className="icons" style={{ listStyle: 'none', padding: 0 }}>
                    <li className="icon solid fa-home" style={{ marginBottom: '1em', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginLeft: '15px' }}>
                        Via Scipione 45/A<br />
                        43039, Salsomaggiore Terme (PR)<br />
                        Italia
                      </span>
                    </li>
                    <li className="icon solid fa-phone" style={{ marginBottom: '1em', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginLeft: '15px' }}>+39 351 714 0966</span>
                    </li>
                    <li className="icon solid fa-envelope" style={{ marginBottom: '1em', display: 'flex', alignItems: 'center' }}>
                      <a href="mailto:arcari.nicholaso@gmail.com" style={{ marginLeft: '15px' }}>arcari.nicholaso@gmail.com</a>
                    </li>
                    <li className="icon brands fa-github" style={{ display: 'flex', alignItems: 'center' }}>
                      <a href="https://github.com/Nicholas-Arcari" style={{ marginLeft: '15px' }}>github.com/Nicholas-Arcari</a>
                    </li>
                  </ul>
                </div>

              </section>
            </div>

          </div>
        </div>
        
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