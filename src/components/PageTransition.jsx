import { useLocation } from 'react-router-dom';

// La dissolvenza in entrata non ha bisogno di stato. Prima il componente
// montava invisibile e un effetto lo rendeva visibile al fotogramma dopo,
// cioe' due render e un setState dentro un effetto per una cosa che il
// browser sa gia' fare. Cambiando `key` a ogni percorso React rimonta il
// contenitore, e rimontarlo fa ripartire l'animazione CSS da sola.
const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-transition">
      {children}
    </div>
  );
};

export default PageTransition;
