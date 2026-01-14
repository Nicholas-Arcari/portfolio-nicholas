// src/pages/Stampe3d.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Stampe3d = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const terminalLines = [
    "> ./load_module.sh --3d-print",
    "> Heating bed to 60°C...",
    "> Parsing G-code...",
    "> Status: Extruding Layer 1...",
    "> Ready."
  ];

  // Gestione layout (No Sidebar per dare spazio alle foto)
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
                    {/* NUOVO LINK */}
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

      {/* --- MAIN --- */}
      <section id="main">
        <div className="container">
          <div id="content">
             
             {/* Intro */}
             <article className="box post">
                <header><h2>Dal Digitale al Fisico</h2></header>
                <p>La stampa 3D unisce la mia passione per il software con la soddisfazione di creare oggetti tangibili. Qui raccolgo i miei progetti, dalle parti funzionali ai prototipi.</p>
             </article>

             {/* Esempi Progetti (Sostituisci i testi e le immagini con i tuoi reali) */}
             <article className="box post">
                <header><h2>Progetti <strong>Maker</strong></h2></header>
                
                {/* Immagine Principale */}
                <a href="#" className="image featured"><img src="images/img4.jpg" alt="Stampe 3D" /></a> 
                
                <p>Utilizzo stampanti FDM/SLA per realizzare soluzioni custom per la casa e l'ufficio.</p>

                <hr />

                <h3>Supporti Funzionali</h3>
                <p>Progettazione e stampa di supporti per cable management, stand per cuffie e organizzatori per la scrivania.<br />
                <strong>Materiale:</strong> PLA / PETG.<br />
                <strong>Software:</strong> Fusion 360 / Blender.</p>

                <hr />

                <h3>Prototipazione Rapida</h3>
                <p>Creazione di case per Raspberry Pi e microcontrollori personalizzati.<br />
                <strong>Note:</strong> Ottimizzazione dei flussi d'aria e accessibilità delle porte I/O.</p>

                <hr />

                <h3>Art & Lithophanes</h3>
                <p>Stampe artistiche ad alta risoluzione e litofanie retroilluminate.<br />
                <strong>Setup:</strong> Ugello 0.2mm, Layer height 0.12mm.</p>
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

export default Stampe3d;