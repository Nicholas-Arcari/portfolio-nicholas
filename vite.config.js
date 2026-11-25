import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import homeworkStandalone from './build/homework-standalone.js'
import retiDoc from './build/reti-doc.js'
import distributedNotes from './build/distributed-notes.js'

// Content Security Policy del sito pubblicato. GitHub Pages non permette di
// impostare header HTTP, quindi la politica viaggia come <meta> nell'index.html,
// subito dopo il charset e prima di qualunque foglio di stile o script, perche'
// governa solo cio' che viene caricato dopo di lei. Solo in build: il server di
// sviluppo inietta script inline e apre un websocket per il ricaricamento a
// caldo, e questa politica li bloccherebbe.
//
// script-src resta 'self' senza eccezioni: e' la regola che disinnesca un XSS,
// perche' uno script iniettato nella pagina non verrebbe eseguito. Il resto
// elenca solo cio' che il sito carica davvero da fuori: i font Google importati
// dal CSS del template, i video tutorial, serviti dalle release GitHub, che
// rimandano ai propri domini di storage, e la demo di The Anomaly Guard nella
// pagina del Project #1, l'unico iframe del sito: frame-src permette solo il
// suo indirizzo (anche le pagine interne della demo stanno sotto quel
// percorso), e Project1.jsx la isola comunque con sandbox.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "media-src 'self' https://github.com https://objects.githubusercontent.com https://release-assets.githubusercontent.com",
  "connect-src 'self'",
  "object-src 'none'",
  'frame-src https://the-anomaly-guard.github.io/anomaly-guard/',
  "base-uri 'self'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ')

const CHARSET = '<meta charset="UTF-8" />'

const cspMeta = () => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml(html) {
    // Senza il punto d'aggancio la build deve fallire: pubblicare in silenzio
    // un sito senza politica e' peggio che non pubblicarlo.
    if (!html.includes(CHARSET)) {
      throw new Error(`csp-meta: ${CHARSET} non trovato in index.html`)
    }
    return html.replace(
      CHARSET,
      `${CHARSET}\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
    )
  },
})

// https://vitejs.dev/config/
// homeworkStandalone: i programmi scaricabili degli homework di Statistics (zip
// e versione online in downloads/statistics/), generati dagli stessi sorgenti
// delle pagine. retiDoc: le pagine impaginate del laboratorio di Reti devono
// avere le stesse parole dei file del laboratorio. distributedNotes: gli
// appunti di Distributed Systems devono leggersi, avere formule valide e la
// stessa struttura in inglese e in italiano; del CSS di KaTeX restano solo i
// font woff2.
export default defineConfig({
  plugins: [react(), cspMeta(), homeworkStandalone(), retiDoc(), distributedNotes()],
  base: '/portfolio-nicholas/', // <--- Nome del repo
  build: {
    // Un font piccolo finirebbe dentro il CSS come data:, che font-src della
    // CSP non ammette (succedeva a KaTeX_Size3, le parentesi alte delle
    // formule): i font restano sempre file a se'. Per il resto vale la
    // soglia normale.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
    rollupOptions: {
      output: {
        // React, React DOM e il router cambiano di rado: in un file a parte
        // restano nella cache del browser anche quando il sito si aggiorna
        manualChunks(id) {
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react';
          return undefined;
        },
      },
    },
  },
})
