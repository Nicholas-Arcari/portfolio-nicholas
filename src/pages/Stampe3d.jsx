// src/pages/Stampe3d.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Stampe3d = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTermExecuted, setSearchTermExecuted] = useState(""); // Ricerca progetti eseguiti
  const [searchTermFuture, setSearchTermFuture] = useState("");     // Ricerca progetti futuri

  const terminalLines = [
    "> ./load_module.sh --3d-print",
    "> Heating bed to 60°C...",
    "> Parsing G-code...",
    "> Status: Extruding Layer 1...",
    "> Ready."
  ];

  // --- DATI DEI PROGETTI ---
  
  // 1. LISTA PROGETTI ESEGUITI
  const executedProjects = [
    {
      title: "Cookie cutter",
      description: "Formine per biscotti personalizzate e a tema",
      material: "PLA Nero Opaco (Food Safe)",
      image: "images/stampa/" 
    },
    {
      title: "Braccio Cyberpunk lame manitide",
      description: "Modello dimensione reale 1:1, assemblato in più parti e dipinto",
      material: "PLA Bianco + Primer e Acrilici",
      image: "images/stampa/stampa16.jpg"
    },
    {
      title: "Action Figure Denji",
      description: "Modello artistico di un personaggio iconico, post-prodotto e dipinto a mano",
      material: "PLA Bianco + Primer e Acrilici",
      image: "images/stampa/stampa3.jpg"
    },
    {
      title: "Action Figure Kakashi",
      description: "Modello artistico di un personaggio iconico, post-prodotto e dipinto a mano",
      material: "PLA Bianco + Primer e Acrilici",
      image: "images/stampa/"
    },
    {
      title: "Action Figure Mimikyu",
      description: "Modello artistico di un personaggio iconico, post-prodotto e dipinto a mano",
      material: "PLA Bianco + Primer e Acrilici",
      image: "images/stampa/"
    },
    {
      title: "Case Custom per Raspberry Pi",
      description: "Case ventilato con alloggiamento per SSD NVMe e schermo OLED integrato",
      material: "PLA+ o ASA",
      image: "images/stampa/stampa11.jpg"
    },
    {
      title: "Sponge Bed with Pillows",
      description: "Letto in miniatura per spugna da cucina per lavare i piatti",
      material: "PLA+ o ASA",
      image: "images/stampa/stampa19.jpg"
    },
    {
      title: "Action Figure Kuromi",
      description: "Modello artistico di un personaggio iconico, post-prodotto e dipinto a mano",
      material: "PLA",
      image: "images/stampa/stampa18.jpg"
    },
    {
      title: "Aperol Spritz LED Sign",
      description: "Lampada a LED a tema Aperol Spritz per illuminare le serate estive",
      material: "PLA+",
      image: "images/stampa/stampa7.jpg"
    },
    {
      title: "Hestia knife",
      description: "coltello ispirato a Danmachi, con dettagli accurati e finiture realistiche",
      material: "PLA",
      image: "images/stampa/stampa5.jpg"
    },
    {
      title: "Herb planter with auto-watering system",
      description: "Piccolo vaso per erbe aromatiche con sistema di auto-irrigazione integrato",
      material: "PLA",
      image: "images/stampa/stampa13.jpg"
    },
  ];

  // 2. LISTA PROGETTI DA ESEGUIRE
  const futureProjects = [
    {
      title: "Cane robotico programmabile",
      description: "Progetto complesso che integra stampa 3D e motori passo-passo controllati da Arduino. https://www.instructables.com/GoodBoy-3D-Printed-Arduino-Robot-Dog/",
      material: "PETG / ABS (per resistenza meccanica)",
      image: "images/stampa/stampa1.jpg"
    },
    {
      title: "Emmi Metroid Dread",
      description: "Robot ispirato a Metroid Dread, con articolazioni mobili e dettagli precisi programmabili via Arduino",
      material: "PLA",
      image: "images/stampa/stampa17.jpg"
    },
    {
      title: "DreamOfProps for Trauma Team Helmet",
      description: "Elmo futuristico ispirato a Trauma Team in Cyberpunk 2077",
      material: "PLA",
      image: "images/stampa/stampa10.jpg"
    },
    {
      title: "Daedric Armor split for smaller printers",
      description: "Armatura Daedric da The Elder Scrolls V: Skyrim, progettata per essere stampata in più parti e indossata",
      material: "PLA",
      image: "images/stampa/stampa2.jpg"
    },
    {
      title: "Tea Dispenser (top-mounted)",
      description: "Dispenser carino per bustine di tè",
      material: "PLA",
      image: "images/stampa/stampa20.jpg"
    },
    {
      title: "Iron Man MK6 MK 6 Suit",
      description: "Armatura completa di iron man programmabile in Arduino",
      material: "PLA",
      image: "images/stampa/stampa4.jpg"
    },
    {
      title: "Jack Daniel's coasters",
      description: "Sottobicchiere a tema Jack Daniel's",
      material: "PLA",
      image: "images/stampa/stampa6.jpg"
    },
    {
      title: "'wearable' T60b Power Armor from Fallout 4",
      description: "Armatura alta più di 2 metri indossabile per affrontare al meglio la zona contaminata",
      material: "PLA+",
      image: "images/stampa/stampa9.jpg"
    },
    {
      title: "Iron Man Helmet, Articulated, Wearable",
      description: "Maschera di Iron programmabile in Arduino",
      material: "PLA",
      image: "images/stampa/stampa8.jpg"
    },
    {
      title: "Tazzina da basket gioco",
      description: "Canestro da basket con una clip regolabile che si adatta alla maggior parte delle tazze in modo da giocare a fare canestro nella tazza con i vostri cereali o biscotti preferiti",
      material: "PLA",
      image: "images/stampa/stampa15.jpg"
    },
    {
      title: "Cyberpunk Mecha Sci-fi Bonsai",
      description: "Bonsai in stile cyberpunk con dettagli mecha e futuristici",
      material: "PLA+",
      image: "images/stampa/stampa12.jpg"
    },
    {
      title: "Cyberpunk 2077 Ottiche Kiroshi",
      description: "CHOOMS! Che siate in giro per una notte in città a Night City, o che stiate prendendo d'assalto la torre Arasaka, è meglio avere le migliori ottiche che si possano comprare, e niente batte Kiroshi.",
      material: "PLA+",
      image: "images/stampa/stampa14.jpg"
    }
    
  ];

  // --- FILTRI ---
  const filteredExecuted = executedProjects.filter(project => 
    project.title.toLowerCase().includes(searchTermExecuted.toLowerCase())
  );

  const filteredFuture = futureProjects.filter(project => 
    project.title.toLowerCase().includes(searchTermFuture.toLowerCase())
  );

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
                
                {/* SEARCH BAR ESEGUITI */}
                <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                  <input
                    type="text"
                    placeholder="Cerca progetto eseguito..."
                    value={searchTermExecuted}
                    onChange={(e) => setSearchTermExecuted(e.target.value)}
                    style={{ 
                      width: '60%', 
                      padding: '10px', 
                      borderRadius: '5px', 
                      border: '1px solid #ccc',
                      fontSize: '1em'
                    }}
                  />
                </div>

                <div className="row">
                    {filteredExecuted.length > 0 ? (
                      filteredExecuted.map((project, index) => (
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
                      ))
                    ) : (
                      <p style={{ width: '100%', textAlign: 'center' }}>Nessun progetto trovato.</p>
                    )}
                </div>
             </section>

             <hr style={{ margin: '4em 0' }} />

             {/* --- SEZIONE 2: PROGETTI DA ESEGUIRE --- */}
             <section>
                <header style={{ marginBottom: '2em', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5em', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Progetti da Eseguire</h2>
                    <p>Work in Progress, rendering e idee pronte per lo slicing.</p>
                </header>

                {/* SEARCH BAR FUTURI */}
                <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                  <input
                    type="text"
                    placeholder="Cerca progetto futuro..."
                    value={searchTermFuture}
                    onChange={(e) => setSearchTermFuture(e.target.value)}
                    style={{ 
                      width: '60%', 
                      padding: '10px', 
                      borderRadius: '5px', 
                      border: '1px solid #ccc',
                      fontSize: '1em'
                    }}
                  />
                </div>

                <div className="row">
                    {filteredFuture.length > 0 ? (
                      filteredFuture.map((project, index) => (
                        <div key={index} className="col-6 col-12-medium">
                            <article className="box feature" style={{ opacity: 0.9 }}>
                                <a href="#" className="image featured">
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
                      ))
                    ) : (
                      <p style={{ width: '100%', textAlign: 'center' }}>Nessun progetto trovato.</p>
                    )}
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