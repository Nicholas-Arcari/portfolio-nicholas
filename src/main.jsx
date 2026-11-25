import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { reloadOnMissingPage } from './utils/reloadOnMissingPage'
import { markHistoryEntry } from './utils/listMemory'

import { HashRouter } from 'react-router-dom'

reloadOnMissingPage()
markHistoryEntry()

// Lo scorrimento lo decidono le pagine: gli elenchi tornano al punto
// ricordato (src/utils/listMemory.js), tutte le altre partono dall'inizio.
// Il ripristino automatico del browser arriverebbe dopo, a pagina gia'
// disegnata, e le contraddirebbe.
if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'

// Le animazioni e le transizioni del template partono a pagina caricata: fino
// ad allora la classe is-preload del <body> le tiene ferme (main.css). Prima
// la toglieva il main.js del template.
const startAnimations = () => setTimeout(() => document.body.classList.remove('is-preload'), 100)
if (document.readyState === 'complete') startAnimations()
else window.addEventListener('load', startAnimations, { once: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)