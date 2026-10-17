// src/pages/statistics/Project1.jsx
// Il primo project di Statistics, un progetto di gruppo: per ora solo la
// cornice degli homework con "Work in progress...". Il codice stara' in un
// repository a parte; quando ci sara', il riquadro per scaricarlo andra' nella
// sidebar come per gli homework, ma con il link a quel repository.
import React from 'react';
import { useLanguage } from '../../contexts/languageContext';
import HomeworkShell from './HomeworkShell';

const Project1 = () => {
  const { t } = useLanguage();
  return (
    <HomeworkShell slug="project-1">
      <div className="soft-panel" style={{ textAlign: 'center', padding: '2em 1em', marginTop: '1.5em' }}>
        <i className="icon solid fa-users" style={{ fontSize: '2.5em', color: '#d52349', marginBottom: '0.5em', display: 'block' }}></i>
        <h3 style={{ marginBottom: 0 }}>{t('statistics.projectWip')}</h3>
      </div>
    </HomeworkShell>
  );
};

export default Project1;
