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
        }, 100); // Piccolo delay per assicurare che il rendering sia finito
      }
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

      {/* Main Section */}
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