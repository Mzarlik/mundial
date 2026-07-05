import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Disclaimer from './components/Disclaimer';
import Home from './pages/Home';
import HowToTest from './pages/HowToTest';
import DayResults from './pages/DayResults';
import MatchDetail from './pages/MatchDetail';
import Parlays from './pages/Parlays';
import Bracket from './pages/Bracket';
import SwissSystem from './pages/SwissSystem';
import PlayerStats from './pages/PlayerStats';

/**
 * Componente Principal (App) que define la estructura básica de la aplicación:
 * 1. Control de visualización del Disclaimer de advertencia legal/estadística.
 * 2. Diseño del Layout con menú lateral (Sidebar) y área de contenido principal.
 * 3. Definición del enrutamiento de la aplicación (React Router).
 */
export default function App() {
  const [accepted, setAccepted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const isWidePage = ['/cuadro', '/suizo', '/estadisticas-jugadores'].includes(location.pathname) || location.pathname.startsWith('/partido/');
  
  function handleAccept() { 
    setAccepted(true); 
  }
  
  return (<>
    {/* Advertencia obligatoria para el usuario antes de acceder */}
    {!accepted && <Disclaimer onAccept={handleAccept} />}
    
    <div className="app-layout">
      {/* Botón para alternar la visualización del menú en dispositivos móviles */}
      <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>|||</button>
      
      {/* Barra de navegación lateral */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Rutas principales del frontend */}
      <main className={`main-content ${isWidePage ? 'wide-page-main' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/como-probar" element={<HowToTest />} />
          <Route path="/resultados/:dayId" element={<DayResults />} />
          <Route path="/partido/:matchId" element={<MatchDetail />} />
          <Route path="/parleys" element={<Parlays />} />
          <Route path="/cuadro" element={<Bracket />} />
          <Route path="/suizo" element={<SwissSystem />} />
          <Route path="/estadisticas-jugadores" element={<PlayerStats />} />
        </Routes>
      </main>
    </div>
  </>);
}
