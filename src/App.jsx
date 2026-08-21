// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeProvider';
import { LanguageProvider } from './contexts/LanguageProvider';
import Home from './pages/Home';
import Ricette from './pages/Ricette';
import Cocktail from './pages/Cocktail';
import Cocktail_classici from './pages/Cocktail_classici';
import Stampe3d from './pages/Stampe3d';
import Pizze from './pages/Pizze';
import FreelanceDetails from './pages/FreelanceDetails';
import UniversityDetails from './pages/UniversityDetails';
import MasterDetails from './pages/MasterDetails';
import TemplateScripts from './components/TemplateScripts';
import SettingsBar from './components/SettingsBar';
import PageTransition from './components/PageTransition';
import About from './pages/About';
import NotFound from './pages/NotFound';
import CyberServices from './pages/CyberServices';
import CitizenShield from './pages/CitizenShield';
import FinanzMe from './pages/FinanzMe';
import ByteBulk from './pages/ByteBulk';
import './HackerTheme.css';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <TemplateScripts />
        <SettingsBar />

        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ricette" element={<Ricette />} />
            <Route path="/pizze" element={<Pizze />} />
            <Route path="/cocktail" element={<Cocktail />} />
            <Route path="/cocktail-classici" element={<Cocktail_classici />} />
            <Route path="/stampe3d" element={<Stampe3d />} />
            <Route path="/freelance-details" element={<FreelanceDetails />} />
            <Route path="/university-details" element={<UniversityDetails />} />
            <Route path="/master-details" element={<MasterDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/cyber-services" element={<CyberServices />} />
            <Route path="/citizen-shield" element={<CitizenShield />} />
            <Route path="/finanzme" element={<FinanzMe />} />
            <Route path="/bytebulk" element={<ByteBulk />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
