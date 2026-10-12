/* global process, module, require, Homework2 */
// src/pages/statistics/hw2/standalone/cli.js
// La coda del file homework2.js scaricabile: la riga di comando
// node homework2.js [opzioni] e l'uso da altri script. La build la aggiunge
// dopo la libreria cosi' com'e', quindi qui non ci sono import ne' export.
//
// Funziona qualunque sia il nome del file, e in entrambi i modi in cui Node
// puo' caricarlo:
//   - CommonJS (il package.json accanto lo dichiara): require('./homework2.js')
//     restituisce la libreria, e la riga di comando parte solo se il file e'
//     quello eseguito (require.main);
//   - modulo ES (per esempio copiato da solo in un progetto con
//     "type": "module"): la libreria e' globalThis.Homework2, e la riga di
//     comando parte solo se il file e' quello eseguito, cosa che qui si
//     ricava dalla traccia dello stack, l'unico modo che non richiede
//     import.meta (che in uno script classico sarebbe un errore di sintassi).

// Command line: node homework2.js [--mnemonic ...] [--passphrase ...] [--index i | --path ...] [--random n] [--no-stats]
(function () {
  if (typeof window !== 'undefined' || typeof process !== 'object' || !process || !process.versions || !process.versions.node) return;
  const run = () => {
    process.exitCode = Homework2.runCli(process.argv.slice(2), console.log);
  };

  if (typeof module === 'object' && module && module.exports) {
    module.exports = Homework2;
    if (typeof require === 'function' && require.main === module) run();
    return;
  }

  globalThis.Homework2 = Homework2;
  // where is this file? the first frame of a fresh stack trace says it
  const frame = (new Error().stack || '').split('\n').find((line) => /^\s+at /.test(line)) || '';
  const location = frame
    .replace(/^\s+at\s+/, '')
    .replace(/^[^(]*\((.*)\)$/, '$1')
    .replace(/:\d+:\d+$/, '');
  const normalize = (path) => {
    let s = String(path);
    if (s.startsWith('file://')) {
      s = decodeURIComponent(s.slice('file://'.length));
      if (/^\/[A-Za-z]:/.test(s)) s = s.slice(1);
    }
    s = s.replace(/\\/g, '/');
    return /^[A-Za-z]:\//.test(s) ? s.toLowerCase() : s;
  };
  const fs = typeof process.getBuiltinModule === 'function' ? process.getBuiltinModule('fs') : null;
  const real = (path) => {
    try {
      return fs ? fs.realpathSync(path) : path;
    } catch {
      return path;
    }
  };
  const entry = process.argv[1] ? normalize(real(process.argv[1])) : '';
  const self = normalize(location);
  if (entry && (entry === self || `${entry}.js` === self)) run();
})();
