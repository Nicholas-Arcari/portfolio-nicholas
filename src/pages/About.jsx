// src/pages/About.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const About = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const terminalLines = [
    "> ./whoami",
    "> Nicholas Arcari",
    "> Status: Accensione fuoco della giovinezza...",
    "> Loading Bio..."
  ];

  // Layout No-Sidebar per questa pagina
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
      
      {/* HEADER */}
      <section id="header">
        <div className="container">
          <h1 id="logo"><Link to="/">Nicholas Arcari</Link></h1>
          <br />
          <TerminalText lines={terminalLines} />
          
          <nav id="nav">
            <ul>
              <li><Link className="icon solid fa-home" to="/"><span>Home</span></Link></li>
              <li className="current"><Link className="icon solid fa-user" to="/about"><span>Chi Sono</span></Link></li>
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
                    <li style={{ padding: '5px 20px', borderTop: 'none' }}><Link to="/ricette" style={{ display: 'block', color: '#444' }}>Ricette di Mamma Niky</Link></li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/cocktail" style={{ display: 'block', color: '#444' }}>I miei Cocktail</Link></li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/stampe3d" style={{ display: 'block', color: '#444' }}>Stampe 3D</Link></li>
                  </ul>
                )}
              </li>
              
              {/* Voce Attiva */}
              <li><a className="icon brands fa-github" href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer"><span>GitHub</span></a></li>
            </ul>
          </nav>
        </div>
      </section>

      {/* MAIN - SEZIONE ABOUT */}
      <section id="main">
        <div className="container">
          <div id="content">
            
            {/* Box Contenitore Stile Clean */}
            <article className="box post" style={{ padding: '3em' }}>
              
              <div className="row aln-middle">
                
                {/* COLONNA SINISTRA: FOTO */}
                <div className="col-5 col-12-medium">
                  <span className="image fit">
                    <img 
                      src="images/test.jpg" 
                      alt="Nicholas Arcari" 
                      style={{ borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} 
                    />
                  </span>
                </div>

                {/* COLONNA DESTRA: TESTO E CONTATTI */}
                <div className="col-7 col-12-medium">
                  <header>
                    <h2 style={{ fontSize: '2.8em', marginBottom: '0.5em', borderBottom: '3px solid #d52349', display: 'inline-block' }}>
                      About Me
                    </h2>
                  </header>
                  
                  <div style={{ fontSize: '1.1em', lineHeight: '1.8', color: '#555', marginBottom: '2em' }}>
                    <p>
                     Ciao, sono <strong>Nicholas Arcari</strong>. <br />
                     Ho scoperto che il mio cervello processa il codice e il cibo esattamente allo stesso modo. Per me, non c'è una reale differenza tra il silicio e la farina: entrambi richiedono struttura, pazienza e una cura quasi maniacale per i dettagli.
                    </p>
                    <p>
                     C'è una poesia tecnica nel costruire le cose da zero. <strong>Preparare il mio cyberlab</strong>, tirare su macchine virtuali e configurare reti sicure mi dà la stessa soddisfazione viscerale di quando affondo le mani nell'impasto, sentendo la maglia glutinica prendere forma sotto le dita. Sono due tipi di architettura, ma l'anima è la stessa.
                    </p>
                    <p>
                     E poi c'è il monitoraggio. Passerei ore a fissare i log di un <strong>SIEM</strong> scorrere a video in cerca di anomalie, con la stessa identica trepidazione con cui mi incollo al vetro del forno, guardando una lievitazione complessa prendere vita, aspettando che la crosta diventi perfetta.
                    </p>
                  </div>

                  {/* LISTA CONTATTI (Ex Footer) */}
                  <h3 style={{ fontSize: '1.5em', marginBottom: '1em' }}>Contatti</h3>
                  <ul className="icons" style={{ listStyle: 'none', padding: 0 }}>
                    
                    <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                      <i className="icon solid fa-envelope" style={{ width: '30px', color: '#d52349', fontSize: '1.2em' }}></i>
                      <a href="mailto:arcari.nicholaso@gmail.com" style={{ fontWeight: 'bold', color: '#444' }}>arcari.nicholas0@gmail.com</a>
                    </li>

                    <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                      <i className="icon solid fa-phone" style={{ width: '30px', color: '#d52349', fontSize: '1.2em' }}></i>
                      <span>+39 351 714 0966</span>
                    </li>

                    <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                      <i className="icon solid fa-map-marker-alt" style={{ width: '30px', color: '#d52349', fontSize: '1.2em' }}></i>
                      <span>Salsomaggiore Terme (PR), Italia</span>
                    </li>

                    <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                      <i className="icon brands fa-linkedin" style={{ width: '30px', color: '#0077b5', fontSize: '1.2em' }}></i>
                      <a href="https://www.linkedin.com/in/tuo-profilo" target="_blank" rel="noreferrer">LinkedIn</a>
                    </li>

                    <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                      <i className="icon brands fa-github" style={{ width: '30px', color: '#333', fontSize: '1.2em' }}></i>
                      <a href="https://github.com/Nicholas-Arcari" target="_blank" rel="noreferrer">GitHub</a>
                    </li>

                  </ul>

                </div>
              </div>
            </article>

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

export default About;