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
        <div className="card" style={{padding: '2.5rem'}}>
          <p>A diferencia de las calculadoras tradicionales, este sistema <strong>se retroalimenta de la realidad</strong>. Cada vez que un partido oficial concluye en el Mundial, los resultados se inyectan en nuestro motor. Las redes neuronales, XGBoost y las Cadenas de Markov (MCMC) recalculan sus pesos, y los puntajes ELO históricos se ajustan dinámicamente.</p>
          <p style={{marginBottom: 0}}>Si una "cenicienta" da la sorpresa en Fase de Grupos, el algoritmo aprende inmediatamente de esa volatilidad para ajustar las predicciones del resto de sus partidos eliminatorios. El Optimizador Matemático evalúa constantemente cuál de nuestras 7 inteligencias artificiales tiene el menor margen de error (RPS) y le cede el control absoluto del Ensamble.</p>
        </div>
      </div>

      <div className="section-block">
        <h2>Laboratorios de Monte Carlo 🎲</h2>
        <div className="comparison-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
          <div className="card">
            <h3>♟️ Sistema Suizo Estocástico</h3>
            <p>Simulamos un torneo masivo de Formato Suizo puro (48 equipos). Utilizando la distribución histórica de ELO, el motor realiza <strong>miles de iteraciones de Monte Carlo</strong> para encontrar el promedio exacto de puntos esperados (xPts), cruces y goles de cada selección si el Mundial se jugara como un torneo de ajedrez gigante.</p>
          </div>
          <div className="card">
            <h3>⚔️ Supervivencia Eliminatoria</h3>
            <p>La fase final no es predecible a simple vista. Inyectamos los 16 cruces de Dieciseisavos a un motor estocástico que tira los dados <strong>2,000 veces</strong> simulando prórrogas y tandas de penales con modelos Beta-Binomiales. El resultado es un mapa de calor que desnuda la verdadera probabilidad de cada selección de levantar la copa.</p>
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
