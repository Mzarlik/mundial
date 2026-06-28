import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { DAYS, getMatchesByDay } from '../config/matches';

export default function Sidebar({ open, onClose }) {
  const [daysOpen, setDaysOpen] = useState(true);
  const [expandedDays, setExpandedDays] = useState({
    jornada1: false,
    jornada2: false,
    jornada3: false,
    dieciseisavos: false
  });
  const [expandedDates, setExpandedDates] = useState({});

  const toggleDay = (dayId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedDays(prev => ({ ...prev, [dayId]: !prev[dayId] }));
  };

  const toggleDate = (dateKey, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const formatDate = (dateStr) => {
    const parts = dateStr.split('-');
    return parts.length === 3 ? `Día ${parts[2]}/${parts[1]}` : dateStr;
  };

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} onClick={e => { if (e.target.closest('.sidebar-match-item')) onClose?.(); }}>
      <div className="sidebar-logo"><h2>Mundial ML</h2><span>Predicciones con Machine Learning</span></div>
      <nav>
        <div className="sidebar-section-label">Principal</div>
        <NavLink to="/" end>Inicio</NavLink>
        <NavLink to="/parleys" style={{ color: '#f39c12', fontWeight: 'bold' }}>🎟️ Parleys Recomendados</NavLink>
        <NavLink to="/cuadro" style={{ color: '#0ea5e9', fontWeight: 'bold' }}>🏆 Simulador de Llaves</NavLink>
        
        <div className="sidebar-section-label">Resultados por día</div>
        <button className="sidebar-toggle-btn" onClick={() => setDaysOpen(!daysOpen)}>
          Fase de grupos <span style={{marginLeft: 'auto'}}>{daysOpen ? '▾' : '▸'}</span>
        </button>
        
        {daysOpen && DAYS.map(d => {
          const isExpanded = expandedDays[d.id];
          const dailyMatches = getMatchesByDay(d.id);

          // Group matches by date
          const matchesByDate = {};
          dailyMatches.forEach(m => {
            if (!matchesByDate[m.date]) {
              matchesByDate[m.date] = [];
            }
            matchesByDate[m.date].push(m);
          });
          const sortedDates = Object.keys(matchesByDate).sort();

          return (
            <div key={d.id} className="sidebar-day-group">
              <div className="sidebar-day-header">
                <NavLink to={`/resultados/${d.id}`} className="day-link">
                  {d.label}
                </NavLink>
                <button className="sidebar-day-toggle" onClick={(e) => toggleDay(d.id, e)}>
                  {isExpanded ? '▾' : '▸'}
                </button>
              </div>
              
              {isExpanded && (
                <div className="sidebar-date-list">
                  {sortedDates.map(dateStr => {
                    const dateKey = `${d.id}_${dateStr}`;
                    const isDateExpanded = expandedDates[dateKey];
                    const formattedDate = formatDate(dateStr);
                    const matchesForDate = matchesByDate[dateStr];

                    return (
                      <div key={dateStr} className="sidebar-date-group">
                        <div className="sidebar-date-header" onClick={(e) => toggleDate(dateKey, e)} style={{ cursor: 'pointer' }}>
                          <span className="sidebar-date-label">
                            📅 {formattedDate}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {isDateExpanded ? '▾' : '▸'}
                          </span>
                        </div>
                        
                        {isDateExpanded && (
                          <div className="sidebar-match-sublist">
                            {matchesForDate.map(m => (
                              <NavLink key={m.id} to={`/partido/${m.id}`} className="sidebar-match-item">
                                {m.home} vs {m.away}
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
