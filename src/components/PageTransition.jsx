import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const frame = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <div className={`page-transition ${visible ? 'page-visible' : ''}`}>
      {children}
    </div>
  );
};

export default PageTransition;
