// src/pages/Cocktail_classici.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TerminalText from '../components/TerminalText';

const Cocktail_classici = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Stato per la ricerca

  const terminalLines = [
    "> ./load_module.sh --iba-classics",
    "> Loading historical archives...",
    "> Status: Vintage Mode Activated.",
    "> Ready."
  ];

  // Gestione layout (Sidebar Destra)
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

  // --- DATABASE DEI COCKTAIL ---
  const cocktailsData = [
    {
      name: "Americano",
      ingredients: "Soda, Bitter, Vermouth Rosso, Arancia, Limone.",
      preparation: "Raffreddare il bicchiere con del ghiaccio. Togliere il ghiaccio in eccesso o l'acqua, inserire 35 ml di Vermouth e 35 ml di Bitter. Aggiungere la soda q.b. (dai 30ml ai 60ml in base al gusto) e mescolare delicatamente. Aggiungere ghiaccio fresco, mescolare e per finire guarnire con una fetta di arancia nel cocktail e una scorza di limone strizzata sul bordo.",
      history: "Si chiama \"Americano\" in onore all'America che era abituata a bere drink \"on the rocks\", quindi con ghiaccio. Noi in Italia, nei primi del Novecento, eravamo soliti bere il vermouth freddo in coppettine senza ghiaccio. Era un periodo in cui si cercava di aggiungere una parte più amara, un po' più bitter al nostro vermouth e da lì un po' di soda (utilizzata sia in Europa che in America) per rendere il cocktail più frizzante."
    },
    {
      name: "Bloody Mary",
      ingredients: "Vodka, Succo di Pomodoro, Sedano, Tabasco, Salsa Worcester, Pepe, Sale, Limone Fresco.",
      preparation: "Freddare il bicchiere. In uno shaker (o meglio, usando la tecnica del \"rolling\") inserire ghiaccio e 45ml di Vodka. Tagliare a metà un limone, spremere 5-10ml e unirlo a 125ml di succo di pomodoro. Aggiungere un pizzico di sale, pepe, qualche goccia di Tabasco e Worcester. Miscelare per ossigenare il drink senza shakerare troppo violentemente. Versare nel bicchiere con ghiaccio nuovo e decorare con sedano e scorza di limone.",
      history: "Questo drink nasce in Francia intorno agli anni '20/'30 da un barman che lavorava all'Harry's New York Bar di Parigi, Ferdinand \"Pete\" Petiot. Inizialmente creò una miscela semplice di vodka e pomodoro. Un manager di un hotel di New York lo assaggiò, gli piacque e convinse Petiot a trasferirsi al Saint Regis Hotel di New York. Per adattarsi ai palati americani, più amanti dei sapori speziati, aggiunse salse e condimenti creando il Bloody Mary odierno. Il sedano fu aggiunto negli anni '60: nasce come pinzimonio, ma durante un cocktail party una cliente lo intinse nel bicchiere, creando la tradizione."
    },
    {
      name: "Bombardino",
      ingredients: "Zabov (Liquore all'uovo), Panna montata, Cacao.",
      preparation: "Scaldare lo Zabov (senza farlo bollire), versarlo in un bicchiere resistente al calore e guarnire con abbondante panna montata e una spolverata di cacao.",
      history: "Drink nato negli anni '50/'60, periodo d'oro dei cocktail vintage sulle piste da sci. Si narra sia stato creato da un giovane barman genovese rifugiatosi in montagna."
    },
    {
      name: "Corpse Reviver #2",
      ingredients: "Lillet Blanc, Gin, Cointreau, Succo di limone, Assenzio (qualche goccia).",
      preparation: "Raffreddare la coppetta. Nello shaker versare 25ml di Gin, 25ml di Cointreau, 25ml di Lillet Blanc e 25ml di succo di limone fresco. Aggiungere un cucchiaino di assenzio (o sciacquare il bicchiere con esso). Shakerare con ghiaccio e filtrare nella coppetta. Guarnire con scorza di limone.",
      history: "Il nome significa \"risveglia cadaveri\", inteso come rimedio per i postumi della sbornia. Un ingrediente chiave è l'assenzio (la \"fata verde\"), liquore a base di artemisia nato in Svizzera nel 1700 (Pierre Ordinaire) o forse creato dalla \"nonna Henriod\" come rimedio casalingo."
    },
    {
      name: "Cosmopolitan",
      ingredients: "Vodka (45ml), Cointreau (30ml), Succo di Lime fresco (15ml), Succo di Mirtillo rosso americano (50ml), Scorza d'arancia.",
      preparation: "Raffreddare la coppetta. Nello shaker con ghiaccio unire Vodka, Cointreau, succo di mirtillo e lime. Shakerare energicamente. Filtrare nel bicchiere (senza ghiaccio). Prendere una scorza d'arancia e spremerne gli oli essenziali sopra il drink per profumarlo.",
      history: "Le origini sono vaghe. Una versione \"Cosmopolitan\" appare nel 1927 (Harry MacElhone), ma la versione moderna simile all'attuale risale al 1934 o agli anni '80. Una nota regola non scritta dice di mettere \"tanto Cranberry quanto basta a far dire 'Uhh che bello, è rosa!'\"."
    },
    {
      name: "Daiquiri",
      ingredients: "Rum Bianco (es. Havana 3), Succo di Lime fresco, Zucchero bianco semolato (o sciroppo).",
      preparation: "Versione Classica: Nel cobbler sciogliere 2 cucchiaini di zucchero in 25ml di lime fresco. Aggiungere 45ml di Rum e ghiaccio. Shakerare e filtrare in coppetta. Hemingway Special: Shakerare 45ml Rum, 25ml Pompelmo rosa, 10ml Lime, 10ml Maraschino e 10ml sciroppo. Filtrare e guarnire con scorza di pompelmo.",
      history: "Cuba, inizio '900. Due ingegneri minerari (Pagliuchi e Cox) vollero brindare ma avevano solo Rum, Lime e Zucchero. Unirono il tutto e, scartando il nome \"Rum Sour\", lo battezzarono come la spiaggia vicina: Daiquiri. Un'altra leggenda cita i marines della nave Maine affondata. Famosa la variante di Hemingway (\"Papa Doble\"): doppia dose di rum, niente zucchero, aggiunta di pompelmo e maraschino."
    },
    {
      name: "Martini Dry",
      ingredients: "Gin (60ml), Vermouth Dry (q.b.), Oliva o Scorza di limone.",
      preparation: "Raffreddare il mixing glass. Versare Gin e Vermouth sul ghiaccio e mescolare (stir) delicatamente per raffreddare e diluire. Filtrare nella coppetta Martini ghiacciata. Decorare con oliva o scorza di limone. Nota: La variante Vesper (James Bond) richiede Gin, Vodka e Lillet Blanc, ed è agitata (shaken), non mescolata.",
      history: "Forse nato al Knickerbocker Hotel di NY da un barman di nome Martinez (o servito a Rockefeller). In Italia è meno popolare che all'estero. È un drink secchissimo e ad alto tenore alcolico. Le prime versioni (fine 1800) erano molto diverse, con Orange Bitter e parti uguali di Gin e Vermouth."
    },
    {
      name: "French 75",
      ingredients: "Gin (30ml), Succo di limone (20ml), Zucchero liquido (10ml), Champagne o Spumante (a colmare).",
      preparation: "Shakerare Gin, limone e zucchero con ghiaccio. Filtrare in una flûte (o coppetta) e colmare delicatamente con lo spumante. Guarnire con scorza di limone.",
      history: "Anni '20, Harry's New York Bar di Parigi. Il nome è un omaggio al cannone francese da 75mm utilizzato nella Prima Guerra Mondiale, per via della \"botta\" che il drink dava."
    },
    {
      name: "Hugo",
      ingredients: "Prosecco, Sciroppo ai fiori di Sambuco, Soda o acqua frizzante, Menta fresca, Lime.",
      preparation: "Tecnica \"Build\" (direttamente nel bicchiere). In un calice con ghiaccio versare il Prosecco, 30ml di sciroppo di sambuco e uno splash di soda. Aggiungere foglie di menta, mescolare delicatamente e decorare con un ciuffo di menta e una fetta di lime.",
      history: "Origini alpine (Trentino Alto Adige), creato da Roland Gruber intorno al 2005. Voleva un'alternativa più fresca e dolce al classico Spritz veneziano. Inizialmente usava sciroppo di melissa, poi sostituito dal più reperibile sambuco."
    },
    {
      name: "Long Island Iced Tea",
      ingredients: "Vodka, Rum, Gin, Tequila, Cointreau, Succo di Limone, Zucchero di Canna Liquido, Coca Cola.",
      preparation: "Utilizzare un bicchiere alto (Highball) e raffreddarlo con ghiaccio. In uno shaker inserire: 15ml di Vodka, 15ml di Rum, 15ml di Gin, 15ml di Tequila, 15ml di Cointreau, 25ml di succo di limone e 10ml di sciroppo di zucchero. Shakerare e filtrare nel bicchiere con ghiaccio nuovo. Aggiungere un top (pochissima) Coca Cola per dare il colore del tè e guarnire con limone.",
      history: "Si narra sia nato durante il proibizionismo (anni '20/'30) per mascherare l'alcol come tè freddo, mescolando tutto ciò che si aveva a disposizione (limone, zucchero, cola) per ingannare i controlli della polizia. La ricetta è stata codificata ufficialmente negli anni '60 da Robert \"Rosebud\" Butt, diventando poi un classico mondiale."
    },
    {
      name: "Manhattan",
      ingredients: "Rye Whiskey (o Bourbon), Vermouth Rosso, Angostura, Amarene sciroppate, Scorza d'arancia.",
      preparation: "In un mixing glass versare 50 ml di Rye Whiskey, 25 ml di vermouth rosso e 2-4 gocce di Angostura. Mescolare (stir) con ghiaccio e filtrare nella coppetta già fredda. Guarnire con un'amarena sciroppata e spruzzare gli oli essenziali di una scorza d'arancia.",
      history: "Nasce in America. Si dice sia stato creato durante un party elettorale per Samuel J. Tilden, governatore di NY in corsa per la Casa Bianca. Al party era presente anche Jennie Jerome, madre di Winston Churchill, a cui talvolta viene attribuita la paternità del drink, anche se le date storiche sono dibattute."
    },
    {
      name: "Margarita",
      ingredients: "Tequila, Lime, Cointreau (o Triple Sec), Sale.",
      preparation: "Bagnare il bordo del bicchiere con lime e passarlo nel sale (crusta). Nello shaker con ghiaccio versare 45ml di Tequila, 15ml di succo di Lime fresco e 15ml di Cointreau. Shakerare e filtrare nel bicchiere bordato di sale.",
      history: "Uno dei cocktail after-dinner più amati. La storia sfuma nella leggenda, collocandosi tra gli anni '30 e '40 in Messico o al confine USA. Richiama il modo tradizionale di bere tequila (sale e limone), ma in una forma più raffinata e miscelata."
    },
    {
      name: "Mojito",
      ingredients: "Rum Cubano, Menta, Zucchero di Canna Bianco, Acqua di Seltz (o frizzante), Lime, Angostura (opzionale).",
      preparation: "In un bicchiere alto (Tumbler) mettere 25ml di succo di lime e 4-5g di zucchero di canna bianco. Mescolare bene per sciogliere lo zucchero. Aggiungere la menta (senza pestarla troppo) e uno splash di soda. Aggiungere 45ml di Rum e riempire il bicchiere di ghiaccio (meglio se tritato grossolanamente). Mescolare dal basso verso l'alto. Colmare con ghiaccio e soda. Decorare con ciuffo di menta e gocce di Angostura.",
      history: "Origini cubane (La Bodeguita del Medio, L'Avana), reso celebre da Hemingway negli anni '50. Deriva probabilmente dal \"Draque\", bevanda del pirata Francis Drake (1500) a base di aguardiente, lime e menta. Il nome unisce \"mojo\" (salsa/incantesimo) e \"mojadito\" (umido)."
    },
    {
      name: "Moscow Mule",
      ingredients: "Vodka, Ginger Beer, Angostura, Lime, Zenzero, Menta.",
      preparation: "Nella tazza di rame (o bicchiere alto) colma di ghiaccio versare 45ml di Vodka e il succo di mezzo lime. Colmare con Ginger Beer e aggiungere qualche goccia di Angostura. Guarnire con menta fresca e fettina di lime.",
      history: "Nato negli anni '40 in America dall'incontro di due imprenditori in difficoltà: uno produceva Vodka (Smirnoff, poco amata all'epoca), l'altro Ginger Beer. La moglie di uno dei due produceva tazze di rame. Unendo i tre elementi invenduti crearono un successo mondiale. Il nome deriva dalla Vodka (Russia/Mosca) e dal \"calcio\" (mule) che l'alcol dava."
    },
    {
      name: "Negroni",
      ingredients: "Gin, Vermouth Rosso, Bitter Campari, Arancia.",
      preparation: "Costruito direttamente nel bicchiere (Build) con ghiaccio. Versare in parti uguali: 30ml Gin, 30ml Bitter Campari, 30ml Vermouth Rosso. Mescolare delicatamente e guarnire con fetta d'arancia.",
      history: "Firenze, 1919, Bar Casoni. Il conte Camillo Negroni chiese al barman Fosco Scarselli di \"rinforzare\" il suo solito Americano, sostituendo la soda con il Gin, per ricordare i suoi viaggi a Londra. Nacque così uno dei cocktail italiani più famosi al mondo."
    },
    {
      name: "Negroni Sbagliato",
      ingredients: "Spumante Brut (o Prosecco), Vermouth Rosso, Bitter Campari, Arancia.",
      preparation: "Tecnica Build nel bicchiere con ghiaccio. 30ml Bitter Campari, 30ml Vermouth Rosso e completare con Spumante. Mescolare delicatamente (per non perdere le bollicine) e decorare con arancia.",
      history: "Milano, Bar Basso, anni '70. Il barman Mirko Stocchetto, per errore o per fretta, prese la bottiglia di Spumante invece di quella del Gin mentre preparava un Negroni. Il risultato piacque subito e divenne un classico."
    },
    {
      name: "Old Fashioned",
      ingredients: "Bourbon (o Rye Whiskey), Angostura, Zolletta di zucchero (o sciroppo), Acqua (splash), Scorza d'arancia.",
      preparation: "Mettere la zolletta nel bicchiere, imbibirla con 2-3 gocce di Angostura e un goccio d'acqua (o soda). Pestare fino a scioglierla. Aggiungere ghiaccio e 45ml di Bourbon. Mescolare a lungo per diluire e raffreddare. Guarnire con scorza d'arancia spremuta sopra.",
      history: "Definito come il \"Whiskey Cocktail\" originale già nel 1862 da Jerry Thomas. Rappresenta la definizione arcaica di cocktail: spiriti, zucchero, acqua e bitters. È costantemente uno dei drink più venduti al mondo."
    },
    {
      name: "Piña Colada",
      ingredients: "Rum Bianco, Succo d'Ananas, Latte di Cocco (o crema di cocco), Ghiaccio.",
      preparation: "Nel frullatore (blender) mettere: 45ml Rum Bianco, 120ml Succo d'Ananas, 10-20ml Latte di cocco e ghiaccio tritato. Frullare fino ad ottenere una consistenza cremosa (frozen). Decorare con fetta d'ananas e foglia.",
      history: "Il drink ufficiale di Porto Rico. Significa \"ananas pressato\". Nato nel Caribe, è il re dei cocktail tropicali (Tiki)."
    },
    {
      name: "Ramos Gin Fizz",
      ingredients: "London Dry Gin, Sciroppo di zucchero, Albume, Panna fresca, Succo di Limone, Succo di Lime, Acqua di Fiori d'Arancio, Soda.",
      preparation: "Shakerare (Dry Shake senza ghiaccio) 45ml Gin, 25ml sciroppo, 30ml panna, 15ml limone, 10ml lime, albume e 3 gocce acqua fiori d'arancio. Aggiungere ghiaccio e shakerare energicamente per molto tempo (almeno 2-3 minuti). Filtrare in un bicchiere alto (senza ghiaccio) e completare lentamente con soda per far alzare la schiuma oltre il bordo.",
      history: "New Orleans, 1888, Henry Charles Ramos. Famoso per la sua lunghissima shakerata necessaria per montare panna e albume. Nel suo locale c'erano gli \"shaker boys\", ragazzi assunti solo per shakerare i drink a turno per 10-15 minuti."
    },
    {
      name: "Sex on the Beach",
      ingredients: "Vodka, Liquore alla Pesca (Peach Schnapps), Succo d'Arancia, Succo di Cranberry (Mirtillo rosso).",
      preparation: "Nello shaker con ghiaccio: 40ml Vodka, 20ml Liquore alla pesca, 40ml Succo d'arancia, 40ml Succo di Cranberry. Shakerare e filtrare in un bicchiere alto (Highball) con ghiaccio fresco.",
      history: "Florida, 1987. Creato per promuovere il liquore alla pesca durante lo Spring Break. Il nome fu scelto combinando i due motivi principali per cui i turisti andavano in Florida: \"Sex\" e \"Beach\". Inizialmente chiamato \"Peach on the Beach\"."
    },
    {
      name: "Spritz",
      ingredients: "Aperol (o Campari/Select), Prosecco, Soda (o acqua frizzante), Arancia.",
      preparation: "In un calice colmo di ghiaccio versare: 3 parti di Prosecco (70ml), 2 parti di Aperol (50ml), 1 parte di Soda (splash). Mescolare delicatamente e guarnire con fetta d'arancia.",
      history: "Nasce nel Triveneto durante la dominazione austriaca. I soldati asburgici trovavano i vini veneti troppo forti e li allungavano (spritzen = spruzzare) con acqua gassata. Negli anni '20/'30 si aggiunse il bitter (Aperol, Select) creando la versione attuale."
    },
    {
      name: "Vesper",
      ingredients: "Gin, Vodka, Lillet Blanc (o Cocchi Americano), Scorza di limone.",
      preparation: "Nello shaker con ghiaccio: 45ml Gin, 15ml Vodka, 10ml Lillet Blanc. Shakerare (non mescolare!) energicamente e filtrare in coppetta. Guarnire con una lunga scorza di limone.",
      history: "Inventato da Ian Fleming nel romanzo di 007 \"Casino Royale\" (1953). James Bond lo ordina e lo dedica a Vesper Lynd, la prima Bond Girl di cui si innamora. La frase celebre è \"Shaken, not stirred\"."
    },
    {
      name: "Vie en Rose",
      ingredients: "Assenzio, Albume, Sciroppo di zucchero, Acqua di rose, Succo di limone.",
      preparation: "Nello shaker: 35ml Assenzio, 15ml sciroppo (aromatizzato con 2 gocce di acqua di rose), 25ml limone e albume. Dry shake (senza ghiaccio), poi shakerare con ghiaccio. Filtrare in coppetta. Profumare con oli essenziali di arancia.",
      history: "Un omaggio all'eleganza francese e all'uso dell'assenzio, unito alla delicatezza della rosa."
    },
    {
      name: "Whiskey Sour",
      ingredients: "Bourbon Whiskey, Succo di Limone, Sciroppo di zucchero, Albume (opzionale), Angostura, Scorza d'arancia.",
      preparation: "Shakerare (Dry Shake se si usa albume) 45ml Bourbon, 25ml limone fresco, 15ml sciroppo, albume e 2 gocce di Angostura. Aggiungere ghiaccio e shakerare di nuovo. Filtrare in bicchiere basso (con o senza ghiaccio). Guarnire con scorza d'arancia o ciliegina.",
      history: "Uno dei pilastri della miscelazione (categoria Sour: base alcolica + parte citrica + parte dolce). Perfetto sia come aperitivo che come dopocena."
    },
    {
      name: "White Russian",
      ingredients: "Vodka, Liquore al Caffè (Kahlúa), Panna fresca (o latte).",
      preparation: "Nel bicchiere basso con ghiaccio versare 50ml Vodka e 20ml Liquore al caffè. Mescolare. A parte, shakerare leggermente la panna per addensarla (senza montarla a neve) e versarla delicatamente sopra il drink (float) creando due strati distinti.",
      history: "Variante del Black Russian nata a Bruxelles a fine anni '40 per l'ambasciatrice USA Pearl Mesta. Reso immortale dal film \"Il Grande Lebowski\" (1998), dove è il drink preferito del Drugo (The Dude)."
    },
    {
      name: "Zombie",
      ingredients: "Rum Cubano, Rum Giamaicano, Cognac (o Rum Overproof), Assenzio, Succo d'Ananas, Succo d'Arancia, Sciroppo Passion Fruit, Sciroppo Cannella, Angostura, Lime, Granatina.",
      preparation: "Nello shaker con ghiaccio: 15ml Rum chiaro, 15ml Rum scuro, 15ml Cognac/Overproof, 25ml Arancia, 25ml Passion Fruit, 15ml Cannella, 25ml Ananas, 15ml Lime, gocce di Angostura e Assenzio. Shakerare (o usare tecnica \"Throwing\"). Versare in bicchiere alto o Tiki Mug colmo di ghiaccio. Guarnire con menta, frutta e zolletta di zucchero imbevuta di assenzio e fiammeggiata.",
      history: "Il re dei Tiki cocktail, creato da Donn Beach (Don the Beachcomber) negli anni '30. Si chiama così perché era talmente forte (pieno di rum diversi) che rendeva il cliente uno \"zombie\". Spesso nei bar ne venivano serviti massimo due a persona."
    }
  ];

  // Filtra i cocktail in base alla ricerca
  const filteredCocktails = cocktailsData.filter(cocktail =>
    cocktail.name.toLowerCase().includes(searchTerm.toLowerCase())
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
              <li><Link className="icon solid fa-user" to="/about"><span>Chi Sono</span></Link></li>
              
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
            
            {/* CONTENT - Lista Cocktail */}
            <div id="content" className="col-8 col-12-medium">
               
               {/* Intro */}
               <article className="box post">
                  <header><h2>I Grandi Classici</h2></header>
                  <p>Un viaggio nella storia della miscelazione, dalle origini ai giorni nostri.</p>
                  
                  {/* BARRA DI RICERCA */}
                  <input
                    type="text"
                    placeholder="Cerca un cocktail (es. Negroni, Spritz)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '15px', 
                      borderRadius: '5px', 
                      border: '1px solid #ccc',
                      backgroundColor: '#f9f9f9',
                      fontSize: '1.1em',
                      marginTop: '20px'
                    }}
                  />
               </article>

               {/* LISTA FILTRATA DEI COCKTAIL */}
               {filteredCocktails.length > 0 ? (
                 filteredCocktails.map((cocktail, index) => (
                   <React.Fragment key={index}>
                     <article className="box post">
                        <header><h2>{cocktail.name}</h2></header>
                        
                        <h3>Ingredienti</h3>
                        <p>{cocktail.ingredients}</p>

                        <h3>Preparazione</h3>
                        <p>{cocktail.preparation}</p>

                        <h3>Storia</h3>
                        <p>{cocktail.history}</p>
                     </article>
                     {/* Aggiunge la linea orizzontale se non è l'ultimo elemento */}
                     {index < filteredCocktails.length - 1 && <hr />}
                   </React.Fragment>
                 ))
               ) : (
                 <article className="box post">
                   <p>Nessun cocktail trovato con questo nome. Prova a cercare qualcos'altro!</p>
                 </article>
               )}

            </div>

            {/* SIDEBAR */}
            <div id="sidebar" className="col-4 col-12-medium">
               <section>
                <ul className="divided">
                  <li>
                    <article className="box highlight">
                      <header><h3><Link to="/cocktail">Torna al futuro</Link></h3></header>
                      <p>Ti mancano i miei esperimenti tech? Torna alla pagina principale dei cocktail.</p>
                      <Link to="/cocktail" className="button icon solid fa-microchip">I miei Cocktail Tech</Link>
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

export default Cocktail_classici;