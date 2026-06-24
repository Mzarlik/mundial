import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { DAYS } from '../config/matches';
export default function Sidebar({ open, onClose }) {
  const [daysOpen, setDaysOpen] = useState(true);
  return (
    <aside className={`sidebar${open ? ' open' : ''}`} onClick={e => { if (e.target.closest('a')) onClose?.(); }}>
      <div className="sidebar-logo"><h2>Mundial ML</h2><span>Predicciones con Machine Learning</span></div>
      <nav>
        <div className="sidebar-section-label">Principal</div>
        <NavLink to="/" end>Inicio</NavLink>
        <NavLink to="/parleys" style={{ color: '#f39c12', fontWeight: 'bold' }}>🎟️ Parleys Recomendados</NavLink>
        <div className="sidebar-section-label">Resultados por día</div>
        <button className="sidebar-toggle-btn" onClick={() => setDaysOpen(!daysOpen)}>Fase de grupos <span style={{marginLeft: 'auto'}}>{daysOpen ? '▾' : '▸'}</span></button>
        {daysOpen && DAYS.map(d => (<NavLink key={d.id} to={`/resultados/${d.id}`} className="day-link">{d.label}</NavLink>))}
      </nav>
    </aside>
  );
}
