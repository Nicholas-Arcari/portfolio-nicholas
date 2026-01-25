// src/pages/Stampe3d.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Stampe3d = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTermExecuted, setSearchTermExecuted] = useState(""); // Ricerca progetti eseguiti
  const [searchTermFuture, setSearchTermFuture] = useState("");     // Ricerca progetti futuri

  const [showExecuted, setShowExecuted] = useState(false); // Default: nascosto
  const [showFuture, setShowFuture] = useState(false);     // Default: nascosto

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
      title: "Cookie Cutter Set",
      description: "Set di formine per biscotti personalizzate, progettate in CAD e stampate per uso alimentare.",
      material: "PLA Nero Opaco (Food Safe)",
      image: "images/stampa/",
      topic: "Cucina",
      link: "https://www.thingiverse.com" 
    },
    {
      title: "Mantis Blades (Cyberpunk 2077)",
      description: "Replica in scala 1:1 delle iconiche lame retrattili. Assemblaggio multi-parte con finitura metallizzata e weathering.",
      material: "PLA Bianco + Primer e Acrilici",
      image: "images/stampa/stampa16.jpg",
      topic: "Cosplay",
      link: "https://makerworld.com/it/models/655884-cyberpunk-mantis-blades-model#profileId-582890"
    },
    {
      title: "Action Figure: Denji (Chainsaw Man)",
      description: "Statuetta dettagliata del protagonista di Chainsaw Man.",
      material: "PLA Bianco + Primer e Acrilici",
      image: "images/stampa/stampa3.jpg",
      topic: "Action Figure",
      link: "https://www.thingiverse.com/thing:6256385"
    },
    {
      title: "Action Figure: Kakashi Hatake",
      description: "Diorama dinamico del ninja copia. Cura particolare nella pittura delle texture dei tessuti e dell'effetto Chidori.",
      material: "PLA Bianco + Primer e Acrilici",
      image: "images/stampa/",
      topic: "Action Figure",
      link: "https://www.thingiverse.com/thing:927511"
    },
    {
      title: "Action Figure: Mimikyu",
      description: "Modello 'life-size' del Pokémon fantasma. Finitura opaca per simulare l'effetto tessuto del costume.",
      material: "PLA Bianco + Primer e Acrilici",
      image: "images/stampa/",
      topic: "Action Figure",
      link: "https://www.thingiverse.com/thing:1940448"
    },
    {
      title: "Raspberry Pi Ultimate Case",
      description: "Case custom progettato per massimizzare il flusso d'aria. Include alloggiamenti per SSD NVMe e display OLED di stato.",
      material: "PLA+ o ASA",
      image: "images/stampa/stampa11.jpg",
      topic: "Tech",
      link: "https://makerworld.com/it/models/179232-raspberry-pi-4b"
    },
    {
      title: "Sponge Bed",
      description: "Accessorio funzionale e ironico per la cucina: un letto in miniatura che permette alla spugna di asciugarsi correttamente.",
      material: "PLA+ o ASA",
      image: "images/stampa/stampa19.jpg",
      topic: "Cucina",
      link: "https://www.thingiverse.com/thing:2687499"
    },
    {
      title: "Action Figure: Kuromi",
      description: "Personaggio Kuromi stampato ad alta risoluzione. Colori acrilici vivaci e sigillante lucido per un look 'vinyl toy'.",
      material: "PLA",
      image: "images/stampa/stampa18.jpg",
      topic: "Action Figure",
      link: "https://www.thingiverse.com/thing:6006836"
    },
    {
      title: "Aperol Spritz Neon Sign",
      description: "Insegna luminosa a LED personalizzata. Design a strati per diffondere la luce arancione tipica del cocktail.",
      material: "PLA+ Traslucido e Opaco",
      image: "images/stampa/stampa7.jpg",
      topic: "Arredamento",
      link: "https://www.thingiverse.com/thing:6657606"
    },
    {
      title: "Hestia Knife (DanMachi)",
      description: "Replica fedele del pugnale divino, con incisioni delle rune geroglifiche.",
      material: "PLA",
      image: "images/stampa/stampa5.jpg",
      topic: "Cosplay",
      link: "https://www.thingiverse.com/thing:5185347"
    },
    {
      title: "Self-Watering Planter",
      description: "Vaso per erbe aromatiche con serbatoio d'acqua integrato e sistema di capillarità per ridurre la frequenza di innaffiatura.",
      material: "PLA (Watertight setting)",
      image: "images/stampa/stampa13.jpg",
      topic: "Giardinaggio",
      link: "https://makerworld.com/it/models/112701-self-watering-herb-planter-for-the-kitchen?from=search#profileId-120974"
    },
    {
      title: "Spadone daedrico",
      description: "Spadone daedrico di 180 cm ispirato al mondo di Skyrim. Finitura lucida e dettagliate incisioni per il design.",
      material: "PLA",
      image: "images/stampa/stampa21.jpg",
      topic: "Cosplay",
      link: "https://www.printables.com/model/370085-daedric-greatsword-skyrim-for-small-printing"
    },
  ];

  // 2. LISTA PROGETTI DA ESEGUIRE
  const futureProjects = [
    {
      title: "Robot Dog Open Source",
      description: "Progetto avanzato di robotica: quadrupede stampato in 3D con 12 gradi di libertà, gestito da Arduino e servi ad alta coppia.",
      material: "PETG / ABS (per resistenza meccanica)",
      image: "images/stampa/stampa1.jpg",
      topic: "Robotica",
      link: "https://makerworld.com/it/models/1426836-arduino-robot-dog#profileId-1483116"
    },
    {
      title: "E.M.M.I. (Metroid Dread)",
      description: "Modello articolato complesso del robot inseguitore. Richiede tolleranze precise per le giunture posabili.",
      material: "PLA / TPU (per giunti flessibili)",
      image: "images/stampa/stampa17.jpg",
      topic: "Action Figure",
      link: "https://www.thingiverse.com/thing:5254236"
    },
    {
      title: "Trauma Team Helmet",
      description: "Casco integrale ispirato ai medici tattici di Cyberpunk 2077. Progettato per essere indossabile con elettronica interna.",
      material: "PLA (rinforzato internamente)",
      image: "images/stampa/stampa10.jpg",
      topic: "Cosplay",
      link: "https://www.thingiverse.com/thing:4897526"
    },
    {
      title: "Daedric Armor (Skyrim)",
      description: "Armatura completa Daedrica.",
      material: "PLA",
      image: "images/stampa/stampa2.jpg",
      topic: "Cosplay",
      link: "https://www.thingiverse.com/thing:3581525"
    },
    {
      title: "Tea Dispenser Verticale",
      description: "Organizzatore a gravità per bustine di tè. Design compatto per ottimizzare lo spazio in dispensa.",
      material: "PLA",
      image: "images/stampa/stampa20.jpg",
      topic: "Cucina",
      link: "https://www.thingiverse.com/thing:4763805"
    },
    {
      title: "Iron Man MK6 Suit",
      description: "Armatura completa in scala 1:1. Include alloggiamenti per servomotori per l'apertura automatica del casco e dei flap.",
      material: "PLA+ (per resistenza agli urti)",
      image: "images/stampa/stampa4.jpg",
      topic: "Cosplay",
      link: "https://www.thingiverse.com/thing:1779274"
    },
    {
      title: "Jack Daniel's Coasters",
      description: "Set di sottobicchieri tematici con design in rilievo e cambio colore al layer.",
      material: "PLA / TPU",
      image: "images/stampa/stampa6.jpg",
      topic: "Arredamento",
      link: "https://www.thingiverse.com/thing:2395261"
    },
    {
      title: "T-60b Power Armor (Fallout 4)",
      description: "Il progetto definitivo: armatura alta oltre 2 metri, indossabile, con esoscheletro di supporto interno.",
      material: "PLA+ (kg stimati: 25+)",
      image: "images/stampa/stampa9.jpg",
      topic: "Cosplay",
      link: "https://www.thingiverse.com/thing:1133207"
    },
    {
      title: "Iron Man Helmet (Motorized)",
      description: "Casco stand-alone con faceplate motorizzata controllata da Arduino e sensori vocali/tattili.",
      material: "PLA Silk (effetto metallico)",
      image: "images/stampa/stampa8.jpg",
      topic: "Cosplay",
      link: "https://www.thingiverse.com/thing:4629346"
    },
    {
      title: "Mug Basketball Hoop",
      description: "Gadget da ufficio: un mini canestro a clip adattabile a qualsiasi tazza per lanciare zollette o cereali.",
      material: "PLA",
      image: "images/stampa/stampa15.jpg",
      topic: "Svago",
      link: "https://makerworld.com/it/models/1218000-basket-mug-funny-game#profileId-1234266"
    },
    {
      title: "Cyberpunk Sci-Fi Bonsai",
      description: "Fusione tra natura e tecnologia: un bonsai artificiale con elementi mecha, cavi e illuminazione LED integrata.",
      material: "PLA Wood (tronco) & PLA Neon",
      image: "images/stampa/stampa12.jpg",
      topic: "Arredamento",
      link: "https://makerworld.com/it/models/1530931-cyberpunk-mecha-sci-fi-bonsai"
    },
    {
      title: "Kiroshi Optics Replica",
      description: "CHOOMS! Che siate in giro per una notte in città a Night City, o che stiate prendendo d'assalto la torre Arasaka, è meglio avere le migliori ottiche che si possano comprare, e niente batte Kiroshi.",
      material: "PLA+ e Resina (per le lenti)",
      image: "images/stampa/stampa14.jpg",
      topic: "Cosplay",
      link: "https://makerworld.com/it/models/1595160-cyberpunk-2077-kiroshi-optics#profileId-1680368"
    }
  ];

  // --- FILTRI ---
  const filteredExecuted = executedProjects.filter(project => 
    project.title.toLowerCase().includes(searchTermExecuted.toLowerCase()) || 
    project.topic.toLowerCase().includes(searchTermExecuted.toLowerCase())
  );

  const filteredFuture = futureProjects.filter(project => 
    project.title.toLowerCase().includes(searchTermFuture.toLowerCase()) ||
    project.topic.toLowerCase().includes(searchTermFuture.toLowerCase())
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
          <div id="content">
             
             {/* Intro */}
             <article className="box post">
                <header><h2>Dal Digitale al Fisico</h2></header>
                <p>La stampa 3D unisce la mia passione per il software con la soddisfazione di creare oggetti tangibili. Qui raccolgo i miei progetti, divisi tra quelli già realizzati e le idee in cantiere.</p>
                
                <p style={{ marginTop: '1.5em', fontStyle: 'italic', borderLeft: '4px solid #d52349', paddingLeft: '15px', color: '#555' }}>
                  🚀 <strong>Collaborazioni:</strong> Sono disponibile per collaborazioni e servizi di stampa 3D su richiesta. 
                  Se hai un progetto in mente o un file da stampare, contattami per discuterne insieme!
                </p>
             </article>

             {/* --- SEZIONE 1: PROGETTI ESEGUITI (ESPANDIBILE) --- */}
             <section>
                <header style={{ marginBottom: '2em', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5em', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Progetti Eseguiti</h2>
                    
                    {/* BOTTONE TOGGLE ESEGUITI */}
                    <div style={{ marginTop: '15px' }}>
                        <button 
                            className="button alt small" 
                            onClick={() => setShowExecuted(!showExecuted)}
                        >
                            {showExecuted ? 'Nascondi Progetti' : 'Mostra Progetti'}
                            <i className={`icon solid ${showExecuted ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginLeft: '10px' }}></i>
                        </button>
                    </div>
                </header>
                
                {/* CONTENUTO CONDIZIONALE ESEGUITI */}
                {showExecuted && (
                    <div className="fade-in">
                        {/* SEARCH BAR ESEGUITI */}
                        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                        <input
                            type="text"
                            placeholder="Cerca per nome o argomento..."
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
                                            <span style={{ display: 'inline-block', backgroundColor: '#eee', color: '#444', padding: '2px 10px', borderRadius: '15px', fontSize: '0.8em', marginBottom: '10px' }}>
                                            {project.topic}
                                            </span>
                                        </header>
                                        <p>{project.description}</p>
                                        
                                        <div style={{ fontSize: '0.9em', color: '#555', paddingTop: '10px' }}>
                                            
                                            {/* LINK */}
                                            {project.link && (
                                            <p style={{ margin: 0, marginBottom: '5px', wordBreak: 'break-all' }}>
                                                <strong>Link: </strong> 
                                                <a href={project.link} target="_blank" rel="noreferrer" style={{ color: '#d52349' }}>
                                                    {project.link}
                                                </a>
                                            </p>
                                            )}

                                            {/* SPAZIO */}
                                            <br />

                                            {/* MATERIALE */}
                                            <p style={{ marginBottom: '0.5em' }}><strong>Materiale:</strong> {project.material}</p>
                                            
                                            {/* BARRA ORIZZONTALE ALLA FINE */}
                                            <hr style={{ marginTop: '10px', marginBottom: '0' }} />
                                        </div>
                                    </article>
                                </div>
                            ))
                            ) : (
                            <p style={{ width: '100%', textAlign: 'center' }}>Nessun progetto trovato.</p>
                            )}
                        </div>
                    </div>
                )}
             </section>

             <hr style={{ margin: '4em 0' }} />

             {/* --- SEZIONE 2: PROGETTI DA ESEGUIRE (ESPANDIBILE) --- */}
             <section>
                <header style={{ marginBottom: '2em', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5em', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Progetti da Eseguire</h2>
                    
                    {/* BOTTONE TOGGLE FUTURI */}
                    <div style={{ marginTop: '15px' }}>
                        <button 
                            className="button alt small" 
                            onClick={() => setShowFuture(!showFuture)}
                        >
                            {showFuture ? 'Nascondi Progetti' : 'Mostra Progetti'}
                            <i className={`icon solid ${showFuture ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ marginLeft: '10px' }}></i>
                        </button>
                    </div>
                </header>

                {/* CONTENUTO CONDIZIONALE FUTURI */}
                {showFuture && (
                    <div className="fade-in">
                        {/* SEARCH BAR FUTURI */}
                        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                        <input
                            type="text"
                            placeholder="Cerca per nome o argomento..."
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
                                            <span style={{ display: 'inline-block', backgroundColor: '#eee', color: '#444', padding: '2px 10px', borderRadius: '15px', fontSize: '0.8em', marginBottom: '10px' }}>
                                            {project.topic}
                                            </span>
                                        </header>
                                        <p>{project.description}</p>
                                        
                                        <div style={{ fontSize: '0.9em', color: '#555', paddingTop: '10px' }}>
                                            
                                            {/* LINK */}
                                            {project.link && (
                                            <p style={{ margin: 0, marginBottom: '5px', wordBreak: 'break-all' }}>
                                                <strong>Link: </strong> 
                                                <a href={project.link} target="_blank" rel="noreferrer" style={{ color: '#d52349' }}>
                                                    {project.link}
                                                </a>
                                            </p>
                                            )}

                                            <br />

                                            {/* MATERIALE */}
                                            <p style={{ marginBottom: '0.5em' }}><strong>Materiale:</strong> {project.material}</p>
                                            
                                            {/* BARRA ORIZZONTALE ALLA FINE */}
                                            <hr style={{ marginTop: '10px', marginBottom: '0' }} />
                                        </div>
                                    </article>
                                </div>
                            ))
                            ) : (
                            <p style={{ width: '100%', textAlign: 'center' }}>Nessun progetto trovato.</p>
                            )}
                        </div>
                    </div>
                )}
             </section>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
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

export default Stampe3d;