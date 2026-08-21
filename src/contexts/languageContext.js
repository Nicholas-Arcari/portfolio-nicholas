import { createContext, useContext } from 'react';

// Il contesto e il suo hook vivono qui, separati dal provider, perché un file
// che esporta un componente deve esportare soltanto componenti: altrimenti il
// ricaricamento a caldo di Vite non sa se sostituire il modulo o rimontare
// l'albero, e ricarica la pagina intera a ogni salvataggio.
export const LanguageContext = createContext(null);

export const useLanguage = () => useContext(LanguageContext);
