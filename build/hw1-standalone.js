// build/hw1-standalone.js
// Il programma scaricabile dell'Homework #1 di Statistics, generato a ogni
// build dagli stessi sorgenti della pagina del sito: se cambia il codice,
// cambia anche il download, e i due non possono raccontare cose diverse.
//
// Il risultato e' una cartella con index.html, style.css, homework1.js,
// app.js e README.txt, pubblicata cosi' com'e' (la versione online) e in uno
// zip (il download). I sorgenti sono moduli ES, che un browser non carica da
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

const SOURCE = fileURLToPath(new URL('../src/pages/statistics/hw1/', import.meta.url));
const OUTPUT = 'downloads/statistics';
const FOLDER = 'homework1';

// Il nome con cui ogni modulo e' visibile agli altri nel programma generato
const MODULES = { 'homework1.js': 'Homework1', 'view.js': 'view$', 'texts.js': 'texts$' };

const STATIC_FILES = ['index.html', 'style.css', 'README.txt'];

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.zip': 'application/zip',
};

const read = (file) => readFileSync(path.join(SOURCE, file), 'utf8');

function moduleName(specifier, file) {
  const name = MODULES[path.basename(specifier)];
  if (!name) throw new Error(`hw1-standalone: ${file} importa ${specifier}, che il programma scaricabile non contiene`);
  return name;
}

/** One ES module as a function body: its imports as local constants, its exports as a list. */
function convert(file) {
  const exported = [];
  const lines = read(file).split('\n').map((line) => {
    let m = line.match(/^import \* as (\w+) from '([^']+)';$/);
    if (m) return `const ${m[1]} = ${moduleName(m[2], file)};`;
    m = line.match(/^import \{ ([^}]+) \} from '([^']+)';$/);
    if (m) {
      const names = m[1].split(',').map((n) => n.trim().replace(/\s+as\s+/, ': '));
      return `const { ${names.join(', ')} } = ${moduleName(m[2], file)};`;
    }
    if (/^import\b/.test(line)) throw new Error(`hw1-standalone: ${file}: import non supportato: ${line}`);
    m = line.match(/^export (const|let|function\*?|class) (\w+)/);
    if (m) {
      exported.push(m[2]);
      return line.slice('export '.length);
    }
    if (/^export\b/.test(line)) throw new Error(`hw1-standalone: ${file}: export non supportato: ${line}`);
    return line;
  });
  return { body: lines.join('\n').trimEnd(), exported };
}

const banner = (what) => `/*
 * Homework #1 - Statistics - Nicholas Arcari
 * Sapienza University of Rome, MSc in Cybersecurity
 *
 * ${what}
 *
 * Generated from the sources of the online page,
 * https://nicholas-arcari.github.io/portfolio-nicholas/#/statistics/homework-1
 */
`;

// package.json accanto ai file: dice a Node che homework1.js e' CommonJS anche
// se la cartella finisce dentro un progetto con "type": "module", cosi'
// require('./homework1.js') restituisce la libreria e npm start la esegue.
const PACKAGE = {
  name: 'homework1-statistics',
  version: '1.0.0',
  private: true,
  description: 'Homework #1 - Statistics: from a private key to a public key with elliptic-curve scalar multiplication, as in Ethereum.',
  author: 'Nicholas Arcari',
  type: 'commonjs',
  main: 'homework1.js',
  scripts: { start: 'node homework1.js' },
  engines: { node: '>=14' },
};

/** homework1.js: the computations, usable from index.html and from Node. */
function libraryScript() {
  const { body, exported } = convert('homework1.js');
  return [
    banner('Computations: toy curve, point addition, scalar multiplication, statistics,\n * animation and command line (node homework1.js [k] [p]).'),
    'var Homework1 = (function () {',
    "'use strict';",
    '',
    body,
    '',
    `return { ${exported.join(', ')} };`,
    '})();',
    '',
    read('standalone/cli.js').replace(/^\/\* global [^*]*\*\/\n/, ''),
  ].join('\n');
}

/** app.js: view.js, texts.js and the interface, in one classic script. */
function appScript() {
  const modules = ['view.js', 'texts.js'].map((file) => {
    const { body, exported } = convert(file);
    return [`var ${MODULES[file]} = (function () {`, "'use strict';", '', body, '', `return { ${exported.join(', ')} };`, '})();'].join('\n');
  });
  const app = convert('standalone/app.js');
  return [
    banner('Interface and texts (Italian and English). Needs homework1.js, loaded first.'),
    '(function () {',
    "'use strict';",
    '',
    ...modules.map((m) => `${m}\n`),
    '(function () {',
    "'use strict';",
    '',
    app.body,
    '})();',
    '})();',
    '',
  ].join('\n');
}

/** Every file of the program: name -> content. */
export function standaloneFiles() {
  const files = {};
  for (const name of STATIC_FILES) files[name] = read(`standalone/${name}`);
  files['homework1.js'] = libraryScript();
  files['app.js'] = appScript();
  files['package.json'] = `${JSON.stringify(PACKAGE, null, 2)}\n`;
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
function sourceDate() {
  const sources = ['homework1.js', 'view.js', 'texts.js', 'standalone/app.js', 'standalone/cli.js', ...STATIC_FILES.map((f) => `standalone/${f}`)];
  return new Date(Math.max(...sources.map((f) => statSync(path.join(SOURCE, f)).mtimeMs)));
}

/** A zip archive (deflate) with every file inside the folder homework1/. */
export function zipFiles(files, date = sourceDate()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const local = [];
  const central = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.from(content, 'utf8');
    const packed = zlib.deflateRawSync(data, { level: 9 });
    const fileName = Buffer.from(`${FOLDER}/${name}`, 'utf8');
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

export default function hw1Standalone() {
  return {
    name: 'hw1-standalone',

    // In build: dist/downloads/statistics/homework1/... e homework1.zip
    generateBundle() {
      const files = standaloneFiles();
      for (const [name, content] of Object.entries(files)) {
        this.emitFile({ type: 'asset', fileName: `${OUTPUT}/${FOLDER}/${name}`, source: content });
      }
      this.emitFile({ type: 'asset', fileName: `${OUTPUT}/${FOLDER}.zip`, source: zipFiles(files) });
    },

    // In sviluppo: gli stessi file, rigenerati a ogni richiesta dai sorgenti
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const prefix = `${server.config.base}${OUTPUT}/`;
        const url = (req.url || '').split('?')[0];
        if (!url.startsWith(prefix)) return next();
        const rest = url.slice(prefix.length);
        try {
          const files = standaloneFiles();
          let name = null;
          let body = null;
          if (rest === `${FOLDER}.zip`) {
            name = rest;
            body = zipFiles(files);
          } else if (rest.startsWith(`${FOLDER}/`)) {
            name = rest.slice(FOLDER.length + 1) || 'index.html';
            if (!Object.hasOwn(files, name)) return next();
            body = files[name];
          } else {
            return next();
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
