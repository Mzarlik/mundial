import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchById, flagUrl, DAYS } from '../config/matches';

function GraphImage({ src, alt }) {
  if (!src) return (<div className="graph-placeholder">Gráfica pendiente — coloca el PNG en <code>public/graphs/</code> y actualiza <code>matches.js</code></div>);
  return <img src={src} alt={alt} style={{width:'100%',borderRadius:'var(--radius-md)'}} />;
}

function Top3ScoresBanner({ matchId, home, away }) {
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    fetch('/data/predictions.json')
      .then(res => res.json())
      .then(data => {
        if (data[matchId]) {
          setPrediction(data[matchId]);
        }
      })
      .catch(e => console.error("Error loading predictions", e));
  }, [matchId]);

  if (!prediction || !prediction.top3_scores) return null;

  const top3 = prediction.top3_scores;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      borderRadius: '12px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      color: '#fff',
      borderLeft: '5px solid #f59e0b'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b' }}>
            Top 3 Marcadores Promediados (Ensemble)
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: '500' }}>
          Promedio de 5 IAs
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.6rem' }}>
        {top3.map((item, idx) => {
          const scores = item.score.split('-');
          const goalsHome = parseInt(scores[0]);
          const goalsAway = parseInt(scores[1]);
          
          let badgeText = "Empate";
          let badgeBg = 'rgba(148, 163, 184, 0.15)';
          let badgeColor = '#cbd5e1';
          
          if (goalsHome > goalsAway) {
            badgeText = `Gana ${home}`;
            badgeBg = 'rgba(59, 130, 246, 0.18)';
            badgeColor = '#60a5fa';
          } else if (goalsAway > goalsHome) {
            badgeText = `Gana ${away}`;
            badgeBg = 'rgba(239, 68, 68, 0.18)';
            badgeColor = '#f87171';
          }

          const borderHighlight = idx === 0 ? '1px solid rgba(245, 158, 11, 0.45)' : (idx === 1 ? '1px solid rgba(203, 213, 225, 0.3)' : '1px solid rgba(180, 83, 9, 0.3)');
          const positionLabel = idx === 0 ? '🥇 1er Marcador' : (idx === 1 ? '🥈 2do Marcador' : '🥉 3er Marcador');
          const medalColor = idx === 0 ? '#f59e0b' : (idx === 1 ? '#94a3b8' : '#b45309');

          return (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: borderHighlight,
              borderRadius: '8px',
              padding: '0.75rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '3px', background: medalColor }}></div>
              <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {positionLabel}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#fff', margin: '0.2rem 0', letterSpacing: '0.05em' }}>
                {item.score}
              </div>
              <div style={{ fontSize: '0.72rem', padding: '0.25rem 0.4rem', borderRadius: '4px', background: badgeBg, color: badgeColor, fontWeight: 'bold', margin: '0.4rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {badgeText}
              </div>
              <div style={{ marginTop: '0.3rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#10b981' }}>{item.prob.toFixed(1)}%</div>
                <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '0.4rem', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, item.prob * 5.5)}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', borderRadius: '2px' }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SafeBetBanner({ matchId, home, away }) {
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    fetch('/data/predictions.json')
      .then(res => res.json())
      .then(data => {
        if (data[matchId]) {
          setPrediction(data[matchId]);
        }
      })
      .catch(e => console.error("Error loading predictions", e));
  }, [matchId]);

  if (!prediction) return null;

  const { home: pH, draw: pD, away: pA } = prediction;
  let suggestion = null;
  let prob = 0;

  if (pH > 0.65) { suggestion = `Gana ${home}`; prob = pH; }
  else if (pA > 0.65) { suggestion = `Gana ${away}`; prob = pA; }
  else if (pH + pD > 0.85) { suggestion = `Doble Oportunidad: ${home} o Empate`; prob = pH + pD; }
  else if (pA + pD > 0.85) { suggestion = `Doble Oportunidad: ${away} o Empate`; prob = pA + pD; }

  if (!suggestion) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(46, 204, 113, 0.15) 0%, rgba(39, 174, 96, 0.05) 100%)',
      border: '1px solid #2ecc71',
      borderRadius: '8px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.2rem'
    }}>
      <div style={{ fontSize: '2.2rem' }}>💎</div>
      <div>
        <div style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sugerencia de Apuesta de Valor (IA)
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.4' }}>
          El modelo Ensemble detecta una ventaja matemática significativa: 
          <strong style={{ color: '#fff', marginLeft: '0.4rem', fontSize: '1rem' }}>{suggestion} ({(prob * 100).toFixed(1)}%)</strong>
        </div>
      </div>
    </div>
  );
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
        <div style={{textAlign:'center'}}><img src={flagUrl(match.homeCode)} alt={match.home} /><div style={{fontFamily:'var(--font-display)',marginTop:'0.5rem',fontSize:'1.1rem',textTransform:'uppercase',color:'#fff'}}>{match.home}</div></div>
        <span className="vs-big">VS</span>
        <div style={{textAlign:'center'}}><img src={flagUrl(match.awayCode)} alt={match.away} /><div style={{fontFamily:'var(--font-display)',marginTop:'0.5rem',fontSize:'1.1rem',textTransform:'uppercase',color:'#fff'}}>{match.away}</div></div>
      </div>
      <div className="detail-row"><span>{day?.full}</span><span>{match.time}</span><span>{match.venue}</span><span>{match.group}</span></div>
    </div>
    
    <Top3ScoresBanner matchId={match.id} home={match.home} away={match.away} />
    <SafeBetBanner matchId={match.id} home={match.home} away={match.away} />
    
    <div className="match-disclaimer"><strong>Aviso:</strong> Las predicciones son estimaciones generadas por modelos estadísticos con fines exclusivamente académicos y de entretenimiento. La precisión es limitada (~55-60% para el resultado) debido a la aleatoriedad del fútbol. No utilizar para decisiones de riesgo.</div>
    <div className="data-note"><strong>Nota:</strong> Los datos se calculan dinámicamente con cortes temporales para simular precisión fuera de muestra.</div>
    
    <div className="graph-section">
      <h2>Comparativa de Modelos (Resumen)</h2>
      <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}>Comparación directa de las probabilidades asignadas por cada modelo al resultado del partido. Analiza el consenso entre diferentes metodologías.</p>
      <GraphImage src={match.graphs.Resumen} alt={`Resumen comparativo ${match.home} vs ${match.away}`} />
    </div>
    
    <div className="graph-section" style={{borderLeft: '4px solid var(--orange)'}}>
      <h2>Predicción Definitiva — Modelo Ensemble</h2>
      <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}><strong>Nivel de Confianza: EL MÁS ALTO.</strong> Este es el veredicto matemático final. Combina <strong>cinco inteligencias artificiales distintas</strong> (MCMC, XGBoost, CatBoost, MLP y MFA Montecarlo) en una sola matriz probabilística, eliminando los "puntos ciegos" o sesgos individuales de cada algoritmo. Si buscas la predicción estadísticamente más rigurosa, es esta.</p>
      <GraphImage src={match.graphs.ensemble} alt={`Ensemble ${match.home} vs ${match.away}`} />
    </div>

    <div className="graph-section">
      <h2><span className="model-badge badge-ml">MLP</span> Red Neuronal (Deep Learning)</h2>
      <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}><strong>Nivel de Confianza: ALTO.</strong> Diseñada para atrapar patrones abstractos. Las redes neuronales son excepcionales para encontrar correlaciones invisibles (por ejemplo, cómo el valor de mercado afecta la mentalidad de los jugadores), aunque a veces pueden sobreajustar (memorizar) los datos.</p>
      <GraphImage src={match.graphs.mlp} alt={`Red Neuronal ${match.home} vs ${match.away}`} />
    </div>

    <div className="graph-section">
      <h2><span className="model-badge badge-cb">CB</span> Gradient Boosting Categórico (CatBoost)</h2>
      <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}><strong>Nivel de Confianza: ALTO.</strong> Especialista en "leer etiquetas". A diferencia de otros modelos, CatBoost procesa directamente el nombre del país y lo asocia matemáticamente con su historial y su valor financiero (Market Value), revelando ventajas posicionales.</p>
      <GraphImage src={match.graphs.catboost} alt={`CatBoost ${match.home} vs ${match.away}`} />
    </div>

    <div className="graph-section">
      <h2><span className="model-badge badge-ml" style={{background: '#0ea5e9'}}>MFA</span> Simulador Montecarlo Auditable</h2>
      <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}><strong>Nivel de Confianza: ALTO.</strong> Este modelo extrae la fuerza competitiva de los equipos basándose en el historial reciente, penalizaciones por bajas y multiplicadores subjetivos (factor sorpresa o localía), generando una distribución probabilística independiente a través de muestreo de Poisson.</p>
      <GraphImage src={match.graphs.mfa} alt={`MFA Montecarlo ${match.home} vs ${match.away}`} />
    </div>

    <div className="graph-section">
      <h2><span className="model-badge badge-xg">XGB</span> Regresión de Goles (XGBoost)</h2>
      <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}><strong>Nivel de Confianza: ALTO.</strong> El modelo predictivo más famoso del mundo. Utiliza miles de árboles de decisión para "corregir sus propios errores" recursivamente. Se guía fuertemente por la diferencia en el "Ranking ELO" y el "Pi-Rating" (poder ofensivo real).</p>
      <GraphImage src={match.graphs.xgboost} alt={`XGBoost ${match.home} vs ${match.away}`} />
    </div>

    <div className="graph-section">
      <h2><span className="model-badge badge-mc">MCMC</span> Estadística Bayesiana (PyMC)</h2>
      <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}><strong>Nivel de Confianza: MODERADO/ALTO.</strong> No usa Machine Learning moderno, sino pura estadística probabilística pesada. En lugar de predecir un resultado directo, simula 12,000 líneas de tiempo posibles para entender los límites ofensivos de cada país. Es el más cauteloso de los cuatro.</p>
      <GraphImage src={match.graphs.mcmc} alt={`MCMC Bayesiano ${match.home} vs ${match.away}`} />
    </div>

    <div className="graph-section">
      <h2>Accuracy Comparativo Global</h2>
      <div style={{color:'var(--text-secondary)',fontSize:'0.9rem',lineHeight:'1.6',marginBottom:'1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'}}>
        <p style={{marginBottom: '1rem'}}>Esta gráfica demuestra el <strong>rendimiento empírico</strong> de nuestros algoritmos al someterlos a una prueba estricta. Escondimos resultados reales y obligamos a las IA a "predecir el pasado a ciegas" para verificar matemáticamente cuál modelo es superior.</p>
        <ul style={{paddingLeft: '1.5rem', marginBottom: '1rem'}}>
          <li style={{marginBottom: '0.5rem'}}><strong>Accuracy 1X2 (Panel Izquierdo):</strong> Mide el porcentaje de veces que el modelo acertó al ganador correcto (Local, Empate o Visitante). En el impredecible fútbol de selecciones, acertar cerca del 60% es de nivel profesional. <em>(Barras más altas = Mejor)</em>.</li>
          <li><strong>RPS - Ranked Probability Score (Panel Derecho):</strong> Es la métrica dorada de los analistas de datos. Castiga severamente la "soberbia". Si un modelo asegura con 90% que un equipo ganará y este pierde, su RPS sufrirá un daño brutal. Mide qué tan prudentes y bien calibradas están las probabilidades. <em>(Barras más bajas = Mejor)</em>.</li>
        </ul>
        <p style={{fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)'}}>* Notarás que el modelo <strong>Ensemble</strong> frecuentemente ostenta el RPS más bajo (mejor equilibrado), demostrando que promediar el "cerebro" de 5 IAs distintas reduce drásticamente el riesgo de error.</p>
      </div>
      <GraphImage src={match.graphs.accuracy} alt={`Accuracy ${match.home} vs ${match.away}`} />
    </div>
    <div style={{textAlign:'center', marginTop: '3rem'}}>
      <Link to={`/resultados/${match.day}`} className="btn btn-outline">Volver a los partidos</Link>
    </div>
  </div>);
}
