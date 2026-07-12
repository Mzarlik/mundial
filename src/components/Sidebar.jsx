import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { DAYS, getMatchesByDay } from '../config/matches';
import { TicketIcon, TrophyIcon, FlaskIcon, ChartIcon } from './Icons';

export default function Sidebar({ open, onClose }) {
  const [daysOpen, setDaysOpen] = useState(true);
  const [expandedDays, setExpandedDays] = useState({
    jornada1: false,
    jornada2: false,
    jornada3: false,
    dieciseisavos: false,
    octavos: false,
    cuartos: false,
    semis: false,
    tercer_lugar: false,
    final: false
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
        <NavLink 
          to="/" 
          end
          style={({ isActive }) => ({
            color: isActive ? '#fff' : 'var(--text-sidebar)',
            background: isActive ? 'rgba(255, 255, 255, 0.05)' : undefined,
            borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            borderRight: 'none',
            paddingLeft: isActive ? '1.75rem' : '1.5rem',
            fontWeight: isActive ? 'bold' : '500'
          })}
        >
          Inicio
        </NavLink>
        <NavLink 
          to="/parleys" 
          style={({ isActive }) => ({ 
            color: isActive ? '#fff' : '#f59e0b', 
            background: isActive ? 'rgba(245, 158, 11, 0.08)' : undefined,
            borderLeft: isActive ? '3px solid #f59e0b' : '3px solid transparent',
            borderRight: 'none',
            paddingLeft: isActive ? '1.75rem' : '1.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          })}
        >
          <TicketIcon size={16} />
          <span>Parleys Recomendados</span>
        </NavLink>
        <NavLink 
          to="/cuadro" 
          style={({ isActive }) => ({ 
            color: isActive ? '#fff' : '#0ea5e9', 
            background: isActive ? 'rgba(14, 165, 233, 0.08)' : undefined,
            borderLeft: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
            borderRight: 'none',
            paddingLeft: isActive ? '1.75rem' : '1.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          })}
        >
          <TrophyIcon size={16} />
          <span>Simulador de Llaves</span>
        </NavLink>
        <NavLink 
          to="/suizo" 
          style={({ isActive }) => ({ 
            color: isActive ? '#fff' : '#a78bfa', 
            background: isActive ? 'rgba(167, 139, 250, 0.08)' : undefined,
            borderLeft: isActive ? '3px solid #a78bfa' : '3px solid transparent',
            borderRight: 'none',
            paddingLeft: isActive ? '1.75rem' : '1.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          })}
        >
          <FlaskIcon size={16} />
          <span>Laboratorios de IA</span>
        </NavLink>
        <NavLink 
          to="/estadisticas-jugadores" 
          style={({ isActive }) => ({ 
            color: isActive ? '#fff' : '#10b981', 
            background: isActive ? 'rgba(16, 185, 129, 0.08)' : undefined,
            borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
            borderRight: 'none',
            paddingLeft: isActive ? '1.75rem' : '1.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          })}
        >
          <ChartIcon size={16} />
          <span>Estadísticas de Jugadores</span>
        </NavLink>
        
        <div className="sidebar-section-label">Resultados por día</div>
        <button className="sidebar-toggle-btn" onClick={() => setDaysOpen(!daysOpen)}>
          Partidos por Fase <span style={{marginLeft: 'auto'}}>{daysOpen ? '▾' : '▸'}</span>
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
