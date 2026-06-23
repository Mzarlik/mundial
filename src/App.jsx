import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Disclaimer from './components/Disclaimer';
import Home from './pages/Home';
import HowToTest from './pages/HowToTest';
import DayResults from './pages/DayResults';
import MatchDetail from './pages/MatchDetail';
import Support from './pages/Support';
export default function App() {
  const [accepted, setAccepted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  function handleAccept() { setAccepted(true); }
  return (<>
    {!accepted && <Disclaimer onAccept={handleAccept} />}
    <div className="app-layout">
      <button className="mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>|||</button>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/como-probar" element={<HowToTest />} />
          <Route path="/resultados/:dayId" element={<DayResults />} />
          <Route path="/partido/:matchId" element={<MatchDetail />} />
          <Route path="/soporte" element={<Support />} />
        </Routes>
      </main>
    </div>
  </>);
}
