// Traduzioni della sezione "about", in italiano e in inglese.
// Come funzionano le sezioni: registry.js.
import { register } from './registry.js';

register('about', {
  it: {
    terminal: [
      '> ./whoami',
      '> Nicholas Arcari',
      '> Status: Accensione fuoco della giovinezza...',
      '> Caricamento Bio...',
    ],
    title: 'About Me',
    bio: [
      'Ciao, sono Nicholas Arcari.',
      'Nel mio modo di vedere il mondo, righe di codice e cibo non sono affatto agli antipodi. A ben pensarci, tra il silicio e la cucina non esiste una differenza cos\u00ec grande: entrambi richiedono struttura, pazienza e una cura quasi maniacale per i dettagli.',
      'C\'\u00e8 una poesia silenziosa, quasi romantica, nel costruire qualcosa partendo da zero. Allestire laboratori di sicurezza informatica, orchestrare macchine virtuali e configurare reti sicure mi regala la stessa soddisfazione viscerale di quando affondo le mani nell\'impasto, sentendo il profumo, la maglia glutinica prendere forma sotto le dita... Sono due forme di architettura diverse, \u00e8 vero, ma condividono la stessa anima.',
      'E poi c\'\u00e8 l\'attesa vigile, il monitoraggio. Potrei passare ore a seguire lo scorrere dei log di un SIEM, cercando l\'anomalia nascosta, con la stessa concentrazione febbrile con cui osservo una lievitazione complessa dietro il vetro del forno. In entrambi i casi si tratta di leggere segnali sottili, interpretare comportamenti, aspettare il momento esatto in cui tutto raggiunge il suo equilibrio perfetto.',
      'PS: se non metti le patate precedentemente lessate dentro la pasta al pesto non penso possiamo diventare amici.',
    ],
    contacts: 'Contatti',
    location: 'Salsomaggiore Terme (PR), Italia',
    location2: 'Roma (RM), Italia',
  },
  en: {
    terminal: [
      '> ./whoami',
      '> Nicholas Arcari',
      '> Status: Igniting the fire of youth...',
      '> Loading Bio...',
    ],
    title: 'About Me',
    bio: [
      'Hi, I\'m Nicholas Arcari.',
      'In my view, lines of code and cooking are not opposites at all. When you think about it, there isn\'t such a big difference between silicon and the kitchen: both require structure, patience and an almost obsessive attention to detail.',
      'There\'s a quiet, almost romantic poetry in building something from scratch. Setting up cybersecurity labs, orchestrating virtual machines and configuring secure networks gives me the same visceral satisfaction as when I plunge my hands into dough, feeling the gluten network take shape under my fingers... They\'re two different forms of architecture, but they share the same soul.',
      'And then there\'s the watchful waiting, the monitoring. I could spend hours following the flow of a SIEM\'s logs, searching for the hidden anomaly, with the same feverish concentration I use to watch a complex proofing through the oven glass. In both cases it\'s about reading subtle signals, interpreting behaviour, waiting for the exact moment when everything reaches its perfect balance.',
      'PS: if you don\'t put previously boiled potatoes in your pesto pasta, I don\'t think we can be friends.',
    ],
    contacts: 'Contacts',
    location: 'Salsomaggiore Terme (PR), Italy',
    location2: 'Rome (RM), Italy',
  },
});
