import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      <div className="home-hero">
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Mundial 2026 <span>AI Predictor</span></h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto' }}>
          Un ecosistema avanzado de Machine Learning e Inferencia Bayesiana diseñado para predecir, simular y analizar la Copa del Mundo en tiempo real.
        </p>
        <div style={{marginTop:'2.5rem',display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
          <Link to="/cuadro" className="btn btn-accent" style={{padding: '1rem 2rem'}}>🏆 Simulador de Llaves</Link>
          <Link to="/parleys" className="btn btn-outline" style={{padding: '1rem 2rem'}}>🧪 Laboratorios Estocásticos</Link>
        </div>
      </div>
      
      <div className="section-block">
        <h2>Un Motor que Aprende en Tiempo Real 🧠</h2>
        <div className="card" style={{ padding: '2.5rem', lineHeight: '1.6' }}>
          <p style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>A diferencia de las calculadoras tradicionales, este sistema <strong>se retroalimenta de la realidad en tiempo real</strong>:</p>
          <ul style={{ paddingLeft: '1.25rem', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li><strong>Actualización Automática:</strong> Cada vez que concluye un partido oficial, los resultados se inyectan en nuestro motor, recalculando las redes neuronales, XGBoost y Cadenas de Markov (MCMC).</li>
            <li><strong>Adaptabilidad ELO:</strong> Si una "cenicienta" da la sorpresa en Fase de Grupos, el algoritmo aprende inmediatamente de esa volatilidad, reajustando la forma y las proyecciones para los siguientes cruces.</li>
            <li><strong>Optimizador de Ensemble:</strong> El motor evalúa de forma continua cuál de nuestros 7 algoritmos posee el menor margen de error empírico (RPS) y ajusta de forma dinámica los pesos de decisión.</li>
          </ul>
        </div>
      </div>

      <div className="section-block">
        <h2>Laboratorios de Monte Carlo 🎲</h2>
        <div className="comparison-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '2rem', lineHeight: '1.6' }}>
            <h3>♟️ Sistema Suizo Estocástico</h3>
            <p style={{ marginBottom: '1rem' }}>Simulamos un formato suizo puro (48 equipos) aplicando distribuciones históricas de ELO:</p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <li>Ejecución de <strong>miles de iteraciones de Monte Carlo</strong>.</li>
              <li>Cálculo exacto de <strong>puntos esperados (xPts)</strong> y goles por selección.</li>
              <li>Proyección de cruces dinámicos bajo modelo estocástico.</li>
            </ul>
          </div>
          <div className="card" style={{ padding: '2rem', lineHeight: '1.6' }}>
            <h3>⚔️ Supervivencia Eliminatoria</h3>
            <p style={{ marginBottom: '1rem' }}>Modelamos la fase final simulando la entropía de los cruces de eliminación directa:</p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <li>Simulación estocástica de <strong>10,000 torneos completos</strong>.</li>
              <li>Prórrogas modeladas con desgaste físico y penales Beta-Binomiales.</li>
              <li>Generación de un <strong>mapa de calor interactivo</strong> de supervivencia.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="section-block">
        <h2>Arquitectura Multi-Modelo (State of the Art)</h2>
        <p>No confiamos el destino de un partido a un solo algoritmo. Hemos construido un <strong>Ensemble Optimizado</strong> que cruza las metodologías más potentes de Data Science:</p>
        
        <div className="comparison-grid">
          <div className="card">
            <h3><span className="model-badge badge-xg">XGB</span> XGBoost & CatBoost</h3>
            <p>Modelos de Gradient Boosting que destrozan la complejidad no lineal de las estadísticas. Aprenden de <strong>Pi-Ratings</strong>, formas recientes, historial Head-to-Head y ventaja de localía procesando casi 50,000 partidos históricos en milisegundos.</p>
          </div>
          <div className="card">
            <h3><span className="model-badge badge-mc">MCMC</span> Inferencia Bayesiana</h3>
            <p>Usando PyMC, generamos 12,000 cadenas de Markov para estimar la "fuerza latente" de los equipos. No solo arroja un ganador, sino que cuantifica la <strong>incertidumbre</strong> para saber si un partido es realmente seguro o es un simple volado de suerte (Coin Toss).</p>
          </div>
          <div className="card">
            <h3><span className="model-badge badge-dc">B-P</span> Poisson Bivariado</h3>
            <p>Los modelos matemáticos puros (Dixon-Coles y Distribución Binomial Negativa) que estiman las tasas de ataque y defensa, corrigiendo la dependencia estadística típica de los empates 0-0 y 1-1 en torneos de alta presión.</p>
          </div>
        </div>
      </div>
      
      <div className="match-disclaimer" style={{textAlign: 'center', marginBottom: '3rem', marginTop: '4rem'}}>
        El fútbol posee una entropía irreducible. El mejor modelo matemático del mundo no puede prever una tarjeta roja al minuto 5. La información y predicciones de esta arquitectura son producto de un <i>ejercicio académico de Data Science</i> avanzado y no constituyen recomendaciones financieras o de apuestas.
      </div>
    </div>
  );
}
