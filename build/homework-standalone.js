// build/homework-standalone.js
// I programmi scaricabili degli homework di Statistics, generati a ogni build
// dagli stessi sorgenti delle pagine del sito: se cambia il codice, cambia
// anche il download, e i due non possono raccontare cose diverse.
//
// Per ogni homework il risultato e' una cartella con index.html, style.css,
// la libreria (homework1.js, homework2.js, ...), app.js, package.json e
// README.txt, pubblicata cosi' com'e' (la versione online) e in uno zip (il
// download). I sorgenti sono moduli ES, che un browser non carica da
// file://: qui diventano script classici, che si aprono con un doppio clic.
// La conversione e' volutamente minima e conserva il codice riga per riga,
// commenti compresi, perche' il file scaricato deve restare leggibile:
//   import * as x from './m.js'     ->  const x = <modulo>;
//   import { a, b as c } from ...   ->  const { a, b: c } = <modulo>;
//   export const / function(*) ...  ->  dichiarazione, restituita alla fine
// Qualunque altra forma di import o export ferma la build invece di produrre
// un programma rotto.
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const STATISTICS = fileURLToPath(new URL('../src/pages/statistics/', import.meta.url));
const OUTPUT = 'downloads/statistics';
const STATIC_FILES = ['index.html', 'style.css', 'README.txt'];

/**
 * Gli homework con un programma scaricabile. `number` da' il nome della
 * cartella (homework1, homework2a, ...) e dell'indirizzo della pagina
 * (homework-1, homework-2a, ...), `name` il titolo; `library` e' il file dei
 * calcoli, che diventa lo script globale `global`; `inner` sono i moduli che
 * la libreria importa e che finiscono dentro di lei (i parametri della
 * consegna dell'Exercise 1, la lista di parole di BIP-39 dell'Exercise 2, il
 * corpus dell'Homework #2).
 */
export const HOMEWORKS = [
  {
    number: '1',
    name: 'Homework #1 - Exercise 1',
    source: 'hw1',
    library: 'homework1.js',
    global: 'Homework1',
    inner: ['task.js'],
    contents: 'Computations: toy curve, point addition, scalar multiplication, statistics,\n * animation and command line (node homework1.js [k] [p]).',
    description: 'Homework #1 - Exercise 1 - Statistics: from a private key to a public key with elliptic-curve scalar multiplication, as in Ethereum.',
  },
  {
    number: '2',
    name: 'Homework #1 - Exercise 2',
    source: 'hw2',
    library: 'homework2.js',
    global: 'Homework2',
    inner: ['wordlist.js'],
    contents: 'The wallet pipeline (BIP-39, BIP-32, BIP-44, secp256k1, Keccak-256, EIP-55),\n * the official test vectors, statistics and command line (node homework2.js [options]).',
    description: 'Homework #1 - Exercise 2 - Statistics: from a wallet seed to an Ethereum address, with BIP-39, BIP-32, BIP-44, secp256k1, Keccak-256 and EIP-55.',
  },
  {
    number: '2a',
    name: 'Homework #2',
    source: 'hw2a',
    library: 'homework2a.js',
    global: 'Homework2a',
    inner: ['corpus.js'],
    contents: 'Computations: the toy EC-ElGamal scheme on secp256k1, the Caesar cipher, the corpus and its language models,\n * the statistical attack, the attacks on the private key, statistics and command line (node homework2a.js [options]).',
    description: 'Homework #2 - Statistics: a toy elliptic-curve scheme and the Caesar cipher, with statistical cryptanalysis and attacks.',
  },
];

const folderOf = (hw) => `homework${hw.number}`;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.zip': 'application/zip',
};

const read = (hw, file) => readFileSync(path.join(STATISTICS, hw.source, file), 'utf8');

/** Il nome con cui ogni modulo e' visibile agli altri nel programma generato. */
function modules(hw) {
  const names = { [hw.library]: hw.global, 'view.js': 'view$', 'texts.js': 'texts$' };
  for (const file of hw.inner) names[file] = `${path.basename(file, '.js')}$`;
  return names;
}

