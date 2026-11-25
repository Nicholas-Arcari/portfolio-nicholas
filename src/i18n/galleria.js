// Traduzioni della sezione "galleria", in italiano e in inglese.
// Come funzionano le sezioni: registry.js.
import { register } from './registry.js';

register('galleria', {
  it: {
    terminal: [
      '> ./load_module.sh --gallery',
      '> Caricamento scatti: Roma...',
      '> Selezione delle foto migliori...',
      '> Status: Work in progress...',
    ],
    introTitle: 'amoR',
    introDesc: 'Qui raccoglierò una selezione delle mie fotografie di Roma.',
    wip: 'Work in progress...',
  },
  en: {
    terminal: [
      '> ./load_module.sh --gallery',
      '> Loading shots: Rome...',
      '> Picking the best photos...',
      '> Status: Work in progress...',
    ],
    introTitle: 'amoR',
    introDesc: 'Here I will collect a selection of my photographs of Rome.',
    wip: 'Work in progress...',
  },
});
