import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      <div className="home-hero">
        <h1>Fase de grupos <span>Interactiva</span></h1>
        <p>Predicciones generadas con Inteligencia Artificial. Un ejercicio académico de frontera para explorar cómo el Machine Learning y la Inferencia Bayesiana descifran el deporte más complejo del mundo.</p>
        <div style={{marginTop:'2.5rem',display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
          <Link to="/resultados/jornada1" className="btn btn-accent">Ver Predicciones</Link>
          <Link to="/como-probar" className="btn btn-outline">Probar el Código Python</Link>
        </div>
      </div>
      
      <div className="section-block">
        <h2>¿Qué es el Machine Learning Predictivo?</h2>
        <div className="card" style={{padding: '2.5rem'}}>
          <p>El Machine Learning (aprendizaje automático) es una rama de la IA que permite a las computadoras aprender patrones a partir de datos históricos sin ser programadas explícitamente. En lugar de seguir reglas de negocio, un modelo de ML ingiere millones de puntos de datos, encuentra correlaciones matemáticas invisibles al ojo humano y las usa para generar distribuciones probabilísticas sobre el futuro.</p>
          <p style={{marginBottom: 0}}>En este proyecto, hemos alimentado a los algoritmos con más de <strong>49,000 partidos internacionales</strong> registrados desde 1872. El algoritmo no "adivina"; calcula el futuro basándose en una matriz de varianza histórica.</p>
        </div>
      </div>

      <div className="section-block">
        <h2>La Arquitectura de Modelos</h2>
        <p>No confiamos en un solo algoritmo. Hemos construido un <strong>Ensemble (Promedio Predictivo)</strong> que combina las tres metodologías más avanzadas del estado del arte:</p>
        
        <div className="comparison-grid">
          <div className="card">
            <h3><span className="model-badge badge-ml">MLP</span> Redes Neuronales (Deep Learning)</h3>
            <p>Un Perceptrón Multicapa (MLPRegressor) que utiliza capas ocultas para extraer relaciones no lineales complejas entre la fuerza histórica y la forma reciente. Destaca descubriendo "patrones abstractos" que escapan a la regresión lineal.</p>
          </div>
          <div className="card">
            <h3><span className="model-badge badge-xg">XGB</span> Gradient Boosting (XGBoost)</h3>
            <p>El rey indiscutible de las competiciones de Data Science. Ensambla miles de árboles de decisión secuencialmente. Utiliza métricas avanzadas como <strong>Pi-Ratings</strong> (para medir el dominio de un equipo por diferencia de goles) y <strong>ELO</strong>.</p>
          </div>
          <div className="card">
            <h3><span className="model-badge badge-cb">CB</span> Gradient Boosting Categórico (CatBoost)</h3>
            <p>La alternativa de Microsoft/Yandex. Diseñado algorítmicamente para extraer patrones ocultos tratando directamente los nombres de las selecciones como variables categóricas nativas, sin perder información por codificación de texto.</p>
          </div>
          <div className="card">
            <h3><span className="model-badge badge-mc">MCMC</span> Inferencia Bayesiana (PyMC)</h3>
            <p>Un muestreador MCMC (Cadenas de Markov de Monte Carlo) con 12,000 iteraciones que no solo predice un resultado, sino que cuantifica la incertidumbre matemáticamente. Modela la capacidad ofensiva/defensiva latente de cada selección.</p>
          </div>
          <div className="card">
            <h3><span className="model-badge badge-dc">B-P</span> Dixon-Coles (Poisson Bivariado)</h3>
            <p>El estándar de oro estadístico (1997). Asume que los goles siguen distribuciones de Poisson, pero corrige la interdependencia (los empates 0-0 y 1-1 ocurren con más frecuencia que lo dictado por el azar puro). Sirve como nuestra base (baseline).</p>
          </div>
        </div>
      </div>

      <div className="section-block">
        <h2>Medición de Precisión (Accuracy y RPS)</h2>
        <div className="card" style={{padding: '2rem'}}>
          <p>Para medir el rigor científico de estos algoritmos, ejecutamos simulaciones <strong>fuera de muestra (out-of-sample)</strong>. Escondemos partidos recientes y obligamos a la IA a "predecir el pasado" a ciegas.</p>
          <ul style={{marginTop: '1.5rem', marginBottom: '0'}}>
            <li><strong>Accuracy 1X2:</strong> Porcentaje de acierto directo. (Local, Empate o Visitante).</li>
            <li><strong>Ranked Probability Score (RPS):</strong> La métrica más estricta. Penaliza severamente a un modelo cuando afirma con gran certeza (ej. 90%) un resultado que termina siendo incorrecto.</li>
          </ul>
        </div>
      </div>
      
      <div className="match-disclaimer" style={{textAlign: 'center', marginBottom: '3rem'}}>
        El fútbol posee una entropía irreducible (aleatoriedad extrema). El mejor modelo matemático del mundo no puede prever una tarjeta roja al minuto 5. La información aquí presentada es para fines de investigación académica en <i>Data Science</i> y no debe usarse para apuestas o decisiones de riesgo financiero.
      </div>
      
      <div style={{textAlign:'center',margin:'4rem 0'}}>
        <Link to="/como-probar" className="btn btn-accent" style={{padding: '1rem 2.5rem', fontSize: '1.1rem'}}>Ver código fuente en GitHub</Link>
      </div>
    </div>
  );
}