function moduleName(hw, specifier, file) {
  const name = modules(hw)[path.basename(specifier)];
  if (!name) throw new Error(`homework-standalone: ${file} importa ${specifier}, che il programma scaricabile non contiene`);
  return name;
}

/** One ES module as a function body: its imports as local constants, its exports as a list. */
function convert(hw, file) {
  const exported = [];
  const lines = read(hw, file).split('\n').map((line) => {
    let m = line.match(/^import \* as (\w+) from '([^']+)';$/);
    if (m) return `const ${m[1]} = ${moduleName(hw, m[2], file)};`;
    m = line.match(/^import \{ ([^}]+) \} from '([^']+)';$/);
    if (m) {
      const names = m[1].split(',').map((n) => n.trim().replace(/\s+as\s+/, ': '));
      return `const { ${names.join(', ')} } = ${moduleName(hw, m[2], file)};`;
    }
    if (/^import\b/.test(line)) throw new Error(`homework-standalone: ${file}: import non supportato: ${line}`);
    m = line.match(/^export (const|let|function\*?|class) (\w+)/);
    if (m) {
      exported.push(m[2]);
      return line.slice('export '.length);
    }
    if (/^export\b/.test(line)) throw new Error(`homework-standalone: ${file}: export non supportato: ${line}`);
    return line;
  });
  return { body: lines.join('\n').trimEnd(), exported };
}

/** A module as a variable holding what it exports: var view$ = (function () { ... })(); */
function moduleScript(hw, file) {
  const { body, exported } = convert(hw, file);
  return [`var ${modules(hw)[file]} = (function () {`, "'use strict';", '', body, '', `return { ${exported.join(', ')} };`, '})();'].join('\n');
}

const banner = (hw, what) => `/*
 * ${hw.name} - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * ${what}
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-${hw.number}
 */
`;

// package.json accanto ai file: dice a Node che la libreria e' CommonJS anche
// se la cartella finisce dentro un progetto con "type": "module", cosi'
// require('./homeworkN.js') restituisce la libreria e npm start la esegue.
const packageJson = (hw) => ({
  name: `${folderOf(hw)}-statistics`,
  version: '1.0.0',
  private: true,
  description: hw.description,
  author: 'Nicholas Arcari',
  type: 'commonjs',
  main: hw.library,
  scripts: { start: `node ${hw.library}` },
  engines: { node: '>=14' },
});

/** The library: the computations, usable from index.html and from Node, with its inner modules inside. */
function libraryScript(hw) {
  const { body, exported } = convert(hw, hw.library);
  return [
    banner(hw, hw.contents),
    `var ${hw.global} = (function () {`,
    "'use strict';",
    '',
    ...hw.inner.map((file) => `${moduleScript(hw, file)}\n`),
    body,
    '',
    `return { ${exported.join(', ')} };`,
    '})();',
    '',
    read(hw, 'standalone/cli.js').replace(/^\/\* global [^*]*\*\/\n/, ''),
  ].join('\n');
}

/** app.js: view.js, texts.js and the interface, in one classic script. */
function appScript(hw) {
  const parts = ['view.js', 'texts.js'].map((file) => moduleScript(hw, file));
  const app = convert(hw, 'standalone/app.js');
  return [
    banner(hw, `Interface and texts (Italian and English). Needs ${hw.library}, loaded first.`),
    '(function () {',
    "'use strict';",
    '',
    ...parts.map((m) => `${m}\n`),
    '(function () {',
    "'use strict';",
    '',
    app.body,
    '})();',
    '})();',
    '',
  ].join('\n');
}

/** Every file of the program of one homework: name -> content. */
export function standaloneFiles(hw) {
  const files = {};
  for (const name of STATIC_FILES) files[name] = read(hw, `standalone/${name}`);
  files[hw.library] = libraryScript(hw);
  files['app.js'] = appScript(hw);
  files['package.json'] = `${JSON.stringify(packageJson(hw), null, 2)}\n`;
  return files;
}

