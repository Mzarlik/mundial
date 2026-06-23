import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { DAYS, getMatchesByDay } from '../config/matches';
import MatchCard from '../components/MatchCard';
export default function DayResults() {
  const { dayId } = useParams();
  const day = DAYS.find(d => d.id === dayId) || DAYS[0];
  const matches = getMatchesByDay(day.id);
  return (<div>
    <h1 style={{marginBottom:'0.3rem'}}>Predicciones</h1>
    <p style={{color:'var(--text-secondary)',marginBottom:'1rem'}}>Fase de grupos · {day.full}</p>
    <div className="data-note">
      <strong>Nota:</strong> Los datos y predicciones pueden variar según los resultados de los partidos anteriores. Se recomienda ejecutar el notebook al inicio de cada día para obtener las estimaciones más actualizadas, ya que el modelo incorpora automáticamente los resultados más recientes del repositorio de datos.
    </div>
    <div className="day-tabs">
      {DAYS.map(d => (<Link key={d.id} to={`/resultados/${d.id}`} className={`day-tab${d.id===day.id?' active':''}`}>{d.label}</Link>))}
    </div>
    {matches.length > 0 ? (
      <div className="matches-grid">{matches.map(m => <MatchCard key={m.id} match={m} />)}</div>
    ) : (
      <div className="card" style={{textAlign:'center',padding:'3rem'}}>
        <p style={{color:'var(--text-muted)'}}>No hay partidos para este día. Edita <code style={{color:'var(--accent)'}}>src/config/matches.js</code>.</p>
      </div>
    )}
  </div>);
}
