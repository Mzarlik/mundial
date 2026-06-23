import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchById, flagUrl, DAYS } from '../config/matches';
function GraphImage({ src, alt }) {
  if (!src) return (<div className="graph-placeholder">Gráfica pendiente — coloca el PNG en <code>public/graphs/</code> y actualiza <code>matches.js</code></div>);
  return <img src={src} alt={alt} style={{width:'100%',borderRadius:'var(--radius-md)'}} />;
}
export default function MatchDetail() {
  const { matchId } = useParams();
  const match = getMatchById(matchId);
  if (!match) return (<div className="card" style={{textAlign:'center',padding:'3rem'}}><h2>Partido no encontrado</h2><Link to="/" className="btn btn-outline" style={{marginTop:'1rem'}}>Volver al inicio</Link></div>);
  const day = DAYS.find(d => d.id === match.day);
  return (<div>
    <div className="ficha">
      <div style={{fontSize:'0.78rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Ficha técnica</div>
      <div className="flags-big">
        <div style={{textAlign:'center'}}><img src={flagUrl(match.homeCode)} alt={match.home} /><div style={{fontFamily:'var(--font-display)',marginTop:'0.5rem',fontSize:'1.1rem',textTransform:'uppercase'}}>{match.home}</div></div>
        <span className="vs-big">VS</span>
        <div style={{textAlign:'center'}}><img src={flagUrl(match.awayCode)} alt={match.away} /><div style={{fontFamily:'var(--font-display)',marginTop:'0.5rem',fontSize:'1.1rem',textTransform:'uppercase'}}>{match.away}</div></div>
      </div>
      <div className="detail-row"><span>{day?.full}</span><span>{match.time}</span><span>{match.venue}</span><span>{match.group}</span></div>
    </div>
    <div className="match-disclaimer"><strong>Aviso:</strong> Las predicciones son estimaciones generadas por modelos estadísticos con fines exclusivamente académicos y de entretenimiento. La precisión es limitada (~55-60% para el resultado, menos del 20% para el marcador exacto) debido a la aleatoriedad del fútbol. No se recomienda utilizar esta información como base para tomar decisiones que impliquen riesgo financiero.</div>
    <div className="data-note"><strong>Nota:</strong> Los datos pueden cambiar según los resultados de partidos anteriores. Se recomienda ejecutar el notebook al inicio de cada día para obtener las estimaciones más actualizadas.</div>
    <div className="graph-section"><h2>Predicción — modelo estadístico (Dixon-Coles)</h2><GraphImage src={match.graphs.mcmc} alt={`Dixon-Coles ${match.home} vs ${match.away}`} /></div>
    <div className="graph-section"><h2>Predicción — XGBoost + ratings</h2><GraphImage src={match.graphs.xgboost} alt={`XGBoost ${match.home} vs ${match.away}`} /></div>
    <div className="graph-section"><h2>Accuracy comparativo</h2><p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}>Rendimiento fuera de muestra sobre cientos de partidos que el modelo nunca vio.</p><GraphImage src={match.graphs.accuracy} alt={`Accuracy ${match.home} vs ${match.away}`} /></div>
    <div style={{textAlign:'center',margin:'2.5rem 0'}}>
      <a href={match.colabLink} target="_blank" rel="noopener noreferrer" className="btn btn-accent">Probar código en Google Colab</a>
      <p style={{color:'var(--text-muted)',fontSize:'0.78rem',marginTop:'0.75rem'}}>Se abrirá el notebook en Google Drive. Ábrelo con Colab y dale "Ejecutar todo".</p>
    </div>
    <Link to={`/resultados/${match.day}`} className="btn btn-outline">Volver a los partidos del día</Link>
  </div>);
}