// --- ZIP ---------------------------------------------------------------------

let crcTable = null;
function crc32(data) {
  if (typeof zlib.crc32 === 'function') return zlib.crc32(data);
  if (!crcTable) {
    crcTable = Array.from({ length: 256 }, (_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c >>> 0;
    });
  }
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Date of the newest source file, so that the same sources give the same zip. */
function sourceDate(hw) {
  const sources = [hw.library, ...hw.inner, 'view.js', 'texts.js', 'standalone/app.js', 'standalone/cli.js', ...STATIC_FILES.map((f) => `standalone/${f}`)];
  return new Date(Math.max(...sources.map((f) => statSync(path.join(STATISTICS, hw.source, f)).mtimeMs)));
}

/** A zip archive (deflate) with every file inside the folder of the homework (homework1/, ...). */
export function zipFiles(hw, files, date = sourceDate(hw)) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const local = [];
  const central = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.from(content, 'utf8');
    const packed = zlib.deflateRawSync(data, { level: 9 });
    const fileName = Buffer.from(`${folderOf(hw)}/${name}`, 'utf8');
    const crc = crc32(data);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // local file header
    header.writeUInt16LE(20, 4); // version needed: 2.0
    header.writeUInt16LE(0x0800, 6); // file names in UTF-8
    header.writeUInt16LE(8, 8); // deflate
    header.writeUInt16LE(time, 10);
    header.writeUInt16LE(day, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(packed.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(fileName.length, 26);
    header.writeUInt16LE(0, 28);
    local.push(header, fileName, packed);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0); // central directory header
    entry.writeUInt16LE((3 << 8) | 20, 4); // made by: Unix, 2.0
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt16LE(time, 12);
    entry.writeUInt16LE(day, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(packed.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(fileName.length, 28);
    entry.writeUInt16LE(0, 30); // extra field
    entry.writeUInt16LE(0, 32); // comment
    entry.writeUInt16LE(0, 34); // disk
    entry.writeUInt16LE(0, 36); // internal attributes
    entry.writeUInt32LE((0o100644 << 16) >>> 0, 38); // regular file, rw-r--r--
    entry.writeUInt32LE(offset, 42);
    central.push(entry, fileName);

    offset += header.length + fileName.length + packed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // end of central directory
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...local, directory, end]);
}

// --- Plugin di Vite -------------------------------------------------------

export default function homeworkStandalone() {
  return {
    name: 'homework-standalone',

    // In build: dist/downloads/statistics/homeworkN/... e homeworkN.zip
    generateBundle() {
      for (const hw of HOMEWORKS) {
        const files = standaloneFiles(hw);
        for (const [name, content] of Object.entries(files)) {
          this.emitFile({ type: 'asset', fileName: `${OUTPUT}/${folderOf(hw)}/${name}`, source: content });
        }
        this.emitFile({ type: 'asset', fileName: `${OUTPUT}/${folderOf(hw)}.zip`, source: zipFiles(hw, files) });
      }
    },

    // In sviluppo: gli stessi file, rigenerati a ogni richiesta dai sorgenti
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const prefix = `${server.config.base}${OUTPUT}/`;
        const url = (req.url || '').split('?')[0];
        if (!url.startsWith(prefix)) return next();
        const rest = url.slice(prefix.length);
        const hw = HOMEWORKS.find((h) => rest === `${folderOf(h)}.zip` || rest.startsWith(`${folderOf(h)}/`));
        if (!hw) return next();
        try {
          const files = standaloneFiles(hw);
          let name = null;
          let body = null;
          if (rest === `${folderOf(hw)}.zip`) {
            name = rest;
            body = zipFiles(hw, files);
          } else {
            name = rest.slice(folderOf(hw).length + 1) || 'index.html';
            if (!Object.hasOwn(files, name)) return next();
            body = files[name];
          }
          res.setHeader('Content-Type', CONTENT_TYPES[path.extname(name)] || 'application/octet-stream');
          res.end(body);
        } catch (error) {
          next(error);
        }
        return undefined;
      });
    },
  };
}
