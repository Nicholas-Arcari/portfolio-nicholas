// src/pages/UniversityDetails.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const UniversityDetails = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const terminalLines = [
    "> ./load_module.sh --education",
    "> fetching_transcript.py...",
    "> Analyzing ECTS credits...",
    "> Status: Degree Awarded (90/110).",
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

  // --- DATABASE CORSI ---
  const coursesData = [
    // ANNO 1
    {
      name: "Fondamenti di Programmazione A & B",
      year: "Anno 1",
      description: "Introduzione al pensiero computazionale e alla programmazione imperativa tramite C++ e Java. Gestione della memoria (puntatori), allocazione dinamica, strutture dati fondamentali e primi concetti di Object Oriented Programming."
    },
    {
      name: "Architettura degli Elaboratori",
      year: "Anno 1",
      description: "Studio dell'architettura di Von Neumann, logica booleana e circuiti digitali. Gestione della pipeline del processore e gerarchie di memoria."
    },
    {
      name: "Algoritmi e Strutture Dati",
      year: "Anno 1",
      description: "Analisi della complessità computazionale (O-grande). Studio e implementazione di strutture dati avanzate (alberi, grafi, hash table) e algoritmi di ordinamento e ricerca."
    },
    {
      name: "Analisi Matematica",
      year: "Anno 1",
      description: "Studio delle funzioni reali di variabile reale: limiti, calcolo differenziale e calcolo integrale. Analisi di successioni e serie numeriche per le basi matematiche dell'informatica."
    },
    {
      name: "Algebra e Geometria",
      year: "Anno 1",
      description: "Algebra lineare: spazi vettoriali, matrici, determinanti e sistemi lineari. Geometria analitica nello spazio e applicazioni delle trasformazioni lineari."
    },
    {
      name: "Fisica",
      year: "Anno 1",
      description: "Principi fondamentali della meccanica classica, termodinamica ed elettromagnetismo. Applicazione del metodo scientifico e risoluzione di problemi fisici."
    },
    {
      name: "Inglese B1",
      year: "Anno 1",
      description: "Consolidamento delle competenze linguistiche con focus sulla terminologia tecnica e scientifica in ambito informatico."
    },

    // ANNO 2
    {
      name: "Sistemi Operativi",
      year: "Anno 2",
      description: "Architettura dei moderni OS (Linux/Unix/Windows). Gestione dei processi, scheduling, thread e concorrenza (semafori, monitor), gestione della memoria virtuale e file system. Programmazione di sistema in C."
    },
    {
      name: "Basi di Dati",
      year: "Anno 2",
      description: "Progettazione di database relazionali (Modello E-R, normalizzazione). Linguaggio SQL (DDL, DML) e algebra relazionale. Transazioni, concorrenza e indici nei DBMS."
    },
    {
      name: "Metodologie di Programmazione",
      year: "Anno 2",
      description: "Programmazione Orientata agli Oggetti avanzata in C++. Studio dei Design Patterns (GoF), principi SOLID, testing unitario e gestione delle eccezioni."
    },
    {
      name: "Fondamenti dell'Informatica",
      year: "Anno 2",
      description: "Teoria della computabilità e linguaggi formali. Automi a stati finiti, grammatiche libere dal contesto e Macchine di Turing."
    },
    {
      name: "Calcolo Numerico",
      year: "Anno 2",
      description: "Metodi per la risoluzione numerica di problemi matematici continui. Analisi degli errori, approssimazione di funzioni e risoluzione di sistemi lineari al calcolatore (MATLAB/Python)."
    },
    {
      name: "Elementi di Probabilità",
      year: "Anno 2",
      description: "Calcolo delle probabilità, variabili aleatorie discrete e continue, teoremi limite e introduzione alla statistica inferenziale per l'analisi dei dati."
    },
    {
      name: "Sistemi Informativi",
      year: "Anno 2",
      description: "Modellazione dei processi aziendali e ciclo di vita del software. Analisi dei requisiti e progettazione tramite linguaggio UML."
    },
    {
      name: "Programmazione di Sistemi Mobili",
      year: "Anno 2",
      description: "Sviluppo di applicazioni native per dispositivi mobili (Android e Apple). Studio del ciclo di vita delle activity, gestione dei sensori, persistenza dati locale e design interfacce utente responsive."
    },
    {
      name: "Microservizi e Infrastrutture IT",
      year: "Anno 2",
      description: "Progettazione di architetture distribuite a microservizi. Containerizzazione con Docker, orchestrazione tramite Kubernetes e pattern di comunicazione (REST, gRPC, Message Brokers)."
    },
    {
      name: "Laboratorio di Algoritmi",
      year: "Anno 2",
      description: "Applicazione pratica delle tecniche algoritmiche. Risoluzione di problemi complessi tramite programmazione competitiva e ottimizzazione del codice."
    },
    {
      name: "Scrittura in LaTeX",
      year: "Anno 2",
      description: "Composizione tipografica di documenti scientifici e tecnici. Gestione di bibliografie, formule matematiche complesse e strutturazione della tesi."
    },

    // ANNO 3
    {
      name: "Reti di Calcolatori",
      year: "Anno 3",
      description: "Analisi dello stack protocollare TCP/IP e modello ISO/OSI. Routing, protocolli di trasporto (TCP/UDP), livello applicazione (HTTP, DNS) e fondamenti di network security. Tutto questo affiancato da attività di laboratorio pratico con Wireshark e simulazioni di rete."
    },
    {
      name: "Ingegneria del Software",
      year: "Anno 3",
      description: "Gestione di progetti software complessi. Metodologie agili (Scrum), version control, CI/CD, metriche di qualità e manutenzione del software attraverso design patterns."
    },
    {
      name: "Intelligenza Artificiale",
      year: "Anno 3",
      description: "Agenti intelligenti, algoritmi di ricerca (A*), logica del primo ordine e introduzione al Machine Learning e alle Reti Neurali."
    },
    {
      name: "Programmazione Parallela e HPC",
      year: "Anno 3",
      description: "Sviluppo di applicazioni ad alte prestazioni. Calcolo parallelo su architetture multi-core (OpenMP), sistemi distribuiti (MPI) e programmazione su GPU (CUDA)."
    },
    {
      name: "Sistemi Informativi e Gestione d'Impresa",
      year: "Anno 3",
      description: "Integrazione dei sistemi IT nei processi di business. ERP, CRM, Business Intelligence e gestione dell'innovazione digitale nelle aziende."
    }
  ];

  // Filtra i corsi
  const filteredCourses = coursesData.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                    <li style={{ padding: '5px 20px', borderTop: 'none' }}><Link to="/ricette" style={{ display: 'block', color: '#444' }}>Ricette</Link></li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/cocktail" style={{ display: 'block', color: '#444' }}>Cocktail</Link></li>
                    <li style={{ padding: '5px 20px', borderTop: '1px solid #eee' }}><Link to="/stampe3d" style={{ display: 'block', color: '#444' }}>Stampe 3D</Link></li>
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
                  <header><h2>Percorso Accademico</h2></header>
                  <p>Università di Parma - Laurea Triennale in Scienze Informatiche (L-31).</p>
                  
                  {/* BARRA DI RICERCA */}
                  <input
                    type="text"
                    placeholder="Cerca un esame o un argomento (es. Reti, Java, Algoritmi)..."
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

                  {/* LISTA CORSI */}
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course, index) => (
                      <React.Fragment key={index}>
                        <div style={{ marginBottom: '2em' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>{course.name}</h3>
                                <span className="button alt small" style={{ pointerEvents: 'none' }}>{course.year}</span>
                            </div>
                            <p style={{ marginTop: '0.5em' }}>{course.description}</p>
                        </div>
                        {index < filteredCourses.length - 1 && <hr />}
                      </React.Fragment>
                    ))
                  ) : (
                    <p style={{textAlign: 'center', padding: '20px', fontStyle: 'italic'}}>
                      Nessun corso trovato.
                    </p>
                  )}

               </article>
            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium">
               
               {/* Box Resume */}
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3>Riepilogo</h3></header>
                      <p>
                        <strong>Ateneo:</strong> Università di Parma<br />
                        <strong>Corso:</strong> Scienze Informatiche (L-31)<br />
                        <strong>Periodo:</strong> 2021 - 2025<br />
                        <strong>Voto Finale:</strong> 90/110
                      </p>
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

export default UniversityDetails;