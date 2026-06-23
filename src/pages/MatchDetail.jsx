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
        <div style={{textAlign:'center'}}><img src={flagUrl(match.homeCode)} alt={match.home} /><div style={{fontFamily:'var(--font-display)',marginTop:'0.5rem',fontSize:'1.1rem',textTransform:'uppercase',color:'#fff'}}>{match.home}</div></div>
        <span className="vs-big">VS</span>
        <div style={{textAlign:'center'}}><img src={flagUrl(match.awayCode)} alt={match.away} /><div style={{fontFamily:'var(--font-display)',marginTop:'0.5rem',fontSize:'1.1rem',textTransform:'uppercase',color:'#fff'}}>{match.away}</div></div>
      </div>
      <div className="detail-row"><span>{day?.full}</span><span>{match.time}</span><span>{match.venue}</span><span>{match.group}</span></div>
    </div>
    
    <div className="match-disclaimer"><strong>Aviso:</strong> Las predicciones son estimaciones generadas por modelos estadísticos con fines exclusivamente académicos y de entretenimiento. La precisión es limitada (~55-65% para el resultado) debido a la aleatoriedad del fútbol. No utilizar para decisiones de riesgo.</div>
    <div className="data-note"><strong>Nota:</strong> Los datos se calculan dinámicamente con cortes temporales para simular precisión fuera de muestra.</div>
    
    <div className="graph-section">
      <h2>Comparativa de Modelos (Resumen)</h2>
      <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}>Comparación directa de las probabilidades asignadas por cada modelo al resultado del partido. Analiza el consenso entre diferentes metodologías.</p>
      <GraphImage src={match.graphs.Resumen} alt={`Resumen comparativo ${match.home} vs ${match.away}`} />
    </div>
    
    <div className="graph-section" style={{borderLeft: '4px solid var(--orange)'}}>
      <h2>Predicción Definitiva — Modelo Ensemble</h2>
      <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}><strong>Nivel de Confianza: EL MÁS ALTO.</strong> Este es el veredicto matemático final. Combina las cuatro inteligencias artificiales (MCMC, XGBoost, CatBoost y MLP) en una sola matriz probabilística, eliminando los "puntos ciegos" o sesgos individuales de cada algoritmo. Si buscas la predicción estadísticamente más rigurosa, es esta.</p>
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
        <p style={{fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)'}}>* Notarás que el modelo <strong>Ensemble</strong> frecuentemente ostenta el RPS más bajo (mejor equilibrado), demostrando que promediar el "cerebro" de 4 IAs distintas reduce drásticamente el riesgo de error.</p>
      </div>
      <GraphImage src={match.graphs.accuracy} alt={`Accuracy ${match.home} vs ${match.away}`} />
    </div>
    <div style={{textAlign:'center', marginTop: '3rem'}}>
      <Link to={`/resultados/${match.day}`} className="btn btn-outline">Volver a los partidos</Link>
    </div>
  </div>);
}
