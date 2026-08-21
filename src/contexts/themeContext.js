import { createContext, useContext } from 'react';

// Come per la lingua: contesto e hook fuori dal file del provider, così quello
// resta un modulo di soli componenti e il ricaricamento a caldo funziona.
export const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);
