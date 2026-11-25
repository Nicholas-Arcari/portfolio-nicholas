// Traduzioni della sezione "stampe3d", in italiano e in inglese.
// Come funzionano le sezioni: registry.js.
import { register } from './registry.js';

register('stampe3d', {
  it: {
    terminal: [
      '> ./load_module.sh --3d-print',
      '> Riscaldamento piatto a 60\u00b0C...',
      '> Parsing G-code...',
      '> Status: Estrusione Layer 1...',
      '> Pronto.',
    ],
    introTitle: 'Dal Digitale al Fisico',
    introDesc: 'La stampa 3D unisce la mia passione per il software con la soddisfazione di creare oggetti tangibili. Qui raccolgo i miei progetti, divisi tra quelli gi\u00e0 realizzati e le idee in cantiere.',
    collabNote: 'Sono disponibile per collaborazioni e servizi di stampa 3D su richiesta. Se hai un progetto in mente o un file da stampare, contattami per discuterne insieme!',
    collabLabel: 'Collaborazioni:',
    executedTitle: 'Progetti Eseguiti',
    futureTitle: 'Progetti da Eseguire',
    show: 'Mostra Progetti',
    hide: 'Nascondi Progetti',
    searchPlaceholder: 'Cerca per nome o argomento...',
    material: 'Materiale:',
    link: 'Link:',
    noResults: 'Nessun progetto trovato.',
    executed: [
      {
        title: "Cookie Cutter Set",
        description: "Set di formine per biscotti personalizzate, progettate in CAD e stampate per uso alimentare.",
        material: "PLA Nero Opaco (Food Safe)",
        image: "",
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
        image: "",
        topic: "Action Figure",
        link: "https://www.thingiverse.com/thing:927511"
      },
      {
        title: "Action Figure: Mimikyu",
        description: "Modello 'life-size' del Pokemon fantasma. Finitura opaca per simulare l'effetto tessuto del costume.",
        material: "PLA Bianco + Primer e Acrilici",
        image: "",
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
        description: "Vaso per erbe aromatiche con serbatoio d'acqua integrato e sistema di capillarit\u00e0 per ridurre la frequenza di innaffiatura.",
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
    ],
    future: [
      {
        title: "Robot Dog Open Source",
        description: "Progetto avanzato di robotica: quadrupede stampato in 3D con 12 gradi di libert\u00e0, gestito da Arduino e servi ad alta coppia.",
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
        description: "Organizzatore a gravit\u00e0 per bustine di t\u00e8. Design compatto per ottimizzare lo spazio in dispensa.",
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
        description: "CHOOMS! Che siate in giro per una notte in citt\u00e0 a Night City, o che stiate prendendo d'assalto la torre Arasaka, \u00e8 meglio avere le migliori ottiche che si possano comprare, e niente batte Kiroshi.",
        material: "PLA+ e Resina (per le lenti)",
        image: "images/stampa/stampa14.jpg",
        topic: "Cosplay",
        link: "https://makerworld.com/it/models/1595160-cyberpunk-2077-kiroshi-optics#profileId-1680368"
      },
    ],
  },
  en: {
    terminal: [
      '> ./load_module.sh --3d-print',
      '> Heating bed to 60\u00b0C...',
      '> Parsing G-code...',
      '> Status: Extruding Layer 1...',
      '> Ready.',
    ],
    introTitle: 'From Digital to Physical',
    introDesc: '3D printing combines my passion for software with the satisfaction of creating tangible objects. Here I collect my projects, divided between completed ones and ideas in the pipeline.',
    collabNote: 'I\'m available for collaborations and 3D printing services on request. If you have a project in mind or a file to print, contact me to discuss it!',
    collabLabel: 'Collaborations:',
    executedTitle: 'Completed Projects',
    futureTitle: 'Upcoming Projects',
    show: 'Show Projects',
    hide: 'Hide Projects',
    searchPlaceholder: 'Search by name or topic...',
    material: 'Material:',
    link: 'Link:',
    noResults: 'No project found.',
    executed: [
      {
        title: "Cookie Cutter Set",
        description: "Set of custom cookie cutters, designed in CAD and printed for food-safe use.",
        material: "Matte Black PLA (Food Safe)",
        image: "",
        topic: "Kitchen",
        link: "https://www.thingiverse.com"
      },
      {
        title: "Mantis Blades (Cyberpunk 2077)",
        description: "Full-scale 1:1 replica of the iconic retractable blades. Multi-part assembly with metallic finish and weathering.",
        material: "White PLA + Primer and Acrylics",
        image: "images/stampa/stampa16.jpg",
        topic: "Cosplay",
        link: "https://makerworld.com/it/models/655884-cyberpunk-mantis-blades-model#profileId-582890"
      },
      {
        title: "Action Figure: Denji (Chainsaw Man)",
        description: "Highly detailed statuette of the Chainsaw Man protagonist.",
        material: "White PLA + Primer and Acrylics",
        image: "images/stampa/stampa3.jpg",
        topic: "Action Figure",
        link: "https://www.thingiverse.com/thing:6256385"
      },
      {
        title: "Action Figure: Kakashi Hatake",
        description: "Dynamic diorama of the Copy Ninja. Special attention paid to painting fabric textures and the Chidori effect.",
        material: "White PLA + Primer and Acrylics",
        image: "",
        topic: "Action Figure",
        link: "https://www.thingiverse.com/thing:927511"
      },
      {
        title: "Action Figure: Mimikyu",
        description: "Life-size model of the ghost Pok\u00e9mon. Matte finish to simulate the fabric look of the costume.",
        material: "White PLA + Primer and Acrylics",
        image: "",
        topic: "Action Figure",
        link: "https://www.thingiverse.com/thing:1940448"
      },
      {
        title: "Raspberry Pi Ultimate Case",
        description: "Custom case designed to maximize airflow. Includes mounts for an NVMe SSD and a status OLED display.",
        material: "PLA+ or ASA",
        image: "images/stampa/stampa11.jpg",
        topic: "Tech",
        link: "https://makerworld.com/it/models/179232-raspberry-pi-4b"
      },
      {
        title: "Sponge Bed",
        description: "A fun and functional kitchen accessory: a miniature bed that lets the sponge dry properly.",
        material: "PLA+ or ASA",
        image: "images/stampa/stampa19.jpg",
        topic: "Kitchen",
        link: "https://www.thingiverse.com/thing:2687499"
      },
      {
        title: "Action Figure: Kuromi",
        description: "High-resolution Kuromi character print. Vibrant acrylic colors and gloss sealant for a vinyl toy look.",
        material: "PLA",
        image: "images/stampa/stampa18.jpg",
        topic: "Action Figure",
        link: "https://www.thingiverse.com/thing:6006836"
      },
      {
        title: "Aperol Spritz Neon Sign",
        description: "Custom LED light sign. Layered design to diffuse the signature orange glow of the cocktail.",
        material: "Translucent and Opaque PLA+",
        image: "images/stampa/stampa7.jpg",
        topic: "Home Decor",
        link: "https://www.thingiverse.com/thing:6657606"
      },
      {
        title: "Hestia Knife (DanMachi)",
        description: "Faithful replica of the divine dagger, featuring hieroglyphic rune engravings.",
        material: "PLA",
        image: "images/stampa/stampa5.jpg",
        topic: "Cosplay",
        link: "https://www.thingiverse.com/thing:5185347"
      },
      {
        title: "Self-Watering Planter",
        description: "Herb planter with a built-in water reservoir and capillary system to reduce watering frequency.",
        material: "PLA (Watertight setting)",
        image: "images/stampa/stampa13.jpg",
        topic: "Gardening",
        link: "https://makerworld.com/it/models/112701-self-watering-herb-planter-for-the-kitchen?from=search#profileId-120974"
      },
      {
        title: "Spadone daedrico",
        description: "180 cm Daedric greatsword inspired by the world of Skyrim. Glossy finish and detailed engravings throughout the design.",
        material: "PLA",
        image: "images/stampa/stampa21.jpg",
        topic: "Cosplay",
        link: "https://www.printables.com/model/370085-daedric-greatsword-skyrim-for-small-printing"
      },
    ],
    future: [
      {
        title: "Robot Dog Open Source",
        description: "Advanced robotics project: a 3D-printed quadruped with 12 degrees of freedom, powered by Arduino and high-torque servos.",
        material: "PETG / ABS (for mechanical strength)",
        image: "images/stampa/stampa1.jpg",
        topic: "Robotics",
        link: "https://makerworld.com/it/models/1426836-arduino-robot-dog#profileId-1483116"
      },
      {
        title: "E.M.M.I. (Metroid Dread)",
        description: "Complex articulated model of the hunter robot. Requires precise tolerances for posable joints.",
        material: "PLA / TPU (for flexible joints)",
        image: "images/stampa/stampa17.jpg",
        topic: "Action Figure",
        link: "https://www.thingiverse.com/thing:5254236"
      },
      {
        title: "Trauma Team Helmet",
        description: "Full-face helmet inspired by the tactical medics of Cyberpunk 2077. Designed to be wearable with internal electronics.",
        material: "PLA (internally reinforced)",
        image: "images/stampa/stampa10.jpg",
        topic: "Cosplay",
        link: "https://www.thingiverse.com/thing:4897526"
      },
      {
        title: "Daedric Armor (Skyrim)",
        description: "Full Daedric armor set.",
        material: "PLA",
        image: "images/stampa/stampa2.jpg",
        topic: "Cosplay",
        link: "https://www.thingiverse.com/thing:3581525"
      },
      {
        title: "Tea Dispenser Verticale",
        description: "Gravity-fed tea bag organizer. Compact design to optimize pantry space.",
        material: "PLA",
        image: "images/stampa/stampa20.jpg",
        topic: "Kitchen",
        link: "https://www.thingiverse.com/thing:4763805"
      },
      {
        title: "Iron Man MK6 Suit",
        description: "Full-scale 1:1 armor. Includes servo motor housings for automatic helmet and flap opening.",
        material: "PLA+ (for impact resistance)",
        image: "images/stampa/stampa4.jpg",
        topic: "Cosplay",
        link: "https://www.thingiverse.com/thing:1779274"
      },
      {
        title: "Jack Daniel's Coasters",
        description: "Themed coaster set with embossed design and layer-based color change.",
        material: "PLA / TPU",
        image: "images/stampa/stampa6.jpg",
        topic: "Home Decor",
        link: "https://www.thingiverse.com/thing:2395261"
      },
      {
        title: "T-60b Power Armor (Fallout 4)",
        description: "The ultimate project: a wearable armor standing over 2 meters tall, with an internal support exoskeleton.",
        material: "PLA+ (estimated weight: 25+ kg)",
        image: "images/stampa/stampa9.jpg",
        topic: "Cosplay",
        link: "https://www.thingiverse.com/thing:1133207"
      },
      {
        title: "Iron Man Helmet (Motorized)",
        description: "Standalone helmet with a motorized faceplate controlled by Arduino and voice/touch sensors.",
        material: "Silk PLA (metallic effect)",
        image: "images/stampa/stampa8.jpg",
        topic: "Cosplay",
        link: "https://www.thingiverse.com/thing:4629346"
      },
      {
        title: "Mug Basketball Hoop",
        description: "Office gadget: a clip-on mini basketball hoop that fits any mug for tossing sugar cubes or cereal.",
        material: "PLA",
        image: "images/stampa/stampa15.jpg",
        topic: "Fun",
        link: "https://makerworld.com/it/models/1218000-basket-mug-funny-game#profileId-1234266"
      },
      {
        title: "Cyberpunk Sci-Fi Bonsai",
        description: "A fusion of nature and technology: an artificial bonsai with mecha elements, cables, and integrated LED lighting.",
        material: "PLA Wood (trunk) & PLA Neon",
        image: "images/stampa/stampa12.jpg",
        topic: "Home Decor",
        link: "https://makerworld.com/it/models/1530931-cyberpunk-mecha-sci-fi-bonsai"
      },
      {
        title: "Kiroshi Optics Replica",
        description: "CHOOMS! Whether you're out for a night on the town in Night City or storming Arasaka Tower, you'd better have the best optics eddies can buy - and nothing beats Kiroshi.",
        material: "PLA+ and Resin (for the lenses)",
        image: "images/stampa/stampa14.jpg",
        topic: "Cosplay",
        link: "https://makerworld.com/it/models/1595160-cyberpunk-2077-kiroshi-optics#profileId-1680368"
      },
    ],
  },
});
