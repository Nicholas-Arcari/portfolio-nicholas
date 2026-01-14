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

  // --- DATI DEI PROGETTI (Modifica qui per aggiungere/rimuovere) ---
  
  // 1. LISTA PROGETTI ESEGUITI
  const executedProjects = [
    {
      title: "Cookiecutter",
      description: "Formine per biscotti.",
      material: "PLA Nero Opaco",
      image: "images/pic07.jpg" 
    },
    {
      title: "Braccio destro cyberpunk",
      description: "Prelevato il contenuto dai file di gico.",
      material: "PLA Bianco + Primer e Acrilici",
      image: "images/pic07.jpg"
    },
    {
      title: "Action Figure Denji",
      description: "Modello artistico di un personaggio iconico, post-prodotto e dipinto a mano.",
      material: "PLA Bianco + Primer e Acrilici",
      image: "images/pic07.jpg"
    }
  ];

  // 2. LISTA PROGETTI DA ESEGUIRE
  const futureProjects = [
    {
      title: "Cane robotico programmabile",
      description: "Progetto complesso che integra stampa 3D e motori passo-passo controllati da Arduino.",
      material: "PETG / ABS (per resistenza meccanica)",
      image: "images/pic06.jpg"
    },
    {
      title: "Case Custom per Raspberry Pi",
      description: "Case ventilato con alloggiamento per SSD NVMe e schermo OLED integrato.",
      material: "PLA+ o ASA",
      image: "images/pic06.jpg"
    }
  ];

  // Gestione layout
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
          <div id="content">
             
             {/* Intro */}
             <article className="box post">
                <header><h2>Dal Digitale al Fisico</h2></header>
                <p>La stampa 3D unisce la mia passione per il software con la soddisfazione di creare oggetti tangibili. Qui raccolgo i miei progetti, divisi tra quelli già realizzati e le idee in cantiere.</p>
             </article>

             {/* --- SEZIONE 1: PROGETTI ESEGUITI --- */}
             <section>
                <header style={{ marginBottom: '2em', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5em', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Progetti Eseguiti</h2>
                </header>
                
                <div className="row">
                    {executedProjects.map((project, index) => (
                        <div key={index} className="col-6 col-12-medium">
                            <article className="box feature">
                                <a href="#" className="image featured">
                                    <img src={project.image} alt={project.title} style={{ objectFit: 'cover', height: '300px' }} />
                                </a>
                                <header>
                                    <h3>{project.title}</h3>
                                </header>
                                <p>{project.description}</p>
                                <p style={{ fontSize: '0.9em', color: '#555', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                    <strong>Materiale:</strong> {project.material}
                                </p>
                            </article>
                        </div>
                    ))}
                </div>
             </section>

             <hr style={{ margin: '4em 0' }} />

             {/* --- SEZIONE 2: PROGETTI DA ESEGUIRE --- */}
             <section>
                <header style={{ marginBottom: '2em', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5em', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Progetti da Eseguire</h2>
                    <p>Work in Progress, rendering e idee pronte per lo slicing.</p>
                </header>

                <div className="row">
                    {futureProjects.map((project, index) => (
                        <div key={index} className="col-6 col-12-medium">
                            <article className="box feature" style={{ opacity: 0.9 }}> {/* Leggera trasparenza per indicare "futuro" */}
                                <a href="#" className="image featured">
                                    {/* Nota: Qui potresti usare un'immagine "placeholder" o un render 3D */}
                                    <img src={project.image} alt={project.title} style={{ objectFit: 'cover', height: '300px', filter: 'grayscale(30%)' }} />
                                </a>
                                <header>
                                    <h3>{project.title}</h3>
                                </header>
                                <p>{project.description}</p>
                                <p style={{ fontSize: '0.9em', color: '#555', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                    <strong>Materiale Previsto:</strong> {project.material}
                                </p>
                            </article>
                        </div>
                    ))}
                </div>
             </section>

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