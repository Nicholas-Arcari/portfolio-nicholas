// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeProvider';
import { LanguageProvider } from './contexts/LanguageProvider';
import Home from './pages/Home';
import TemplateScripts from './components/TemplateScripts';
import SettingsBar from './components/SettingsBar';
import PageTransition from './components/PageTransition';
import './HackerTheme.css';

// Ogni pagina tranne la home si scarica solo quando serve: chi apre il sito
// non paga il codice delle pagine che non visita (gli homework, con calcoli,
// testi e grafici, pesano qualche centinaio di kB).
const Ricette = lazy(() => import('./pages/Ricette'));
const Cocktail = lazy(() => import('./pages/Cocktail'));
const Cocktail_classici = lazy(() => import('./pages/Cocktail_classici'));
const Stampe3d = lazy(() => import('./pages/Stampe3d'));
const Galleria = lazy(() => import('./pages/Galleria'));
const Pizze = lazy(() => import('./pages/Pizze'));
const FreelanceDetails = lazy(() => import('./pages/FreelanceDetails'));
const UniversityDetails = lazy(() => import('./pages/UniversityDetails'));
const MasterDetails = lazy(() => import('./pages/MasterDetails'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CyberServices = lazy(() => import('./pages/CyberServices'));
const CitizenShield = lazy(() => import('./pages/CitizenShield'));
const FinanzMe = lazy(() => import('./pages/FinanzMe'));
const ByteBulk = lazy(() => import('./pages/ByteBulk'));
const SeedCast = lazy(() => import('./pages/SeedCast'));
const StatisticsHomework = lazy(() => import('./pages/statistics/StatisticsHomework'));
const Homework1 = lazy(() => import('./pages/statistics/Homework1'));
const Homework2 = lazy(() => import('./pages/statistics/Homework2'));
const Homework2a = lazy(() => import('./pages/statistics/Homework2a'));

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <TemplateScripts />
        <SettingsBar />

        <PageTransition>
          <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ricette" element={<Ricette />} />
              <Route path="/pizze" element={<Pizze />} />
              <Route path="/cocktail" element={<Cocktail />} />
              <Route path="/cocktail-classici" element={<Cocktail_classici />} />
              <Route path="/stampe3d" element={<Stampe3d />} />
              <Route path="/galleria" element={<Galleria />} />
              <Route path="/freelance-details" element={<FreelanceDetails />} />
              <Route path="/university-details" element={<UniversityDetails />} />
              <Route path="/master-details" element={<MasterDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/cyber-services" element={<CyberServices />} />
              <Route path="/citizen-shield" element={<CitizenShield />} />
              <Route path="/finanzme" element={<FinanzMe />} />
              <Route path="/bytebulk" element={<ByteBulk />} />
              <Route path="/seedcast" element={<SeedCast />} />
              <Route path="/statistics" element={<StatisticsHomework />} />
              <Route path="/statistics/homework-1" element={<Homework1 />} />
              <Route path="/statistics/homework-2" element={<Homework2 />} />
              <Route path="/statistics/homework-2a" element={<Homework2a />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageTransition>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
